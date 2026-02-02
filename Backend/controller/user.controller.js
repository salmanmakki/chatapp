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

    // Hashing the password

    const hashPassword = await bcrypt.hash(password, 10);

    // Handle profile picture
    let profilePicUrl = "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg";
    
    if (req.file) {
      profilePicUrl = `http://localhost:4001/uploads/${req.file.filename}`;
    }

    const newUser = await new User({

      fullname,

      email,

      password: hashPassword,

      profilePic: profilePicUrl,

    });

    await newUser.save();

    if (newUser) {

      createTokenAndSaveCookie(newUser._id, res);

      res.status(201).json({

        message: "User created successfully",

        user: {

          _id: newUser._id,

          fullname: newUser.fullname,

          email: newUser.email,

        },

      });

    }

  } catch (error) {

    console.log(error);

    res.status(500).json({ error: "Internal server error" });

  }

};

export const login = async (req, res) => {

  const { email, password } = req.body;

  try {

    const user = await User.findOne({ email });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!user || !isMatch) {

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

    console.log(error);

    res.status(500).json({ error: "Internal server error" });

  }

};

export const logout = async (req, res) => {

  try {

    res.clearCookie("jwt");

    res.status(201).json({ message: "User logged out successfully" });

  } catch (error) {

    console.log(error);

    res.status(500).json({ error: "Internal server error" });

  }

};



export const allUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    
    // Get all users except logged-in user
    const users = await User.find({
      _id: { $ne: loggedInUser },
    }).select("-password");

    // Get latest message for each user
    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        try {
          // Get the latest message between logged-in user and this user
          const latestMessage = await Message.findOne({
            $or: [
              { senderId: loggedInUser, receiverId: user._id },
              { senderId: user._id, receiverId: loggedInUser }
            ]
          }).sort({ createdAt: -1 });

          return {
            ...user.toObject(),
            lastMessage: latestMessage || null,
            lastMessageTime: latestMessage ? latestMessage.createdAt : null
          };
        } catch (error) {
          console.error("Error getting messages for user:", user._id, error);
          return {
            ...user.toObject(),
            lastMessage: null,
            lastMessageTime: null
          };
        }
      })
    );

    // Sort users by last message time (most recent first), then by name for users with no messages
    usersWithLastMessage.sort((a, b) => {
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      }
      if (a.lastMessageTime && !b.lastMessageTime) {
        return -1; // a comes first (has message)
      }
      if (!a.lastMessageTime && b.lastMessageTime) {
        return 1; // b comes first (has message)
      }
      // Both have no messages, sort by name
      return a.fullname.localeCompare(b.fullname);
    });

    res.status(201).json(usersWithLastMessage);
  } catch (error) {
    console.log("Error in allUsers Controller: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
};

