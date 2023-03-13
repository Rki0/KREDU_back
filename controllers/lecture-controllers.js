const fs = require("fs");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Lecture = require("../models/Lecture");
const User = require("../models/User");
const LectureComment = require("../models/LectureComment");
const LectureSubComment = require("../models/LectureSubComment");

const getLectures = async (req, res, next) => {
  let lectures;

  try {
    lectures = await Lecture.find({}, "-description -link -file");
  } catch (err) {
    const error = new HttpError(
      "Cannot get lecture data. Please try again.",
      500
    );

    next(error);
  }

  res.status(200).json({ lectures });
};

const getLecture = async (req, res, next) => {
  const lectureId = req.params.lectureId;

  let lecture;

  try {
    lecture = await Lecture.findOne({ _id: lectureId });
  } catch (err) {
    const error = new HttpError(
      "Cannot get lecture data. Please try again.",
      500
    );

    next(error);
  }

  if (!lecture) {
    const error = new HttpError("There is no lecture. Please try again.", 500);

    return next(error);
  }

  res.status(200).json({ lecture });
};

const createLecture = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, date, link } = req.body;

  let lectureFile = [];

  for (const file of req.files) {
    const fileData = {
      path: file.path,
      name: file.originalname,
      ext: file.mimetype.split("/")[1],
    };

    lectureFile.push(fileData);
  }

  const createdLecture = new Lecture({
    title,
    description,
    date,
    link,
    file: lectureFile,
    writer: req.userData.userId,
  });

  try {
    await createdLecture.save();
  } catch (err) {
    const error = new HttpError(
      "Saving lecture is failed...Please try again.",
      500
    );

    next(error);
  }

  res.status(201).json({ uploadSuccess: true });
};

const likeLecture = async (req, res, next) => {
  const lectureId = req.params.lectureId;

  let currLecture;

  try {
    currLecture = await Lecture.findById(lectureId);
  } catch (err) {
    const error = new HttpError(
      "Lecture finding is failed. Please try again.",
      500
    );

    next(error);
  }

  if (!currLecture) {
    const error = new HttpError("There is no lecture. Please try again.", 500);

    next(error);
  }

  currLecture.like += 1;

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "User searching is failed... Please try again.",
      500
    );

    next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user!", 500);

    next(error);
  }

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    await currLecture.save({ session: sess });

    user.likes.push(currLecture);

    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Increasing like is failed.. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ likeSuccess: true });
};

const dislikeLecture = async (req, res, next) => {
  const lectureId = req.params.lectureId;

  let currLecture;

  try {
    currLecture = await Lecture.findById(lectureId);
  } catch (err) {
    const error = new HttpError(
      "Lecture finding is failed. Please try again.",
      500
    );

    next(error);
  }

  if (!currLecture) {
    const error = new HttpError("There is no lecture. Please try again.", 500);

    next(error);
  }

  currLecture.like -= 1;

  if (currLecture.like < 0) {
    currLecture.like = 0;
  }

  let user;

  try {
    user = await User.findById(req.userData.userId).populate("likes");
  } catch (err) {
    const error = new HttpError(
      "User searching is failed... Please try again.",
      500
    );

    next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user!", 500);

    next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await currLecture.save({ session: sess });

    user.likes = user.likes.filter((like) => like.id !== lectureId);

    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Decreasing like is failed.. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ disLikeSuccess: true });
};

