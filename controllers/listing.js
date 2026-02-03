import { Listing } from "../models/listing.js";
import fetch from "node-fetch";
import opencage from 'opencage-api-client';

export const index = async (req, res) => {
    let { category, search } = req.query;
    let filter = {};

    if (!category || category === "undefined") {
        category = "Homes";
    }
    req.session.category = category;

    if (category) {
        filter = { category: category };
    }
    if (search) {
        const searchRegex = { $regex: search, $options: "i" };
        // This effectively says: WHERE category = X AND (title = Y OR location = Y OR country = Y)
        filter.$or = [
            { title: searchRegex },
            { location: searchRegex },
            { country: searchRegex }
        ];
    }

    let listings = await Listing.find(filter);
    if (listings.length === 0 && search) {
        res.locals.error = [`No listings found for destination ${search}.`];

        // Reset filter to ONLY category (drop the $or search part)
        listings = await Listing.find({ category: category });
    }
    res.render("listings/index", { listings, category });
}

export const create = (req, res) => {
    const { category } = req.query;
    res.render("listings/new", { category });
}

export const add = async (req, res, next) => {
    try {
        const listing = new Listing(req.body.listing);
        listing.owner = req.user._id;

        // Image Handling
        if (req.file) {
            listing.image = { url: req.file.path, filename: req.file.filename };
        }

        // OPENCAGE GEOCODING
        // Note: Ye process.env se key uthayega
        const data = await opencage.geocode({
            q: req.body.listing.location,
            key: process.env.OPENCAGE_API_KEY
        });

        // Check if location found
        if (data.status.code === 200 && data.results.length > 0) {
            const place = data.results[0];
            listing.geometry = {
                type: "Point",
                // OpenCage returns .lng and .lat
                coordinates: [place.geometry.lng, place.geometry.lat]
            };
        } else {
            // Agar location nahi mili to Default (New Delhi)
            console.log("Location not found, using default.");
            listing.geometry = { type: "Point", coordinates: [77.209, 28.613] };
        }

        await listing.save();
        req.flash("success", "New Listing created!");
        res.redirect("/listings");

    } catch (err) {
        console.log("Geocoding Error:", err.message);
        // Error aaye to bhi listing save ho jayegi (Default coordinates ke sath)
        const listing = new Listing(req.body.listing);
        listing.owner = req.user._id;
        if (req.file) listing.image = { url: req.file.path, filename: req.file.filename };
        listing.geometry = { type: "Point", coordinates: [77.209, 28.613] };
        await listing.save();

        req.flash("success", "Listing created (Map check failed but saved).");
        res.redirect("/listings");
    }
};

export const show = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/show", { listing });
}

export const edit = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }

    let originalimgurl = listing.image.url;
    console.log(listing.image.url);
    originalimgurl = originalimgurl.replace(
        "/upload",
        "/upload/w_300"
    );

    res.render("listings/edit", { listing, originalimgurl });
}

export const update = async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if (typeof req.file != "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}

export const deletecontroller = async (req, res) => {
    const { id } = req.params;
    const deletedListings = await Listing.findOneAndDelete({ _id: id });
    console.log(deletedListings);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
}