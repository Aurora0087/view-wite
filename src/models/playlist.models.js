import mongoose, { Schema } from "mongoose";

const playlistSchama = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
    title: {
        type: String,
        require: true,
        min: [1, "Title atlast 1 charecter long"],
    },
    description: {
        type: String,
    },
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    ispublic: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Playlist = mongoose.model("Playlist", playlistSchama);