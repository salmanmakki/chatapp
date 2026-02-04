import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import createTokenAndSaveCookie from "../jwt/generateToken.js";
import Message from "../models/message.model.js";

// ================= SIGNUP =================
export const signup = async (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Cloudinary URL or default avatar
    const profilePic =
      req.file?.path ||
      "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg";

    const newUser = await User.create({
      fullname,
      email,
      password: hashedPassword,
      profilePic,
    });

    createTokenAndSaveCookie(newUser._id, res);

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        profilePic: newUser.profilePic,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid user credential" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid user credential" });
    }

    createTokenAndSaveCookie(user._id, res);

    res.status(200).json({
      message: "User logged in successfully",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= LOGOUT =================
export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= ALL USERS =================
export const allUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const latestMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        }).sort({ createdAt: -1 });

        return {
          ...user.toObject(),
          lastMessage: latestMessage || null,
          lastMessageTime: latestMessage?.createdAt || null,
        };
      })
    );

    usersWithLastMessage.sort((a, b) => {
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      }
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return a.fullname.localeCompare(b.fullname);
    });

    res.status(200).json(usersWithLastMessage);
  } catch (error) {
    console.error("allUsers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
