import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './db/db.js'; // Correct path to your connectDB file
import { Course } from './models/course.model.js'; // Correct path to course model
import { Lecture } from './models/lecture.model.js'; // Correct path to lecture model

dotenv.config();

const checkIds = async () => {
  try {
    const lecture = await Lecture.findById('67a47b68baa86e959abd7400');
    const course = await Course.findById('67a0de99851f060d85a51299');

    if (lecture) {
      console.log('Lecture found:', lecture);
    } else {
      console.log('Lecture not found');
    }

    if (course) {
      console.log('Course found:', course);
    } else {
      console.log('Course not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Connect to the database and run the check
connectDB().then(() => {
  checkIds();
});
