const User = require("../models/User");
const Player = require("../models/FutsalPlayer");
const Team = require("../models/Team");
const GameWeek = require("../models/GameWeek");
const { getCurrentGameWeek } = require("../services/gameLogic/gameWeek");
const mongoose = require("mongoose");

// GET/ All Teams

exports.getAllTeams = async (req, res) => {
  // Ensure req.user exists after authMiddleware
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  const { gameWeekId } = req.body; // Extract target user's ID and game week ID from the request body

  // Validate inputs
  try {
    const currentGameWeek = await getCurrentGameWeek();
    if (gameWeekId >= currentGameWeek.gameWeekId && currentGameWeek.isActive)
      return res.status(400).json({
        message:
          "You can only view current weeks team by other players when the deadline is closed",
      });
    // Fetch the team for the specified game week for the target user
    const previousTeams = await Team.find({
      gameWeek: gameWeekId,
    }).populate("players");

    if (!previousTeams) {
      return res
        .status(404)
        .json({ message: "Team not found for the specified game week." });
    }

    // Return the team information along with the players
    res.status(200).json({
      message: "Previous team retrieved successfully.",
      team: previousTeams,
      players: previousTeams.players,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH/ Add player to team or copy previous week's team if it doesn't exist
// PATCH/ Add player to team
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

    const team = await Team.findOne({ owner: userId, gameWeek: 1 });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const players = await Player.find({ _id: { $in: playerIds } });
    const errors = [];
    const playersToAdd = [];

    // Loop through each playerId to process
    for (const playerId of playerIds) {
      const player = players.find((p) => p._id.toString() === playerId);

      // Validate the player
      if (!player) {
        errors.push(`Player ID ${playerId} does not exist.`);
        continue; // Skip to the next player
      }

      // Check if the player is already in the team
      if (team.players.includes(player._id)) {
        errors.push(`Player ${player.name} is already in the team.`);
        continue; // Skip to the next player
      }

      // Check if the team is already full
      if (team.players.length >= 15) {
        errors.push(`Team is already full. Cannot add ${player.name}.`);
        continue; // Skip to the next player
      }

      // Check if user has enough money
      if (user.money < player.price) {
        errors.push(`Insufficient funds to add ${player.name}.`);
        continue; // Skip to the next player
      }

      // If all checks pass, add player
      playersToAdd.push(player); // Store the player object
    }

    // If there are errors, return them without modifying the team or user balance
    if (errors.length > 0) {
      return res.status(400).json({ message: "Errors occurred", errors });
    }

    // Deduct money for players being added
    for (const player of playersToAdd) {
      console.log("money before", user.money);
      user.money -= player.price; // Deduct the player's price
      console.log("player price", player.price);
      console.log("money after", user.money);
      team.players.push(player._id); // Add player to team
      player.transfersIn++; // Increment transfersIn count for the player
    }

    // Save changes to user and team
    await Promise.all([
      user.save(), // Save updated user with new money value
      team.save(), // Save updated team with new players
      ...playersToAdd.map((player) =>
        Player.findByIdAndUpdate(player._id, { $inc: { transfersIn: 1 } })
      ),
    ]);

    res.status(200).json({
      message: "Players added successfully",
      team: team.players,
      money: user.money,
      deadline: currentGameWeek.endDate,
    });
  } catch (err) {
    console.error(err); // Log any unexpected errors for debugging
    res.status(500).json({ message: err.message });
  }
};

// DELETE/ delete team from user// DELETE/ remove player from team
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

    const team = await Team.findOne({ owner: userId, gameWeek: 1 });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const players = await Player.find({ _id: { $in: playerIds } });
    const playerMap = new Map(
      players.map((player) => [player._id.toString(), player])
    );

    const errors = [];
    const playersToRemove = [];

    for (const playerId of playerIds) {
      const player = playerMap.get(playerId);

      // Check if the player exists
      if (!player) {
        errors.push(`Player ID ${playerId} does not exist.`);
        continue; // Skip to the next player
      }

      // Check if the player is in the team
      if (!team.players.includes(player._id)) {
        errors.push(`Player ${player.name} not found in the team.`);
        continue; // Skip to the next player
      }

      // If all checks pass, mark player for removal
      playersToRemove.push(player); // Store the player object for further processing
    }

    // If there are any errors, return them without modifying the team
    if (errors.length > 0) {
      return res.status(400).json({ message: "Errors occurred", errors });
    }

    // Update user's money and player's transfer count
    for (const player of playersToRemove) {
      console.log("money before", user.money);
      user.money += player.price; // Add player's price back to user's money
      console.log("player price", player.price);
      console.log("money after", user.money);
      player.transfersOut++; // Increment transfersOut count for the player
    }

    // Remove the players from the team
    team.players = team.players.filter(
      (playerId) =>
        !playersToRemove.some(
          (player) => player._id.toString() === playerId.toString()
        )
    );

    // Save changes to the user, team, and players
    await Promise.all([
      team.save(),
      user.save(),
      ...playersToRemove.map((player) =>
        Player.findByIdAndUpdate(player._id, { $inc: { transfersOut: 1 } })
      ),
    ]);

    res.status(200).json({
      message: "Players removed successfully",
      team: team.players,
      money: user.money,
      deadline: currentGameWeek.endDate,
    });
  } catch (err) {
    console.error(err); // Log any unexpected errors for debugging
    res.status(500).json({ message: err.message });
  }
};

exports.getPreviousTeamById = async (req, res) => {
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
