import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
    channal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
    }
}, {
    timestamps: true,
});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);