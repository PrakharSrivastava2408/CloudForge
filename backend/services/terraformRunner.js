const { spawn } = require('child_process');
const path = require('path');
const { db } = require('./database');

// Template directory mapping
const TEMPLATE_MAP = {
    'aurora-postgresql': 'aws-aurora-postgres',
    'ec2': 'aws-ec2',
    's3': 'aws-s3',
    'redis': 'aws-elasticache-redis',
    'lambda': 'aws-lambda'
};

// Output field mapping per service type
const OUTPUT_MAPPING = {
    'aurora-postgresql': {
        endpoint: 'cluster_endpoint',
        name: 'database_name'
    },
    'ec2': {
        endpoint: 'public_ip',
        name: 'instance_id'
    },
    's3': {
        endpoint: 'bucket_name',
        name: 'bucket_name'
    },
    'redis': {
        endpoint: 'primary_endpoint',
        name: 'cluster_id'
    },
    'lambda': {
        endpoint: 'api_endpoint',
        name: 'function_name'
    }
};

function getTemplateDir(engine) {
    const templateName = TEMPLATE_MAP[engine] || 'aws-aurora-postgres';
    // Support both Docker (/terraform) and local (../../terraform/templates) paths
    const dockerPath = `/terraform/templates/${templateName}`;
    const localPath = path.resolve(__dirname, `../../terraform/templates/${templateName}`);
    const fs = require('fs');
    return fs.existsSync(dockerPath) ? dockerPath : localPath;
}

async function runTerraform(socket, provisionId, action = 'apply', params = {}) {
    const isDestroy = action === 'destroy';
    const engine = params.engine || 'aurora-postgresql';
    const tfDir = getTemplateDir(engine);
    const commandArgs = ['-chdir=' + tfDir, action, '-auto-approve'];
    
    // Add variables based on service type
    if (params.environment) commandArgs.push(`-var=environment=${params.environment}`);
    if (params.region) commandArgs.push(`-var=region=${params.region}`);
    
    // Service-specific variables
    if (engine === 'aurora-postgresql' && params.capacity) {
        commandArgs.push(`-var=capacity=${params.capacity}`);
    }
    if (engine === 'ec2' && params.capacity) {
        commandArgs.push(`-var=instance_type=${params.capacity}`);
    }
    if (engine === 'redis' && params.capacity) {
        commandArgs.push(`-var=node_type=${params.capacity}`);
    }
    if (engine === 'lambda' && params.capacity) {
        // capacity is memory size for lambda (e.g., "128MB" -> 128)
        const memory = parseInt(params.capacity) || 128;
        commandArgs.push(`-var=memory_size=${memory}`);
    }

    socket.emit('terraform_log', {
        provisionId,
        log: { time: new Date().toLocaleTimeString(), message: `Initializing Terraform ${action} for ${engine}...`, type: 'info' }
    });

    const init = spawn('terraform', ['-chdir=' + tfDir, 'init']);
    
    init.stdout.on('data', data => {
        const clean = data.toString().replace(/\x1b\[[0-9;]*m/g, '').trim();
        if (clean) socket.emit('terraform_log', { provisionId, log: { time: new Date().toLocaleTimeString(), message: clean, type: 'normal' }});
    });
    
    init.stderr.on('data', data => {
        const clean = data.toString().replace(/\x1b\[[0-9;]*m/g, '').trim();
        if (clean) socket.emit('terraform_log', { provisionId, log: { time: new Date().toLocaleTimeString(), message: clean, type: 'error' }});
    });
    
    init.on('close', async (code) => {
        if (code !== 0) {
            socket.emit('terraform_log', { provisionId, log: { time: new Date().toLocaleTimeString(), message: `✗ Terraform init failed with code ${code}`, type: 'error' }});
            socket.emit('terraform_log', { provisionId, log: { time: new Date().toLocaleTimeString(), message: 'Check that Terraform is installed and AWS credentials are configured.', type: 'error' }});
            
            // Update resource status to error
            await db.updateResource(provisionId, { status: 'Error' });
            await handleRollback(provisionId, engine, 'init failed');
            
            socket.emit('terraform_complete', { provisionId, success: false, error: 'Init failed' });
            return;
        }

        const tf = spawn('terraform', commandArgs);

        tf.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                // Strip ANSI escape codes
                const clean = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
                if(clean !== '') {
                    socket.emit('terraform_log', {
                        provisionId,
                        log: { time: new Date().toLocaleTimeString(), message: clean, type: 'normal' }
                    });
                }
            });
        });

        tf.stderr.on('data', (data) => {
            // Strip ANSI escape codes
            const clean = data.toString().replace(/\x1b\[[0-9;]*m/g, '').trim();
            if (clean) {
                socket.emit('terraform_log', {
                    provisionId,
                    log: { time: new Date().toLocaleTimeString(), message: clean, type: 'error' }
                });
            }
        });

        tf.on('close', async (code) => {
            const message = code === 0 ? `✓ Terraform ${action} complete!` : `✗ Terraform ${action} failed with code ${code}`;
            const type = code === 0 ? 'success' : 'error';
            
            socket.emit('terraform_log', {
                provisionId,
                log: { time: new Date().toLocaleTimeString(), message, type }
            });

            // After successful apply, fetch outputs
            if (code === 0 && !isDestroy) {
                fetchTerraformOutputs(socket, provisionId, engine, tfDir);
            } else if (code !== 0 && !isDestroy) {
                // Apply failed - update status and rollback
                await db.updateResource(provisionId, { status: 'Error' });
                socket.emit('terraform_log', {
                    provisionId,
                    log: { time: new Date().toLocaleTimeString(), message: 'Provisioning failed. Check AWS credentials and permissions.', type: 'error' }
                });
                socket.emit('terraform_complete', { provisionId, success: false, error: 'Apply failed' });
            } else {
                socket.emit('terraform_complete', { provisionId, success: code === 0 });
            }

            if (code === 0 && isDestroy) {
                socket.emit('terraform_complete', { provisionId, success: true });
            }
        });
    });
}

