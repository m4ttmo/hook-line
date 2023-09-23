const axios = require("axios");
const cheerio = require("cheerio");

// Function to fetch weekend box office data
async function fetchWeekendBoxOfficeData() {
  try {
    // Define the URL of the website you want to scrape
    const url = "https://www.boxofficemojo.com/weekend/chart/";

    // Make an HTTP GET request to the URL
    const response = await axios.get(url);

    // Load the HTML content of the page into Cheerio
    const $ = cheerio.load(response.data);

    // Extract the data you need using Cheerio selectors
    const weekendBoxOfficeData = [];
    $("table.mojo-body-table tr").each((index, element) => {
      const rank = $(element).find("td:nth-child(1)").text().trim();
      const movie = $(element).find("td:nth-child(2)").text().trim();
      const weekendGross = $(element).find("td:nth-child(3)").text().trim();
      const totalGross = $(element).find("td:nth-child(9)").text().trim();

      weekendBoxOfficeData.push({
        rank,
        movie,
        weekendGross,
        totalGross,
      });
    });

    // Log or process the extracted data as needed
    console.log(weekendBoxOfficeData);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Call the function to fetch weekend box office data
fetchWeekendBoxOfficeData();
