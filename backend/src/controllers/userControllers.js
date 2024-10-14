const User = require("../models/User");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// GET/ user by token id
exports.getUserById = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await User.findById(userId)
      .populate("team")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { _id, firstname, lastname, email, profileImage, team, role } = user;

    res.status(200).json({
      id: _id,
      firstname,
      lastname,
      email,
      profileImage, // Add profileImage to response
      team,
      role,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to retrieve user", error: err.message });
  }
};

// POST / create user
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

// PATCH/ update user
exports.updateUser = async (req, res) => {
  // Ensure req.user exists after authMiddleware
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }
  const userId = req.user.id; // Extracted from JWT

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { ...req.body },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Return only the necessary fields
    const { _id, firstname, lastname, email } = user;
    res.status(200).json({ id: _id, firstname, lastname, email });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update user", error: err.message });
  }
};

// DELETE/ user by id
exports.deleteUser = async (req, res) => {
  // Ensure req.user exists after authMiddleware
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }
  const userId = req.user.id; // Extracted from JWT

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
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

// POST/ add player to team
exports.addToTeam = async (req, res) => {
  // Ensure req.user exists after authMiddleware
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }
  const userId = req.user.id; // Extracted from JWT
  const { playerId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(playerId)) {
    return res.status(400).json({ message: "Invalid player ID" });
  }
  try {
    const user = await User.findById(userId);
    const player = await Player.findById(playerId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!player) return res.status(404).json({ message: "Player not found" });

    // Check if the player is already in the team
    if (user.team.includes(playerId)) {
      return res.status(400).json({ message: "Player already in the team" });
    }

    // Check if the team is already full
    if (user.team.length >= 15) {
      return res
        .status(400)
        .json({ message: "Team is already full. Cannot add more players." });
    }

    // Check if the user has enough money to buy the player
    if (user.money < player.price) {
      return res
        .status(400)
        .json({ message: "Insufficient funds to add this player" });
    }

    // Check the number of players from the same team
    const sameTeamCount = await Player.countDocuments({
      _id: { $in: user.team },
      team: player.team, // Assuming the Player model has a 'team' field
    });

    if (sameTeamCount >= 3) {
      return res.status(400).json({
        message: "You can only have up to 3 players from the same team.",
      });
    }

    // Add player to the team and deduct the price from the user's money
    user.team.push(playerId);
    user.money -= player.price;

    await user.save();

    res.status(200).json({
      message: "Player added successfully",
      team: user.team,
      money: user.money,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE/ delete team from user
exports.removeFromTeam = async (req, res) => {
  // Ensure req.user exists after authMiddleware
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }
  const userId = req.user.id; // Extracted from JWT
  const { playerId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(playerId)
  ) {
    return res.status(400).json({ message: "Invalid user ID or playerId" });
  }

  try {
    const user = await User.findById(userId);
    const player = await Player.findById(playerId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!player) return res.status(404).json({ message: "Player not found" });

    // Check if the player is in the user's team
    const playerIndex = user.team.indexOf(playerId);
    if (playerIndex === -1) {
      return res.status(400).json({ message: "Player not found in the team" });
    }

    // Remove the player from the team and refund the price to the user's money
    user.team.splice(playerIndex, 1);
    user.money += player.price;

    await user.save();

    res.status(200).json({
      message: "Player removed successfully",
      team: user.team,
      money: user.money,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET/ return only user's team with pagination support
exports.getUserWithTeam = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }

  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    // Fetch the total number of favorite players
    const user = await User.findById(userId).populate("team");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
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
      {
        id: loggedInUser._id,
        firstname: loggedInUser.firstname,
        role: loggedInUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    res.status(200).json({
      message: "User logged in successfully",
      token,
      firstname: loggedInUser.firstname,
      id: loggedInUser._id,
      role: loggedInUser.role,
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message); // Log error message
    res.status(400).json({ error: error.message });
  }
};
