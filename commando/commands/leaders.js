const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
    .setName('leaders')
    .setDescription('Finds leaders throughout Diep.io.')
    .addStringOption(function(option) {
        return option.setName('region')
            .setDescription('The region(s) to filter leaders (split by ,). Default: ALL')
    })
    .addStringOption(function(option) {
        return option.setName('gamemodes')
            .setDescription('The gamemode(s) to filter leaders (split by ,). Default: ALL')
    })
    .addStringOption(function(option) {
        return option.setName('score')
            .setDescription('Leaders given will only have at least this score.');
    });

module.exports = { 
    data,
};