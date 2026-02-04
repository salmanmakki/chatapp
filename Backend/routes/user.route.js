import express from "express";
import upload from "../middleware/upload.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import {

  allUsers,

  login,

  logout,

  signup,

} from "../controller/user.controller.js";

import secureRoute from "../middleware/secureRoute.js";

const router = express.Router();

// Configure multer for profile picture uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });


router.post("/signup", upload.single("profilePic"), signup);

router.post("/login", login);

router.post("/logout", logout);

router.get("/allusers", secureRoute, allUsers);

router.post(
  "/upload",
  upload.single("image"),
  (req, res) => {
    res.status(200).json({
      imageUrl: req.file.path,
    });
  }
);



export default router;

