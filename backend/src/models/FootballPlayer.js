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
      default:
        (Math.floor(Math.random() * 4) + 6) * 1000000 +
        Math.floor(Math.random() * 2) * 500000,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    currenWeekPoints: {
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
    minutesPlayed: {
      type: Number,
      default: 0,
    },
    goals: {
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

module.exports = mongoose.model("FootballPlayer", playerSchema);