function fetchTerraformOutputs(socket, provisionId, engine, tfDir) {
    socket.emit('terraform_log', {
        provisionId,
        log: { time: new Date().toLocaleTimeString(), message: 'Fetching infrastructure outputs...', type: 'info' }
    });

    const output = spawn('terraform', ['-chdir=' + tfDir, 'output', '-json']);
    let outputData = '';

    output.stdout.on('data', (data) => {
        outputData += data.toString();
    });

    output.stderr.on('data', (data) => {
        socket.emit('terraform_log', {
            provisionId,
            log: { time: new Date().toLocaleTimeString(), message: data.toString(), type: 'error' }
        });
    });

    output.on('close', (code) => {
        if (code === 0 && outputData) {
            try {
                const outputs = JSON.parse(outputData);
                const secretArn = outputs.secret_arn?.value;
                
                // Fetch credentials from Secrets Manager
                if (secretArn) {
                    fetchSecretsFromAWS(socket, provisionId, secretArn, outputs, engine);
                } else {
                    // Fallback without secrets
                    const credentials = buildCredentials(outputs, {}, engine);
                    completeProvisioning(socket, provisionId, credentials, engine);
                }
            } catch (err) {
                socket.emit('terraform_log', {
                    provisionId,
                    log: { time: new Date().toLocaleTimeString(), message: `Failed to parse outputs: ${err.message}`, type: 'error' }
                });
                socket.emit('terraform_complete', { provisionId, success: false });
            }
        } else {
            socket.emit('terraform_complete', { provisionId, success: false });
        }
    });
}

function fetchSecretsFromAWS(socket, provisionId, secretArn, outputs, engine) {
    socket.emit('terraform_log', {
        provisionId,
        log: { time: new Date().toLocaleTimeString(), message: 'Retrieving credentials from Secrets Manager...', type: 'info' }
    });

    const aws = spawn('aws', ['secretsmanager', 'get-secret-value', '--secret-id', secretArn, '--query', 'SecretString', '--output', 'json']);
    let secretData = '';

    aws.stdout.on('data', (data) => {
        secretData += data.toString();
    });

    aws.stderr.on('data', (data) => {
        socket.emit('terraform_log', {
            provisionId,
            log: { time: new Date().toLocaleTimeString(), message: `AWS CLI: ${data.toString()}`, type: 'error' }
        });
    });

    aws.on('close', (code) => {
        if (code === 0 && secretData) {
            try {
                const secretString = JSON.parse(secretData.trim());
                const secret = JSON.parse(secretString);
                
                const credentials = buildCredentials(outputs, secret, engine);
                credentials.secret_arn = secretArn;

                socket.emit('terraform_log', {
                    provisionId,
                    log: { time: new Date().toLocaleTimeString(), message: '✓ Credentials retrieved securely', type: 'success' }
                });

                completeProvisioning(socket, provisionId, credentials, engine);
            } catch (err) {
                socket.emit('terraform_log', {
                    provisionId,
                    log: { time: new Date().toLocaleTimeString(), message: `Failed to parse secret: ${err.message}`, type: 'error' }
                });
                // Fallback without secrets
                const credentials = buildCredentials(outputs, {}, engine);
                completeProvisioning(socket, provisionId, credentials, engine);
            }
        } else {
            // AWS CLI failed, fallback without secrets
            socket.emit('terraform_log', {
                provisionId,
                log: { time: new Date().toLocaleTimeString(), message: 'Could not fetch from Secrets Manager (AWS CLI not configured?)', type: 'info' }
            });
            const credentials = buildCredentials(outputs, {}, engine);
            completeProvisioning(socket, provisionId, credentials, engine);
        }
    });
}

