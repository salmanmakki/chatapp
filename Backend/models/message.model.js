import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "video", "document", "location", "contact", "poll"],
      default: "text",
    },

    // Text content (optional for media)
    message: {
      type: String,
      required: false,
    },

    // Backward-compat for older clients (image-only)
    imageUrl: {
      type: String,
      required: false,
    },

    // Generic attachments for image/video/document
    attachments: [
      {
        kind: {
          type: String,
          enum: ["image", "video", "document"],
        },
        url: String,
        name: String,
        mimeType: String,
        size: Number,
      },
    ],

    // Location message payload
    location: {
      lat: Number,
      lng: Number,
      label: String,
    },

    // Contact card payload
    contact: {
      name: String,
      phone: String,
      email: String,
    },

    // Poll payload
    poll: {
      question: String,
      allowMultiple: { type: Boolean, default: false },
      options: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          votes: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
        },
      ],
    },

    // Delivery / read status for WhatsApp-style ticks
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "seen"],
      default: "sent",
    },

    // For "clear chat for me" feature (messages hidden per-user)
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("message", messageSchema);

export default Message;
