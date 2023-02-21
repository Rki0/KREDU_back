const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = Schema({
  nickname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  image: {
    type: String,
  },
  role: {
    type: Number,
  },
  likes: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Lecture",
    },
  ],
  lectureComments: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "LectureComment",
    },
  ],
  lectureSubComments: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "LectureSubComment",
    },
  ],
  myQA: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Qa",
    },
  ],
  likeQA: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Qa",
    },
  ],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
