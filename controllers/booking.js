import { Listing } from "../models/listing.js";
import { Booking } from "../models/booking.js";
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
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (start >= end) {
        req.flash("error", "Check-out date must be after Check-in date!");
        return res.redirect(`/listings/${id}`);
    }

    const existingBooking = await Booking.findOne({
        listing: id,
        status: { $ne: "cancelled" }, // Ignore cancelled bookings
        $or: [
            // Logic: (StartA < EndB) and (EndA > StartB) means overlap
            { checkIn: { $lt: end }, checkOut: { $gt: start } }
        ]
    });

    if (existingBooking) {
        req.flash("error", "Dates are already booked! Please choose different dates.");
        return res.redirect(`/listings/${id}`);
    }
    // 1. Calculate Price
    const dayDiff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = dayDiff * listing.price;

    // 2. Create Razorpay Order
    // Razorpay needs amount in "paise" (multiply by 100)
    const options = {
        amount: totalPrice * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);

        // 3. Save Booking to DB (Pending)
        const newBooking = new Booking({
            listing: id,
            booker: req.user._id,
            checkIn: start,
            checkOut: end,
            totalPrice: totalPrice,
            status: "pending"
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
    const { bookingId, paymentId } = req.query;

    const booking = await Booking.findById(bookingId);
    if (booking) {
        booking.status = "confirmed";
        await booking.save();
    }

    req.flash("success", "Payment Successful! Booking Confirmed.");
    res.redirect(`/listings/${id}`);
};
