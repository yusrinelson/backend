const express = require("express");
const router = express.Router();
const {
  loginUser,
  signupUser,
  getCurrentUser,
  refreshToken,
  logout,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/refresh", refreshToken);

router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logout);

module.exports = router;
