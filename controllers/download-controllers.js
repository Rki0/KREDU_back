const fs = require("fs");
const HttpError = require("../models/http-error");

const downloadFile = async (req, res, next) => {
  const fileName = req.params.fileName;

  let isFileExist;

  try {
    isFileExist = fs.existsSync(`uploads/attachments/${fileName}`);
  } catch (err) {
    const error = new HttpError(
      "File searching is failed...Please try again.",
      500
    );

    next(error);
  }

  if (!isFileExist) {
    const error = new HttpError("There is no file. Please try again.", 500);

    next(error);
  }

  try {
    res.download(`uploads/attachments/${fileName}`);
  } catch (err) {
    const error = new HttpError(
      "File download is faild. Please try again.",
      500
    );

    next(error);
  }
};

const downloadQAFile = async (req, res, next) => {
  const fileName = req.params.fileName;

  let isFileExist;

  try {
    isFileExist = fs.existsSync(`uploads/questions/${fileName}`);
  } catch (err) {
    const error = new HttpError(
      "File searching is failed...Please try again.",
      500
    );

    next(error);
  }

  if (!isFileExist) {
    const error = new HttpError("There is no file. Please try again.", 500);

    next(error);
  }

  try {
    res.download(`uploads/questions/${fileName}`);
  } catch (err) {
    const error = new HttpError(
      "File download is faild. Please try again.",
      500
    );

    next(error);
  }
};

exports.downloadFile = downloadFile;
exports.downloadQAFile = downloadQAFile;
