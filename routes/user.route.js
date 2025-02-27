import express from 'express';
import { signup, login, getUserProfile, logout, updateUserProfile } from '../controllers/user.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import upload from '../utils/multer.js'; // Correct import path

const router = express.Router();

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/profile').get(isAuthenticated, getUserProfile);
router.route('/profile/update').put(isAuthenticated, upload.single('profilePhoto'), updateUserProfile); // Apply multer middleware
router.route('/logout').post(logout);

export default router;
