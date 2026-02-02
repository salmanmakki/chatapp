import mongoose from "mongoose";



const userSchema = mongoose.Schema({

    fullname: {

        type: String,

        required: true,

    },

    email: {

        type: String,

        required: true,

        unique: true,

    },

    password: {

        type: String,

        required: true,

    },

    confirmPassword: {

        type: String,

    },

    profilePic: {
        type: String,
        default: "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
    },

    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]

}, { timestamps: true }); // createdAt & updatedAt



const User = mongoose.model("User", userSchema);

export default User;