const updateLectureById = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, link, initialFiles } = req.body;

  const lectureId = req.params.lectureId;

  let lecture;

  try {
    lecture = await Lecture.findById(lectureId);
  } catch (err) {
    const error = new HttpError(
      "Lecture finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  let lectureFile = [];

  // 새로 추가된 것을 DB에 넣어주기(폴더에는 이미 미들웨어 통해서 넣어졌음)
  for (const file of req.files) {
    const fileData = {
      path: file.path,
      name: file.originalname,
      ext: file.mimetype.split("/")[1],
    };

    lectureFile.push(fileData);
  }

  // 기존 DB에 존재하는 파일
  const filesPath = lecture.file;

  let updatedInitialFile = [];

  // 기존 파일이 변경되어, 전부 삭제된 경우는 undefined로 그 어떤 분기 처리도 거치지 않고
  // updatedInitialFile이 빈 배열인채로 진행되게 한다.
  if (typeof initialFiles === "string") {
    // 기존 파일이 변경되어, 1개만 있는 경우
    updatedInitialFile.push(initialFiles);
  } else if (typeof initialFiles !== "undefined") {
    // 기존 파일이 변경되어, 2개 이상인 경우
    updatedInitialFile = [...initialFiles];
  }

  let deletedInitialFiles = [];

  if (
    updatedInitialFile.length !== lecture.file.length &&
    filesPath.length !== 0
  ) {
    const filteredFilesPath = filesPath.filter((file) =>
      updatedInitialFile.includes(file.path)
    );

    lecture.file = filteredFilesPath;

    deletedInitialFiles = filesPath.filter(
      (file) => !updatedInitialFile.includes(file.path)
    );
  }

  const newFiles = [...lecture.file, ...lectureFile];

  lecture.title = title;
  lecture.description = description;
  lecture.link = link;
  lecture.file = newFiles;

  // 기존 강의 정보에 있던 것에서 삭제된 것을 폴더와 DB에서 지우기
  deletedInitialFiles.forEach((filePath) => {
    fs.unlink(filePath.path, (err) => {
      console.log(err);
    });
  });

  try {
    await lecture.save();
  } catch (err) {
    const error = new HttpError(
      "Cannot save updated data. Please try again.",
      500
    );

    return next(error);
  }

  res.status(200).json({ updateSuccess: true });
};

const deleteLectureById = async (req, res, next) => {
  const lectureId = req.params.lectureId;

  let lecture;

  try {
    lecture = await Lecture.findById(lectureId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find lecture.",
      500
    );

    return next(error);
  }

  if (!lecture) {
    const error = new HttpError("Could not find lecture for this id.", 404);

    return next(error);
  }

  if (!req.userData.manager) {
    const error = new HttpError("You are not manager!", 500);

    return next(error);
  }

  const filesPath = lecture.file;

  try {
    await lecture.remove();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete lecture.",
      500
    );

    return next(error);
  }

  filesPath.forEach((filePath) => {
    fs.unlink(filePath.path, (err) => {
      console.log(err);
    });
  });

  res.status(200).json({
    deleteSuccess: true,
  });
};

