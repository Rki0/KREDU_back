const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const qaCommentSchema = Schema({
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
  post: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Qa",
  },
  likedUser: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
  ],
  subComments: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "LectureSubComment",
    },
  ],
});

module.exports = mongoose.model("QaComment", qaCommentSchema);
