const mongoose = require("mongoose");

const likedLectureSchema = mongoose.Schema({
  likedLectureId: {
    type: Number,
    default: 0,
  },
  thumbnail: {
    type: String,
  },
  link: {
    type: String,
  },
  date: {
    type: String,
  },
});

const userSchema = mongoose.Schema({
  userId: {
    type: Number,
    default: 0,
  },
  nickname: {
    type: String,
    maxlength: 10,
  },
  email: {
    type: String,
    maxlength: 50,
    trim: true,
    unique: 1,
  },
  password: {
    type: String,
    minlength: 8,
    maxlength: 15,
  },
  profile: {
    type: String,
    default: "",
  },
  liked: [likedLectureSchema],
  role: {
    type: Number,
    default: 0,
  },
});

//////// 비밀번호 암호화 ////////
const bcrypt = require("bcrypt");
const saltRounds = 10;

userSchema.pre("save", function (next) {
  let user = this;

  if (user.isModified("password")) {
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err);

      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);

        user.password = hash;

        next();
      });
    });
  } else {
    next();
  }
});
////////////////

//////// comparePassword ////////
userSchema.methods.comparePassword = function (plainPassword, callback) {
  bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
    if (err) return callback(err);

    callback(null, isMatch);
  });
};
////////////////

//////// update userId up! ////////
const { Counter } = require("./Counter");

userSchema.post("save", function (result) {
  let user = this;

  Counter.findOne({ id: 0 }, (err, res) => {
    if (err) return err;

    let up = res.userIdCounter + 1;

    Counter.updateOne({ id: 0 }, { userIdCounter: up }, (err) => {
      if (err) return err;

      User.updateOne({ email: user.email }, { userId: up }, (err) => {
        if (err) return err;
      });
    });
  });
});
////////////////

const User = mongoose.model("User", userSchema);

module.exports = { User };
