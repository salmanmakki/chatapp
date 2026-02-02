import jwt from "jsonwebtoken";

const createTokenAndSaveCookie = (userId, res) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "10d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,        // ✅ localhost
    sameSite: "lax",      // ✅ allow frontend → backend
    maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
  });
};

export default createTokenAndSaveCookie;
