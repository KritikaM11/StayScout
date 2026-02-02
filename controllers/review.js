import { Listing } from "../models/listing.js";
import { Review } from "../models/reviews.js";


export const index = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    let newreview = new Review(req.body.review);
    newreview.author = req.user._id;

    listing.reviews.push(newreview);
    await newreview.save();
    await listing.save();
    req.flash("success", "New Review created!");

    console.log("review Saved");
    res.redirect(`/listings/${listing._id}`);
}

export const deletereview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");

    res.redirect(`/listings/${id}`);
}