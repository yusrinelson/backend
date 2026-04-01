const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.protect = async (req, res, next) => {
  let token;

  token = req.headers.authorization?.startsWith("Bearer")
    ? req.headers.authorization.split(" ")[1]
    : ""; //check if token is present

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);

    req.user = await User.findById(decoded._id).select("-password");
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Not authorized: Invalid token", error: error.message });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};


// protect
// Use this on routes where user must be logged in.
// Example: adding item to cart, checking out, posting review.
// It verifies JWT, gets user info, attaches it to req.user.

// restrictTo
// Use this when only certain roles can access.
// Example: only admin can create products.
// Syntax: router.post("/create", protect, restrictTo("admin"), createProduct)

// So any protected route = protect first, then restrictTo if role-based.