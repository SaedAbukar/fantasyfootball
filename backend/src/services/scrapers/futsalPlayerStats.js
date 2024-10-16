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

async function scrapeTeamUrls(url) {
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

        // Ensure the columns exist before accessing them
        if (columns.length >= 3) {
          const name = columns[2]?.querySelector("a")?.innerText.trim();
          const link = columns[2]?.querySelector("a")?.getAttribute("href"); // Player name from the anchor tag
          let finalLink = null; // Initialize finalLink to handle the case where the link might not exist

          if (link) {
            // Check if the link is not null or undefined
            const updatedLink = `https://tulospalvelu.palloliitto.fi${link}`;
            finalLink = updatedLink.replace("/info", "/players");
          } else {
            console.warn("No link found in the specified column.");
          }
          // Push the extracted data to the data array
          data.push({
            name,
            link: finalLink,
          });
        } else {
          console.warn("Row does not have enough columns:", row.innerHTML);
        }
      });
      console.log("data", data);
      return data;
    });

    console.log(scrapedData);
    return scrapedData;
  } catch (error) {
    console.error("Error scraping initial data:", error);
  } finally {
    // Close the browser if it was launched
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeInitialData(url) {
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

        // Ensure the columns exist before accessing them
        if (columns.length >= 8) {
          const number = columns[0]?.innerText.trim() || ""; // Player number
          const name = columns[1]?.querySelector("a")?.innerText.trim() || ""; // Player name from the anchor tag
          const matches = columns[2]?.innerText.trim() || ""; // Matches
          const goals = columns[3]?.innerText.trim() || ""; // Goals
          const assists = columns[4]?.innerText.trim() || ""; // Assists
          const points = columns[5]?.innerText.trim() || ""; // Points
          const yellowCards = columns[6]?.innerText.trim() || ""; // Yellow cards
          const redCards = columns[7]?.innerText.trim() || ""; // Red cards

          // Push the extracted data to the data array
          data.push({
            number,
            name,
            matches,
            goals,
            assists,
            points,
            yellowCards,
            redCards,
          });
        } else {
          console.warn("Row does not have enough columns:", row.innerHTML);
        }
      });

      return data;
    });

    console.log(scrapedData);
    return scrapedData;
  } catch (error) {
    console.error("Error scraping initial data:", error);
  } finally {
    // Close the browser if it was launched
    if (browser) {
      await browser.close();
    }
  }
}

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

    await page.waitForSelector("tbody tr", { visible: true });

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
        const points = columns[4].innerText.trim();

        // Push the extracted data to the data array
        data.push({
          name,
          team,
          matches,
          goals,
          points,
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

    await page.waitForSelector("tbody tr", { visible: true });

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
    "https://tulospalvelu.palloliitto.fi/category/FM3!etefs2425/statistics/points";
  const cardsURL =
    "https://tulospalvelu.palloliitto.fi/category/FM3!etefs2425/statistics/cards/playercards";

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
  console.log(players);
  return players;
}

async function scrapePlayerData() {
  const url =
    "https://tulospalvelu.palloliitto.fi/category/FM3!etefs2425/tables";
  const maxConcurrency = 5; // Maximum number of concurrent browser instances

  const createRandomPrice = () => {
    return (
      (Math.floor(Math.random() * 4) + 6) * 1000000 +
      Math.floor(Math.random() * 2) * 500000
    );
  };

  try {
    const links = await scrapeTeamUrls(url);
    if (links) {
      const linkChunks = []; // Array to hold chunks of links

      // Split links into chunks of size maxConcurrency
      for (let i = 0; i < links.length; i += maxConcurrency) {
        linkChunks.push(links.slice(i, i + maxConcurrency));
      }

      const allPlayers = []; // Array to accumulate all player data

      for (const chunk of linkChunks) {
        // Process each chunk in parallel
        const chunkResults = await Promise.all(
          chunk.map(async (link) => {
            // Make sure link.link is defined and not empty
            if (link.link) {
              console.log("Scraping link:", link.link);
              const data = await scrapeInitialData(link.link); // Call the correct function
              if (data) {
                // Map the player data and add the team name
                const players = data.map((player) => ({
                  ...player,
                  team: link.name,
                  price: createRandomPrice(),
                }));
                return players;
              }
            } else {
              console.warn("Link is not defined for:", link);
            }
            return []; // Return an empty array if no data is found
          })
        );

        // Flatten the results from the current chunk and add to allPlayers
        allPlayers.push(...chunkResults.flat());
      }

      return allPlayers; // Return the accumulated player data
    }
  } catch (error) {
    console.log(error);
    return []; // Return an empty array in case of an error
  }
}

// Run the merge function
// mergePlayerData();

// scrapeTeamUrls(
//   "https://tulospalvelu.palloliitto.fi/category/FM3!etefs2425/statistics/points"
// );
// scrapeInitialData("https://tulospalvelu.palloliitto.fi/category/FM3!etefs2425/statistics/cards/playercards");

// Run the scrapePlayerData function
// scrapePlayerData();

module.exports = { mergePlayerData, scrapePlayerData };
