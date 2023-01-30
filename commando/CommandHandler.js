const { Collection } = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');

const CommandHandler = class {
    constructor(directory) {
        this.commands = new Collection();
        this.files = [];
        this.directory = directory || '';
    }

    fetchCommands() {
        this.files = fs.readdirSync(path.join(__dirname, this.directory)).filter(file => file.endsWith('.js'));

        for (const name of this.files) {
            const file = require(`${path.join(__dirname, this.directory, name)}`);
            this.commands.set(name.slice(0, -3), file);
        }

        return this.commands;
    }
}

module.exports = { CommandHandler };