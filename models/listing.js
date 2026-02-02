
import mongoose, { Schema } from "mongoose";
import { Review } from "./reviews.js";

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: {
        url: String,
        filename: String
    },

    price: {
        type: Number,
    },
    location: {
        type: String,
    },
    country: {
        type: String,
    },
    category: {
        type: String,
        enum: ["Homes", "Experiences", "Services"],
        required: true,
        default: "Homes"
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    geometry: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
})


listingSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await Review.deleteMany({ _id: { $in: doc.reviews } });
    }
});


export const Listing = mongoose.model("Listing", listingSchema);