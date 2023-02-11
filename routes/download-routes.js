const express = require("express");

const downLoadControllers = require("../controllers/download-controllers");

const router = express.Router();

router.get("/:fileName", downLoadControllers.downloadFile);

module.exports = router;
