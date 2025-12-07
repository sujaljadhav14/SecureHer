const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const {
    registerUser,
    authUser,
    getUserProfile,
    updateUserProfile,
    createIncident
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/signin', authUser);
router.get('/getUserProfile', protect, getUserProfile);
router.patch('/updateUserProfile', protect, updateUserProfile);
router.post('/createIncident', protect, upload.fields([
    { name: 'incidentImage', maxCount: 1 },
    { name: 'incidentAudio', maxCount: 1 }
]), createIncident);

module.exports = router;
