const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    team: {
      type: String,
      required: true,
    },
    // position: {
    //   type: String,
    //   enum: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    //   required: true,
    // },
    price: {
      type: Number,
      // required: true,
      min: 0,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    selectedByPercent: {
      type: Number,
      default: 0,
    },
    transfersIn: {
      type: Number,
      default: 0,
    },
    transfersOut: {
      type: Number,
      default: 0,
    },
    matches: {
      type: Number,
      default: 0,
    },
    goals: {
      type: Number,
      default: 0,
    },
    assist: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    cleanSheets: {
      type: Number,
      default: 0,
    },
    yellowCards: {
      type: Number,
      default: 0,
    },
    redCards: {
      type: Number,
      default: 0,
    },
    upcomingFixtures: {
      type: [String], // Array of fixture details, e.g., ['vs Team A', 'vs Team B']
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FutsalPlayer", playerSchema);
