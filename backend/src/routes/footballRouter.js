// routes/footballPlayerRoutes.js
const express = require("express");
const footballPlayerController = require("../controllers/footballPlayerControllers");

const router = express.Router();

router.get("/", footballPlayerController.getAllFootballPlayers);
router.get("/:id", footballPlayerController.getFootballPlayerById);
router.get("/search/keys", footballPlayerController.findFootballPlayers);
router.patch(
  "/player/updateddata",
  footballPlayerController.getUpdatedFootballPlayerData
);
router.post(
  "/player/initialdata",
  footballPlayerController.getInitialFootballPlayerData
);
router.post("/", footballPlayerController.createFootballPlayer); // Add this line for creating a footballPlayer
router.patch("/:id", footballPlayerController.updateFootballPlayer); // Add this line for updating a footballPlayer
router.delete("/:id", footballPlayerController.deleteFootballPlayer);

module.exports = router;
