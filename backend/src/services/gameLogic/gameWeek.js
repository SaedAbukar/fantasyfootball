const GameWeek = require("../../models/GameWeek"); // Adjust the path as necessary
const connectDB = require("../../config/db");

const gameWeekDates = [
  {
    gameWeekId: 1,
    startDate: "2024-10-17T00:00:00",
    endDate: "2024-10-26T10:00:00",
  },
  {
    gameWeekId: 2,
    startDate: "2024-10-28T00:00:00",
    endDate: "2024-11-01T10:00:00",
  },
  {
    gameWeekId: 3,
    startDate: "2024-11-04T00:00:00",
    endDate: "2024-11-09T10:00:00",
  },
  {
    gameWeekId: 4,
    startDate: "2024-11-11T00:00:00",
    endDate: "2024-11-15T10:00:00",
  },
  {
    gameWeekId: 5,
    startDate: "2024-11-18T00:00:00",
    endDate: "2024-11-23T10:00:00",
  },
  {
    gameWeekId: 6,
    startDate: "2024-11-25T00:00:00",
    endDate: "2024-11-30T10:00:00",
  },
  {
    gameWeekId: 7,
    startDate: "2024-12-01T00:00:00",
    endDate: "2024-12-07T10:00:00",
  },
  {
    gameWeekId: 8,
    startDate: "2024-12-09T00:00:00",
    endDate: "2024-12-13T10:00:00",
  },
  {
    gameWeekId: 9,
    startDate: "2024-12-16T00:00:00",
    endDate: "2025-01-05T10:00:00",
  },
  {
    gameWeekId: 10,
    startDate: "2025-01-13T00:00:00",
    endDate: "2025-01-17T10:00:00",
  },
  {
    gameWeekId: 11,
    startDate: "2025-01-20T00:00:00",
    endDate: "2025-01-25T10:00:00",
  },
  {
    gameWeekId: 12,
    startDate: "2025-02-03T00:00:00",
    endDate: "2025-02-08T10:00:00",
  },
  {
    gameWeekId: 13,
    startDate: "2025-02-10T00:00:00",
    endDate: "2025-02-23T10:00:00",
  },
  {
    gameWeekId: 14,
    startDate: "2025-02-24T00:00:00",
    endDate: "2025-02-28T10:00:00",
  },
  {
    gameWeekId: 15,
    startDate: "2025-03-10T00:00:00",
    endDate: "2025-03-14T10:00:00",
  },
];

// Function to seed game weeks in the database
async function seedGameWeeks() {
  try {
    for (const gw of gameWeekDates) {
      const existingGameWeek = await GameWeek.findOne({
        gameWeekId: gw.gameWeekId,
      });
      if (!existingGameWeek) {
        await GameWeek.create(gw);
      }
    }
    console.log("Gameweeks seeded");
  } catch (error) {
    console.error("Error seeding game weeks:", error);
  }
}

// Middleware to update Gameweek status based on the current date
async function updateGameWeekStatus() {
  try {
    const currentDate = new Date();

    // Set all game weeks to inactive
    await GameWeek.updateMany({}, { $set: { isActive: false } });

    // Find and activate the current game week
    const activeGameWeek = await GameWeek.findOneAndUpdate(
      { startDate: { $lte: currentDate }, endDate: { $gte: currentDate } },
      { $set: { isActive: true } },
      { new: true }
    );

    if (activeGameWeek) {
      console.log(`Gameweek ${activeGameWeek.gameWeekId} is now active`);
    } else {
      console.log("No active game week found");
    }
  } catch (error) {
    console.error("Error updating game week status:", error);
  }
}

// Function to get the All game weeks
async function getAllGameWeeks() {
  // Fetch all game weeks from the database
  const allGameWeek = await GameWeek.find({});

  return allGameWeek; // This will return All game weeks
}

// Function to get the current active game week
async function getCurrentGameWeek() {
  const currentDate = new Date();

  // Fetch the active game week from the database
  const activeGameWeek = await GameWeek.findOne({
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
  });

  return activeGameWeek; // This will return the current active game week, or null if none found
}

// connectDB(); // connect to db before running the functions below
// seedGameWeeks(); // remember to run this after fixture data has been scraped and saved
// updateGameWeekStatus(); // run this function after every gameweek

module.exports = { getAllGameWeeks, getCurrentGameWeek };
