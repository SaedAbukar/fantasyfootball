const User = require("../models/User");
const Player = require("../models/FutsalPlayer");
const Team = require("../models/Team");
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

// PATCH/ add player to team
// PATCH/ Add player to team or copy previous week's team if it doesn't exist
exports.addToTeam = async (req, res) => {
  // Ensure req.user exists after authMiddleware
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }

  const userId = req.user.id; // Extracted from JWT
  const { playerIds, gameWeekId } = req.body;

  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    return res.status(400).json({ message: "No players provided" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await User.findById(userId);
    const team = await Team.findOne({ owner: userId, gameWeek: gameWeekId });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const players = await Player.find({ _id: { $in: playerIds } });
    const errors = [];

    // Loop through each player to validate and add them
    for (const player of players) {
      // Check if player is already in the team
      if (team.players.includes(player._id)) {
        errors.push(`Player ${player.name} already in the team`);
        continue; // Skip to the next player
      }

      // Check if the team is already full
      if (team.players.length >= 15) {
        errors.push(`Team is already full. Cannot add ${player.name}.`);
        continue; // Skip to the next player
      }

      // Check if the user has enough money to buy the player
      if (user.money < player.price) {
        errors.push(`Insufficient funds to add ${player.name}.`);
        continue; // Skip to the next player
      }

      // Add player to the team and deduct the price from the user's money
      team.players.push(player._id);
      user.money -= player.price;
      player.transfersIn++; // Update player's transfer count
    }

    // Save changes to user and team
    await team.save();
    await user.save();
    await Promise.all(players.map((player) => player.save()));

    // Send response
    res.status(200).json({
      message: "Players added successfully",
      errors: errors.length > 0 ? errors : null, // Include errors if any
      team: team.players,
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
  const { playerIds, gameWeekId } = req.body; // Assuming playerIds is passed in the body

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
    const user = await User.findById(userId);
    const team = await Team.findOne({ owner: userId, gameWeek: gameWeekId });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!team)
      return res
        .status(404)
        .json({ message: "Team not found for the specified game week" });

    const players = await Player.find({ _id: { $in: playerIds } });
    const errors = []; // To hold any errors during the process

    // Loop through player IDs to remove them
    for (const playerId of playerIds) {
      const playerIndex = team.players.indexOf(playerId);
      if (playerIndex === -1) {
        errors.push(`Player ID ${playerId} not found in the team`);
        continue; // Skip to the next player
      }

      const player = await Player.findById(playerId); // Fetch the player details
      if (!player) {
        errors.push(`Player ID ${playerId} does not exist`);
        continue; // Skip to the next player
      }

      // Remove the player from the team and refund the price to the user's money
      team.players.splice(playerIndex, 1);
      user.money += player.price;
      player.transfersOut++; // Increment transfers out count for the player
    }

    await team.save(); // Save the updated team
    await user.save(); // Save the updated user
    await Promise.all(players.map((player) => player.save()));

    res.status(200).json({
      message: "Players removed successfully",
      errors: errors.length > 0 ? errors : null, // Include errors if any
      team: team.players, // Return updated players list
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
