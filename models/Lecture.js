const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const lectureSchema = Schema({
  writer: {
    type: String,
    required: true,
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
  link: {
    type: String,
    required: true,
  },
  file: [
    {
      path: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      ext: {
        type: String,
        required: true,
      },
    },
  ],
  like: {
    type: Number,
    default: 0,
  },
  see: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "LectureComment",
    },
  ],
  fixedComment: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "LectureComment",
    },
  ],
});

module.exports = mongoose.model("Lecture", lectureSchema);
