import dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import methodOverridePkg from "method-override";
import ejsMate from "ejs-mate";
import { ExpressError } from "./utils/ExpressError.js";
import { listing } from "./routes/listing.js";
import { review } from "./routes/review.js";
import { user } from "./routes/user.js";
import { bookingRouter } from "./routes/booking.js";

import session from "express-session";
import MongoStore from "connect-mongo";
import flash from "connect-flash";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import LocalStrategy from "passport-local";
import { User } from "./models/user.js";
import { googleAuth } from "./googleAuth.js";
import { error } from "console";


const methodOverride = methodOverridePkg.default || methodOverridePkg; // ensure function
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));  //to params idawa
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")))

//mongodb connection
const dbUrl = process.env.ATLASDB;
async function main() {
    await mongoose.connect(dbUrl);
}
main().then(() => {
    console.log("connected to the database");
}).catch((err) => {
    console.log(err);
})


const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
})

store.on("error" , ()=>{
    console.log("error in mongosessionstore "+ error);
})
//express-session and flash
const sessionInfo = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};


app.use(session(sessionInfo));
app.use(flash());

//Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

// google authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    passReqToCallback: true // IMPORTANT: This lets us access req inside the function
},
    googleAuth
));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//connect flash
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.newuser = req.user;
    res.locals.category = req.session.category || "Homes";
    next();
})

//routes
app.use("/listings", listing);
app.use("/listings/:id/reviews", review);
app.use("/", user);
app.use("/listings/:id/book", bookingRouter);

//for all other paths
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Invalid Request!"));
})

//error handling
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { message });
})

app.listen(8080, () => {
    console.log("app is listening on port 8080");
})