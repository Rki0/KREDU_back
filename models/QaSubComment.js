const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const qaSubCommentSchema = Schema({
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
  mainComment: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "QaComment",
  },
  likedUser: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("QaSubComment", qaSubCommentSchema);
