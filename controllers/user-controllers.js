const fs = require("fs");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/User");
const Lecture = require("../models/Lecture");

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { nickname, email, password, role } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Sign up failed. Please try again.", 500);

    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("You already sign up. Please use login.", 422);

    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Encrypt failed, please try again.", 500);

    return next(error);
  }

  const createdUser = new User({
    nickname,
    email,
    password: hashedPassword,
    role,
    likes: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Save user data failed. Please try again.",
      500
    );

    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Generating signup token is failed. Please try again",
      500
    );

    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Login failed, please try again later.", 500);

    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );

    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );

    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );

    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      // { userId: existingUser.id, email: existingUser.email },
      {
        userId: existingUser.id,
        email: existingUser.email,
        nickname: existingUser.nickname,
        manager: existingUser.role === 1 ? true : false,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Logging up failed, please try again later.",
      500
    );

    return next(error);
  }

  // localStorage에 저장되는 것
  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token,
    manager: existingUser.role !== 0 ? true : false,
    nickname: existingUser.nickname,
  });
};

const withdraw = async (req, res, next) => {
  const { password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findById(req.userData.userId).populate("likes");
  } catch (err) {
    const error = new HttpError(
      "Something inputs wrong. Please try again.",
      422
    );

    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Cannot find user. Please try again.", 500);

    return next(error);
  }

  if (existingUser.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to delete info.", 401);

    return next(error);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not find you, please check your credentials and try again.",
      500
    );

    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not find you.",
      401
    );

    return next(error);
  }

  try {
    existingUser.likes.forEach((like) => {
      like.remove();
    });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete all of you.",
      500
    );

    return next(error);
  }

  try {
    await existingUser.remove();
  } catch (err) {
    const error = new HttpError(
      "Cannot delete your info. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ withdrawSuccess: true });
};

const getUserInfo = async (req, res, next) => {
  let existingUser;

  try {
    existingUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "User finding goes wrong. Please try again.",
      500
    );

    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not find you.",
      403
    );

    return next(error);
  }

  if (existingUser.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to access info.", 401);

    return next(error);
  }

  const { nickname, image } = existingUser;

  res.status(200).json({ nickname, image });
};

const changeNickname = async (req, res, next) => {
  const { nickname } = req.body;

  let existingUser;

  try {
    existingUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "User finding goes wrong. Please try again.",
      500
    );

    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not find you.",
      403
    );

    return next(error);
  }

  if (existingUser.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to access info.", 401);

    return next(error);
  }

  try {
    await User.updateOne({ _id: existingUser._id }, { nickname: nickname });
  } catch (err) {
    const error = new HttpError(
      "Update user data failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ changeSuccess: true });
};

const changeImage = async (req, res, next) => {
  const image = req.file.path;

  let currentUser;

  try {
    currentUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "User finding goes wrong. Please try again.",
      500
    );

    return next(error);
  }

  if (!currentUser) {
    const error = new HttpError(
      "Invalid credentials, could not find you.",
      403
    );

    return next(error);
  }

  if (currentUser.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to access info.", 401);

    return next(error);
  }

  if (currentUser.image) {
    fs.unlink(currentUser.image, (err) => {
      console.log(err);
    });
  }

  try {
    await User.updateOne({ _id: currentUser._id }, { image: image });
  } catch (err) {
    const error = new HttpError(
      "Update user data failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ changeSuccess: true });
};

const changePswd = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  let existingUser;
  try {
    existingUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Something inputs wrong. Please try again.",
      422
    );

    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Cannot find user. Please try again.", 500);

    return next(error);
  }

  if (existingUser.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to change info.", 401);

    return next(error);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(
      currentPassword,
      existingUser.password
    );
  } catch (err) {
    const error = new HttpError(
      "Could not find you, please check your credentials and try again.",
      500
    );

    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not find you.",
      401
    );

    return next(error);
  }

  if (newPassword === currentPassword) {
    const error = new HttpError("Inputed passwords aren't different.", 401);

    return next(error);
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(newPassword, 12);
  } catch (err) {
    const error = new HttpError("Encrypt failed, please try again.", 500);

    return next(error);
  }

  try {
    await User.updateOne(
      { _id: existingUser._id },
      { password: hashedPassword }
    );
  } catch (err) {
    const error = new HttpError(
      "Update user data failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(201).json({ changeSuccess: true });
};

const checkLikeLecture = async (req, res, next) => {
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

  const currLectureId = req.params.lectureId;

  let isLiked = false;

  try {
    for (const like of user.likes) {
      const lecture = like.toObject({ getters: true });

      if (currLectureId === lecture.id) {
        isLiked = true;
        break;
      }
    }
  } catch (err) {
    const error = new HttpError(
      "Likes data searching is failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(200).json({ isLiked });
};

const checkLikeQA = async (req, res, next) => {
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

  const currQaId = req.params.qaId;

  let isLiked = false;

  try {
    for (const like of user.likeQA) {
      const qa = like.toObject({ getters: true });

      if (currQaId === qa.id) {
        isLiked = true;
        break;
      }
    }
  } catch (err) {
    const error = new HttpError(
      "Likes data searching is failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(200).json({ isLiked });
};

const getLikeLecture = async (req, res, next) => {
  let user;

  try {
    user = await User.findById(req.userData.userId).populate("likes");
  } catch (err) {
    const error = new HttpError(
      "User finding is failed..Please try again.",
      500
    );

    return next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user.", 500);

    return next(error);
  }

  let likedLecture = [];

  user.likes.forEach((like) => {
    likedLecture.push(like.toObject({ getters: true }));
  });

  res.status(200).json({ likedLecture });
};

const deleteLikeLecture = async (req, res, next) => {
  let user;

  try {
    user = await User.findById(req.userData.userId).populate("likes");
  } catch (err) {
    const error = new HttpError(
      "User finding is failed..Please try again.",
      500
    );

    return next(error);
  }

  if (!user) {
    const error = new HttpError("There is no user. Please try again.", 500);

    return next(error);
  }

  const lectureId = req.params.lectureId;

  user.likes = user.likes.filter((like) => like.id !== lectureId);

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Saving user data is failed. Please try again.",
      500
    );

    return next(error);
  }

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

  lecture.like -= 1;

  try {
    await lecture.save();
  } catch (err) {
    const error = new HttpError(
      "Saving lecture data is failed. Please try again.",
      500
    );

    return next(error);
  }

  res.status(200).json({ deleteSuccess: true });
};

const getUserQA = async (req, res, next) => {
  const userId = req.userData.userId;

  let user;

  try {
    user = await User.findById(userId).populate("myQA");
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

  let qas = [];

  user.myQA.forEach((qa) => {
    qas.push(qa.toObject({ getters: true }));
  });

  res.status(200).json({ qas });
};

exports.signup = signup;
exports.login = login;
exports.withdraw = withdraw;
exports.getUserInfo = getUserInfo;
exports.changeNickname = changeNickname;
exports.changeImage = changeImage;
exports.changePswd = changePswd;
exports.checkLikeLecture = checkLikeLecture;
exports.checkLikeQA = checkLikeQA;
exports.getLikeLecture = getLikeLecture;
exports.deleteLikeLecture = deleteLikeLecture;
exports.getUserQA = getUserQA;
