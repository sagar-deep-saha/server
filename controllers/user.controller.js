import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
import { generateToken } from '../utils/generateToken.js';
import {uploadMedia, deleteMedia} from '../utils/cloudinary.js'

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});


export const signup = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Check if user already exists by email or phone number
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or phone number already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ name, email, phone, password: hashedPassword, role });
        await newUser.save();

        const userResponse = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role, // Ensure the role is included in the response
        };

        const token = generateToken(res, newUser);

        res.status(201).json({ token, message: 'User created and logged in successfully', user: userResponse });
    } catch (error) {
        console.error('Signup Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error during signup' });
        }
    }
};



export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Incorrect email/phone or password"
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect email/phone or password"
            });
        }

        generateToken(res, user, `Welcome back ${user.name}`);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to login"
        });
    }
};


export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ message: 'Server error during logout' });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false,
            });
        }

        return res.status(200).json({ user, success: true });

    } catch (error) {
        console.error('Get User Profile Error:', error);
        console.log('Get User Profile Error:', error);
        res.status(500).json({ message: 'Server error during fetching user profile' });
    }
};


export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { name } = req.body;
        const profilePhoto = req.file ? req.file.path : null;

        console.log('Profile Photo:', profilePhoto); // Debugging line

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false,
            });
        }

        if (user.photoUrl) {
            const publicId = user.photoUrl.split('/').pop().split('.')[0];
            await deleteMedia(publicId); // Ensure the correct function is called
        }

        let photoUrl = user.photoUrl;
        if (profilePhoto) {
            const cloudResponse = await uploadMedia(profilePhoto); // Ensure the correct function is called
            console.log('Cloud Response:', cloudResponse); // Debugging line
            if (cloudResponse && cloudResponse.secure_url) {
                photoUrl = cloudResponse.secure_url;
            } else {
                return res.status(500).json({ message: 'Error uploading profile photo' });
            }
        }

        const updatedData = { name, photoUrl };

        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true }).select('-password');

        return res.status(200).json({ user: updatedUser, success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update User Profile Error:', error);
        res.status(500).json({ message: 'Server error during updating user profile' });
    }
};