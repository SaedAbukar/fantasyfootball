// routes/futsalPlayerRoutes.js
const express = require("express");
const futsalPlayerController = require("../controllers/futsalPlayerControllers");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const router = express.Router();

router.get("/", authMiddleware, futsalPlayerController.getAllFutsalPlayers); // Get all futsalPlayers
router.get("/:id", authMiddleware, futsalPlayerController.getFutsalPlayerById); // Get futsalPlayers by id
router.get(
  "/search/keys",
  authMiddleware,
  futsalPlayerController.findFutsalPlayers
); // Get futsalPlayers by query
router.patch(
  "/player/updateddata",
  authMiddleware,
  roleMiddleware("admin"),
  futsalPlayerController.getUpdatedFutsalPlayerData
); // Updating futsalPlayers stats and points
router.post(
  "/player/initialdata",
  authMiddleware,
  roleMiddleware("admin"),
  futsalPlayerController.getInitialFutsalPlayerData
); // Creating futsalPlayers stats and points
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  futsalPlayerController.createFutsalPlayer
); // Creating a futsalPlayer
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  futsalPlayerController.updateFutsalPlayer
); // Updating a futsalPlayer
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  futsalPlayerController.deleteFutsalPlayer
); // Deleting a futsalPlayer

module.exports = router;
