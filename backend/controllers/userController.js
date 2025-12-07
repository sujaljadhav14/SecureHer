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

// @desc    Get user profile
// @route   GET /users/getUserProfile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            mobileNumber: user.mobileNumber,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PATCH /users/updateUserProfile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        // Handle profile image upload (assuming middleware handles the file and puts url in body or file)
        // For simple string based URI (as seen in frontend use)
        if (req.body.itemImage) {
            // Note: In a real app with file upload, this would be different (e.g., using multer/cloudinary)
            // But based on frontend sending multipart, we might need multer middleware. 
            // For now, let's assume if it's passed in body somehow or handle basic string update if passed.
            // Wait, frontend sends multipart with 'itemImage'. We need multer for that.
            // BUT, for MVP/Local, if we are just storing the URI string or base64? 
            // Frontend sends: formData.append('itemImage', { uri: ... })
            // This requires multer to process. 
            // Given the complexity of setting up Multer + Cloudinary/Local Storage right now,
            // and the user request just being about data loading, I will just accept text fields for now.
            // If the user insists on image upload, I will tackle that separately.
            // However, to prevent crash, I should just ignore image if I can't handle it yet, 
            // or if I receive a string URL (e.g. from cloud), save it.
        }

        // If profileImage string is passed explicitly (e.g. if we skip file upload for now)
        if (req.body.profileImage) {
            user.profileImage = req.body.profileImage;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            mobileNumber: updatedUser.mobileNumber,
            name: updatedUser.name,
            email: updatedUser.email,
            profileImage: updatedUser.profileImage,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Create a new incident
// @route   POST /users/createIncident
// @access  Private
const createIncident = asyncHandler(async (req, res) => {
    const { type, description, location, priority, status } = req.body;

    // Process location if it maps to address string or object
    // Frontend sends 'location' as string address usually

    const media = [];

    if (req.files) {
        if (req.files.incidentImage) {
            media.push(req.files.incidentImage[0].path);
        }
        if (req.files.incidentAudio) {
            media.push(req.files.incidentAudio[0].path);
        }
    }

    const incident = await require('../models/Incident').create({
        user: req.user._id,
        type,
        description,
        location: {
            address: location // Simplified as frontend sends string
        },
        priority: priority || 'Low',
        status: status || 'Active',
        media
    });

    if (incident) {
        res.status(201).json({
            message: 'Incident reported successfully',
            incident: {
                incidentId: incident._id,
                type: incident.type,
                status: incident.status,
                priority: incident.priority || 'Low',
                createdAt: incident.createdAt,
                location: incident.location.address,
                description: incident.description,
                imageUrl: req.files && req.files.incidentImage ? req.files.incidentImage[0].path : null, // Local path for now
                audioUrl: req.files && req.files.incidentAudio ? req.files.incidentAudio[0].path : null
            }
        });
    } else {
        res.status(400);
        throw new Error('Invalid incident data');
    }
});

// @desc    Get all incidents (Admin)
// @route   GET /admin/getAllIncidents
// @access  Public (for now, or protect if needed)
const getAllIncidents = asyncHandler(async (req, res) => {
    const incidents = await require('../models/Incident').find({}).sort({ createdAt: -1 }).populate('user', 'name email mobileNumber'); // POPULATE USER DATA

    // Map to format expected by CMS if needed, or send as is
    // The CMS seems to expect 'reportedByName', which we can get from populated user
    const formattedIncidents = incidents.map(incident => ({
        _id: incident._id,
        incidentId: incident._id.toString().slice(-6).toUpperCase(), // varied ID for display
        type: incident.type,
        status: incident.status,
        priority: incident.priority,
        description: incident.description,
        location: incident.location.address,
        createdAt: incident.createdAt,
        imageUrl: incident.media && incident.media[0] ? incident.media[0] : null, // Take first image
        audioUrl: incident.media && incident.media[1] ? incident.media[1] : null, // Audio usually second
        reportedBy: incident.user,
        reportedByName: incident.user ? incident.user.name : 'Anonymous'
    }));

    res.json(formattedIncidents);
});

module.exports = {
    registerUser,
    authUser,
    getUserProfile,
    updateUserProfile,
    createIncident,
    getAllIncidents
};
