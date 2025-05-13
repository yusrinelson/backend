const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const createToken = async (user) => {
  const payload = {
    _id: user._id,
    role: user.role,
  };
  const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "2m" });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, {
    expiresIn: "5m",
  });

  await User.updateOne({ _id: user._id }, { refreshToken });

  return { token, refreshToken };
};

//signup user
const signupUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "user already exists" });
    }

    const user = await User.create({ name, email, password, role });
    const { token, refreshToken } = await createToken(user); //destructure tokens from createToken

    res.status(201).json({
      message: "user created successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      refreshToken,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      res.status(401).json({ message: "Invalid credentials" });
    }

    const { token, refreshToken } = await createToken(user);

    res.status(200).json({
      message: "user logged in successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      refreshToken,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//refresh token
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.satus(401).json({ message: "No refresh token" });
  }

  try {
    //verify token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // Check if user exists and refresh token matches the one in DB
    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    //generate new access token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.SECRET,
      { expiresIn: "2m" }
    );

    res.status(200).json({
      message: "Token refreshed successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token, // new access token
    });
  } catch (error) {
    res
      .status(403)
      .json({ message: "Invalid refresh token", error: error.message });
  }
};

//get current user
const getCurrentUser = async (req, res) => {
  res.json({
    message: "You made a protected route",
    user: req.user,
  });
};

//logout user
const logout = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.updateOne({ _id: userId }, { refreshToken: null });

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during logout", error: error.message });
  }
};

module.exports = {
  loginUser,
  signupUser,
  getCurrentUser,
  refreshToken,
  logout,
};
