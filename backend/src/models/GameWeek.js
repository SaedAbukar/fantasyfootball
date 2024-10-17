const mongoose = require("mongoose");

const gameWeekSchema = new mongoose.Schema({
  gameWeekId: { type: Number, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  //   fixtures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Fixture" }],
});

module.exports = mongoose.model("GameWeek", gameWeekSchema);