const createLectureComments = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "User finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user. Please try again.", 500);

    return next(error);
  }

  const lectureId = req.params.lectureId;

  let lecture;

  try {
    lecture = await Lecture.findById(lectureId).populate("comments");
  } catch (err) {
    const error = new HttpError(
      "Lecture finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!lecture) {
    const error = new HttpError("There is no lecture. Please try again.", 500);

    return next(error);
  }

  const { text, date } = req.body;

  const createdComment = new LectureComment({
    text,
    date,
    creator: req.userData.userId,
    lecture: lectureId,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await createdComment.save({ session: sess });

    lecture.comments.push(createdComment);

    await lecture.save({ session: sess });

    user.lectureComments.push(createdComment);

    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating lectureComments failed, please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({
    ...createdComment.toObject(),
    image: user.image,
    nickname: user.nickname,
    email: user.email,
  });
};

const getLectureComments = async (req, res, next) => {
  const lectureId = req.params.lectureId;

  let lecture;

  try {
    lecture = await Lecture.findById(lectureId).populate("comments");
  } catch (err) {
    const error = new HttpError(
      "Lecture finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!lecture) {
    const error = new HttpError("There is no lecture. Please try again.", 500);

    return next(error);
  }

  let commentsData = [];

  try {
    lecture.comments.forEach((comment) => {
      const commentData = comment.toObject({ getters: true });
      commentsData.push(commentData);
    });
  } catch (err) {
    const error = new HttpError(
      "Fetching comment data is failed. Please try again.",
      500
    );

    return next(error);
  }

  let commentsDataWithUserInfo = [];

  try {
    const processingUser = async (comment) => {
      let user;

      await User.findById(comment.creator._id).then((userData) => {
        user = userData;
      });

      if (!user) {
        const error = new HttpError("There is no user. Please try again.", 500);

        return next(error);
      }

      comment.nickname = user.nickname;
      comment.email = user.email;
      comment.image = user.image;

      commentsDataWithUserInfo.push(comment);
    };

    commentsData.forEach(async (comment) => {
      await processingUser(comment);

      if (commentsDataWithUserInfo.length === commentsData.length) {
        res.status(200).json({ commentsData: commentsDataWithUserInfo });
      }
    });
  } catch (err) {
    const error = new HttpError(
      "Processing user data is failed. Please try again.",
      500
    );

    return next(error);
  }
};

const deleteLectureComment = async (req, res, next) => {
  // subComment도 다 지워야하는데, DB에 남아있는 것 같다. 확인 필요.

  // 코멘트 모델 데이터 얻기. populate로 강의 모델 접근
  const { commentId } = req.body;

  let comment;

  try {
    comment = await LectureComment.findById(commentId).populate("lecture");
  } catch (err) {
    const error = new HttpError(
      "LectureCommnet finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!comment) {
    const error = new HttpError("There is no comment. Please try again.", 500);

    return next(error);
  }

  // 강의 모델에서 해당 코멘트 모델 제거
  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    comment.lecture.comments.pull(comment);

    await comment.lecture.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );

    return next(error);
  }

  // 코멘트 모델 데이터 얻기. populate로 유저 모델 접근
  // 여기서 comment.populate("creator")를 할 수는 없나?
  try {
    comment = await LectureComment.findById(commentId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "LectureCommnet finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (comment.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed.", 500);

    return next(error);
  }

  // 유저 모델에서 해당 코멘트 모델 제거
  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    comment.creator.lectureComments.pull(comment);

    await comment.creator.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );

    return next(error);
  }

  try {
    comment = await LectureComment.findById(commentId).populate("subComments");
  } catch (err) {
    const error = new HttpError(
      "SubComments finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  // subComments에 들어있는 모든 subComment를 삭제
  try {
    comment.subComments.forEach(async (subComment) => {
      try {
        const sess = await mongoose.startSession();

        sess.startTransaction();

        await subComment.remove();

        await sess.commitTransaction();
      } catch (err) {
        const error = new HttpError(
          "Deleteing SubComment is failed. Please try again.",
          500
        );

        return next(error);
      }
    });
  } catch (err) {
    const error = new HttpError(
      "Cannot find SubComment. Please try again.",
      500
    );

    return next(error);
  }

  // comment 데이터 삭제
  try {
    await comment.remove();
  } catch (err) {
    const error = new HttpError(
      "Deleting Comment is failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(200).json({ commentDeleteSuccess: true });
};

const updateLectureComment = async (req, res, next) => {
  const commentId = req.params.commentId;

  let comment;

  try {
    comment = await LectureComment.findById(commentId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Comment finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!comment) {
    const error = new HttpError("There is no comment. Please try again.", 500);

    return next(error);
  }

  if (comment.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed.", 500);

    return next(error);
  }

  const { text } = req.body;

  comment.text = text;

  try {
    comment.save();
  } catch (err) {
    const error = new HttpError(
      "Saving comment is failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(200).json({ updateSuccess: true });
};

const likeLectureComment = async (req, res, next) => {
  const commentId = req.params.commentId;

  let comment;

  try {
    comment = await LectureComment.findById(commentId).populate("likedUser");
  } catch (err) {
    const error = new HttpError(
      "Comment finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!comment) {
    const error = new HttpError("There is no comment. Please try again.", 500);

    return next(error);
  }

  comment.like += 1;

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "User searching is failed... Please try again.",
      500
    );

    next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user!", 500);

    next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    comment.likedUser.push(user);

    await comment.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Increasing like is failed.. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ commentLikeSuccess: true });
};

const dislikeLectureComment = async (req, res, next) => {
  const commentId = req.params.commentId;

  let comment;

  try {
    comment = await LectureComment.findById(commentId);
  } catch (err) {
    const error = new HttpError(
      "Comment finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!comment) {
    const error = new HttpError("There is no comment. Please try again.", 500);

    return next(error);
  }

  comment.like -= 1;

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "User searching is failed... Please try again.",
      500
    );

    next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user!", 500);

    next(error);
  }

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    comment.likedUser.pull(user);

    await comment.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Increasing like is failed.. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ commentDislikeSuccess: true });
};

const createLectureSubComment = async (req, res, next) => {
  let user;

  try {
    user = await User.findById(req.userData.userId).populate(
      "lectureSubComments"
    );
  } catch (err) {
    const error = new HttpError(
      "User finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user. Please try again.", 500);

    return next(error);
  }

  const { text, date, lectureId } = req.body;

  // let lecture;

  // try {
  //   lecture = await Lecture.findById(lectureId);
  // } catch (err) {
  //   const error = new HttpError(
  //     "Lecture finding is failed. Please try again.",
  //     500
  //   );

  //   return next(error);
  // }

  const mainCommentId = req.params.mainCommentId;

  let comment;

  try {
    comment = await LectureComment.findById(mainCommentId).populate(
      "subComments"
    );
  } catch (err) {
    const error = new HttpError(
      "Comment finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!comment) {
    const error = new HttpError("There is no comment. Please try again.", 500);

    return next(error);
  }

  const createdSubComment = new LectureSubComment({
    text,
    date,
    creator: user.id,
    lecture: lectureId,
    mainComment: comment.id,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await createdSubComment.save({ session: sess });

    user.lectureSubComments.push(createdSubComment);

    await user.save({ session: sess });

    comment.subComments.push(createdSubComment);

    await comment.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Saving data is failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({
    ...createdSubComment.toObject(),
    image: user.image,
    nickname: user.nickname,
    email: user.email,
  });
};

const getSubComment = async (req, res, next) => {
  const mainCommentId = req.params.mainCommentId;

  let mainComment;

  try {
    mainComment = await LectureComment.findById(mainCommentId).populate(
      "subComments"
    );
  } catch (err) {
    const error = new HttpError(
      "Comment finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!mainComment) {
    const error = new HttpError("There is no comment. Please try again.", 500);

    return next(error);
  }

  let subCommentsData = [];

  try {
    mainComment.subComments.forEach((subComment) => {
      const subCommentData = subComment.toObject({ getters: true });
      subCommentsData.push(subCommentData);
    });
  } catch (err) {
    const error = new HttpError(
      "Fetching subComment data is failed. Please try again.",
      500
    );

    return next(error);
  }

  let subComments = [];

  try {
    const processingUser = async (subComment) => {
      let user;

      await User.findById(subComment.creator).then((userData) => {
        user = userData;
      });

      if (!user) {
        const error = new HttpError("There is no user. Please try again.", 500);

        return next(error);
      }

      // toObject로 수정 가능하게 만들어줬기 때문에 가능한 것.
      subComment.nickname = user.nickname;
      subComment.email = user.email;
      subComment.image = user.image;

      subComments.push(subComment);
    };

    subCommentsData.forEach(async (subComment) => {
      await processingUser(subComment);

      if (subComments.length === subCommentsData.length) {
        res.status(200).json({ subComments });
      }
    });
  } catch (err) {
    const error = new HttpError(
      "SubComments finding is failed. Please try again.",
      500
    );

    return next(error);
  }
};

const deleteLectureSubComment = async (req, res, next) => {
  const { commentId } = req.body;

  let subComment;

  try {
    subComment = await LectureSubComment.findById(commentId).populate(
      "mainComment"
    );
  } catch (err) {
    const error = new HttpError(
      "LectureSubComment finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!subComment) {
    const error = new HttpError(
      "There is no subComment. Please try again.",
      500
    );

    return next(error);
  }

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    subComment.mainComment.subComments.pull(subComment);

    await subComment.mainComment.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete subComment in mainComment.",
      500
    );

    return next(error);
  }

  try {
    subComment = await LectureSubComment.findById(commentId).populate(
      "creator"
    );
  } catch (err) {
    const error = new HttpError(
      "LectureCommnet finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (subComment.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed.", 500);

    return next(error);
  }

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    await subComment.remove({ session: sess });

    subComment.creator.lectureSubComments.pull(subComment);

    await subComment.creator.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete subComment in creator.",
      500
    );

    return next(error);
  }

  res.status(200).json({ commentDeleteSuccess: true });
};

const updateLectureSubComment = async (req, res, next) => {
  const subCommentId = req.params.subCommentId;

  let subComment;

  try {
    subComment = await LectureSubComment.findById(subCommentId).populate(
      "creator"
    );
  } catch (err) {
    const error = new HttpError(
      "Subcomment finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!subComment) {
    const error = new HttpError(
      "There is no subComment. Please try again.",
      500
    );

    return next(error);
  }

  if (subComment.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed.", 500);

    return next(error);
  }

  const { text } = req.body;

  subComment.text = text;

  try {
    await subComment.save();
  } catch (err) {
    const error = new HttpError(
      "Saving update is failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(200).json({ updateSuccess: true });
};

const likeLectureSubComment = async (req, res, next) => {
  const subCommentId = req.params.subCommentId;

  let subComment;

  try {
    subComment = await LectureSubComment.findById(subCommentId).populate(
      "likedUser"
    );
  } catch (err) {
    const error = new HttpError(
      "subComment finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!subComment) {
    const error = new HttpError(
      "There is no subComment. Please try again.",
      500
    );

    return next(error);
  }

  subComment.like += 1;

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "User searching is failed... Please try again.",
      500
    );

    next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user!", 500);

    next(error);
  }

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    subComment.likedUser.push(user);

    await subComment.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Increasing like is failed.. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ commentLikeSuccess: true });
};

const dislikeLectureSubComment = async (req, res, next) => {
  const subCommentId = req.params.subCommentId;

  let subComment;

  try {
    subComment = await LectureSubComment.findById(subCommentId);
  } catch (err) {
    const error = new HttpError(
      "subComment finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!subComment) {
    const error = new HttpError(
      "There is no subComment. Please try again.",
      500
    );

    return next(error);
  }

  subComment.like -= 1;

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "User searching is failed... Please try again.",
      500
    );

    next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user!", 500);

    next(error);
  }

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    subComment.likedUser.pull(user);

    await subComment.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Increasing like is failed.. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ commentDislikeSuccess: true });
};

