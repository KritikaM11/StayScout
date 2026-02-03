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
    try {
        const listing = new Listing(req.body.listing);
        
        // 1. Prepare the URL
        const query = encodeURIComponent(req.body.listing.location);
        const geoURL = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

        // 2. Fetch Coordinates (with Error Handling)
        const response = await fetch(geoURL, {
            headers: {
                "User-Agent": "WonderList/1.0 (student project)" 
            }
        });

        // 3. Check if the API actually responded nicely
        if (!response.ok) {
            throw new Error("Map Service Unavailable");
        }

        const data = await response.json();

        // 4. Handle "Location Not Found"
        if (!data.length) {
            req.flash("error", "Location not found. Please enter a valid place.");
            return res.redirect("/listings/new");
        }

        // 5. Save Coordinates
        listing.geometry = {
            type: "Point",
            coordinates: [
                parseFloat(data[0].lon),
                parseFloat(data[0].lat)
            ]
        };

        // 6. Handle Image Upload
        if (req.file) {
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image = { url, filename };
        }
        
        listing.owner = req.user._id;

        // 7. Save to Database
        let savedListing = await listing.save();
        console.log(savedListing);
        
        req.flash("success", "New Listing created!");
        res.redirect("/listings");

    } catch (err) {
        // THIS CATCH BLOCK PREVENTS THE CRASH
        console.error("Error in 'add' listing:", err);
        req.flash("error", "Something went wrong (Map API or Database). Please try again.");
        res.redirect("/listings/new");
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