Today's Menu Docker Container
=============================

_Today's Menu_ is a plugin for _TRMNL_, an e-ink dashboard device, that shows a basic menu with options for a main course, sides and a dessert. It was written with school dinners in mind, but could be easily adapted for other scenarios.

This is a simple container that runs on a cron once per day to update the plugin's variables, allowing it to show the correct data. You can run the container anywhere that has an internet connection - this is necessary to communicate with TRMNL's servers.

Requirements
------------

- Data source
    - The script looks for /app/data/menu.json
    - It is recommended you mount an external volume onto /app/data so that you can update menu.json without having to rebuild the container
- Plugin UUID
    - The plugin's UUID must be supplied to the container as an environment variable `TRMNL_PLUGIN_UUID`
- Title
    - The plugin's title must be supplied to the container as an environment variable `PLUGIN_TITLE`
- Date
    - The plugin's subtitle must be supplied to the container as an environment variable `PLUGIN_SUBTITLE`
    - This is just a string and will be displayed as supplied so you can use it as a subtitle, or as metadata related to the currently displayed menu (e.g. week number, day name)
