const User = require("../models/User");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .populate("team")
      .select("-password"); // Populate team with player data
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET a single user by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await User.findById(id).populate("team").select("-password");
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to retrieve user", error: err.message });
  }
};

// POST Create a new user
exports.createUser = async (req, res) => {
  const user = new User({ ...req.body });

  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to create user", error: err.message });
  }
};

// PATCH Update a user by ID
exports.updateUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { _id: id },
      { ...req.body },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // This is just a mock
    if (req.body.password) {
      // Hash new password if provided
      user.password = req.body.password;
      await user.save(); // Save before hashing
    }

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update user", error: err.message });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const deletedUser = await User.findOneAndDelete({ _id: id });
    if (deletedUser) {
      res.status(204).json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete user", error: err.message });
  }
};

// Add player to user's team
exports.addToTeam = async (req, res) => {
  const { id, playerId } = req.params; // User ID from URL

  try {
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if the player ID already exists in team
    if (user.team.includes(playerId)) {
      return res.status(400).json({ message: "Player already in team" });
    }

    // Add the player ID to team array
    user.team.push(playerId);
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove a player from team
exports.removeFromTeam = async (req, res) => {
  const { id, playerId } = req.params; // Get id and playerId from URL params

  try {
    // Find the user by ID
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure team is an array of objects
    if (!Array.isArray(user.team)) {
      return res.status(500).json({ message: "User team should be an array" });
    }

    // Remove player from team array
    user.team = user.team.filter(
      (player) => player._id.toString() !== playerId.toString()
    );

    // Save the updated user document
    await user.save();

    // Optionally, repopulate the user document with players for a detailed response
    const updatedUser = await User.findById(id)
      .populate("team")
      .select("-password");
    res.status(204).json(updatedUser);
  } catch (err) {
    console.error("Error removing from team:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get user's team
exports.getUserWithTeam = async (req, res) => {
  const { id } = req.params; // User ID from URL

  try {
    const user = await User.findById(id).populate("team");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.registerUser = async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  try {
    const newUser = await User.signup(
      firstname,
      lastname,
      email,
      password,
      [],
      []
    );
    const token = jwt.sign(
      { id: newUser._id, firstname: newUser.firstname },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    res.status(201).json({ message: "User created successfully!", token }); // Sending the Token to the client
    console.log("New user registered:", newUser.firstname);
  } catch (error) {
    console.error("Error in registerUser:", error.message); // Log error message
    res.status(400).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const loggedInUser = await User.login(email, password);
    const token = jwt.sign(
      { id: loggedInUser._id, firstname: loggedInUser.firstname },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    res.status(200).json({
      message: "User logged in successfully",
      token,
      firstname: loggedInUser.firstname,
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message); // Log error message
    res.status(400).json({ error: error.message });
  }
};
