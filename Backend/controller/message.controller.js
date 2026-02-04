import { getReceiverSocketId, io } from "../SocketIO/server.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import crypto from "crypto";

/* =========================
   TEXT MESSAGE
========================= */
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const existingMessage = await Message.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    const isFirstMessage = !existingMessage;

    const [blockedBySender, blockedByReceiver] = await Promise.all([
      User.exists({ _id: senderId, blockedUsers: receiverId }),
      User.exists({ _id: receiverId, blockedUsers: senderId }),
    ]);

    if (blockedBySender)
      return res.status(403).json({ error: "You have blocked this user" });

    if (blockedByReceiver)
      return res.status(403).json({ error: "You are blocked by this user" });

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      type: "text",
      message,
      status: isFirstMessage ? "pending" : "sent",
    });

    conversation.messages.push(newMessage._id);
    await conversation.save();

    // Emit to sender
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    // Emit to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      if (!isFirstMessage) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      } else {
        const sender = await User.findById(senderId);
        io.to(receiverSocketId).emit("messageRequest", {
          messageId: newMessage._id,
          senderId,
          senderName: sender.fullname,
          senderProfilePic: sender.profilePic,
          message,
          createdAt: newMessage.createdAt,
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================
   IMAGE MESSAGE (Cloudinary)
========================= */
export const sendImageMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const text = req.body.message || "";

    if (!req.file) {
      return res.status(400).json({ error: "Image file required" });
    }

    const imageUrl = req.file.path; // ✅ Cloudinary URL

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      type: "image",
      message: text,
      imageUrl,
      attachments: [
        {
          kind: "image",
          url: imageUrl,
          name: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
      ],
      status: "sent",
    });

    conversation.messages.push(newMessage._id);
    await conversation.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("sendImageMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================
   FILE / VIDEO / PDF
========================= */
export const sendFileMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const text = req.body.message || "";

    if (!req.file) {
      return res.status(400).json({ error: "File required" });
    }

    const fileUrl = req.file.path; // ✅ Cloudinary URL
    const mime = req.file.mimetype;

    const type = mime.startsWith("video/") ? "video" : "document";

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      type,
      message: text,
      attachments: [
        {
          kind: type,
          url: fileUrl,
          name: req.file.originalname,
          mimeType: mime,
          size: req.file.size,
        },
      ],
      status: "sent",
    });

    conversation.messages.push(newMessage._id);
    await conversation.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("sendFileMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================
   GET MESSAGES
========================= */
export const getMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { id: otherUserId } = req.params;

    const conversation = await Conversation.findOne({
      members: { $all: [senderId, otherUserId] },
    }).populate({
      path: "messages",
      match: { deletedBy: { $ne: senderId } },
      options: { sort: { createdAt: 1 } },
    });

    res.status(200).json(conversation ? conversation.messages : []);
  } catch (err) {
    console.error("getMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================
   PENDING MESSAGES
========================= */
export const getPendingMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const pending = await Message.find({
      receiverId: currentUserId,
      status: "pending",
    })
      .populate("senderId", "fullname profilePic")
      .sort({ createdAt: -1 });

    const formatted = pending.map((m) => ({
      messageId: m._id,
      senderId: m.senderId._id,
      senderName: m.senderId.fullname,
      senderProfilePic: m.senderId.profilePic,
      message: m.message,
      createdAt: m.createdAt,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("getPendingMessages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const acceptPendingMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const receiverId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message)
      return res.status(404).json({ error: "Message not found" });

    if (message.receiverId.toString() !== receiverId.toString())
      return res.status(403).json({ error: "Not authorized" });

    message.status = "delivered";
    await message.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("acceptPendingMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const rejectPendingMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const receiverId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message)
      return res.status(404).json({ error: "Message not found" });

    if (message.receiverId.toString() !== receiverId.toString())
      return res.status(403).json({ error: "Not authorized" });

    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("rejectPendingMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =========================
   LOCATION / CONTACT / POLL
========================= */
export const sendLocationMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { lat, lng, label } = req.body;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      type: "location",
      location: { lat, lng, label },
      status: "sent",
    });

    await Conversation.findOneAndUpdate(
      { members: { $all: [senderId, receiverId] } },
      { $push: { messages: newMessage._id } },
      { upsert: true }
    );

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("sendLocationMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendContactMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { name, phone, email } = req.body;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      type: "contact",
      contact: { name, phone, email },
      status: "sent",
    });

    await Conversation.findOneAndUpdate(
      { members: { $all: [senderId, receiverId] } },
      { $push: { messages: newMessage._id } },
      { upsert: true }
    );

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("sendContactMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendPollMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { question, options, allowMultiple } = req.body;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      type: "poll",
      poll: {
        question,
        allowMultiple: Boolean(allowMultiple),
        options: options.map((text) => ({
          id: crypto.randomUUID(),
          text,
          votes: [],
        })),
      },
      status: "sent",
    });

    await Conversation.findOneAndUpdate(
      { members: { $all: [senderId, receiverId] } },
      { $push: { messages: newMessage._id } },
      { upsert: true }
    );

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("sendPollMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionId } = req.body;
    const userId = req.user._id.toString();

    const msg = await Message.findById(messageId);
    if (!msg || msg.type !== "poll")
      return res.status(400).json({ error: "Invalid poll" });

    msg.poll.options.forEach((o) => {
      o.votes = o.votes.filter((v) => v.toString() !== userId);
      if (o.id === optionId) o.votes.push(req.user._id);
    });

    await msg.save();

    const otherUserId =
      msg.senderId.toString() === userId
        ? msg.receiverId.toString()
        : msg.senderId.toString();

    const socketId = getReceiverSocketId(otherUserId);
    if (socketId) {
      io.to(socketId).emit("messageUpdated", msg);
    }

    res.status(200).json(msg);
  } catch (err) {
    console.error("votePoll error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesSeen = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id: otherUserId } = req.params;

    const conversation = await Conversation.findOne({
      members: { $all: [currentUserId, otherUserId] },
    });

    if (!conversation) return res.status(200).json({ success: true });

    await Message.updateMany(
      {
        _id: { $in: conversation.messages },
        receiverId: currentUserId,
        status: { $ne: "seen" },
      },
      { $set: { status: "seen" } }
    );

    const socketId = getReceiverSocketId(otherUserId);
    if (socketId) {
      io.to(socketId).emit("messagesSeen", { seenBy: currentUserId });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("markMessagesSeen error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearChat = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id: otherUserId } = req.params;

    const conversation = await Conversation.findOne({
      members: { $all: [currentUserId, otherUserId] },
    });

    if (!conversation) return res.status(200).json({ success: true });

    await Message.updateMany(
      { _id: { $in: conversation.messages } },
      { $addToSet: { deletedBy: currentUserId } }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("clearChat error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
