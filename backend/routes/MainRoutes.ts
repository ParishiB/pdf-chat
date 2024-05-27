import express from "express";
import { uploadFile } from "../controller/MainController";
const router = express.Router();

router.route("/uploadFile").post(uploadFile);
module.exports = router;
