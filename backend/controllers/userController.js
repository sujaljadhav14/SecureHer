const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /users/signup
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { mobileNumber, pin, name, email } = req.body;

    if (!mobileNumber || !pin) {
        res.status(400);
        throw new Error('Please include all fields');
    }

    // Check if user already exists
    const userExists = await User.findOne({ mobileNumber });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
        mobileNumber,
        pin,
        name,
        email
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            mobileNumber: user.mobileNumber,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /users/signin
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { mobileNumber, pin } = req.body;

    const user = await User.findOne({ mobileNumber });

    if (user && (await user.matchPin(pin))) {
        res.json({
            _id: user._id,
            mobileNumber: user.mobileNumber,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

module.exports = {
    registerUser,
    authUser,
};
