import { User } from "../models/user.js";
import { Booking } from "../models/booking.js";
import { Listing } from "../models/listing.js";

export const usersignup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({
            email, username
        })
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (error) => {
            if (error) {
                return next(error);
            }
            req.flash("success", "Welcome to StayScout");
            res.redirect("/listings");
        })
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}

export const userlogout = (req, res, next) => {
    req.logout((error) => {
        if (error) {
            return next(error);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    })
}

export const renderProfile = async (req, res) => {
    // 1. Find all bookings made BY the current user
    // We populate 'listing' so we can show the title/image of the place they booked
    const myBookings = await Booking.find({ booker: req.user._id }).populate("listing");
    const allListings = await Listing.find({ owner: req.user._id });
    // 2. Find all listings OWNED by the current user
    const myHomes = allListings.filter(l => l.category === "Homes");
    const myExperiences = allListings.filter(l => l.category === "Experiences");
    const myServices = allListings.filter(l => l.category === "Services");

    res.render("users/profile.ejs", {
        myBookings,
        myHomes,
        myExperiences,
        myServices,
        allListings // We still pass this to check if the user has ANY listings at all
    });
};