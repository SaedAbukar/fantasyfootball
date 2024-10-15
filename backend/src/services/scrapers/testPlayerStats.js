const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Use the stealth plugin
puppeteer.use(StealthPlugin());

const cookieAccepter = async (page) => {
  const cookieButtonSelector =
    "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll";

  try {
    await page.waitForSelector(cookieButtonSelector, {
      visible: true,
      timeout: 10000, // Increased timeout for robustness
    });
    await page.click(cookieButtonSelector);
    console.log("Cookie consent accepted.");
  } catch (cookieError) {
    console.error("Could not click the cookie consent button:", cookieError);
  }
};

async function scrapeData(page, url, scrapeFunction) {
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await cookieAccepter(page);
    return await scrapeFunction(page);
  } catch (error) {
    console.error(`Error navigating or scraping ${url}:`, error);
  }
}

async function scrapeGoalsData(page) {
  return await page.evaluate(() => {
    const rows = document.querySelectorAll("tbody tr");
    const data = [];
    rows.forEach((row) => {
      const columns = row.querySelectorAll("td");
      if (columns.length < 5) return;

      const name = columns[0].innerText.trim();
      const team = columns[1].innerText.trim();
      const matches = columns[2].innerText.trim();
      const goals = columns[3].innerText.trim();
      const minutesPlayed = columns[4].innerText.trim();

      data.push({ name, team, matches, goals, minutesPlayed });
    });
    return data;
  });
}

async function scrapeCardsData(page) {
  return await page.evaluate(() => {
    const rows = document.querySelectorAll("tbody tr");
    const data = [];
    rows.forEach((row) => {
      const columns = row.querySelectorAll("td");
      if (columns.length < 4) return;

      const name = columns[0].innerText.trim();
      const team = columns[1].innerText.trim();
      const yellowCards = columns[2].innerText.trim();
      const redCards = columns[3].innerText.trim();

      data.push({ name, team, yellowCards, redCards });
    });
    return data;
  });
}

async function mergePlayerData() {
  const goalsURL =
    "https://tulospalvelu.palloliitto.fi/category/M3!etejp24/statistics/points";
  const cardsURL =
    "https://tulospalvelu.palloliitto.fi/category/M3!etejp24/statistics/cards/playercards";

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Scraping both data sets
  const goalsStats = await scrapeData(page, goalsURL, scrapeGoalsData);
  const cardsStats = await scrapeData(page, cardsURL, scrapeCardsData);

  const cardsMap = new Map(cardsStats.map((player) => [player.name, player]));

  const players = goalsStats.map((player1) => {
    const player2 = cardsMap.get(player1.name);
    return player2 ? { ...player1, ...player2 } : player1;
  });

  console.log("Players", players);
  await browser.close();
}

// Run the merge function
mergePlayerData();
