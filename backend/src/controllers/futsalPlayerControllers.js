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
    const result = await mergePlayerData();
    // console.log("result: ", result);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(200).json({ message: "Error fetching the data. Try again" });
    }
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve the latest data",
      err: err.message,
    });
  }
};
exports.getInitialFutsalPlayerData = async (req, res) => {
  try {
    const result = await scrapePlayerData();
    // console.log("result: ", result);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(200).json({ message: "Error fetching the data. Try again" });
    }
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve the latest data",
      err: err.message,
    });
  }
};
