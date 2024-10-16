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
    // Step 1: Scrape the latest player data
    const scrapedData = await mergePlayerData();

    // Step 2: Update each player's currentWeekPoints and totalPoints based on the scraped data
    const updatePromises = scrapedData.map(async (scrapedPlayer) => {
      const {
        name,
        team,
        goals,
        matches,
        minutesPlayed,
        yellowCards,
        redCards,
      } = scrapedPlayer;

      // Ensure all scraped data are parsed as integers
      const parsedGoals = parseInt(goals) || 0;
      const parsedMatches = parseInt(matches) || 0;
      const parsedYellowCards = parseInt(yellowCards) || 0;
      const parsedRedCards = parseInt(redCards) || 0;
      const parsedMinutesPlayed = parseInt(minutesPlayed) || 0;

      // Fetch the existing player data from the database
      const existingPlayer = await FootballPlayer.findOne({ name, team });

      if (!existingPlayer) {
        console.warn(
          `Player with name "${name}" and team "${team}" not found in the database.`
        );
        return; // Skip if the player doesn't exist
      }

      // Step 3: Calculate differences
      const goalsDifference = parsedGoals - existingPlayer.goals;
      const matchesDifference = parsedMatches - existingPlayer.matches;
      const yellowCardsDifference =
        parsedYellowCards - existingPlayer.yellowCards;
      const redCardsDifference = parsedRedCards - existingPlayer.redCards;
      const minutesDifference =
        parsedMinutesPlayed - existingPlayer.minutesPlayed;

      // Step 4: Calculate currentWeekPoints based on the differences
      const currentWeekPoints =
        goalsDifference * 4 + // 4 points per goal
        matchesDifference * 1 + // 1 point for each match played
        Math.floor((minutesDifference / 60) * 3.5) + // 3.5 points for each 60 minutes played
        yellowCardsDifference * -1 + // -1 point deduction for each yellow card
        redCardsDifference * -3; // -3 points deduction for each red card

      // Step 5: Update the totalPoints with the latest statistics
      const newTotalPoints =
        parsedGoals * 4 +
        parsedMatches * 1 +
        Math.floor((parsedMinutesPlayed / 60) * 3.5) +
        parsedYellowCards * -1 +
        parsedRedCards * -3;

      // // Debugging logs
      // console.log(`Updating player: ${name}, Team: ${team}`);
      // console.log(
      //   `Parsed Data: Goals: ${parsedGoals}, Matches: ${parsedMatches}, Yellow Cards: ${parsedYellowCards}, Red Cards: ${parsedRedCards}, Minutes Played: ${parsedMinutesPlayed}`
      // );
      // console.log(
      //   `Differences: Goals: ${goalsDifference}, Matches: ${matchesDifference}, Yellow Cards: ${yellowCardsDifference}, Red Cards: ${redCardsDifference}, Minutes: ${minutesDifference}`
      // );
      // console.log(
      //   `Total Points Calculation: ${existingPlayer.totalPoints} + ${
      //     goalsDifference * 4
      //   } + ${matchesDifference * 1} + ${Math.floor(
      //     (minutesDifference / 60) * 3.5
      //   )} + ${yellowCardsDifference * -1} + ${redCardsDifference * -3}`
      // );
      // console.log("New Total Points:", newTotalPoints);
      // console.log("Current Week Points:", currentWeekPoints);

      // Step 6: Update the player with new currentWeekPoints and totalPoints
      await FootballPlayer.findOneAndUpdate(
        { name, team },
        {
          goals: parsedGoals,
          matches: parsedMatches,
          yellowCards: parsedYellowCards,
          redCards: parsedRedCards,
          minutesPlayed: parsedMinutesPlayed,
          currentWeekPoints: currentWeekPoints, // Update with calculated points
          totalPoints: newTotalPoints, // Update totalPoints
        },
        { new: true, runValidators: true }
      );

      // console.log(
      //   `Updated points for player ${name} of team ${team}: currentWeekPoints: ${currentWeekPoints}, totalPoints: ${newTotalPoints}`
      // );
    });

    // Execute all updates in parallel
    await Promise.all(updatePromises);
    res.status(200).json({
      message: "Players' points updated successfully.",
    });
  } catch (err) {
    console.error("Error updating player points:", err.message);
    res
      .status(500)
      .json({ message: "Error updating player points", error: err.message });
  }
};

exports.getInitialFootballPlayerData = async (req, res) => {
  try {
    const result = await scrapePlayerData(); // Scrape player data
    if (result && result.length > 0) {
      // Check if result is valid and not empty
      try {
        const footballPlayers = await FootballPlayer.insertMany(result); // Insert data into the database
        res.status(200).json({
          message: "Data inserted successfully",
          data: footballPlayers,
        });
      } catch (err) {
        res.status(500).json({
          message: "Failed to insert the data",
          error: err.message,
        });
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
