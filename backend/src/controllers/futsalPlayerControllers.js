// controllers/playerController.js
const FutsalPlayer = require("../models/FutsalPlayer");
const {
  mergePlayerData,
  scrapePlayerData,
} = require("../services/scrapers/futsalPlayerStats");
const mongoose = require("mongoose");

// Get all players with optional search and pagination
exports.getAllFutsalPlayers = async (req, res) => {
  try {
    const { page = 1, limit = 10, name } = req.query; // Use default page 1 and limit 10 if not provided
    const skip = (page - 1) * limit; // Calculate how many players to skip

    // Build the filter object for MongoDB query
    const filter = {};

    console.log(filter);

    // Execute the query with filtering, pagination, and limit
    const players = await FutsalPlayer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalFutsalPlayers = await FutsalPlayer.countDocuments(filter); // Get total number of players that match the filter

    // Return the players along with pagination info
    res.status(200).json({
      players,
      totalFutsalPlayers, // Send the total number of players for frontend to calculate total pages
      totalPages: Math.ceil(totalFutsalPlayers / limit), // Calculate total pages
      currentPage: parseInt(page), // Send current page info
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single player by ID
exports.getFutsalPlayerById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid player ID" });
  }

  try {
    const player = await FutsalPlayer.findById(id);
    if (player) {
      res.status(200).json(player);
    } else {
      res.status(404).json({ message: "FutsalPlayer not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Find players by query
exports.findFutsalPlayers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Destructure parameters from request query
    const { name, team, position, price } = req.query; // Use req.query to get parameters

    const query = {};

    // Check for name and build regex query if provided
    if (name && name !== "undefined") {
      query.name = { $regex: new RegExp(name, "i") }; // Case-insensitive search for name
    }

    // Check for team and build regex query if provided
    if (team && team !== "undefined") {
      query.team = { $regex: new RegExp(team, "i") }; // Case-insensitive search for team
    }

    // Check for position and build regex query if provided
    if (position && position !== "undefined") {
      query.position = { $regex: new RegExp(position, "i") }; // Case-insensitive search for position
    }

    // Check if a price limit is provided and add to query
    if (price && !isNaN(price)) {
      query.price = { $lt: parseFloat(price) }; // Filter players with price less than the specified price
    }

    const players = await FutsalPlayer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FutsalPlayer.countDocuments(query); // Count based on search query

    if (players.length === 0) {
      return res
        .status(404)
        .json({ message: "No players found matching the criteria" });
    }

    res.status(200).json({
      players,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching players:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create a new player
exports.createFutsalPlayer = async (req, res) => {
  const newFutsalPlayer = new FutsalPlayer(req.body);

  try {
    const savedFutsalPlayer = await newFutsalPlayer.save();
    res.status(201).json(savedFutsalPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update player data by ID
exports.updateFutsalPlayer = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid player ID" });
  }

  try {
    const updatedFutsalPlayer = await FutsalPlayer.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true, // Enforce schema validation on update
      }
    );

    if (!updatedFutsalPlayer) {
      return res.status(404).json({ message: "FutsalPlayer not found" });
    }

    res.status(200).json(updatedFutsalPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a player by ID
exports.deleteFutsalPlayer = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid player ID" });
  }

  try {
    const playerDeleted = await FutsalPlayer.findOneAndDelete({ _id: id });
    if (playerDeleted) {
      res.status(204).json({ message: "FutsalPlayer deleted successfully" });
    } else {
      res.status(404).json({ message: "FutsalPlayer not found" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete player", error: err.message });
  }
};

exports.getUpdatedFutsalPlayerData = async (req, res) => {
  try {
    // Step 1: Scrape the latest player data
    const scrapedData = await mergePlayerData();

    // Step 2: Update each player's currentWeekPoints and totalPoints based on the scraped data
    const updatePromises = scrapedData.map(async (scrapedPlayer) => {
      const {
        name,
        team,
        matches,
        goals,
        assists,
        points,
        yellowCards,
        redCards,
      } = scrapedPlayer;

      // Fetch the existing player data from the database by name and team
      const existingPlayer = await FutsalPlayer.findOne({ name, team });

      if (!existingPlayer) {
        console.warn(
          `Player with name "${name}" and team "${team}" not found in the database.`
        );
        return; // Skip if the player doesn't exist
      }

      // Ensure all scraped values are parsed as integers
      const parsedGoals = parseInt(goals) || 0;
      const parsedAssists = parseInt(assists) || 0;
      const parsedPoints = parseInt(points) || 0;
      const parsedYellowCards = parseInt(yellowCards) || 0;
      const parsedRedCards = parseInt(redCards) || 0;
      const parsedMatches = parseInt(matches) || 0;

      // Step 3: Calculate differences
      const goalsDifference = parsedGoals - existingPlayer.goals;
      const assistsDifference = parsedAssists - existingPlayer.assist;
      const pointsDifference = parsedPoints - existingPlayer.points;
      const yellowCardsDifference =
        parsedYellowCards - existingPlayer.yellowCards;
      const redCardsDifference = parsedRedCards - existingPlayer.redCards;
      const matchesDifference = parsedMatches - existingPlayer.matches;

      // Step 4: Calculate currentWeekPoints based on the differences
      const currentWeekPoints =
        pointsDifference * 1 + // 1 point per point
        goalsDifference * 4 + // 4 points per goal
        assistsDifference * 3 + // 3 points per assist
        matchesDifference * 1 + // 1 point for each match played
        yellowCardsDifference * -1 + // -1 point deduction for each yellow card
        redCardsDifference * -3; // -3 points deduction for each red card

      // Step 5: Update the totalPoints with the latest statistics
      const newTotalPoints =
        parsedGoals * 4 +
        parsedAssists * 3 +
        parsedPoints * 1 +
        parsedMatches * 1 +
        parsedYellowCards * -1 +
        parsedRedCards * -3;

      // Step 6: Update the player with new currentWeekPoints and totalPoints
      await FutsalPlayer.findOneAndUpdate(
        { name, team },
        {
          goals: parsedGoals,
          assist: parsedAssists,
          points: parsedPoints,
          yellowCards: parsedYellowCards,
          redCards: parsedRedCards,
          matches: parsedMatches,
          currentWeekPoints: currentWeekPoints, // Update with calculated points
          totalPoints: newTotalPoints, // Update totalPoints
        },
        { new: true, runValidators: true }
      );

      console.log(
        `Updated points for player ${name} of team ${team}: currentWeekPoints: ${currentWeekPoints}, totalPoints: ${newTotalPoints}`
      );
    });

    // Execute all updates in parallel
    await Promise.all(updatePromises);
    res.status(200).json({ message: "Players' points updated successfully." });
  } catch (err) {
    console.error("Error updating player points:", err.message);
    res
      .status(500)
      .json({ message: "Error updating player points", error: err.message });
  }
};

exports.getInitialFutsalPlayerData = async (req, res) => {
  try {
    const result = await scrapePlayerData();
    if (result && result.length > 0) {
      try {
        const futsalPlayers = await FutsalPlayer.insertMany(result);
        res
          .status(200)
          .json({ message: "Data inserted successfully", data: futsalPlayers });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to insert the data", error: err.message });
      }
    } else {
      res.status(400).json({ message: "Error fetching the data. Try again" });
    }
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve the latest data",
      error: err.message,
    });
  }
};
