// controllers/footballPlayerController.js
const FootballPlayer = require("../models/FootballPlayer");
const {
  mergePlayerData,
  scrapePlayerData,
} = require("../services/scrapers/footballPlayerStats");
const mongoose = require("mongoose");

// Get all footballPlayers with optional search and pagination
exports.getAllFootballPlayers = async (req, res) => {
  try {
    const { page = 1, limit = 10, name } = req.query; // Use default page 1 and limit 10 if not provided
    const skip = (page - 1) * limit; // Calculate how many footballPlayers to skip

    // Build the filter object for MongoDB query
    const filter = {};

    console.log(filter);

    // Execute the query with filtering, pagination, and limit
    const footballPlayers = await FootballPlayer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalFootballPlayers = await FootballPlayer.countDocuments(filter); // Get total number of footballPlayers that match the filter

    // Return the footballPlayers along with pagination info
    res.status(200).json({
      footballPlayers,
      totalFootballPlayers, // Send the total number of footballPlayers for frontend to calculate total pages
      totalPages: Math.ceil(totalFootballPlayers / limit), // Calculate total pages
      currentPage: parseInt(page), // Send current page info
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single footballPlayer by ID
exports.getFootballPlayerById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid footballPlayer ID" });
  }

  try {
    const footballPlayer = await FootballPlayer.findById(id);
    if (footballPlayer) {
      res.status(200).json(footballPlayer);
    } else {
      res.status(404).json({ message: "FootballPlayer not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Find footballPlayers by query
exports.findFootballPlayers = async (req, res) => {
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
      query.price = { $lt: parseFloat(price) }; // Filter footballPlayers with price less than the specified price
    }

    const footballPlayers = await FootballPlayer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FootballPlayer.countDocuments(query); // Count based on search query

    if (footballPlayers.length === 0) {
      return res
        .status(404)
        .json({ message: "No footballPlayers found matching the criteria" });
    }

    res.status(200).json({
      footballPlayers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching footballPlayers:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create a new footballPlayer
exports.createFootballPlayer = async (req, res) => {
  const newFootballPlayer = new FootballPlayer(req.body);

  try {
    const savedFootballPlayer = await newFootballPlayer.save();
    res.status(201).json(savedFootballPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update footballPlayer data by ID
exports.updateFootballPlayer = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid footballPlayer ID" });
  }

  try {
    const updatedFootballPlayer = await FootballPlayer.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true, // Enforce schema validation on update
      }
    );

    if (!updatedFootballPlayer) {
      return res.status(404).json({ message: "FootballPlayer not found" });
    }

    res.status(200).json(updatedFootballPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a footballPlayer by ID
exports.deleteFootballPlayer = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid footballPlayer ID" });
  }

  try {
    const footballPlayerDeleted = await FootballPlayer.findOneAndDelete({
      _id: id,
    });
    if (footballPlayerDeleted) {
      res.status(204).json({ message: "FootballPlayer deleted successfully" });
    } else {
      res.status(404).json({ message: "FootballPlayer not found" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete footballPlayer", error: err.message });
  }
};

exports.getUpdatedFootballPlayerData = async (req, res) => {
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
exports.getInitialFootballPlayerData = async (req, res) => {
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
