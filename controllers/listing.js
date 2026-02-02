import { Listing } from "../models/listing.js";
import fetch from "node-fetch";

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
    const listing = new Listing(req.body.listing);

    // THIS IS WHERE YOU EXTRACT COORDINATES
    const geoURL = `https://nominatim.openstreetmap.org/search?format=json&q=${req.body.listing.location}`;
    const response = await fetch(geoURL, {
        headers: {
            "User-Agent": "WonderList/1.0 (student project)"
        }
    });
    const data = await response.json();
    if (!data.length) {
        req.flash("error", "Location not found. Please enter a valid place.");
        return res.redirect("/listings/new");
    }

    listing.geometry = {
        type: "Point",
        coordinates: [
            parseFloat(data[0].lon),
            parseFloat(data[0].lat)
        ]
    };

    let url = req.file.path;
    let filename = req.file.filename;
    listing.owner = req.user._id;
    listing.image = { url, filename };

    // let category = req.body.category;
    // listing.category = category;

    let savedListing = await listing.save();

    console.log(savedListing);
    req.flash("success", "New Listing created!");
    res.redirect("/listings");
}

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