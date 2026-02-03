import jwt from "jsonwebtoken";

const createTokenAndSaveCookie = (userId, res) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "10d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,          // ✅ REQUIRED on HTTPS
    sameSite: "none",      // ✅ REQUIRED for cross-domain
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });
};

export default createTokenAndSaveCookie;
