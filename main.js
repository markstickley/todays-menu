const fs = require('fs');

// Read menu data
const data = JSON.parse(fs.readFileSync('./data/menu.json', 'utf8'));

// Get current date and time
const now = new Date();

// If it's after 12:00pm, switch to tomorrow
let targetDate = new Date(now);
if (now.getHours() >= 12) {
    targetDate.setDate(targetDate.getDate() + 1);
}

// Get ISO-formatted date string
const pad = (n) => n.toString().padStart(2, "0");
const targetDateStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;

// Calculate weekday index (Monday = 0, Friday = 4)
const weekday = (targetDate.getDay() + 6) % 7;

// Find the current week based on date ranges
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
  updateMergeVariables({ error: "No meal info for today." });
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

// ⬇️ Declare this function after it's used
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
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error updating merge variables:", error);
      process.exit(1);
    });
}