const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const fileUpload = multer({
  limits: 10000000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/users");
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];

      // 한글 파일명 깨짐 해결
      file.originalname = Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      );

      // file.originalname에서 확장자 제거한 파일명 추출하기
      file.originalname = file.originalname.split(`.${ext}`)[0];

      // 파일명 중복을 방지하기 위해 uuid 붙여주기
      cb(null, file.originalname + uuidv4() + "." + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];

    let error = isValid ? null : new Error("Invalid mime type!");

    cb(error, isValid);
  },
});

module.exports = fileUpload;
