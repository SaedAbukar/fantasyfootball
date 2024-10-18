const Fixture = require("../../models/Fixture"); // Adjust the path as necessary
const GameWeek = require("../../models/GameWeek"); // Assuming you have a GameWeek model
const connectDB = require("../../config/db");
const { scrapeFixtures, url } = require("../scrapers/fixtures");

async function seedFixtures() {
  await connectDB(); // Ensure the database connection is established

  try {
    const fixtures = await scrapeFixtures(url); // Move this inside the function

    for (const fx of fixtures) {
      const existingFixture = await Fixture.findOne({
        home: fx.home,
        away: fx.away,
        date: fx.date,
      });

      if (!existingFixture) {
        await Fixture.create(fx); // Adjust this to create a Fixture instead of GameWeek
      }
    }

    console.log("Fixtures seeded");
  } catch (error) {
    console.error("Error seeding Fixtures:", error);
  }
}

// Call the function to seed fixtures
seedFixtures();
