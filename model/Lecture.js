const mongoose = require("mongoose");

const commentsCommentsSchema = mongoose.Schema({
  // id: {
  //   type: Number,
  // },
  nickname: {
    type: String,
  },
  email: {
    type: String,
  },
  like: {
    type: Number,
  },
});

const lectureCommentsSchema = mongoose.Schema({
  // id: {
  //   type: Number,
  // },
  nickname: {
    type: String,
  },
  email: {
    type: String,
  },
  like: {
    type: Number,
  },
  comments: [commentsCommentsSchema],
});

const lectureSchema = mongoose.Schema({
  // id: {
  //   type: Number,
  // },
  title: {
    type: String,
  },
  date: {
    type: String,
  },
  description: {
    type: String,
  },
  link: {
    type: String,
  },
  file: {
    type: String,
  },
  like: {
    type: Number,
    default: 0,
  },
  see: {
    type: Number,
    default: 0,
  },
  comments: [lectureCommentsSchema],
});

const Lecture = mongoose.model("Lecture", lectureSchema);

module.exports = { Lecture };
