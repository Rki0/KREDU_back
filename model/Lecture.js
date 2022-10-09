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
    type: String | Blob,
  },
  like: {
    type: Number,
    default: 0,
  },
  see: {
    type: Number,
    default: 0,
  },
  writer: {
    type: String,
  },
  comments: [lectureCommentsSchema],
  // // comments를 직접 연결해놓는 대신
  // // comments.length를 여기에 숫자만 넣어주자.
  // // outter댓글이 추가될 때, Lecture의 comments.length 부분을 증가시키는 것으로 댓글수 표현?
  // commentsNum: {
  //   type: Number,
  // },
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
