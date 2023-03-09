const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/check-auth");
const userControllers = require("../controllers/user-controllers");
const profileImgUpload = require("../middleware/user-img-upload");

const router = express.Router();

router.post(
  "/signup",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 8 }),
  ],
  userControllers.signup
);

router.post("/login", userControllers.login);

router.use(checkAuth);

// 아직 구현 안됨
router.post("/withdraw", userControllers.withdraw);

router.get("/info", userControllers.getUserInfo);

router.patch("/change/nickname", userControllers.changeNickname);

router.patch(
  "/change/image",
  profileImgUpload.single("image"),
  userControllers.changeImage
);

router.patch("/change/password", userControllers.changePswd);

router.get("/checkLike/lecture/:lectureId", userControllers.checkLikeLecture);

router.get("/checkLike/qa/:qaId", userControllers.checkLikeQA);

router.get("/likeLecture", userControllers.getLikeLecture);

router.delete("/dislikeLecture/:lectureId", userControllers.deleteLikeLecture);

router.get("/qas", userControllers.getUserQA);

module.exports = router;