function buildCredentials(outputs, secret, engine) {
    const mapping = OUTPUT_MAPPING[engine] || OUTPUT_MAPPING['aurora-postgresql'];
    
    switch (engine) {
        case 'aurora-postgresql':
            return {
                cluster_endpoint: outputs.cluster_endpoint?.value || secret.host || 'N/A',
                reader_endpoint: outputs.reader_endpoint?.value || 'N/A',
                database_name: outputs.database_name?.value || secret.database || 'N/A',
                master_username: secret.username || 'orchestrator_admin',
                master_password: secret.password,
                port: secret.port || 5432
            };
        case 'ec2':
            return {
                public_ip: outputs.public_ip?.value || 'N/A',
                private_ip: outputs.private_ip?.value || 'N/A',
                instance_id: outputs.instance_id?.value || 'N/A',
                instance_type: secret.instance_type || 't3.medium',
                username: secret.username || 'ec2-user',
                password: secret.password,
                private_key: secret.private_key
            };
        case 's3':
            return {
                bucket_name: outputs.bucket_name?.value || 'N/A',
                bucket_arn: outputs.bucket_arn?.value || 'N/A',
                region: outputs.bucket_region?.value || secret.region || 'us-east-1',
                access_key_id: secret.access_key_id,
                secret_access_key: secret.secret_access_key
            };
        case 'redis':
            return {
                primary_endpoint: outputs.primary_endpoint?.value || secret.host || 'N/A',
                reader_endpoint: outputs.reader_endpoint?.value || 'N/A',
                cluster_id: outputs.cluster_id?.value || 'N/A',
                port: secret.port || 6379,
                password: secret.password
            };
        case 'lambda':
            return {
                function_name: outputs.function_name?.value || 'N/A',
                function_arn: outputs.function_arn?.value || 'N/A',
                api_endpoint: outputs.api_endpoint?.value || 'N/A',
                runtime: secret.runtime || 'nodejs18.x',
                memory_size: secret.memory_size || 128,
                timeout: secret.timeout || 30
            };
        default:
            return {
                endpoint: outputs[mapping.endpoint]?.value || 'N/A',
                name: outputs[mapping.name]?.value || 'N/A'
            };
    }
}

async function completeProvisioning(socket, provisionId, credentials, engine) {
    // Set the primary endpoint based on service type
    const ip = credentials.cluster_endpoint || 
                credentials.public_ip || 
                credentials.bucket_name || 
                credentials.primary_endpoint || 
                credentials.api_endpoint || 
                'Active';
    
    // Update resource in database
    await db.updateResource(provisionId, {
        status: 'Active',
        ip: ip,
        credentials: credentials
    });

    socket.emit('terraform_log', {
        provisionId,
        log: { time: new Date().toLocaleTimeString(), message: '✓ Infrastructure ready!', type: 'success' }
    });

    // Show relevant endpoint based on service type
    const endpointDisplay = credentials.cluster_endpoint || 
                           credentials.public_ip || 
                           credentials.bucket_name || 
                           credentials.primary_endpoint || 
                           credentials.api_endpoint;
    
    if (endpointDisplay) {
        socket.emit('terraform_log', {
            provisionId,
            log: { time: new Date().toLocaleTimeString(), message: `Endpoint: ${endpointDisplay}`, type: 'info' }
        });
    }

    socket.emit('terraform_complete', { 
        provisionId, 
        success: true, 
        credentials 
    });
}

module.exports = { runTerraform, runTerraformDestroy, handleRollback };

async function runTerraformDestroy(provisionId, engine, resource) {
    const tfDir = getTemplateDir(engine);
    const commandArgs = ['-chdir=' + tfDir, 'destroy', '-auto-approve'];
    
    // Add environment variable if stored
    if (resource.environment) {
        commandArgs.push(`-var=environment=${resource.environment}`);
    }
    
    const tf = spawn('terraform', commandArgs);
    
    tf.on('close', async (code) => {
        if (code === 0) {
            // Delete resource from database
            await db.deleteResource(provisionId);
            await db.decrementResourceCount();
            
            // Create activity
            await db.createActivity({
                id: `act-${Date.now()}`,
                user_name: "Current User",
                action: "destroyed",
                resource_name: `'${resource.name}'`,
                time: "Just now",
                type: "Infrastructure",
                status: "DESTROYED",
                icon: "delete",
                color_class: "danger"
            });
            
            console.log(`Resource ${provisionId} destroyed successfully`);
        } else {
            // Update status to error
            await db.updateResource(provisionId, { status: 'Error' });
            console.error(`Failed to destroy resource ${provisionId}`);
        }
    });
}

/**
 * Handle rollback when provisioning fails
 */
async function handleRollback(provisionId, engine, reason) {
    console.log(`Rolling back resource ${provisionId}: ${reason}`);
    
    try {
        // Delete the failed resource from database
        await db.deleteResource(provisionId);
        await db.decrementResourceCount();
        
        // Create activity for failed provisioning
        await db.createActivity({
            id: `act-${Date.now()}`,
            user_name: "System",
            action: "rollback",
            resource_name: `Resource ${provisionId}`,
            time: "Just now",
            type: "Infrastructure",
            status: "FAILED",
            icon: "error",
            color_class: "danger"
        });
    } catch (err) {
        console.error(`Rollback failed for ${provisionId}:`, err);
    }
}