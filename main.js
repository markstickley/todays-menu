const fs = require('fs');

// Read menu data
const data = JSON.parse(fs.readFileSync('./data/menu.json', 'utf8'));

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

const options = dayInfo.options.map(opt => `- ${opt}`).join("\n");
const sides = dayInfo.sides;
const dessert = dayInfo.dessert;

const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][targetDate.getDay()];

const requestBody = {
  options: dayInfo.options,
  sides,
  dessert,
  weekTitle: matchedWeek.title,
  weekDay,
  error: ""
};

updateMergeVariables(requestBody);

function updateMergeVariables(mergeVariables) {
  const apiKey = process.env.TRMNL_API_KEY;
  const title = process.env.PLUGIN_TITLE;
  const subtitle = process.env.PLUGIN_SUBTITLE;
  const url = `https://usetrmnl.com/api/custom_plugins/${apiKey}`;
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
      console.error("Error updating merge variables:", error);
      process.exit(1);
    });
}