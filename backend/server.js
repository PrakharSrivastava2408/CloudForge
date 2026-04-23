require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const apiRoutes = require('./routes/api');
const { runTerraform } = require('./services/terraformRunner');

const app = express();
const server = http.createServer(app);

// Wide open CORS for local development
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Load our API routes
app.use('/api', apiRoutes);

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Listen for provision start command
    socket.on('start_provisioning', (data) => {
        const { provisionId, action, params } = data;
        console.log(`Starting real terraform for provision ID: ${provisionId}`);
        runTerraform(socket, provisionId, action || 'apply', params || {});
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`IDP Backend running on port ${PORT}`);
    console.log(`REST API => http://localhost:${PORT}/api`);
    console.log(`Socket Stream Ready`);
});
