// 댓글들을 강의 정보와 따로 관리해서 좋은 점이 뭐지?
// 아이디 증가 구현을 쉽게 할 수 있음
// 자료 구조가 너무 깊어지면
// find 기능을 활용하기가 어려워짐. 이로 인해서 아이디 자동 증가 구현이 복잡해짐
// 차라리 lecture, outtercomment, innercomment를 전부 따로 모델을 만들어서
// lecture에는 lectureId
// outterComment에는 lectureId의 정보와 댓글 정보
// innerComment에는 lectureId, outterCommentId의 정보와 댓글 정보를 가지게 만들어보자.

const mongoose = require("mongoose");

const outterCommentSchema = mongoose.Schema({
  lectureId: {
    type: Number,
  },
  outterCommentId: {
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
});

//////// update outterCommentId up! ////////
// 1. 처리중인 outterComment의 lectureId로 어떤 강의의 댓글인지 판단
// 2. outterCommentId가 default 값이 0인 점을 활용하여 outterCommentId가 0인 것을 찾는다
// 3. 그 것의 outterCommentId를 up으로 수정해준다.
const { Counter } = require("./Counter");

outterCommentSchema.post("save", function (result) {
  let outterComment = this;

  Counter.findOne({ id: 0 }, (err, res) => {
    if (err) return err;

    let up = res.lectureOutterCommentIdCounter + 1;

    Counter.updateOne(
      { id: 0 },
      { lectureOutterCommentIdCounter: up },
      (err) => {
        if (err) return err;

        OutterComment.updateOne(
          { lectureId: outterComment.lectureId },
          { outterCommentId: up },
          (err) => {
            if (err) return err;
          }
        );
      }
    );
  });
});
////////////////

const OutterComment = mongoose.model("OutterComment", outterCommentSchema);

module.exports = { OutterComment };
