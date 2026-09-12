const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {

        username: {
            type: String,
            required: true,
            trim: true
        },


        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },


        password: {
            type: String,
            required: true
        },


        role: {
            type: String,
            enum: ["researcher", "expert", "admin"],
            default: "researcher"
        },


        isEmailVerified: {
            type: Boolean,
            default: false
        },


        // =================================================
        // PERSONAL DETAILS
        // =================================================

        gender: {
            type: String,
            default: ""
        },

        category: {
            type: String,
            default: ""
        },

        state: {
            type: String,
            default: ""
        },

        district: {
            type: String,
            default: ""
        },

        institute: {
            type: String,
            default: ""
        },

        programme: {
            type: String,
            default: ""
        },

        department: {
            type: String,
            default: ""
        }

    },
    {
        timestamps: true
    }
);


module.exports = mongoose.model("User", userSchema);