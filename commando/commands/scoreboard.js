const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
    .setName('scoreboard')
    .setDescription('Finds scoreboard of a link.')
    .addStringOption(function(option) {
        return option.setName('link')
        .setDescription('The link to get the scoreboard of.')
        .setRequired(true);
    });

module.exports = { 
    data,
};