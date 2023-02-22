const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const qaSchema = Schema({
  writer: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  file: [
    {
      type: String,
      required: true,
    },
  ],
  like: {
    type: Number,
    default: 0,
    min: 0,
  },
  see: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      type: mongoose.Types.ObjectId,
      ref: "QaComment",
    },
  ],
  fixedComment: [
    {
      type: mongoose.Types.ObjectId,
      ref: "QaComment",
    },
  ],
});

module.exports = mongoose.model("Qa", qaSchema);
