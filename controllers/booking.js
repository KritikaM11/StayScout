import { Listing } from "../models/listing.js";
import { Booking } from "../models/booking.js";
import crypto from "crypto";
import Razorpay from "razorpay";

// Initialize Razorpay with your keys
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createBooking = async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut } = req.body.booking;

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
        req.flash("error", "Check-in date cannot be in the past!");
        return res.redirect(`/listings/${id}`);
    }
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        req.flash("error", "Invalid booking dates!");
        return res.redirect(`/listings/${id}`);
    }

    if (start >= end) {
        req.flash("error", "Check-out date must be after Check-in date!");
        return res.redirect(`/listings/${id}`);
    }

    const existingBooking = await Booking.findOne({
        listing: id,

        $or: [
            { status: "confirmed" },

            {
                status: "pending",
                expiresAt: { $gt: new Date() }
            }
        ],

        checkIn: { $lt: end },
        checkOut: { $gt: start }
    });

    if (existingBooking) {
        req.flash("error", "Dates are already booked! Please choose different dates.");
        return res.redirect(`/listings/${id}`);
    }

    const dayDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = dayDiff * listing.price;

    const options = {
        amount: totalPrice * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);

        const newBooking = new Booking({
            listing: id,
            booker: req.user._id,
            checkIn: start,
            checkOut: end,
            totalPrice: totalPrice,
            status: "pending",
            razorpayOrderId: order.id,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });
        await newBooking.save();

        // 4. Render Confirmation Page with Order Data
        res.render("bookings/confirm.ejs", {
            listing,
            booking: newBooking,
            order, // Pass the Razorpay order object
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong with payment creation");
        res.redirect(`/listings/${id}`);
    }
};

export const verifyPayment = async (req, res) => {
    const { id } = req.params;

    const {
        bookingId,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
    } = req.query;

    const booking = await Booking.findOne({
        _id: bookingId,
        booker: req.user._id,
        listing: id
    });

    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect(`/listings/${id}`);
    }
    if (
        booking.status === "pending" &&
        booking.expiresAt &&
        booking.expiresAt < new Date()
    ) {
        booking.status = "cancelled";
        await booking.save();

        req.flash("error", "Payment session expired. Please book again.");
        return res.redirect(`/listings/${id}`);
    }

    if (
        !razorpay_payment_id ||
        !razorpay_order_id ||
        !razorpay_signature
    ) {
        req.flash("error", "Payment verification data is missing.");
        return res.redirect(`/listings/${id}`);
    }

    if (booking.razorpayOrderId !== razorpay_order_id) {
        req.flash("error", "Invalid payment order.");
        return res.redirect(`/listings/${id}`);
    }

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    const expectedSignature = Buffer.from(generatedSignature, "utf8");
    const receivedSignature = Buffer.from(razorpay_signature, "utf8");

    const isValid =
        expectedSignature.length === receivedSignature.length &&
        crypto.timingSafeEqual(
            expectedSignature,
            receivedSignature
        );

    if (!isValid) {
        req.flash("error", "Payment verification failed.");
        return res.redirect(`/listings/${id}`);
    }

    // Prevent unnecessary repeated confirmation
    if (booking.status === "confirmed") {
        req.flash("success", "Booking is already confirmed.");
        return res.redirect(`/listings/${id}`);
    }

    booking.status = "confirmed";
    await booking.save();

    req.flash("success", "Payment Successful! Booking Confirmed.");
    return res.redirect(`/listings/${id}`);
};