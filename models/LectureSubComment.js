const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const lectureSubCommentSchema = Schema({
  creator: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
  text: {
    type: String,
    required: true,
  },
  like: {
    type: Number,
    required: true,
    default: 0,
  },
  date: {
    type: String,
    required: true,
  },
  lecture: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Lecture",
  },
  mainComment: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "LectureComment",
  },
  likedUser: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("LectureSubComment", lectureSubCommentSchema);