// const createFixedComment = async (req, res, next) => {
const createOrChangeFixedComment = async (req, res, next) => {
  const lectureId = req.params.lectureId;

  let lecture;

  try {
    lecture = await Lecture.findById(lectureId).populate("fixedComment");
  } catch (err) {
    const error = new HttpError(
      "Lecture finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!lecture) {
    const error = new HttpError("There is no lecture. Please try again.", 500);

    return next(error);
  }

  if (lecture.fixedComment.length > 1) {
    const error = new HttpError("FixedComment cannot be multiple.", 500);

    return next(error);
  }

  const { commentId } = req.body;

  try {
    if (lecture.fixedComment.length === 0) {
      // 고정 코멘트 생성
      lecture.fixedComment.push(commentId);
    } else {
      // 고정 코멘트 변경
      lecture.fixedComment = [commentId];
    }

    await lecture.save();
  } catch (err) {
    const error = new HttpError(
      "Creating fixedComment is failed. Please try again.",
      500
    );

    return next(error);
  }

  let comment;

  try {
    comment = await LectureComment.findById(commentId);
  } catch (err) {
    const error = new HttpError(
      "Finding comment is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!comment) {
    const error = new HttpError("There is no comment. Please try again.", 500);

    return next(error);
  }

  let user;

  try {
    user = await User.findById(comment.creator._id);
  } catch (err) {
    const error = new HttpError(
      "User finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  const userData = {
    nickname: user.nickname,
    email: user.email,
    image: user.image,
  };

  const processedFixedComment = { ...comment._doc, ...userData };

  res.status(200).json({ fixedComment: processedFixedComment });
};

const getFixedComment = async (req, res, next) => {
  const lectureId = req.params.lectureId;

  let lecture;

  try {
    lecture = await Lecture.findById(lectureId).populate("fixedComment");
  } catch (err) {
    const error = new HttpError(
      "Lecture finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!lecture) {
    const error = new HttpError("There is no lecture. Please try again.", 500);

    return next(error);
  }

  let fixedComment;

  try {
    fixedComment = lecture.fixedComment;
  } catch (err) {
    const error = new HttpError(
      "Fetching fixedComment is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (lecture.fixedComment.length === 0) {
    return res.status(200).json({ fixedComment });
  }

  let user;

  try {
    user = await User.findById(fixedComment[0].creator._id);
  } catch (err) {
    const error = new HttpError(
      "User finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user. Please try again.", 500);

    return next(error);
  }

  const userData = {
    nickname: user.nickname,
    email: user.email,
    image: user.image,
  };

  const processedFixedComment = [{ ...fixedComment[0]._doc, ...userData }];

  res.status(200).json({ fixedComment: processedFixedComment });
};

const deleteFixedComment = async (req, res, next) => {
  const lectureId = req.params.lectureId;

  let lecture;

  try {
    lecture = await Lecture.findById(lectureId).populate("fixedComment");
  } catch (err) {
    const error = new HttpError(
      "Lecture finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  if (!lecture) {
    const error = new HttpError("There is no lecture. Please try again.", 500);

    return next(error);
  }

  try {
    lecture.fixedComment = [];

    await lecture.save();
  } catch (err) {
    const error = new HttpError(
      "Deleting fixedComment is failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(200).json({ deleteSuccess: true });
};

const getSearchedLecture = async (req, res, next) => {
  let lectures;

  try {
    lectures = await Lecture.find({}, "-description -link -file");
  } catch (err) {
    const error = new HttpError(
      "Lecture finding is failed. Please try again.",
      500
    );

    return next(error);
  }

  const keyword = req.query.keyword;

  const searchedLectures = lectures.filter((lecture) =>
    lecture.title.includes(keyword)
  );

  res.status(200).json({
    searchedLectures,
  });
};

exports.getLectures = getLectures;
exports.getLecture = getLecture;
exports.createLecture = createLecture;
exports.likeLecture = likeLecture;
exports.dislikeLecture = dislikeLecture;
exports.updateLectureById = updateLectureById;
exports.deleteLectureById = deleteLectureById;
exports.createLectureComments = createLectureComments;
exports.getLectureComments = getLectureComments;
exports.deleteLectureComment = deleteLectureComment;
exports.updateLectureComment = updateLectureComment;
exports.likeLectureComment = likeLectureComment;
exports.dislikeLectureComment = dislikeLectureComment;
exports.createLectureSubComment = createLectureSubComment;
exports.getSubComment = getSubComment;
exports.deleteLectureSubComment = deleteLectureSubComment;
exports.updateLectureSubComment = updateLectureSubComment;
exports.likeLectureSubComment = likeLectureSubComment;
exports.dislikeLectureSubComment = dislikeLectureSubComment;
exports.createOrChangeFixedComment = createOrChangeFixedComment;
exports.getFixedComment = getFixedComment;
exports.deleteFixedComment = deleteFixedComment;
exports.getSearchedLecture = getSearchedLecture;
