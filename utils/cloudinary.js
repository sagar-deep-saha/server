import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});


export const uploadMedia = async (file) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(file, {
            resource_type: 'auto'
        });
        return uploadResponse;
    } catch (error) {
        console.log('Upload Error:', error);
        return null;
    }
};

export const deleteMedia = async (publicId) => {
    try {
        const deleteResponse = await cloudinary.uploader.destroy(publicId);
        return deleteResponse;
    } catch (error) {
        console.log('Delete Error:', error);
        return null;
    }
};

export const deleteVideo = async (publicId) => {
    try {
        const deleteResponse = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'video'
        });
        return deleteResponse;
    } catch (error) {
        console.log('Delete Error:', error);
        return null;
    }
};

export const deletePdf = async (publicId) => {
    try {
        const deleteResponse = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw'
        });
        return deleteResponse;
    } catch (error) {
        console.log('Delete Error:', error);
        return null;
    }
};


