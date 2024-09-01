import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      minlength: [1, "Title must be at least 1 character long"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [1, "Description must be at least 1 character long"],
      index: true,
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    thumbnail: {
      type: String,
      required: [true, "Thumbnail is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    duration: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      require:true,
      default: true,
    },
  },
  { timestamps: true }
);

// Create a text index for full-text search on title and description
videoSchema.index({ title: "text", description: "text" });

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);