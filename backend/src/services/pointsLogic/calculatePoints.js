const calculateTotalPoints = (player) => {
  let totalPoints = 0;

  // Example criteria for calculating total points
  if (typeof player.goals === "number") {
    totalPoints += player.goals * 4; // Assuming 4 points for each goal
  }
  if (typeof player.assists === "number") {
    totalPoints += player.assists * 3; // Assuming 3 points for each assist
  }
  if (typeof player.minutesPlayed === "number") {
    totalPoints += Math.floor(player.minutesPlayed / 90); // 1 point for each full match played
  }

  // Add any other criteria you want to consider

  return totalPoints;
};

const updatePlayerPoints = async () => {
  try {
    // Fetch all players from the database
    const players = await FutsalPlayer.find({}).lean(); // .lean() returns plain JavaScript objects, which is faster

    // Calculate total points for each player
    const updatedPlayers = players.map((player) => {
      const totalPoints = calculateTotalPoints(player);
      return {
        _id: player._id, // Keep player ID for the update
        totalPoints, // Add the calculated totalPoints to the player object
      };
    });

    // Prepare bulk operations for database updates
    const bulkOps = updatedPlayers.map((player) => ({
      updateOne: {
        filter: { _id: player._id }, // Match the player by their ID
        update: { $set: { totalPoints: player.totalPoints } }, // Set the new totalPoints value
      },
    }));

    // Execute the bulk update in the database
    if (bulkOps.length > 0) {
      await FutsalPlayer.bulkWrite(bulkOps);
      console.log("Player totalPoints updated successfully.");
    } else {
      console.log("No players to update.");
    }
  } catch (err) {
    console.error("Failed to update player points:", err.message);
  }
};

// Call the function to perform the updates
updatePlayerPoints();
