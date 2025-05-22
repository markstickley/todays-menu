const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/menu.json', 'utf8'));

const today = new Date();
const weekday = (today.getDay() + 6) % 7;
const pad = (n) => n.toString().padStart(2, "0");
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const matchedWeek = data.weeks.find((week) => {
  return week.datesCommencing.some((dateStr) => {
    const weekDate = new Date(dateStr);
    const diff = today - weekDate;
    return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
  });
});

if (!matchedWeek) {
  updateMergeVariables({error: "No menu found for this week."});
}

const dayInfo = matchedWeek.days[weekday.toString()];
if (!dayInfo) {
    updateMergeVariables({error: "No meal info for today."});
}

const options = dayInfo.options.map(opt => `- ${opt}`).join("\n");
const sides = dayInfo.sides;
const dessert = dayInfo.dessert;

const weekDay = ["Sunday", "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][today.getDay()];

const requestBody = JSON.stringify({options: dayInfo.options, sides, dessert, weekTitle: matchedWeek.title, weekDay, error: ""});

updateMergeVariables(requestBody);

const updateMergeVariables = (mergeVariables) => {
    const apiKey = process.env.TRMNL_API_KEY;
    const title = process.env.PLUGIN_TITLE;
    const subtitle = process.env.PLUGIN_SUBTITLE;
    const url = `https://usetrmnl.com/api/custom_plugins/${apiKey}`;
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: {
            merge_variables: { ...mergeVariables, title, subtitle }
        }
    };
    fetch(url, options)
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.log("Error updating merge variables:", error);
            process.exit(1);
        });
}
