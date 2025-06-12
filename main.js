const fs = require('fs');

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
const data = JSON.parse(fs.readFileSync('./data/menu.json', 'utf8'));

if (!data || !data.weeks || data.weeks.length === 0) {
  logError("No menu data found");
  process.exit(1);
}

const now = new Date();
let targetDate = new Date(now);

// Check if today is Saturday (6) or Sunday (0)
const todayDay = now.getDay();
if (todayDay === 6 || todayDay === 0) {
    // Force to next Monday
    const daysToMonday = (8 - todayDay) % 7;
    targetDate.setDate(targetDate.getDate() + daysToMonday);
} else if (now.getHours() >= 12) {
    // On weekdays, after 12pm, show tomorrow's meal
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
  return;
}

const dayInfo = matchedWeek.days[weekday.toString()];
if (!dayInfo) {
  updateMergeVariables({ error: "No meal info for this day." });
  return;
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
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      merge_variables: { ...mergeVariables, title, subtitle }
    })
  };

  fetch(url, options)
    .then(() => process.exit(0))
    .catch((error) => {
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