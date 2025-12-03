const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    type: { type: String, required: true }, // e.g., 'Harassment', 'Theft'
    description: { type: String },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    media: [{ type: String }], // URLs to images/audio
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Reviewed', 'Resolved'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incident', IncidentSchema);
