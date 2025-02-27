import Razorpay from "razorpay";
import crypto from "crypto";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Lecture } from "../models/lecture.model.js";
import User from "../models/user.model.js";

// Initialize Razorpay instance with your credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    console.log("Received courseId:", courseId); // Debugging

    // Ensure courseId is a string
    const courseIdString = typeof courseId === "string" ? courseId : courseId.courseId;
    if (typeof courseIdString !== "string") {
      return res.status(400).json({ message: "Invalid courseId format" });
    }

    const course = await Course.findById(courseIdString);
    if (!course) return res.status(404).json({ message: "Course not found!" });

    // Create a new course purchase record
    const newPurchase = new CoursePurchase({
      courseId: courseIdString,
      userId,
      amount: course.coursePrice,
      status: "pending",
    });

    // Create a Razorpay order
    const options = {
      amount: course.coursePrice * 100, // Amount in paise (lowest denomination)
      currency: "INR",
      receipt: `receipt_${newPurchase._id}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: "Error creating order" });
    }

    // Save the purchase record
    newPurchase.paymentId = order.id;
    await newPurchase.save();

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      courseTitle: course.courseTitle, // Include course title in the response
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify the payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const purchase = await CoursePurchase.findOne({ paymentId: razorpay_order_id }).populate({ path: "courseId" });

      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      purchase.status = "completed";
      await purchase.save();

      // Make all lectures visible by setting `isPreviewFree` to true
      if (purchase.courseId && purchase.courseId.lectures.length > 0) {
        await Lecture.updateMany(
          { _id: { $in: purchase.courseId.lectures } },
          { $set: { isPreviewFree: true } }
        );
      }

      // Update user's enrolledCourses
      await User.findByIdAndUpdate(
        purchase.userId,
        { $addToSet: { enrolledCourses: purchase.courseId._id } }, // Add course ID to enrolledCourses
        { new: true }
      );

      // Update course to add user ID to enrolledStudents
      await Course.findByIdAndUpdate(
        purchase.courseId._id,
        { $addToSet: { enrolledStudents: purchase.userId } }, // Add user ID to enrolledStudents
        { new: true }
      );

      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Handle webhook events
export const handleWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const receivedSignature = req.headers["x-razorpay-signature"];
  const generatedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (receivedSignature === generatedSignature) {
    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured") {
      const paymentId = payload.payment.entity.id;
      const orderId = payload.payment.entity.order_id;

      // Update order status in the database
      const purchase = await CoursePurchase.findOne({ paymentId: orderId });
      if (purchase) {
        purchase.status = "completed";
        await purchase.save();

        // Additional logic (e.g., making lectures visible)
        if (purchase.courseId && purchase.courseId.lectures.length > 0) {
          await Lecture.updateMany(
            { _id: { $in: purchase.courseId.lectures } },
            { $set: { isPreviewFree: true } }
          );
        }

        // Update user's enrolledCourses
        await User.findByIdAndUpdate(
          purchase.userId,
          { $addToSet: { enrolledCourses: purchase.courseId._id } },
          { new: true }
        );

        // Update course to add user ID to enrolledStudents
        await Course.findByIdAndUpdate(
          purchase.courseId._id,
          { $addToSet: { enrolledStudents: purchase.userId } },
          { new: true }
        );

        console.log(`Payment captured: ${paymentId}`);
      } else {
        console.log(`Order not found: ${orderId}`);
      }
    }

    return res.status(200).json({ message: "Event processed successfully" });
  } else {
    return res.status(400).json({ message: "Invalid signature" });
  }
};

// Get course detail with purchase status
export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator" })
      .populate({ path: "lectures" });

    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    const purchased = await CoursePurchase.findOne({ userId, courseId });

    return res.status(200).json({
      course,
      purchased: !!purchased, // true if purchased, false otherwise
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all purchased courses
export const getAllPurchasedCourse = async (_, res) => {
  try {
    const purchasedCourse = await CoursePurchase.find({
      status: "completed",
    }).populate("courseId");
    if (!purchasedCourse.length) {
      return res.status(404).json({
        purchasedCourse: [],
      });
    }
    return res.status(200).json({
      purchasedCourse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
