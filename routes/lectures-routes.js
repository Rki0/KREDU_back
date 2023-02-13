const express = require("express");
const { check } = require("express-validator");

const lectureControllers = require("../controllers/lecture-controllers");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/", lectureControllers.getLectures);

router.get("/:lectureId", lectureControllers.getLecture);

router.patch("/like", lectureControllers.likeLecture);

router.patch("/dislike", lectureControllers.dislikeLecture);

router.get("/comments/:lectureId", lectureControllers.getLectureComments);

router.patch(
  "/comments/like/:commentId",
  lectureControllers.likeLectureComment
);

router.patch(
  "/comments/dislike/:commentId",
  lectureControllers.dislikeLectureComment
);

router.get("/subcomments/:mainCommentId", lectureControllers.getSubComment);

router.patch(
  "/subcomments/like/:subCommentId",
  lectureControllers.likeLectureSubComment
);

router.patch(
  "/subcomments/dislike/:subCommentId",
  lectureControllers.dislikeLectureSubComment
);

router.use(checkAuth);

router.post(
  "/write",
  fileUpload.array("files", 10),
  [
    check("title").isLength({ min: 1 }),
    check("description").isLength({ min: 1 }),
    check("link").not().isEmpty(),
  ],
  lectureControllers.createLecture
);

router.patch("/like/auth", lectureControllers.authedLikeLecture);

router.patch("/dislike/auth", lectureControllers.authedDislikeLecture);

router.patch(
  "/update/:lectureId",
  fileUpload.array("files", 10),
  [
    check("title").isLength({ min: 1 }),
    check("description").isLength({ min: 1 }),
    check("link").not().isEmpty(),
  ],
  lectureControllers.updateLectureById
);

router.delete("/delete/:lectureId", lectureControllers.deleteLectureById);

router.post(
  "/comments/:lectureId",
  [check("text").isLength({ min: 1 })],
  lectureControllers.createLectureComments
);

router.delete(
  "/comments/delete/:lectureId",
  lectureControllers.deleteLectureComment
);

router.patch(
  "/comments/update/:commentId",
  lectureControllers.updateLectureComment
);

router.patch(
  "/comments/like/auth/:commentId",
  lectureControllers.authedLikeLectureComment
);

router.patch(
  "/comments/dislike/auth/:commentId",
  lectureControllers.authedDislikeLectureComment
);

router.post(
  "/subcomments/:mainCommentId",
  [check("text").isLength({ min: 1 })],
  lectureControllers.createLectureSubComment
);

router.delete(
  "/subcomments/delete/:lectureId",
  lectureControllers.deleteLectureSubComment
);

router.patch(
  "/subcomments/update/:subCommentId",
  lectureControllers.updateLectureSubComment
);

router.patch(
  "/subcomments/like/auth/:subCommentId",
  lectureControllers.authedLikeLectureSubComment
);

router.patch(
  "/subcomments/dislike/auth/:subCommentId",
  lectureControllers.authedDislikeLectureSubComment
);

module.exports = router;
