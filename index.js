const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");

app.use(cors({ origin: "http://localhost:5000", credentials: true }));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// mongoose
const mongoose = require("mongoose");

const config = require("./config/key");

const session = require("express-session");
const MongoStore = require("connect-mongo");

mongoose
  .connect(config.mongoURI)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log("Error", err));

app.use(
  session({
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: config.mongoURI,
    }),
    cookie: { maxAge: 3.6e6 * 24 }, // 24시간 뒤 만료(자동 삭제)
  })
);

const { User } = require("./model/User");

// 회원가입 라우터
app.post("/api/users/register", (req, res) => {
  // const user = new User(req.body);
  const newUser = new User(req.body);

  // 데이터베이스에 같은 이메일이 존재한다면
  User.findOne({ email: req.body.email }, (err, user) => {
    // 회원가입을 진행시키면 안되므로 데이터와 함께 return
    if (user) {
      return res.json({
        success: false,
        message: "이미 가입된 이메일입니다.",
        error: err,
      });
    }

    // 그게 아니라면 데이터 저장 후 성공 메세지 return
    newUser.save((err, userInfo) => {
      return res.status(200).json({
        success: true,
      });
    });
  });
});

// 로그인 라우터
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.post("/api/users/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "입력된 이메일에 해당하는 유저가 없습니다.",
      });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀렸습니다.",
        });
      }

      // 아이디, 비밀번호 일치 시 유저 정보가 들어있는 세션 생성
      req.session.email = req.body.email;
      req.session.nickname = user.nickname;
      req.session.logined = true;

      // 모델 만들 때 role은 디폴트 값을 0으로 설정되게 했으므로, 그걸 가져와서 사용
      req.session.role = user.role;

      return res.status(200).json({
        loginSuccess: true,
        email: req.session.email,
        nickname: req.session.nickname,
        profile: user.profile,
        // liked: user.liked,
      });
    });
  });
});

// 인증 라우터
const { auth } = require("./middleware/auth");

app.get("/api/users/auth", auth, (req, res) => {
  res.status(200).json({
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.session.email,
    nickname: req.session.nickname,
    authSuccess: true,
  });
});

// 로그아웃 라우터
app.get("/api/users/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.json({ logoutSuccess: false, error: err });

    return res.status(200).json({
      logoutSuccess: true,
      message: "로그아웃 성공",
    });
  });
});

const { Lecture } = require("./model/Lecture");
const { response } = require("express");
const { cookieSecret } = require("./config/prod");

// 강의 등록 라우터
app.post("/api/lecture/write", (req, res) => {
  const newLecture = new Lecture(req.body);

  // formData 확인용
  console.log(req.body);

  newLecture.save((err, lectureInfo) => {
    if (err) return res.json({ lectureWriteSuccess: false, error: err });

    return res.status(200).json({
      lectureWriteSuccess: true,
    });
  });
});

// 모든 강의 불러오기 라우터
app.get("/api/lecture/load/all", (req, res) => {
  Lecture.find((err, lectures) => {
    if (err) return res.json({ loadLectureSuccess: false, error: err });

    res.status(200).json({
      loadLectureSuccess: true,
      lectureList: lectures,
    });
  });
});

// 하나의 강의 불러오기 라우터
app.post("/api/lecture/load/one", (req, res) => {
  Lecture.findOne({ lectureId: req.body.lectureNum }, (err, lecture) => {
    if (err) return res.json({ loadOneLectureSuccess: false, error: err });

    return res.status(200).json({
      loadOneLectureSuccess: true,
      lecture: lecture,
    });
  });
});

// 강의 댓글 등록 라우터
app.post("/api/lecture/outtercomment", (req, res) => {
  Lecture.findOneAndUpdate(
    { lectureId: req.body.lectureNum },
    { comments: req.body.comments },
    (err, comment) => {
      if (err) return res.json({ addCommentSuccess: false, error: err });

      return res.status(200).json({
        addCommentSuccess: true,
      });
    }
  );
});

// // Lecture랑 comments 데이터 분리해서 진행할 경우
// // 강의 댓글 등록 라우터
// const { OutterComment } = require("./model/OutterComment");

// app.post("/api/lecture/outtercomment", (req, res) => {
//   const newOutterComment = new OutterComment(req.body);

//   console.log(req.body);

//   newOutterComment.save((err, outterInfo) => {
//     if (err) return res.json({ outterCommentSuccess: false, error: err });

//     // OutterComment 모델 중, 특정 lectureId의 값들만 모아서 길이를 구함.
//     OutterComment.find({ lectureId: req.body.lectureId }, (err, comments) => {
//       console.log(comments);
//     });

//     return res.status(200).json({
//       outterCommentSuccess: true,
//     });
//   });
// });

// 강의 좋아요 등록 라우터
app.post("/api/lecture/like", (req, res) => {
  User.findOneAndUpdate(
    { email: req.body.email },
    { liked: req.body.likeList },
    (err, user) => {
      if (err) return res.json({ lectureLikeSuccess: false, error: err });

      return res.status(200).json({
        lectureLikeSuccess: true,
      });

      // 강의 데이터에서 like 숫자 증가 구현
    }
  );
});

// 강의 좋아요 해제 라우터

// 프로필 사진 등록 라우터

app.post("/api/users/profile/img", (req, res) => {
  User.findOneAndUpdate(
    { email: req.body.email },
    { profile: req.body.profileImg },
    (err, user) => {
      if (err) return res.json({ profileImgSuccess: false, error: err });
      // console.log(user);
      return res.status(200).json({
        profileImgSuccess: true,
      });
    }
  );
});

// 유저 정보 불러오기 라우터
// 이게 좀 이상한게, 결국 userData가 날라가서 얘로 불러오려고 하는건데
// 정작 불러오기 위해 필요한 email이 없음.
app.post("/api/user/all", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return res.json({ loadUserDataSuccess: false, error: err });

    return res.json({
      loadUserDataSuccess: true,
      email: user.email,
      nickname: user.nickname,
      profile: user.profile,
      liked: user.liked,
    });
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
