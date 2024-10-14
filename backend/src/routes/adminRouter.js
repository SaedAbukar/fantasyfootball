const express = require("express");
const router = express.Router();
const adminUserController = require("../controllers/adminUserControllers");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Protected admin routes for user management
router.get(
  "/allUsers",
  authMiddleware,
  roleMiddleware("admin"),
  adminUserController.getAllUsers
);
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  adminUserController.getUserById
); // Get a user by ID
router.post(
  "/createUser",
  authMiddleware,
  roleMiddleware("admin"),
  adminUserController.createUser
);
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  adminUserController.updateUser
); // Update user details
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  adminUserController.deleteUser
); // Delete a user
router.post(
  "/:id/team/:playerId",
  authMiddleware,
  roleMiddleware("admin"),
  adminUserController.addToTeam
); // Add player to user's team
router.delete(
  "/:id/team/:playerId",
  authMiddleware,
  roleMiddleware("admin"),
  adminUserController.removeFromTeam
); // Route to remove a player post from user's team
router.get(
  "/:id/team",
  authMiddleware,
  roleMiddleware("admin"),
  adminUserController.getUserWithTeam
); // Fetch all saved players (team) for the authenticated user

module.exports = router;
