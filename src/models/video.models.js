import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    title: {
        type: String,
        require: true,
        min: [1, "Title atlast 1 charecter long"],
        index:true
    },
    description: {
        type: String,
        require: true,
        min:[5,"Description atlast 5 charecter long"]
    },
    videoUrl: {
        type: String,
        require:true,
    },
    thumbnail: {
        type: String,
        require:true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true,
    },
    duration: {
        type: Number,
        require: true,
        default:0
    },
    views: {
        type: Number,
        default:0,
        require:true,
    },
    isPublished: {
        type: Boolean,
        default:true
    }
}, { timestamps: true })

videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model("Video",videoSchema)