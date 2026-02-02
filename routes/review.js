import express from "express";
const router = express.Router({ mergeParams: true });
import { Listing } from "../models/listing.js"
import { wrapAsync } from "../utils/weapAsync.js";
import { isLoggedin, validateReview, isReviewAuthor } from "../middleware.js";

import * as ReviewController from "../controllers/review.js";

//Reviews
router.post("/", isLoggedin, validateReview, wrapAsync(ReviewController.index)
);

//Delete review
router.delete("/:reviewId",isLoggedin, isReviewAuthor, wrapAsync(ReviewController.deletereview)
);

export const review = router;
