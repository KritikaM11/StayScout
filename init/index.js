import mongoose from "mongoose";
import fetch from "node-fetch";
import { sampleListings, sampleExperiences , sampleServices} from "./data.js"
import { Listing } from "../models/listing.js";
import { Review } from "../models/reviews.js";

const MONGO_URL = "mongodb://127.0.0.1:27017/StayScout";
async function main() {
    await mongoose.connect(MONGO_URL);
}
main().then(() => {
    console.log("connected to the database");
}).catch((err) => {
    console.log(err);
})


//adding lat and log to the map of the already inserted data in database
const geocode = async (location, country) => {
    const query = `${location}, ${country}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
        headers: {
            "User-Agent": "WonderList/1.0 (student project)"
        }
    });

    const data = await res.json();

    if (!data.length) return null;

    return {
        type: "Point",
        coordinates: [
            parseFloat(data[0].lon),
            parseFloat(data[0].lat)
        ]
    };
};


const initDB = async () => {
    await Listing.deleteMany({});
    await Review.deleteMany({});
    console.log("Cleared exixting data...");

    const cleanHomes = sampleListings.map(item => ({ ...item, category: "Homes", reviews: [] }));
    const allData = [...cleanHomes, ...sampleExperiences,...sampleServices];

    for (let obj of allData) {
        const geometry = await geocode(obj.location, obj.country);

        if (!geometry) {
            console.log("Skipping (no location found):", obj.title);
            continue;
        }

        const { reviews: reviewsArray, ...listingProps } = obj;

        const listing = new Listing(listingProps);

        // Manually add missing fields
        listing.owner = "697f65e203b3682c524bb97f"; // Ensure this ID exists in your User collection!
        listing.geometry = geometry;

        // for reviews
        if (reviewsArray && reviewsArray.length > 0) {
            for (let reviewData of reviewsArray) {
                // Create the review document
                const newReview = new Review({
                    comment: reviewData.comment,
                    rating: reviewData.rating,
                    author: "697f65e203b3682c524bb97f" 
                });
                
                // Save it to DB first (so it gets an _id)
                const savedReview = await newReview.save();

                // Push the SAVED review into the listing
                listing.reviews.push(savedReview);
            }
        }

        await listing.save();
        console.log(`Saved: ${obj.title}`);
    }

    console.log("Listings initialized");
}

initDB();