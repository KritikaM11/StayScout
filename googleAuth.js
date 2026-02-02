import { User } from "./models/user.js";

export const googleAuth = async (req, accessToken, refreshToken, profile, done) => {
        try {
            // 1. Check if user exists
            let user = await User.findOne({ email: profile.emails[0].value });

            // 2. Get the action (login vs signup) from session
            const action = req.session.googleAuthAction;

            // SCENARIO A: User Wants to LOGIN
            if (action === 'login') {
                if (user) {
                    // User exists -> Log them in
                    return done(null, user);
                } else {
                    // User does NOT exist -> STOP with error
                    return done(null, false, {
                        message: "No account found with this email. Please Sign Up first.",
                        reason: 'redirect_signup'
                    });
                }
            }

            // SCENARIO B: User Wants to SIGNUP
            if (action === 'signup') {
                if (user) {
                    // Fail: Send them to Login (because they already exist)
                    return done(null, false, {
                        message: "You already have an account. Please Login.",
                        reason: 'redirect_login'
                    });
                } else {
                    // Create new user (Your existing logic)
                    let baseUsername = profile.displayName.replace(/\s+/g, '').toLowerCase();
                    let userCheck = await User.findOne({ username: baseUsername });
                    let finalUsername = baseUsername;

                    if (userCheck) {
                        finalUsername = baseUsername + Math.floor(1000 + Math.random() * 9000);
                    }

                    const newUser = new User({
                        email: profile.emails[0].value,
                        username: finalUsername,
                        googleId: profile.id,
                    });

                    let savedUser = await newUser.save();
                    return done(null, savedUser);
                }
            }
        } catch (err) {
            return done(err, null);
        }
    }