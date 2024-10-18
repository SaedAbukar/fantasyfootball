const express = require("express");
const router = express.Router();
const gameWeekController = require("../controllers/gameWeekControllers");

// Unprotected routes for all
router.get("/", gameWeekController.AllGameWeeks);
router.get("/current", gameWeekController.CurrentGameWeek); // Fetch selected weeks gameWeeks for other players

module.exports = router;
