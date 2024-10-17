const User = require("../models/User");
const Player = require("../models/FutsalPlayer");
const Team = require("../models/Team");
const GameWeek = require("../models/GameWeek");
const getCurrentGameWeek = require("../services/gameLogic/gameWeek");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("-password"); // Populate team with player data
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
      .populate({
        path: "teams",
        populate: {
          path: "players", // This should match the field in the Team schema that references FutsalPlayer
        },
      })
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { _id, firstname, lastname, email, money, teams, role } = user;

    res.status(200).json({
      id: _id,
      firstname,
      lastname,
      email,
      money,
      teams,
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

// PATCH/ Add player to team or copy previous week's team if it doesn't exist
exports.addToTeam = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }

  const userId = req.user.id;
  const { playerIds } = req.body;

  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    return res.status(400).json({ message: "No players provided" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const currentGameWeek = await getCurrentGameWeek();
    if (!currentGameWeek || new Date() >= new Date(currentGameWeek.endDate)) {
      return res
        .status(403)
        .json({ message: "Cannot modify team after the game week has ended." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const team = await Team.findOne({
      owner: userId,
      gameWeek: currentGameWeek.gameWeekId,
    });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const players = await Player.find({ _id: { $in: playerIds } });
    const playerMap = new Map(
      players.map((player) => [player._id.toString(), player])
    );

    const errors = [];
    const playersToAdd = [];

    for (const playerId of playerIds) {
      const player = playerMap.get(playerId);

      if (!player) {
        errors.push(`Player ID ${playerId} does not exist.`);
        continue;
      }

      if (team.players.includes(player._id)) {
        errors.push(`Player ${player.name} already in the team`);
        continue;
      }

      if (team.players.length >= 15) {
        errors.push(`Team is already full. Cannot add ${player.name}.`);
        continue;
      }

      if (user.money < player.price) {
        errors.push(`Insufficient funds to add ${player.name}.`);
        continue;
      }

      playersToAdd.push(player._id);
      user.money -= player.price;
      player.transfersIn++;
    }

    team.players.push(...playersToAdd);

    // Save changes to user and team
    await Promise.all([
      team.save(),
      user.save(),
      ...playersToAdd.map((playerId) =>
        Player.findByIdAndUpdate(playerId, { $inc: { transfersIn: 1 } })
      ),
    ]);

    res.status(200).json({
      message: "Players added successfully",
      errors: errors.length > 0 ? errors : null,
      team: team.players,
      money: user.money,
      deadline: currentGameWeek.endDate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE/ delete team from user
exports.removeFromTeam = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }

  const userId = req.user.id;
  const { playerIds } = req.body;

  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    return res.status(400).json({ message: "No players provided for removal" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  // Validate player IDs
  for (const playerId of playerIds) {
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ message: "Invalid player ID(s) provided" });
    }
  }

  try {
    const currentGameWeek = await getCurrentGameWeek();
    if (!currentGameWeek || new Date() >= new Date(currentGameWeek.endDate)) {
      return res
        .status(403)
        .json({ message: "Cannot modify team after the game week has ended." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const team = await Team.findOne({
      owner: userId,
      gameWeek: currentGameWeek.gameWeekId,
    });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const players = await Player.find({ _id: { $in: playerIds } });
    const playerMap = new Map(
      players.map((player) => [player._id.toString(), player])
    );

    const errors = [];
    const playersToRemove = [];

    for (const playerId of playerIds) {
      const player = playerMap.get(playerId);

      if (!player) {
        errors.push(`Player ID ${playerId} does not exist.`);
        continue;
      }

      if (!team.players.includes(player._id)) {
        errors.push(`Player ID ${playerId} not found in the team`);
        continue;
      }

      playersToRemove.push(player._id);
      user.money += player.price;
      player.transfersOut++;
    }

    // Remove players from the team
    team.players = team.players.filter(
      (playerId) => !playersToRemove.includes(playerId)
    );

    await Promise.all([
      team.save(),
      user.save(),
      ...playersToRemove.map((playerId) =>
        Player.findByIdAndUpdate(playerId, { $inc: { transfersOut: 1 } })
      ),
    ]);

    res.status(200).json({
      message: "Players removed successfully",
      errors: errors.length > 0 ? errors : null,
      team: team.players,
      money: user.money,
      deadline: currentGameWeek.endDate,
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
    // Fetch the user's teams along with the associated futsal players
    const user = await User.findById(userId).populate({
      path: "teams",
      populate: {
        path: "players", // This should match the field in the Team schema that references FutsalPlayer
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Respond with user teams along with populated futsal players
    res.status(200).json(user.teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPreviousTeam = async (req, res) => {
  // Ensure req.user exists after authMiddleware
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  const { targetUserId, gameWeekId } = req.body; // Extract target user's ID and game week ID from the request body

  // Validate inputs
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ message: "Invalid user ID  provided." });
  }

  try {
    const currentGameWeek = await getCurrentGameWeek();
    if (gameWeekId >= currentGameWeek.gameWeekId && currentGameWeek.isActive)
      return res.status(400).json({
        message:
          "You can only view current weeks team by other players when the deadline is closed",
      });
    // Fetch the target user to ensure they exist
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found." });
    }

    // Fetch the team for the specified game week for the target user
    const previousTeam = await Team.findOne({
      owner: targetUserId,
      gameWeek: gameWeekId,
    }).populate("players");

    if (!previousTeam) {
      return res
        .status(404)
        .json({ message: "Team not found for the specified game week." });
    }

    // Return the team information along with the players
    res.status(200).json({
      message: "Previous team retrieved successfully.",
      team: previousTeam,
      players: previousTeam.players,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.registerUser = async (req, res) => {
  const { firstname, lastname, email, password, teamName, gameWeekId } =
    req.body;

  // Check for required fields
  if (
    !firstname ||
    !lastname ||
    !email ||
    !password ||
    !teamName ||
    !gameWeekId
  ) {
    return res.status(400).json({ message: "All fields must be filled" });
  }

  try {
    // Register the new user
    const newUser = await User.signup(firstname, lastname, email, password);

    // Create the team associated with the user
    const team = await Team.create({
      name: teamName,
      owner: newUser._id,
      gameWeek: gameWeekId,
      players: [], // Start with an empty player list
      captain: null,
      viceCaptain: null,
    });

    // Link the new team to the user
    newUser.teams.push(team._id); // Ensure the team ID is stored in the user's teams array
    await newUser.save(); // Save the user to reflect the added team

    // Create a JWT token for the new user
    const token = jwt.sign(
      {
        id: newUser._id,
        firstname: newUser.firstname,
        team: teamName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    // Send response with success message and token
    res.status(201).json({ message: "User created successfully!", token });
    console.log("New user registered:", newUser.firstname);
  } catch (error) {
    console.error("Error in registerUser:", error.message); // Log error message
    res.status(400).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const currentGameWeek = await getCurrentGameWeek();
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
      start: currentGameWeek.startDate,
      deadline: currentGameWeek.endDate,
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message); // Log error message
    res.status(400).json({ error: error.message });
  }
};
