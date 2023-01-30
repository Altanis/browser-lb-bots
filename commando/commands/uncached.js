const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
    .setName('uncached')
    .setDescription('Returns all of the servers the bot could not find the scoreboard of.');

module.exports = { 
    data,
};