import { Listing } from "./models/listing.js";
import { listingSchema } from "./schema.js";
import { ExpressError } from "./utils/ExpressError.js";
import { reviewSchema } from "./schema.js";
import { Review } from "./models/reviews.js";

//schema validation
export const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errmsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(404, errmsg);
    } else {
        next();
    }
}

//review schema validation
export const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errmsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(404, errmsg);
    } else {
        next();
    }
}
export const isLoggedin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        //storing originalUrl in session so that it is accisible throughout
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to create new listing");
        return res.redirect("/login");
    }
    next();
}

export const isSaveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

// authetication that if curruser is not the owner of listing he cannot edit/delete it
export const isOwner = async (req, res, next) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner._id.equals(res.locals.newuser._id)) {
        req.flash("error", "You are not the owner of this listing!");
        return res.redirect(`/listings/${id}`);
    }
    next();
} 

//only a person who has created a review can delete it
export const isReviewAuthor = async (req, res, next) => {
    const {id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review.author.equals(res.locals.newuser._id)) {
        req.flash("error", "You can not delete other's review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
} 