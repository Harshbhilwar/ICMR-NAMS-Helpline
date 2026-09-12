const mongoose = require("mongoose");

const researchQuerySchema = new mongoose.Schema(
    {
        researcher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        username: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        instituteName: {
            type: String,
            required: true,
            trim: true
        },

        specialityName: {
            type: String,
            required: true,
            trim: true
        },

        preferredLanguage: {
            type: String,
            required: true,
            trim: true
        },

        researchQuestion: {
            type: String,
            required: true,
            trim: true
        },

        primaryObjective: {
            type: String,
            required: true,
            trim: true
        },

        studyType: {
            type: String,
            required: true,
            trim: true
        },

        samplingQuestion: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "expert_selected",
                "booked",
                "accepted",
                "completed",
                "rejected",
                "cancelled"
            ],
            default: "pending"
        },

        selectedExpert: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        appointmentDate: {
            type: Date,
            default: null
        },

        appointmentTime: {
            type: String,
            default: ""
        },

        expertSuggestions: {
            type: String,
            default: ""
        },

        feedback: {
            type: String,
            default: ""
        },

        feedbackRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "ResearchQuery",
    researchQuerySchema
);