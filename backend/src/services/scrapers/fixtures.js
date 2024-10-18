const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Use the stealth plugin
puppeteer.use(StealthPlugin());

const cookieAccepter = async (page) => {
  const cookieButtonSelector =
    "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll";

  // Try to click the cookie consent button
  try {
    // Wait for the cookie consent button to appear
    await page.waitForSelector(cookieButtonSelector, { visible: true });

    // Click the cookie consent button
    await page.click(cookieButtonSelector);
    console.log("Cookie consent accepted.");
  } catch (cookieError) {
    // Log the error if the cookie button is not found or click fails
    console.error("Could not click the cookie consent button:", cookieError);
  }
};

async function scrapeFixturesData(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Replace 'your_url_here' with the actual URL of the page
  await page.goto(url, { waitUntil: "networkidle0" });

  const matches = await page.evaluate(() => {
    const matchElements = document.querySelectorAll(".outerrow.widerow");
    const matchData = [];

    matchElements.forEach((match) => {
      const homeTeam = match
        .querySelector(".team_A .teamname span")
        ?.textContent.trim();
      const awayTeam = match
        .querySelector(".team_B .teamname span")
        ?.textContent.trim();
      const gameDate = match
        .querySelector(".match_status span")
        ?.textContent.trim(); // e.g., 'pe 15.11.'
      const kickoffTime = match
        .querySelector(".result .match_time")
        ?.textContent.trim(); // e.g., '17:45'

      // Format date into JavaScript Date object
      if (gameDate && kickoffTime) {
        // Remove leading letters and trim the string to extract date
        const cleanedDate = gameDate.replace(/[^0-9.]/g, "").trim(); // e.g., '15.11.'
        const [day, month] = cleanedDate.split(".").map((part) => part.trim());

        // Determine the year based on the month
        const year =
          parseInt(month) >= 9 && parseInt(month) <= 12 ? 2024 : 2025;

        const [hours, minutes] = kickoffTime
          .split(":")
          .map((part) => part.trim());

        const second = 0;

        // Construct a formatted date string
        const formattedDateString = `${year}-${month}-${day}T${hours}:${minutes}:${second}${second}`;

        matchData.push({
          homeTeam,
          awayTeam,
          date: formattedDateString,
        });
      }
    });

    return matchData;
  });

  console.log("Match Data:", matches);

  await browser.close();
}

async function scrapeFixtures(url) {
  const browser = await puppeteer.launch({ headless: false }); // Set to false for debugging
  const page = await browser.newPage();
  await page.goto(url);

  let fixtures = [];
  let previousHeight = 0;

  while (true) {
    // Scrape the fixtures that are currently visible
    const newFixtures = await page.evaluate(() => {
      let fixtureRows = Array.from(
        document.querySelectorAll(".matchlist .outerrow")
      );
      return fixtureRows.map((row) => {
        const homeTeam =
          row.querySelector(".team_A .teamname")?.textContent.trim() || "";
        const awayTeam =
          row.querySelector(".team_B .teamname")?.textContent.trim() || "";
        const gameDate =
          row.querySelector(".match_status span")?.textContent.trim() || "";
        const kickoffTime =
          row.querySelector(".match_time")?.textContent.trim() || "";

        // Format date into JavaScript Date object
        if (gameDate && kickoffTime) {
          // Remove leading letters and trim the string to extract date (e.g., '15.11.')
          const cleanedDate = gameDate.replace(/[^0-9.]/g, "").trim();
          let [day, month] = cleanedDate.split(".").map((part) => part.trim());

          // Ensure day and month have two digits
          day = day.padStart(2, "0"); // Adds a leading zero if necessary
          month = month.padStart(2, "0"); // Adds a leading zero if necessary

          // Determine the year based on the month
          const year =
            parseInt(month) >= 9 && parseInt(month) <= 12 ? 2024 : 2025;

          // Split the kickoff time into hours and minutes
          const [hours, minutes] = kickoffTime
            .split(":")
            .map((part) => part.trim());
          const seconds = "00"; // Set seconds to 00

          // Construct the formatted date string in yyyy-mm-ddThh:mm:ss format
          const formattedDateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

          return {
            homeTeam,
            awayTeam,
            date: formattedDateString, // Format as yyyy-mm-ddThh:mm:ss
          };
        }
      });
      // .filter((fixture) => fixture !== null); // Filter out any null fixtures
    });

    // Merge new fixtures into the main fixtures list
    fixtures = [...fixtures, ...newFixtures];

    // Scroll to the bottom of the page to load more fixtures
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

    // Wait for new content to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if more content is loading by checking page height
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) break; // Break if no more content is loading
    previousHeight = newHeight;
  }

  await browser.close();

  // Return the fixtures array
  console.log(fixtures);
  return fixtures;
}

const url =
  "https://tulospalvelu.palloliitto.fi/category/FM3!etefs2425/fixture";
// scrapeFixturesData(url);
// scrapeFixtures(url);

(async () => {
  try {
    const fixtures = await scrapeFixtures(url);
    // Output the fixtures directly
    console.log(fixtures);
  } catch (error) {
    console.error("Error scraping fixtures:", error);
  }
})();

module.exports = { scrapeFixtures, url };
