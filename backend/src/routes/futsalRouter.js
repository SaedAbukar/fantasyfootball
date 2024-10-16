// routes/futsalPlayerRoutes.js
const express = require("express");
const futsalPlayerController = require("../controllers/futsalPlayerControllers");

const router = express.Router();

router.get("/", futsalPlayerController.getAllFutsalPlayers);
router.get("/:id", futsalPlayerController.getFutsalPlayerById);
router.get("/search/keys", futsalPlayerController.findFutsalPlayers);
router.post(
  "/player/updateddata",
  futsalPlayerController.getUpdatedFutsalPlayerData
);
router.post(
  "/player/initialdata",
  futsalPlayerController.getInitialFutsalPlayerData
);
router.post("/", futsalPlayerController.createFutsalPlayer); // Add this line for creating a futsalPlayer
router.patch("/:id", futsalPlayerController.updateFutsalPlayer); // Add this line for updating a futsalPlayer
router.delete("/:id", futsalPlayerController.deleteFutsalPlayer);

module.exports = router;
