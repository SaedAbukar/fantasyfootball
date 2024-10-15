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

async function scrapeGoalsData(url) {
  let browser;
  try {
    // Launch the browser
    browser = await puppeteer.launch({ headless: false }); // Set to true for production
    const page = await browser.newPage();

    // Navigate to the target URL
    await page.goto(url, { waitUntil: "networkidle2" });

    // Accept cookie consent
    await cookieAccepter(page);

    // Scrape the data from the table
    const scrapedData = await page.evaluate(() => {
      const rows = document.querySelectorAll("tbody tr");
      const data = [];

      // Loop through each row and extract the columns' data
      rows.forEach((row) => {
        const columns = row.querySelectorAll("td");
        if (columns.length < 5) return; // Ensure there are enough columns

        const name = columns[0].innerText.trim();
        const team = columns[1].innerText.trim();
        const matches = columns[2].innerText.trim();
        const goals = columns[3].innerText.trim();
        const minutesPlayed = columns[4].innerText.trim();

        // Push the extracted data to the data array
        data.push({
          name,
          team,
          matches,
          goals,
          minutesPlayed,
        });
      });

      return data;
    });

    return scrapedData;
  } catch (error) {
    console.error("Error scraping goals data:", error);
  } finally {
    // Close the browser if it was launched
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeCardsData(url) {
  let browser;
  try {
    // Launch the browser
    browser = await puppeteer.launch({ headless: false }); // Set to true for production
    const page = await browser.newPage();

    // Navigate to the target URL
    await page.goto(url, { waitUntil: "networkidle2" });

    // Accept cookie consent
    await cookieAccepter(page);

    // Scrape the data from the table
    const scrapedData = await page.evaluate(() => {
      const rows = document.querySelectorAll("tbody tr");
      const data = [];

      // Loop through each row and extract the columns' data
      rows.forEach((row) => {
        const columns = row.querySelectorAll("td");
        if (columns.length < 4) return; // Ensure there are enough columns

        const name = columns[0].innerText.trim();
        const team = columns[1].innerText.trim();
        const yellowCards = columns[2].innerText.trim();
        const redCards = columns[3].innerText.trim();

        // Push the extracted data to the data array
        data.push({
          name,
          team,
          yellowCards,
          redCards,
        });
      });
      return data;
    });

    // console.log("Cards Data:", scrapedData);
    return scrapedData;
  } catch (error) {
    console.error("Error scraping cards data:", error);
  } finally {
    // Close the browser if it was launched
    if (browser) {
      await browser.close();
    }
  }
}

async function mergePlayerData() {
  const goalsURL =
    "https://tulospalvelu.palloliitto.fi/category/M3!etejp24/statistics/points";
  const cardsURL =
    "https://tulospalvelu.palloliitto.fi/category/M3!etejp24/statistics/cards/playercards";

  // Await the results of both scraping functions
  const goalsStats = await scrapeGoalsData(goalsURL);
  const cardsStats = await scrapeCardsData(cardsURL);

  // Create a map from cardsStats for quick lookup
  const cardsMap = new Map();
  for (const player of cardsStats) {
    cardsMap.set(player.name, player);
  }

  // Merge the data using map()
  const players = goalsStats.map((player1) => {
    const player2 = cardsMap.get(player1.name);
    if (player2) {
      return {
        ...player1,
        yellowCards: player2.yellowCards,
        redCards: player2.redCards,
      };
    }
    return player1; // If no match is found, return the original player1
  });

  // // Log the merged data
  // console.log(players);
  return players;
}

// // Run the merge function
// mergePlayerData();

module.exports = mergePlayerData;
