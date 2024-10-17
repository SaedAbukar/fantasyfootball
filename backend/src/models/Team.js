const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming a User schema exists for the user who owns the team
    required: true,
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FutsalPlayer", // Reference to the FutsalPlayer model
    },
  ],
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FutsalPlayer", // Reference to the FutsalPlayer model who is the captain
  },
  viceCaptain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FutsalPlayer", // Reference to the FutsalPlayer model who is the vice-captain
  },
  gameWeek: {
    type: Number,
    required: true, // The game week for which this team configuration applies
  },
  points: {
    type: Number,
    default: 0,
  },
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
