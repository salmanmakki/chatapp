import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  acceptPendingMessage,
  clearChat,
  getMessage,
  getPendingMessages,
  markMessagesSeen,
  rejectPendingMessage,
  sendContactMessage,
  sendFileMessage,
  sendImageMessage,
  sendLocationMessage,
  sendMessage,
  sendPollMessage,
  votePoll,
} from "../controller/message.controller.js";
import secureRoute from "../middleware/secureRoute.js";

const router = express.Router();

// configure multer storage for image uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

router.post("/send/:id", secureRoute, sendMessage);
router.post(
  "/send-image/:id",
  secureRoute,
  upload.single("image"),
  sendImageMessage
);
router.post(
  "/send-file/:id",
  secureRoute,
  upload.single("file"),
  sendFileMessage
);
router.post("/send-location/:id", secureRoute, sendLocationMessage);
router.post("/send-contact/:id", secureRoute, sendContactMessage);
router.post("/send-poll/:id", secureRoute, sendPollMessage);
router.post("/vote/:messageId", secureRoute, votePoll);

// Pending message routes
router.get("/pending-messages", secureRoute, getPendingMessages);
router.post("/accept-pending/:messageId", secureRoute, acceptPendingMessage);
router.post("/reject-pending/:messageId", secureRoute, rejectPendingMessage);

router.get("/get/:id", secureRoute, getMessage);
router.post("/mark-seen/:id", secureRoute, markMessagesSeen);
router.post("/clear/:id", secureRoute, clearChat);

export default router;
