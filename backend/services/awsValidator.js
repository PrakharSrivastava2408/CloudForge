const { spawn } = require('child_process');

/**
 * Validate AWS credentials before provisioning
 */
async function validateAwsCredentials() {
    return new Promise((resolve) => {
        const aws = spawn('aws', ['sts', 'get-caller-identity', '--output', 'json']);
        
        let output = '';
        let error = '';
        
        aws.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        aws.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        aws.on('close', (code) => {
            if (code === 0 && output) {
                try {
                    const identity = JSON.parse(output);
                    resolve({
                        valid: true,
                        accountId: identity.Account,
                        arn: identity.Arn,
                        userId: identity.UserId
                    });
                } catch (e) {
                    resolve({
                        valid: false,
                        error: 'Failed to parse AWS response'
                    });
                }
            } else {
                resolve({
                    valid: false,
                    error: error || 'AWS credentials not configured or invalid'
                });
            }
        });
    });
}

/**
 * Check if Terraform is installed
 */
async function validateTerraformInstalled() {
    return new Promise((resolve) => {
        const tf = spawn('terraform', ['version']);
        
        let output = '';
        
        tf.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        tf.on('close', (code) => {
            if (code === 0) {
                const versionMatch = output.match(/Terraform v(\d+\.\d+\.\d+)/);
                resolve({
                    installed: true,
                    version: versionMatch ? versionMatch[1] : 'unknown'
                });
            } else {
                resolve({
                    installed: false,
                    error: 'Terraform not found. Please install Terraform.'
                });
            }
        });
    });
}

/**
 * Validate AWS region
 */
async function validateAwsRegion(region) {
    const validRegions = [
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
        'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2',
        'ap-south-1', 'sa-east-1', 'ca-central-1'
    ];
    
    return validRegions.includes(region);
}

/**
 * Pre-flight check before provisioning
 */
async function preFlightCheck() {
    const results = {
        aws: null,
        terraform: null,
        ready: false,
        errors: []
    };
    
    // Check AWS credentials
    results.aws = await validateAwsCredentials();
    if (!results.aws.valid) {
        results.errors.push(`AWS: ${results.aws.error}`);
    }
    
    // Check Terraform
    results.terraform = await validateTerraformInstalled();
    if (!results.terraform.installed) {
        results.errors.push(`Terraform: ${results.terraform.error}`);
    }
    
    results.ready = results.aws.valid && results.terraform.installed;
    
    return results;
}

module.exports = {
    validateAwsCredentials,
    validateTerraformInstalled,
    validateAwsRegion,
    preFlightCheck
};