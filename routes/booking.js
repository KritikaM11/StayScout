import express from "express";
const router = express.Router({ mergeParams: true });
import { isLoggedin } from "../middleware.js";
import { createBooking, verifyPayment } from "../controllers/booking.js";

router.post("/", isLoggedin, createBooking);
router.get("/verify", isLoggedin, verifyPayment);
export const bookingRouter = router;