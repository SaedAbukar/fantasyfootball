const {
  getAllGameWeeks,
  getCurrentGameWeek,
} = require("../services/gameLogic/gameWeek");

// GET/ all game weeks
exports.AllGameWeeks = async (req, res) => {
  try {
    const allGameWeeks = await getAllGameWeeks();
    res.json(allGameWeeks);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch all game weeks", error: err.message });
  }
};

// GET /current game week
exports.CurrentGameWeek = async (req, res) => {
  try {
    const currentGameWeek = await getCurrentGameWeek();
    res.status(200).json(currentGameWeek);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch the current game week",
      error: err.message,
    });
  }
};
