const mongoose = require("mongoose");

let CounterSchema = mongoose.Schema({
  id: {
    type: Number,
    default: 0,
  },
  userIdCounter: {
    type: Number,
    default: 0,
  },
  lectureIdCounter: {
    type: Number,
    default: 0,
  },
  lectureOutterCommentIdCounter: {
    type: Number,
    default: 0,
  },
  lectureInnerCommentIdCounter: {
    type: Number,
    default: 0,
  },
  contentIdCounter: {
    type: Number,
    default: 0,
  },
  commentOutterCommentIdCounter: {
    type: Number,
    default: 0,
  },
  commentInnerCommentIdCounter: {
    type: Number,
    default: 0,
  },
});

const Counter = mongoose.model("Counter", CounterSchema);

module.exports = { Counter };
