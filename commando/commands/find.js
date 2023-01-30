const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
    .setName('find')
    .setDescription('Scans through all scoreboards to find a desired name.')
    .addStringOption(function(option) {
        return option.setName('name')
        .setDescription('The name to use to scan scoreboards.')
        .setRequired(true);
    });

module.exports = { 
    data,
};