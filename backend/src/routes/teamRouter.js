const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamControllers");
const authMiddleware = require("../middleware/authMiddleware");

// Unprotected routes for all

// Protected team routes
router.get("/", authMiddleware, teamController.getAllTeams);
router.get("/byid", authMiddleware, teamController.getPreviousTeamById); // Fetch selected weeks teams for other players
router.patch("/player", authMiddleware, teamController.addToTeam); // Add player to current team's player
router.delete("/player", authMiddleware, teamController.removeFromTeam); // Remove player from current team's player

module.exports = router;
