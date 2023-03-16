const fs = require("fs");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Qa = require("../models/Qa");
const User = require("../models/User");

const getQAs = async (req, res, next) => {
  let qas;

  try {
    qas = await Qa.find({}, "-description -link -file");
  } catch (err) {
    const error = new HttpError("Cannot get Qa data. Please try again.", 500);

    next(error);
  }

  res.status(200).json({ qas });
};

const getQA = async (req, res, next) => {
  const qaId = req.params.qaId;

  let qa;

  try {
    qa = await Qa.findById(qaId).populate("writer");
  } catch (err) {
    const error = new HttpError("QA finding is failed. Please try again.", 500);

    next(error);
  }

  if (!qa) {
    const error = new HttpError("There is no QA data. Please try again.", 500);

    next(error);
  }

  res.status(200).json({ qa });
};

const createQA = async (req, res, next) => {
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

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, date } = req.body;

  let qaFile = [];

  for (const file of req.files) {
    const fileData = {
      path: file.path,
      name: file.originalname,
      ext: file.mimetype.split("/")[1],
    };

    qaFile.push(fileData);
  }

  const createdQA = new Qa({
    title,
    description,
    date,
    file: qaFile,
    writer: req.userData.userId,
  });

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    await createdQA.save({ session: sess });

    user.myQA.push(createdQA);

    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Saving Qa is failed. Please try again.", 500);

    return next(error);
  }

  res.status(201).json({ uploadSuccess: true });
};

const likeQA = async (req, res, next) => {
  const qaId = req.params.qaId;

  let currQA;

  try {
    currQA = await Qa.findById(qaId);
  } catch (err) {
    const error = new HttpError("QA finding is failed. Please try again.", 500);

    next(error);
  }

  if (!currQA) {
    const error = new HttpError("There is no QA. Please try again.", 500);

    next(error);
  }

  currQA.like += 1;

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

    await currQA.save({ session: sess });

    user.likeQA.push(currQA);

    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Increasing like is failed.. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ likeSuccess: true });
};

const dislikeQA = async (req, res, next) => {
  const qaId = req.params.qaId;

  let currQA;

  try {
    currQA = await Qa.findById(qaId);
  } catch (err) {
    const error = new HttpError("QA finding is failed. Please try again.", 500);

    next(error);
  }

  if (!currQA) {
    const error = new HttpError("There is no QA. Please try again.", 500);

    next(error);
  }

  currQA.like -= 1;

  if (currQA.like < 0) {
    currQA.like = 0;
  }

  let user;

  try {
    user = await User.findById(req.userData.userId).populate("likeQA");
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

    await currQA.save({ session: sess });

    user.likeQA = user.likeQA.filter((like) => like.id !== qaId);

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

const deleteQAById = async (req, res, next) => {
  const qaId = req.params.qaId;

  let qa;

  try {
    qa = await Qa.findById(qaId).populate("writer");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find QA.",
      500
    );

    return next(error);
  }

  if (!qa) {
    const error = new HttpError("Could not find QA for this id.", 404);

    return next(error);
  }

  if (qa.writer.id !== req.userData.userId) {
    const error = new HttpError("You are not writer. Please try again.", 500);

    return next(error);
  }

  const filesPath = qa.file;

  console.log(filesPath);

  try {
    const sess = await mongoose.startSession();

    sess.startTransaction();

    qa.writer.myQA.pull(qa);

    await qa.writer.save({ session: sess });

    await qa.remove({ session: sess });

    await sess.commitTransaction();
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

const getSearchedQA = async (req, res, next) => {
  let qas;

  try {
    qas = await Qa.find({}, "-description -file");
  } catch (err) {
    const error = new HttpError("QA finding is failed. Please try again.", 500);

    return next(error);
  }

  const keyword = req.query.keyword;

  const searchedQAs = qas.filter((qa) => qa.title.includes(keyword));

  res.status(200).json({
    searchedQAs,
  });
};

exports.getQAs = getQAs;
exports.getQA = getQA;
exports.createQA = createQA;
exports.likeQA = likeQA;
exports.dislikeQA = dislikeQA;
exports.deleteQAById = deleteQAById;
exports.getSearchedQA = getSearchedQA;
