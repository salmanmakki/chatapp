import { getReceiverSocketId, io } from "../SocketIO/server.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import crypto from "crypto";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id; // current logged in user

    // Check if this is the first message between these users
    const existingMessage = await Message.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    // If this is the first message, mark as pending
    const isFirstMessage = !existingMessage;
    console.log("Is first message:", isFirstMessage, "between", senderId, "and", receiverId);

    // block checks
    const [senderHasBlockedReceiver, receiverHasBlockedSender] = await Promise.all([
      User.exists({ _id: senderId, blockedUsers: receiverId }),
      User.exists({ _id: receiverId, blockedUsers: senderId }),
    ]);

    if (senderHasBlockedReceiver) {
      return res.status(403).json({ error: "You have blocked this user" });
    }
    if (receiverHasBlockedSender) {
      return res.status(403).json({ error: "You are blocked by this user" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      type: "text",
      message,
      status: isFirstMessage ? "pending" : "sent",
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    // Only emit to receiver if not pending approval
    if (!isFirstMessage) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    } else {
      // For first messages, emit a message request notification to receiver (Instagram-style)
      console.log("Emitting message request to receiver:", receiverId);
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        const sender = await User.findById(senderId);
        console.log("Found receiver socket:", receiverSocketId);
        io.to(receiverSocketId).emit("messageRequest", {
          messageId: newMessage._id,
          senderId,
          senderName: sender.fullname,
          senderProfilePic: sender.profilePic,
          message: message,
          createdAt: newMessage.createdAt
        });
        console.log("Message request emitted successfully");
      } else {
        console.log("Receiver not online, but message saved as pending");
      }
    }
    
    // Always emit to sender to update their contact list
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendImageMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id; // current logged in user
    const text = req.body.message || "";

    // block checks
    const [senderHasBlockedReceiver, receiverHasBlockedSender] = await Promise.all([
      User.exists({ _id: senderId, blockedUsers: receiverId }),
      User.exists({ _id: receiverId, blockedUsers: senderId }),
    ]);

    if (senderHasBlockedReceiver) {
      return res.status(403).json({ error: "You have blocked this user" });
    }
    if (receiverHasBlockedSender) {
      return res.status(403).json({ error: "You are blocked by this user" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
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

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    
    // Also emit to sender to update their contact list
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendImageMessage", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { id: chatUser } = req.params;
    const senderId = req.user._id; // current logged in user
    const conversation = await Conversation.findOne({
      members: { $all: [senderId, chatUser] },
    }).populate({
      path: "messages",
      match: { deletedBy: { $ne: senderId } },
      options: { sort: { createdAt: 1 } },
    });
    if (!conversation) {
      return res.status(201).json([]);
    }
    const messages = conversation.messages;
    res.status(201).json(messages);
  } catch (error) {
    console.log("Error in getMessage", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendFileMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const text = req.body.message || "";
    const kindOverride = req.body.kind; // "video" | "document" optional

    // block checks
    const [senderHasBlockedReceiver, receiverHasBlockedSender] = await Promise.all([
      User.exists({ _id: senderId, blockedUsers: receiverId }),
      User.exists({ _id: receiverId, blockedUsers: senderId }),
    ]);

    if (senderHasBlockedReceiver) {
      return res.status(403).json({ error: "You have blocked this user" });
    }
    if (receiverHasBlockedSender) {
      return res.status(403).json({ error: "You are blocked by this user" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const mime = req.file.mimetype || "";
    const resolvedType =
      kindOverride === "video" || kindOverride === "document"
        ? kindOverride
        : mime.startsWith("video/")
          ? "video"
          : "document";

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      type: resolvedType,
      message: text,
      attachments: [
        {
          kind: resolvedType,
          url: fileUrl,
          name: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
      ],
      status: "sent",
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendFileMessage", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const acceptPendingMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const receiverId = req.user._id;
    console.log("Accepting pending message - messageId:", messageId, "type:", typeof messageId);
    console.log("Accepting pending message - receiverId:", receiverId, "type:", typeof receiverId);

    const message = await Message.findById(messageId);
    console.log("Found message:", message);
    
    if (!message) {
      console.log("Message not found:", messageId);
      return res.status(404).json({ error: "Message not found" });
    }

    console.log("Message receiverId:", message.receiverId.toString());
    console.log("Current user ID:", receiverId.toString());
    console.log("Match check:", message.receiverId.toString() === receiverId.toString());

    if (message.receiverId.toString() !== receiverId.toString()) {
      console.log("Not authorized - receiver mismatch");
      return res.status(403).json({ error: "Not authorized" });
    }

    console.log("Message status:", message.status);
    if (message.status !== "pending") {
      console.log("Message is not pending, status:", message.status);
      return res.status(400).json({ error: "Message is not pending" });
    }

    // Update message status to delivered
    message.status = "delivered";
    await message.save();
    console.log("Message status updated to delivered");

    // Emit the message to receiver now that it's accepted
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
      console.log("Message emitted to receiver");
    }

    res.status(200).json({ message: "Message accepted", data: message });
  } catch (error) {
    console.log("Error in acceptPendingMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPendingMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    console.log("Getting pending messages for user:", currentUserId);
    
    // Get all pending messages for current user
    const pendingMessages = await Message.find({
      receiverId: currentUserId,
      status: "pending"
    })
    .populate('senderId', 'fullname profilePic')
    .sort({ createdAt: -1 });

    console.log("Found pending messages:", pendingMessages.length);

    const formattedMessages = pendingMessages.map(msg => ({
      messageId: msg._id,
      senderId: msg.senderId._id,
      senderName: msg.senderId.fullname,
      senderProfilePic: msg.senderId.profilePic,
      message: msg.message,
      createdAt: msg.createdAt
    }));

    console.log("Formatted messages:", formattedMessages);
    res.status(200).json(formattedMessages);
  } catch (error) {
    console.log("Error in getPendingMessages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const rejectPendingMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const receiverId = req.user._id;
    console.log("Rejecting pending message - messageId:", messageId, "type:", typeof messageId);
    console.log("Rejecting pending message - receiverId:", receiverId, "type:", typeof receiverId);

    const message = await Message.findById(messageId);
    console.log("Found message for rejection:", message);
    
    if (!message) {
      console.log("Message not found for rejection:", messageId);
      return res.status(404).json({ error: "Message not found" });
    }

    console.log("Message receiverId:", message.receiverId.toString());
    console.log("Current user ID:", receiverId.toString());
    console.log("Match check:", message.receiverId.toString() === receiverId.toString());

    if (message.receiverId.toString() !== receiverId.toString()) {
      console.log("Not authorized - receiver mismatch");
      return res.status(403).json({ error: "Not authorized" });
    }

    console.log("Message status:", message.status);
    if (message.status !== "pending") {
      console.log("Message is not pending, status:", message.status);
      return res.status(400).json({ error: "Message is not pending" });
    }

    // Delete the rejected message
    await Message.findByIdAndDelete(messageId);
    console.log("Message deleted successfully");

    res.status(200).json({ message: "Message rejected and deleted" });
  } catch (error) {
    console.log("Error in rejectPendingMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendLocationMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { lat, lng, label } = req.body;

    // block checks
    const [senderHasBlockedReceiver, receiverHasBlockedSender] = await Promise.all([
      User.exists({ _id: senderId, blockedUsers: receiverId }),
      User.exists({ _id: receiverId, blockedUsers: senderId }),
    ]);

    if (senderHasBlockedReceiver) {
      return res.status(403).json({ error: "You have blocked this user" });
    }
    if (receiverHasBlockedSender) {
      return res.status(403).json({ error: "You are blocked by this user" });
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      type: "location",
      location: {
        lat,
        lng,
        label: label || "",
      },
      status: "sent",
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendLocationMessage", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendContactMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { name, phone, email } = req.body;

    // block checks
    const [senderHasBlockedReceiver, receiverHasBlockedSender] = await Promise.all([
      User.exists({ _id: senderId, blockedUsers: receiverId }),
      User.exists({ _id: receiverId, blockedUsers: senderId }),
    ]);

    if (senderHasBlockedReceiver) {
      return res.status(403).json({ error: "You have blocked this user" });
    }
    if (receiverHasBlockedSender) {
      return res.status(403).json({ error: "You are blocked by this user" });
    }

    if (!name || !phone) {
      return res.status(400).json({ error: "name and phone are required" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      type: "contact",
      contact: {
        name,
        phone,
        email: email || "",
      },
      status: "sent",
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendContactMessage", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendPollMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { question, options, allowMultiple } = req.body;

    // block checks
    const [senderHasBlockedReceiver, receiverHasBlockedSender] = await Promise.all([
      User.exists({ _id: senderId, blockedUsers: receiverId }),
      User.exists({ _id: receiverId, blockedUsers: senderId }),
    ]);

    if (senderHasBlockedReceiver) {
      return res.status(403).json({ error: "You have blocked this user" });
    }
    if (receiverHasBlockedSender) {
      return res.status(403).json({ error: "You are blocked by this user" });
    }

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res
        .status(400)
        .json({ error: "question and at least 2 options are required" });
    }

    const normalizedOptions = options
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean)
      .slice(0, 10);

    if (normalizedOptions.length < 2) {
      return res
        .status(400)
        .json({ error: "at least 2 non-empty options are required" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      type: "poll",
      poll: {
        question,
        allowMultiple: Boolean(allowMultiple),
        options: normalizedOptions.map((text) => ({
          id: crypto.randomUUID(),
          text,
          votes: [],
        })),
      },
      status: "sent",
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendPollMessage", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;
    const { optionId } = req.body;

    if (!optionId) {
      return res.status(400).json({ error: "optionId is required" });
    }

    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (msg.type !== "poll" || !msg.poll) {
      return res.status(400).json({ error: "Not a poll message" });
    }

    // block checks between participants
    const [senderHasBlockedReceiver, receiverHasBlockedSender] = await Promise.all([
      User.exists({ _id: msg.senderId, blockedUsers: msg.receiverId }),
      User.exists({ _id: msg.receiverId, blockedUsers: msg.senderId }),
    ]);
    if (senderHasBlockedReceiver || receiverHasBlockedSender) {
      return res.status(403).json({ error: "Poll is blocked" });
    }

    const allowMultiple = Boolean(msg.poll.allowMultiple);

    // ensure option exists
    const option = msg.poll.options.find((o) => o.id === optionId);
    if (!option) {
      return res.status(404).json({ error: "Option not found" });
    }

    const userIdStr = currentUserId.toString();

    if (!allowMultiple) {
      // remove from all options first
      msg.poll.options.forEach((o) => {
        o.votes = o.votes.filter((v) => v.toString() !== userIdStr);
      });

      // toggle: if user already voted this option, treat as unvote
      const already = option.votes.some((v) => v.toString() === userIdStr);
      if (!already) {
        option.votes.push(currentUserId);
      }
    } else {
      // toggle vote for this option only
      const already = option.votes.some((v) => v.toString() === userIdStr);
      if (already) {
        option.votes = option.votes.filter((v) => v.toString() !== userIdStr);
      } else {
        option.votes.push(currentUserId);
      }
    }

    await msg.save();

    // notify other participant so their UI updates
    const otherUserId =
      msg.senderId.toString() === userIdStr
        ? msg.receiverId.toString()
        : msg.senderId.toString();

    const otherSocketId = getReceiverSocketId(otherUserId);
    if (otherSocketId) {
      io.to(otherSocketId).emit("messageUpdated", msg);
    }

    return res.status(200).json(msg);
  } catch (error) {
    console.log("Error in votePoll", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Mark all messages in this conversation that were sent TO the current user
// as seen, and notify the sender over Socket.io so their UI can show
// coloured double ticks.
export const markMessagesSeen = async (req, res) => {
  try {
    const { id: otherUserId } = req.params; // the person I'm chatting with
    const currentUserId = req.user._id;

    // Find the conversation between the two users
    const conversation = await Conversation.findOne({
      members: { $all: [currentUserId, otherUserId] },
    });

    if (!conversation) {
      return res.status(200).json({ message: "No conversation" });
    }

    // Update all messages where I am the receiver and status is not already "seen"
    await Message.updateMany(
      {
        _id: { $in: conversation.messages },
        receiverId: currentUserId,
        status: { $ne: "seen" },
      },
      { $set: { status: "seen" } }
    );

    // Notify the other user (the sender) that their messages were seen
    const receiverSocketId = getReceiverSocketId(otherUserId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagesSeen", {
        conversationId: conversation._id.toString(),
        seenBy: currentUserId.toString(),
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in markMessagesSeen", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Clear chat for the CURRENT USER only (soft-delete via Message.deletedBy)
export const clearChat = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findOne({
      members: { $all: [currentUserId, otherUserId] },
    });

    if (!conversation) {
      return res.status(200).json({ success: true });
    }

    await Message.updateMany(
      { _id: { $in: conversation.messages } },
      { $addToSet: { deletedBy: currentUserId } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in clearChat", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
