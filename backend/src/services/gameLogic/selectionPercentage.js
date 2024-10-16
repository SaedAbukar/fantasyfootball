const User = require("../models/User");
const FutsalPlayer = require("./models/FutsalPlayer");

const calculateSelectionPercentages = async () => {
  try {
    // Step 1: Get the total number of users
    const totalUsers = await User.countDocuments();

    // Step 2: Get all players
    const players = await FutsalPlayer.find({});

    // Step 3: For each player, calculate the selection percentage
    const playerSelectionPromises = players.map(async (player) => {
      // Count how many users have selected this player
      const usersWhoSelected = await User.countDocuments({ team: player._id });

      // Calculate selection percentage
      const selectionPercentage = totalUsers
        ? (usersWhoSelected / totalUsers) * 100
        : 0;

      // Update the player with the new selection percentage
      await FutsalPlayer.updateOne(
        { _id: player._id },
        { $set: { selectedByPercent: selectionPercentage } }
      );

      return {
        playerId: player._id,
        selectionPercentage,
      };
    });

    // Execute all promises
    const results = await Promise.all(playerSelectionPromises);

    console.log("Selection percentages updated successfully:", results);
  } catch (err) {
    console.error("Error calculating selection percentages:", err.message);
  }
};

// Call the function to perform the calculations
calculateSelectionPercentages();
