const { log } = require('console');
const fs = require('fs');

/**
 * Requirements:
 * - Read and parse a JSON file containing weekly meal data.
 * - Select the day's meal based on the current date.
 * - After 12pm on Monday–Thursday, show the next day's meal.
 * - After 12pm on Friday, and all day Saturday and Sunday, show Monday's meal for the next week (if available).
 * - Update merge variables for a terminal plugin with the selected meal data.
 * - Handle errors gracefully and log messages with timestamps.
 */

logInfo("Starting meal selection process...");

// Check required environment variables are set
const requiredEnvVars = [
  'TRMNL_PLUGIN_UUID',
  'PLUGIN_TITLE',
  'INVOKER'
];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    logError(`Environment variable ${envVar} is not set`);
    process.exit(1);
  }
});

// Read menu data
let data;
try {
  data = JSON.parse(fs.readFileSync('./data/menu.json', 'utf8'));
} catch (err) {
  logError(`Failed to read or parse menu.json: ${err.message}`);
  process.exit(1);
}

if (!data || !data.weeks || !Array.isArray(data.weeks) || data.weeks.length === 0) {
  logError("No menu data found, or menu data file uses wrong format");
  process.exit(1);
}

const now = new Date();
let targetDate = new Date(now);

// If after 12pm on Friday or any time on Saturday/Sunday, show next Monday's meal
const todayDay = now.getDay();
if (
  (todayDay === 5 && now.getHours() >= 12) || // Friday after 12pm
  todayDay === 6 || // Saturday
  todayDay === 0    // Sunday
) {
    // Advance to next Monday
    const daysToMonday = (8 - todayDay) % 7;
    targetDate.setDate(targetDate.getDate() + daysToMonday);
} else if (now.getHours() >= 12) {
    // On other weekdays after 12pm, show tomorrow's meal
    targetDate.setDate(targetDate.getDate() + 1);
}

// Format date string
const pad = (n) => n.toString().padStart(2, "0");
const targetDateStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;

// Weekday index for menu lookup (0 = Monday, 4 = Friday)
const weekday = (targetDate.getDay() + 6) % 7;

// Find the matching menu week
const matchedWeek = data.weeks.find((week) => {
  return week.datesCommencing.some((dateStr) => {
    const weekDate = new Date(dateStr);
    const diff = targetDate - weekDate;
    return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
  });
});

if (!matchedWeek) {
  updateMergeVariables({ error: "No menu found for this week." });
  process.exit(0);
} else {
  logInfo(`Matched week "${matchedWeek.title}"`, targetDate);
}

const dayInfo = matchedWeek.days[weekday.toString()];
if (!dayInfo) {
  updateMergeVariables({ error: "No meal info for this day." });
  process.exit(0);
} else {
  logInfo(`Matched day "${weekday.toString()}"`);
}

const sides = dayInfo.sides;
const dessert = dayInfo.dessert;

const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][targetDate.getDay()];
const weekNumber = matchedWeek.id.toString();

const requestBody = {
  options: dayInfo.options,
  sides,
  dessert,
  weekTitle: matchedWeek.title,
  weekDay,
  subtitle: `Week ${weekNumber}, ${weekDay}`,
  error: ""
};

updateMergeVariables(requestBody);

logInfo('merge variables updated for', targetDate);

function updateMergeVariables(mergeVariables) {
  const pluginUUID = process.env.TRMNL_PLUGIN_UUID;
  const title = process.env.PLUGIN_TITLE;
  const subtitle = process.env.PLUGIN_SUBTITLE || mergeVariables.subtitle || '';
  const url = `https://usetrmnl.com/api/custom_plugins/${pluginUUID}`;
  const updated = new Date().toISOString();
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      merge_variables: { ...mergeVariables, title, subtitle, updated }
    })
  };

  fetch(url, options)
    .then(response => {
      if (!response.ok) {
        logError("Failed to update merge variables:", response.statusText);
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      logError("Error updating merge variables:", error);
      process.exit(1);
    });
}

function logError(message, ...args) {
  console.error(formatLogMessage(message), ...args);
}

function logInfo(message, ...args) {
  console.log(formatLogMessage(message), ...args);
}

function formatLogMessage(message) {
  return `[${new Date().toISOString()}][${process.env.INVOKER}]: ${message}`;
}