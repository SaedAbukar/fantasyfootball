const FutsalPlayer = require("./models/FutsalPlayer"); // Import the FutsalPlayer model

// Function to update player prices based on criteria
const updatePlayerPrices = async () => {
  try {
    // Fetch all players from the database
    const players = await FutsalPlayer.find({});

    // Iterate over each player and adjust their price
    const updatePromises = players.map(async (player) => {
      let newPrice = player.price;

      // Increase price if the player is popular (more than 20% selected)
      if (player.selectedByPercent > 20) {
        newPrice += player.price * 0.05; // Increase by 5%
      } else if (player.selectedByPercent > 10) {
        newPrice += player.price * 0.03; // Increase by 3%
      }

      // Adjust price based on transfers in and out
      if (player.transfersIn > player.transfersOut) {
        newPrice += player.price * 0.04; // Increase by 4% if more transfers in than out
      } else if (player.transfersOut > player.transfersIn) {
        newPrice -= player.price * 0.03; // Decrease by 3% if more transfers out than in
      }

      // Optionally, adjust price based on performance (goals)
      if (player.goals > 0) {
        newPrice += player.goals * 100000; // Increase 100,000 for each goal
      }

      // Ensure the price doesn't drop below a minimum threshold
      newPrice = Math.max(newPrice, 5000000); // Minimum price of 5,000,000

      // Update the player price in the database
      return FutsalPlayer.updateOne(
        { _id: player._id }, // Match by player ID
        { $set: { price: Math.floor(newPrice) } } // Set the new price, rounded down to the nearest integer
      );
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    console.log("Player prices updated successfully.");
  } catch (err) {
    console.error("Failed to update player prices:", err.message);
  }
};

// Call the function to perform the updates
updatePlayerPrices();
