const express = require("express");

const downLoadControllers = require("../controllers/download-controllers");

const router = express.Router();

router.get("/lecture/:fileName", downLoadControllers.downloadFile);

router.get("/qa/:fileName", downLoadControllers.downloadQAFile);

module.exports = router;
