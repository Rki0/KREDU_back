const express = require("express");
const { check } = require("express-validator");

const qaControllers = require("../controllers/qa-controllers");
const qaFileUpload = require("../middleware/qa-file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/", qaControllers.getQAs);

router.get("/:qaId", qaControllers.getQA);

router.get("/search/input", qaControllers.getSearchedQA);

// router.get("/comments/:lectureId", lectureControllers.getLectureComments);

// router.patch(
//   "/comments/like/:commentId",
//   lectureControllers.likeLectureComment
// );

// router.patch(
//   "/comments/dislike/:commentId",
//   lectureControllers.dislikeLectureComment
// );

// router.get("/subcomments/:mainCommentId", lectureControllers.getSubComment);

// router.patch(
//   "/subcomments/like/:subCommentId",
//   lectureControllers.likeLectureSubComment
// );

// router.patch(
//   "/subcomments/dislike/:subCommentId",
//   lectureControllers.dislikeLectureSubComment
// );

// router.get("/fixedComment/:lectureId", lectureControllers.getFixedComment);

router.use(checkAuth);

router.post(
  "/write",
  qaFileUpload.array("files", 10),
  [
    check("title").isLength({ min: 1, max: 30 }),
    check("description").isLength({ min: 1, max: 1000 }),
  ],
  qaControllers.createQA
);

router.patch("/like/:qaId", qaControllers.likeQA);

router.patch("/dislike/:qaId", qaControllers.dislikeQA);

// router.patch(
//   "/update/:lectureId",
//   fileUpload.array("files", 10),
//   [
//     check("title").isLength({ min: 1 }),
//     check("description").isLength({ min: 1 }),
//     check("link").not().isEmpty(),
//   ],
//   lectureControllers.updateLectureById
// );

router.delete("/:qaId", qaControllers.deleteQAById);

// router.post(
//   "/comments/:lectureId",
//   [check("text").isLength({ min: 1 })],
//   lectureControllers.createLectureComments
// );

// router.delete(
//   "/comments/delete/:lectureId",
//   lectureControllers.deleteLectureComment
// );

// router.patch(
//   "/comments/update/:commentId",
//   lectureControllers.updateLectureComment
// );

// router.patch(
//   "/comments/like/auth/:commentId",
//   lectureControllers.authedLikeLectureComment
// );

// router.patch(
//   "/comments/dislike/auth/:commentId",
//   lectureControllers.authedDislikeLectureComment
// );

// router.post(
//   "/subcomments/:mainCommentId",
//   [check("text").isLength({ min: 1 })],
//   lectureControllers.createLectureSubComment
// );

// router.delete(
//   "/subcomments/delete/:lectureId",
//   lectureControllers.deleteLectureSubComment
// );

// router.patch(
//   "/subcomments/update/:subCommentId",
//   lectureControllers.updateLectureSubComment
// );

// router.patch(
//   "/subcomments/like/auth/:subCommentId",
//   lectureControllers.authedLikeLectureSubComment
// );

// router.patch(
//   "/subcomments/dislike/auth/:subCommentId",
//   lectureControllers.authedDislikeLectureSubComment
// );

// router.patch(
//   "/fixedComment/:lectureId",
//   lectureControllers.createOrChangeFixedComment
// );

// router.get(
//   "/fixedComment/delete/:lectureId",
//   lectureControllers.deleteFixedComment
// );

module.exports = router;
