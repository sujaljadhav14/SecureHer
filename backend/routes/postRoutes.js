const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/posts/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get all posts
router.get('/posts', protect, async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'username email')
            .limit(50);

        res.json({ success: true, data: posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
});

// Create a new post (with image upload support)
router.post('/posts', protect, upload.single('image'), async (req, res) => {
    try {
        console.log('📝 Received post creation request');
        console.log('Body:', req.body);
        console.log('File:', req.file);
        console.log('User:', req.user);

        const { title, description, location, tags, sentiment } = req.body;

        if (!title || title.trim() === '') {
            console.log('❌ No title provided');
            return res.status(400).json({ success: false, message: 'Post title is required' });
        }

        // Build content from title and description
        const content = title + (description ? '\n' + description : '');

        // Handle image if uploaded
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/posts/${req.file.filename}`;
            console.log('📸 Image saved:', imageUrl);
        }

        const newPost = new Post({
            userId: req.user.id,
            username: req.user.name || req.user.mobileNumber || 'Anonymous User',
            content,
            images: imageUrl ? [imageUrl] : [],
            location: location || '',
            tags: tags ? (typeof tags === 'string' ? tags.split(',') : tags) : [],
            sentiment: sentiment || 'neutral',
            likes: [],
            comments: []
        });

        await newPost.save();
        console.log('✅ Post created successfully:', newPost._id);

        res.status(201).json({ success: true, data: newPost });
    } catch (error) {
        console.error('❌ Error creating post:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
    }
});

// Like/Unlike a post
router.post('/posts/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const likeIndex = post.likes.indexOf(req.user.id);

        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push(req.user.id);
        }

        await post.save();

        res.json({ success: true, data: post });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ success: false, message: 'Failed to like post' });
    }
});

// Add comment to a post
router.post('/posts/:id/comment', protect, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        post.comments.push({
            userId: req.user.id,
            username: req.user.name || req.user.mobileNumber || 'Anonymous User',
            text,
            createdAt: new Date()
        });

        await post.save();

        res.json({ success: true, data: post });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
});

// Get comments for a post
router.get('/posts/:id/comments', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.json({ success: true, data: post.comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
});

module.exports = router;
