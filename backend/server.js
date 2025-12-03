require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now (Mobile + CMS)
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secureher')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('🔌 New Client Connected:', socket.id);

    // Listen for SOS Alerts from Mobile App
    socket.on('sos_activated', (data) => {
        console.log('🚨 SOS ALERT RECEIVED:', data);
        // Broadcast to CMS Dashboard
        io.emit('new_sos_alert', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Basic Route
app.get('/', (req, res) => {
    res.send('SecureHer Backend is Running 🚀');
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
});
