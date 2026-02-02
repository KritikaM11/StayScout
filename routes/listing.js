import express from "express";
const router = express.Router();
import { Listing } from "../models/listing.js"
import { wrapAsync } from "../utils/weapAsync.js";
import { isOwner, isLoggedin, validateListing } from "../middleware.js";
import * as ListingController from "../controllers/listing.js";
import { storage } from "../cloudconfig.js";
import multer from "multer";
const upload = multer({ storage })

router.route("/")
    .get(wrapAsync(ListingController.index))
    .post(isLoggedin, upload.single('listing[image]'), validateListing, wrapAsync(ListingController.add));

//create route
router.get("/new", isLoggedin, ListingController.create)


router.route("/:id")
    .get(wrapAsync(ListingController.show))
    .put(isLoggedin, isOwner, upload.single('listing[image]'), validateListing, wrapAsync(ListingController.update))
    .delete(isLoggedin, isOwner, wrapAsync(ListingController.deletecontroller));


//edit route
router.get("/:id/edit", isLoggedin, isOwner, wrapAsync(ListingController.edit))


export const listing = router;