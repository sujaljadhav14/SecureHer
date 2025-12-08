require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const postRoutes = require('./routes/postRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

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
// For MVP: Force local connection to avoid broken .env issues
const MONGODB_URI = 'mongodb://127.0.0.1:27017/secureher';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected (Local)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/posts', postRoutes);

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Error Handling
// app.use(notFound);
// app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
});
