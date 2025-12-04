const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true // Allows multiple null values
    },
    pin: {
        type: String,
        required: true
    },
    trustedContacts: [{
        name: String,
        phone: String
    }]
}, {
    timestamps: true
});

// Method to match entered pin with hashed pin
userSchema.methods.matchPin = async function (enteredPin) {
    return await bcrypt.compare(enteredPin, this.pin);
};

// Middleware to hash pin before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('pin')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
