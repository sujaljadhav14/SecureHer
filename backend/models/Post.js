const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    images: [{
        type: String // URLs to images
    }],
    location: {
        type: String,
        default: ''
    },
    tags: [{
        type: String
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String,
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral', 'needs_support'],
        default: 'neutral'
    },
    supportOffered: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
