import mongoose, { Schema } from "mongoose";

const likeSchama = new Schema({
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community"
    },
}, { timestamps: true });

export const Like = mongoose.model("Like", likeSchama);