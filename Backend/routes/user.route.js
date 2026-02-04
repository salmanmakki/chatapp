import express from "express";
import upload from "../middleware/upload.js";
import {
  signup,
  login,
  logout,
  allUsers,
} from "../controller/user.controller.js";
import secureRoute from "../middleware/secureRoute.js";

const router = express.Router();


router.post("/signup", upload.single("profilePic"), signup);

router.post("/login", login);
router.post("/logout", logout);


router.get("/allusers", secureRoute, allUsers);

export default router;
