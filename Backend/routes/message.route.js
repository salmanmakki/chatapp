import express from "express";
import upload from "../middleware/upload.js";
import secureRoute from "../middleware/secureRoute.js";

import {
  sendMessage,
  sendImageMessage,
  sendFileMessage,
  sendLocationMessage,
  sendContactMessage,
  sendPollMessage,
  votePoll,
  getMessage,
  markMessagesSeen,
  clearChat,
  getPendingMessages,
  acceptPendingMessage,
  rejectPendingMessage,
} from "../controller/message.controller.js";

const router = express.Router();

// TEXT
router.post("/send/:id", secureRoute, sendMessage);

// IMAGE
router.post(
  "/send-image/:id",
  secureRoute,
  upload.single("image"), // ✅ MUST BE "file"
  sendImageMessage
);

// FILE / VIDEO / PDF
router.post(
  "/send-file/:id",
  secureRoute,
  upload.single("file"), // ✅ MUST BE "file"
  sendFileMessage
);

router.post("/send-location/:id", secureRoute, sendLocationMessage);
router.post("/send-contact/:id", secureRoute, sendContactMessage);
router.post("/send-poll/:id", secureRoute, sendPollMessage);
router.post("/vote/:messageId", secureRoute, votePoll);

// Pending
router.get("/pending-messages", secureRoute, getPendingMessages);
router.post("/accept-pending/:messageId", secureRoute, acceptPendingMessage);
router.post("/reject-pending/:messageId", secureRoute, rejectPendingMessage);

// Fetch / status
router.get("/get/:id", secureRoute, getMessage);
router.post("/mark-seen/:id", secureRoute, markMessagesSeen);
router.post("/clear/:id", secureRoute, clearChat);

export default router;
