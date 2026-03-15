import fs from "fs";
import fetch from "node-fetch";
import csv from "csv-parser";

const AIRPORTS_URL = "https://ourairports.com/data/airports.csv";
const COUNTRIES_URL = "https://ourairports.com/data/countries.csv";

async function generate() {
  // Load country names
  const countriesRes = await fetch(COUNTRIES_URL);
  const countries = {};
  await new Promise((resolve) => {
    countriesRes.body
      .pipe(csv())
      .on("data", (row) => {
        if (row.code && row.name) countries[row.code] = row.name;
      })
      .on("end", resolve);
  });

  // Load airports
  const airportsRes = await fetch(AIRPORTS_URL);
  const airports = [];
  await new Promise((resolve) => {
    airportsRes.body
      .pipe(csv())
      .on("data", (row) => {
        if (
          row.iata_code &&
          row.iata_code.length === 3 &&
          row.type !== "closed" &&
          (row.type === "large_airport" || row.type === "medium_airport")
        ) {
          airports.push({
            code: row.iata_code,
            name: row.name.replace(/\s*(International|Airport|Regional)\s*/gi, " ").trim(),
            city: row.municipality || "",
            country: countries[row.iso_country] || row.iso_country,
          });
        }
      })
      .on("end", resolve);
  });

  // Sort by country then city
  airports.sort((a, b) => a.country.localeCompare(b.country) || a.city.localeCompare(b.city));

  const output = `export const WORLD_AIRPORTS = ${JSON.stringify(airports, null, 2)};\n`;
  fs.writeFileSync("src/data/worldAirports.js", output);
  console.log(`Generated ${airports.length} airports`);
}

generate();
