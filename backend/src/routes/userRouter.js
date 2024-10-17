const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers");
const authMiddleware = require("../middleware/authMiddleware");

// Unprotected Register and Login routes for all
router.post("/register", userController.registerUser); // Registers new user
router.post("/login", userController.loginUser); // Login user
router.get("/allusers", userController.getAllUsers); // Get current user's profile (no :id needed)

// Protected user routes
router.get("/search", authMiddleware, userController.findUsers);
router.get("/profile", authMiddleware, userController.getUserById); // Get current user's profile (no :id needed)
router.patch("/profile", authMiddleware, userController.updateUser); // Update current user's profile (no :id needed)
router.delete("/profile", authMiddleware, userController.deleteUser); // Delete current user's account (no :id needed)

router.patch("/player", authMiddleware, userController.addToTeam); // Add player to current user's player
router.delete("/player", authMiddleware, userController.removeFromTeam); // Remove player from current user's player

// Fetch all saved players (player) for the authenticated user
router.get("/player/myteam", authMiddleware, userController.getUserWithTeam);
router.get("/player/teams", authMiddleware, userController.getPreviousTeam);

module.exports = router;
