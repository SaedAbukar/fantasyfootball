// routes/playerRoutes.js
const express = require("express");
const playerController = require("../controllers/playerControllers");

const router = express.Router();

router.get("/", playerController.getAllPlayers);
router.get("/:id", playerController.getPlayerById);
router.get("/search/keys", playerController.findPlayers);
router.post("/player/updateddata", playerController.getUpdatedPlayerData);
router.post("/player/upinitialdata", playerController.getInitialPlayerData);
router.post("/", playerController.createPlayer); // Add this line for creating a player
router.patch("/:id", playerController.updatePlayer); // Add this line for updating a player
router.delete("/:id", playerController.deletePlayer);

module.exports = router;
