const mongoose = require("mongoose");

const fixtureSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  date: { type: Date, required: true },
  result: { type: String, default: "-" },
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
});

module.exports = mongoose.model("Fixture", fixtureSchema);
