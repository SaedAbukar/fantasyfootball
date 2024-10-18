const Fixture = require("../models/Fixture");
const mongoose = require("mongoose");

// GET all fixtures
exports.getAllFixtures = async (req, res) => {
  try {
    const fixtures = await Fixture.find({});
    res.status(200).json(fixtures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET/ fixtures by query
exports.findFixtures = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }

  const { team } = req.query;

  const query = {
    $or: [
      { homeTeam: { $regex: new RegExp(team, "i") } }, // Match home team
      { awayTeam: { $regex: new RegExp(team, "i") } }, // Match away team
    ],
  };

  try {
    const fixtures = await Fixture.find(query);
    res.status(200).json({
      message: `Found ${fixtures.length} fixture(s)`,
      fixtures,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET/ fixtures by id
exports.getFixtureById = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Invalid user or user not authenticated" });
  }
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const fixture = await Fixture.findById(id);

    if (!fixture) {
      return res.status(404).json({ message: "Fixture not found" });
    }

    res.status(200).json({ fixture });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to retrieve fixture", error: err.message });
  }
};
