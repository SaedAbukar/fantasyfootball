const express = require("express");
const router = express.Router();
const fixtureController = require("../controllers/fixtureControllers");
const authMiddleware = require("../middleware/authMiddleware");

// Protected user routes
router.get("/", authMiddleware, fixtureController.getAllFixtures);
router.get("/:id", authMiddleware, fixtureController.getFixtureById);
router.get("/search/fixture", authMiddleware, fixtureController.findFixtures);

module.exports = router;
