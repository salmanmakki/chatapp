import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = "image"; // ✅ FORCE IMAGE

    // only video gets video
    if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    return {
      folder: "chat-app",
      resource_type: resourceType, // 🔥 THIS LINE FIXES IMAGES
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

const upload = multer({ storage });

export default upload;

