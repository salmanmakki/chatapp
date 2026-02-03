import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import createTokenAndSaveCookie from "../jwt/generateToken.js";
import Message from "../models/message.model.js";

export const signup = async (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already registered" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    let profilePicUrl =
      "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg";

    if (req.file) {
      profilePicUrl = `${process.env.BACKEND_URL}/uploads/${req.file.filename}`;
    }

    const newUser = new User({
      fullname,
      email,
      password: hashPassword,
      profilePic: profilePicUrl,
    });

    await newUser.save();

    createTokenAndSaveCookie(newUser._id, res);

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

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

    res.status(201).json({
      message: "User logged in successfully",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(201).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const allUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUser },
    }).select("-password");

    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const latestMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUser, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUser },
          ],
        }).sort({ createdAt: -1 });

        return {
          ...user.toObject(),
          lastMessage: latestMessage || null,
          lastMessageTime: latestMessage ? latestMessage.createdAt : null,
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
    res.status(500).json({ error: "Internal server error" });
  }
};

