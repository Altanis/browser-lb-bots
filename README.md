# Browser LB Bots

## What is this?

This is a project aimed at crowdsourcing leaderboards in Diep.io to one central LB Bot.

## How does this work?

Users (anyone, even you!) can help keep our bot up to date. Using a server and "slave tab" mechanism, users can run the server locally and install a script designed to scan servers for their leaderboards. These leaderboards are sent to the server, and once all are cached, are able to be utilized by the central bot.

## How do I set this up?

A video detailing instructions will be shown here later, but for now:

1. Install [Node.js](https://nodejs.org/en/), preferably current rather than LTS.
    - Ensure Node.js is added to PATH.
2. Clone this repository locally.
    - You can do this by either:
        - [Downloading Git](https://git-scm.com/downloads) and running `git clone https://github.com/Altanis/browser-lb-bots.git`.
        - Download as a ZIP folder, then expand it.
3. Open up a terminal in the folder, and run `npm install`.
4. Install [Tampermonkey](https://www.tampermonkey.net/) as an extension on your browser.
5. Copy the contents of [`script.user.js`](https://github.com/Altanis/browser-lb-bots/blob/master/script.user.js) into a new script.
    - Alternatively, you may go to [this link](https://github.com/Altanis/browser-lb-bots/raw/master/script.user.js) and press "Install".
6. In the terminal you ran `npm install` in, run `npm start`.
7. When the terminal says `"[WS]: Server listening on port 3000. You may connect a slave tab."`, enable the script and run it in the browser.
8. When the browser alerts you with a message "Finished collecting servers", you have finished crowdsourcing the leaderboards at that point.

**Installation/setup only takes five minutes, and collecting all server leaderboards will take you only five minutes.**

## Where do I find the central bot?

This bot is in the form of a **Discord bot**. To view it, join [this guild](https://discord.gg/kBEu2Z5aRA).