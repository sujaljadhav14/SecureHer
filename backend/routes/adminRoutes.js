const express = require('express');
const router = express.Router();
const { getAllIncidents } = require('../controllers/userController');

// Define admin routes
router.get('/getAllIncidents', getAllIncidents);

module.exports = router;
