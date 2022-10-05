const mongoose = require("mongoose");

const commentsCommentsSchema = mongoose.Schema({
  innerCommentsId: {
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

const lectureCommentsSchema = mongoose.Schema({
  outterCommentsId: {
    type: Number,
    default: 0,
  },
  nickname: {
    type: String,
  },
  email: {
    type: String,
  },
  date: {
    type: String,
  },
  description: {
    type: String,
  },
  like: {
    type: Number,
    default: 0,
  },
  comments: [commentsCommentsSchema],
});

const lectureSchema = mongoose.Schema({
  lectureId: {
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

//////// update userId up! ////////
const { Counter } = require("./Counter");

lectureSchema.post("save", function (result) {
  let lecture = this;

  Counter.findOne({ id: 0 }, (err, res) => {
    if (err) return err;

    let up = res.lectureIdCounter + 1;

    Counter.updateOne({ id: 0 }, { lectureIdCounter: up }, (err) => {
      if (err) return err;

      Lecture.updateOne({ title: lecture.title }, { lectureId: up }, (err) => {
        if (err) return err;
      });
    });
  });
});
////////////////

const Lecture = mongoose.model("Lecture", lectureSchema);

module.exports = { Lecture };
