import express from "express";
const router = express.Router({ mergeParams: true });
import { User } from "../models/user.js";
import { wrapAsync } from "../utils/weapAsync.js";
import passport from "passport";
import { isSaveRedirectUrl } from "../middleware.js";
import * as UserController from "../controllers/user.js";
import { renderProfile } from "../controllers/user.js";
import { isLoggedin } from "../middleware.js";

router.get("/signup", (req, res) => {
    res.render("users/signup.ejs")
})

router.post("/signup", wrapAsync(UserController.usersignup))

//for login user
router.get("/login", (req, res) => {
    res.render("users/login.ejs")
})

router.post("/login", isSaveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),
    (req, res) => {
        req.flash("success", "Welcome to the WonderLust! You are logged in!");
        const redirectUrl = res.locals.redirectUrl || "/listings";
        res.redirect(redirectUrl);
    })

// routes/user.js

// 1. Trigger for LOGIN button (Sets action to 'login')
router.get("/auth/google/login", (req, res, next) => {
    req.session.googleAuthAction = 'login'; // Remember the user wants to LOGIN
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

// 2. Trigger for SIGNUP button (Sets action to 'signup')
router.get("/auth/google/signup", (req, res, next) => {
    req.session.googleAuthAction = 'signup'; // Remember the user wants to SIGNUP
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

// Callback route remains the same
// routes/user.js

router.get("/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", (err, user, info) => {
        // 1. Handle Unexpected Errors
        if (err) { return next(err); }

        // 2. Handle Authentication Failures (user is false)
        if (!user) {
            req.flash("error", info.message); // Show the specific error message

            // Redirect based on the 'reason' we set in index.js
            if (info.reason === 'redirect_signup') {
                return res.redirect("/signup");
            } 
            if (info.reason === 'redirect_login') {
                return res.redirect("/login");
            }
            return res.redirect("/login"); // Fallback
        }

        // 3. Handle Success (Manually log the user in)
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            
            req.flash("success", "Welcome back to StayScout!");
            // Check if there was a saved URL (like if they tried to edit a listing before logging in)
            let redirectUrl = req.session.redirectUrl || "/listings"; 
            res.redirect(redirectUrl);
        });

    })(req, res, next); // Required: immediately invoke the function
});

//Logout
router.get("/logout", UserController.userlogout);

//user dashboard
router.get("/profile", isLoggedin, renderProfile);
export const user = router;