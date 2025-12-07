const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/signin', authUser);
router.get('/getUserProfile', protect, getUserProfile);
router.patch('/updateUserProfile', protect, updateUserProfile);

module.exports = router;
