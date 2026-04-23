const express = require('express');
const router = express.Router();
const { db } = require('../services/database');
const { preFlightCheck, validateAwsCredentials } = require('../services/awsValidator');

// Health check endpoint
router.get('/health', async (req, res) => {
    const checks = await preFlightCheck();
    res.json({
        status: checks.ready ? 'healthy' : 'unhealthy',
        checks: {
            aws: checks.aws,
            terraform: checks.terraform
        },
        errors: checks.errors
    });
});

// AWS validation endpoint
router.get('/validate-aws', async (req, res) => {
    const result = await validateAwsCredentials();
    res.json(result);
});

// Dashboard routes
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await db.getStats();
    const activity = await db.getActivity();
    res.json({
      stats,
      activity: activity.map(a => ({
        id: a.id,
        user: a.user_name,
        action: a.action,
        resourceName: a.resource_name,
        time: a.time,
        type: a.type,
        status: a.status,
        icon: a.icon,
        colorClass: a.color_class
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Catalog routes
router.get('/catalog', async (req, res) => {
  try {
    const catalog = await db.getServiceCatalog();
    res.json({ catalog });
  } catch (error) {
    console.error('Catalog error:', error);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// Resources routes
router.get('/resources', async (req, res) => {
  try {
    const resources = await db.getResources();
    res.json({
      resources: resources.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        status: r.status,
        ip: r.ip,
        engine: r.engine,
        credentials: r.credentials
      }))
    });
  } catch (error) {
    console.error('Resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

router.get('/resources/:id/credentials', async (req, res) => {
  const { id } = req.params;
  
  try {
    const resource = await db.getResource(id);
    
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    
    if (!resource.credentials) {
      return res.status(404).json({ error: "Credentials not available yet" });
    }
    
    const creds = resource.credentials;
    let connString = '';
    
    // Generate connection string based on service type
    if (creds.cluster_endpoint) {
      connString = `postgresql://${creds.master_username}:<password>@${creds.cluster_endpoint}:${creds.port || 5432}/${creds.database_name}`;
    } else if (creds.public_ip) {
      connString = `ssh ${creds.username || 'ec2-user'}@${creds.public_ip}`;
    } else if (creds.bucket_name) {
      connString = `s3://${creds.bucket_name}`;
    } else if (creds.primary_endpoint) {
      connString = `redis://:${creds.password ? '***' : ''}@${creds.primary_endpoint}:${creds.port || 6379}`;
    } else if (creds.api_endpoint) {
      connString = creds.api_endpoint;
    }
    
    res.json({
      credentials: creds,
      connectionString: connString
    });
  } catch (error) {
    console.error('Credentials error:', error);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

router.delete('/resources/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const resource = await db.getResource(id);
    
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    
    // Update status to terminating
    await db.updateResource(id, { status: "Terminating" });
    
    // Run terraform destroy asynchronously
    const { runTerraformDestroy } = require('../services/terraformRunner');
    runTerraformDestroy(id, resource.engine, resource);
    
    // Create activity
    await db.createActivity({
      id: `act-${Date.now()}`,
      user_name: "Current User",
      action: "destroyed",
      resource_name: `'${resource.name}'`,
      time: "Just now",
      type: "Infrastructure",
      status: "TERMINATING",
      icon: "delete",
      color_class: "danger"
    });
    
    return res.status(202).json({ message: "Resource termination started" });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// Provision route
router.post('/provision', async (req, res) => {
  const { engine, capacity, environment } = req.body;
  const newProvisionId = `prov-${Date.now()}`;
  
  // Validate AWS credentials first
  const awsCheck = await validateAwsCredentials();
  if (!awsCheck.valid) {
    return res.status(400).json({ 
      error: 'AWS credentials not configured or invalid',
      details: awsCheck.error 
    });
  }
  
  // Determine resource type based on engine
  const typeMap = {
    'aurora-postgresql': 'RDS Aurora',
    'ec2': 'EC2',
    's3': 'S3',
    'redis': 'ElastiCache',
    'lambda': 'Lambda'
  };
  
  const resourceType = typeMap[engine] || 'Infrastructure';
  const shortEngine = engine.split('-')[0] || 'resource';
  const resourceName = `new-${shortEngine}-${Math.floor(Math.random() * 1000)}`;
  
  try {
    // Create a pending resource in database
    await db.createResource({
      id: newProvisionId,
      name: resourceName,
      type: resourceType,
      status: 'Provisioning',
      ip: 'Pending...',
      engine: engine,
      credentials: null,
      environment: environment
    });
    
    // Increment resource count
    await db.incrementResourceCount();
    
    // Create activity
    await db.createActivity({
      id: `act-${Date.now()}`,
      user_name: "Current User",
      action: "provisioned",
      resource_name: `'${resourceName}'`,
      time: "Just now",
      type: "Infrastructure",
      status: "PENDING",
      icon: "add_circle",
      color_class: "primary"
    });

    return res.status(202).json({ 
      message: "Provisioning started", 
      provisionId: newProvisionId,
      awsAccount: awsCheck.accountId
    });
  } catch (error) {
    console.error('Provision error:', error);
    return res.status(500).json({ error: 'Failed to start provisioning' });
  }
});

module.exports = router;
