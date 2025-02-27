import dotenv from 'dotenv';
import express from 'express';
import connectDB from './db/db.js';
import userRoute from './routes/user.route.js';
import courseRoute from './routes/course.route.js';
import mediaRoute from './routes/media.route.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import coursePurchaseRoute from './routes/purchaseCourse.route.js'; // Corrected the import
import bodyParser from 'body-parser';
import courseProgressRoute from "./routes/courseProgress.route.js";
dotenv.config();
connectDB();

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

// Health check endpoint
app.get('/check', (req, res) => {
    res.status(200).json({ message: 'Server is up and running!' });
});

app.use('/api/v1/user', userRoute);
app.use('/api/v1/course', courseRoute);
app.use('/api/v1/media', mediaRoute);
app.use('/api/v1/purchase', coursePurchaseRoute);
// apis

app.use("/api/v1/course-progress", courseProgressRoute); // Corrected the path

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});
