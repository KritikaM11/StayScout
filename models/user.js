import mongoose, { mongo } from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
const passportLocalMongoosePlugin = passportLocalMongoose.default;

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    googleId: { type: String },
})

userSchema.plugin(passportLocalMongoosePlugin);
export const User = mongoose.model("User", userSchema); 