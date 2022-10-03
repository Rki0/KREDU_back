const mongoose = require("mongoose");

const commentsCommentsSchema = mongoose.Schema({
  id: {
    type: Number,
  },
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

const contentsCommentsSchema = mongoose.Schema({
  id: {
    type: Number,
  },
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

const contentsSchema = mongoose.Schema({
  id: {
    type: Number,
  },
  title: {
    type: String,
  },
  date: {
    type: String,
  },
  description: {
    type: String,
  },
  file: {
    type: String,
  },
  like: {
    type: Number,
  },
  see: {
    type: Number,
  },
  comments: [contentsCommentsSchema],
});

const Contents = mongoose.model("Contents", contentsSchema);

module.exports = { Contents };
