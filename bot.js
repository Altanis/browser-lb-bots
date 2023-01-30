require('dotenv').config();

// -- IMPORTS -- //

const { server: Server } = require("./server/Server");
const { CommandHandler } = require('./commando/CommandHandler');

const { Client, EmbedBuilder, Colors } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const SharpClient = class extends Client {
    constructor(opts) {
        super(opts);

        // -- LOAD DISCORD COMMANDS -- //
        this.REST = new REST({ version: '9' }).setToken(process.env.TOKEN);
        this.CommandHandler = new CommandHandler('commands');
        this.CommandHandler.fetchCommands();
        this.#refreshCommands();

        this.ALIASES = {
            MODES: {
                'ffa': 'ffa',
                'teams': 'teams',
                '2teams': 'teams',
                '2tdm': 'teams',
                '4teams': '4teams',
                '4tdm': '4teams',
                'maze': 'maze',
            },

            REGIONS: {
                'sfo': 'lnd-sfo',
                'la': 'lnd-sfo',
                'miami': 'lnd-atl',
                'nyc': 'lnd-atl',
                'atl': 'lnd-atl',
                'atlanta': 'lnd-atl',
                'eu': 'lnd-fra',
                'fra': 'lnd-fra',
                'frankfurt': 'lnd-fra',
                'tok': 'lnd-tok',
                'tokyo': 'lnd-tok',
                'sg': 'lnd-tok',
                'singapore': 'lnd-tok',
                'syd': 'lnd-syd',
                'sydney': 'lnd-syd',

                'lnd-sfo': 'lnd-sfo',
                'lnd-atl': 'lnd-atl',
                'lnd-fra': 'lnd-fra',
                'lnd-tok': 'lnd-tok',
                'lnd-syd': 'lnd-syd'
            },
            
            COLORS: {
                'BLUE': '💙',
                'RED': '❤️',
                'GREEN': '💚',
                'PURPLE': '💜',
                'WHITE': '🤍'
            },
        }
    }

    async #refreshCommands() {
        try {
            console.log('Refreshing application (/) commands...');
            await this.REST.put(Routes.applicationGuildCommands(this.user?.id || '1043983864902725735', '1043984063825989705'), {
                body: this.CommandHandler.commands.map(command => command.data.toJSON())
            });
        } catch (error) {
            console.error('Failed to refresh application (/) comamnds:', error);
            this.#refreshCommands();
        }
    }

    get servers() {
        return Server.servers.cached.length ? Server.servers.cached : Server.servers.servers;
    }
}

const client = new SharpClient({ intents: [131071] });
client.login(process.env.TOKEN);

client.on('ready', () => {
    console.log(`Connected to DAPI via account ${client.user?.tag}!`);
});

client.on('messageCreate', function(message) {
    if (message.content.startsWith('!eval') && ['765239557666111509'].includes(message.author.id)) {
        const code = message.content.replace('!eval ', '');
        const embed = new EmbedBuilder();
    
        try {
            let evalled = eval(code);

            if (typeof evalled !== 'string')
                evalled = require('util').inspect(evalled);

            embed.setColor(Colors.Green);
            embed.setTitle('Evaluation Successful!');
            embed.setDescription('The evaluation ran successfully.');
            embed.addFields([
                { name: 'Inputted Code', value: `\`\`\`js\n${code}\`\`\`` },
                { name: 'Outputted Code', value: `\`\`\`js\n${evalled.includes(client.token) ? '🖕' : evalled}\`\`\`` }
            ]);

            message.channel.send({ embeds: [embed] }).catch(() => {});
        } catch (err) {
            embed.setColor(Colors.Red);
            embed.setTitle('Evaluation Unsuccessful!');
            embed.setDescription('The evaluation ran unsuccessfully.');
            embed.addFields([
                { name: 'Inputted Code', value: `\`\`\`js\n${code}\`\`\`` },
                { name: 'Error', value: `\`\`\`js\n${err.message.includes(client.token) ? '🖕' : err.message}\`\`\`` }
            ]);

            message.channel.send({ embeds: [embed] }).catch(() => {});
        }
    }
});

client.on("interactionCreate", async interaction => {
    if (interaction.isCommand()) {
        switch (interaction.commandName) {
            case "leaders": {
                let servers = JSON.parse(JSON.stringify(client.servers));
                if (!servers.length) return interaction.reply({ content: 'The bot is still caching servers, be patient!', ephemeral: true });
                
                let regions = interaction.options.getString("region")?.split(', ') || ["sfo", "atl", "fra", "tok", "syd"];
                let gamemodes = interaction.options.getString("gamemodes")?.split(', ') || ["ffa", "teams", "4teams", "maze"];
                let score = interaction.options.getString("score") || "500k";
                
                score = 
                    score.endsWith('k') ?
                        +score.replace('k', '') * 1000 :
                    (score.endsWith('m') ?
                        +score.replace('m', '') * 1000000 :
                        +score);

                if (isNaN(score)) return interaction.reply({ content: 'Invalid score!', ephemeral: true });

                regions = regions.map(r => client.ALIASES.REGIONS[r.toLowerCase()]);
                gamemodes = gamemodes.map(g => client.ALIASES.MODES[g.toLowerCase()]);

                console.log(regions, gamemodes);

                if (regions.includes(undefined)) return interaction.reply({ content: 'Invalid region!', ephemeral: true });
                if (gamemodes.includes(undefined)) return interaction.reply({ content: 'Invalid gamemode!', ephemeral: true });

                servers = servers.filter(server => regions.includes(server.server.region_id) && gamemodes.includes(server.server.game_mode_id));
                console.log(servers.length);
                let scores = [];

                for (const { server, scores: s } of servers) {
                    for (const entry of s) {
                        if (entry.score >= score) {
                            scores.push({ server, entry });
                        }
                    }
                }

                scores = scores.sort((a, b) => b.entry.score - a.entry.score);
                // I'm too lazy to add pagination, so :P
                scores = scores.slice(0, 25);


                function scoreFormat(score) {
                    if (score >= 1e6) return (score/1e6).toFixed(1) + "m";
                    else if (score >= 1e3) return (score/1e3).toFixed(1) + "k";
                    else return score + "";
                }

                const embed = new EmbedBuilder();
                embed.setTitle('Current Leaders');
                embed.setDescription(`Showing the top **${scores.length}** players with a score of **${scoreFormat(score).toUpperCase()}** or higher.`);
                embed.setColor(5763719);
                embed.setFooter({
                   text: `Requested by ${interaction.user.tag} | Made by Altanis#0129 | Max 25 Results`,
                   iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });
                embed.setTimestamp();

                const fields = [];

                for (let i = 0; i < scores.length; i++) {
                    const { server, entry } = scores[i];
                    fields.push({
                        name: `${i + 1}. ${scoreFormat(+entry.score)} **${entry.name}**`,
                        value: `${server.game_mode_id} ${server.region_id} ${server.link}`
                    });
                }

                embed.addFields(fields);
                interaction.reply({ embeds: [embed] });

                break;
            }
            case "find": {
                const name = interaction.options.getString("name");
                if (!name) return interaction.reply({ content: "Please provide a name!", ephemeral: true });

                let hits = [];
                for (const { server, scores } of client.servers) {
                    for (const entry of scores) {
                        if (entry.name?.toLowerCase().includes(name.toLowerCase()))
                            hits.push({ server, entry });
                    }
                }

                hits = hits.sort((a, b) => b.entry.score - a.entry.score);
                // I'm too lazy to add pagination, so :P
                hits = hits.slice(0, 25);

                function scoreFormat(score) {
                    if (score >= 1e6) return (score/1e6).toFixed(1) + "m";
                    else if (score >= 1e3) return (score/1e3).toFixed(1) + "k";
                    else return score + "";
                }

                const embed = new EmbedBuilder();
                embed.setTitle('Current Players');
                embed.setDescription(`Showing the top **${hits.length}** players with a name of **${name.toLowerCase()}**.`);
                embed.setColor(5763719);
                embed.setFooter({
                    text: `Requested by ${interaction.user.tag} | Made by Altanis#0129 | Max 25 Results`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });
                embed.setTimestamp();

                const fields = [];

                for (let i = 0; i < hits.length; i++) {
                    const { server, entry } = hits[i];
                    fields.push({
                        name: `${i + 1}. ${scoreFormat(+entry.score)} **${entry.name}**`,
                        value: `${server.game_mode_id} ${server.region_id} ${server.link}`
                    });
                }

                embed.addFields(fields);
                console.log(embed);
                console.log(interaction);
                interaction.reply({ embeds: [embed] });
                
                break;
            }
            case "scoreboard": {
                const link = interaction.options.getString("link")?.split("#")[1].toLowerCase();
                if (!link) return interaction.reply({ content: "Please provide a link!", ephemeral: true });

                const server = client.servers.find(server => server.server.link?.split("#")[1].toLowerCase() === link);
                if (!server) return interaction.reply({ content: "Please provide a **valid** link!", ephemeral: true });

                const embed = new EmbedBuilder();
                embed.setTitle("Scoreboard");
                embed.setURL(server.server.link);
                embed.setDescription(`Showing the top **${server.scores.length}** players on this server.`);
                embed.setColor(5763719);
                embed.setFooter({
                    text: `Requested by ${interaction.user.tag} | Made by Altanis#0129 | Max 25 Results`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });

                function scoreFormat(score) {
                    if (score >= 1e6) return (score / 1e6).toFixed(1) + "m";
                    else if (score >= 1e3) return (score / 1e3).toFixed(1) + "k";
                    else return score + "";
                }

                const fields = [];
                for (let i = 0; i < server.scores.length; i++) {
                    const { name, score } = server.scores[i];

                    fields.push({
                        name: `${i + 1}. ${scoreFormat(+score)} **${name}**`,
                        value: "sex"
                    });
                }

                embed.addFields(fields);
                interaction.reply({ embeds: [embed] });
                break;
            }
        }
    }
});

/*
            case 'scoreboard': {
                let servers = JSON.parse(JSON.stringify(client.servers));
                const uncached = servers.filter(server => server.uncached || !server.leaderboard.length);
                servers = servers.filter(server => server.leaderboard?.length);

                if (!servers.length) return interaction.reply({ content: 'The bot is still caching servers, be patient!', ephemeral: true });
                if (uncached.length) interaction.channel.send({ content: `⚠ ${uncached.length} server(s) could not be found.` });

                const link = interaction.options.getString('link')?.split('#')[1];
                if (!link) return interaction.reply({ content: 'Please provide a link!', ephemeral: true });

                const server = servers.find(server => server.url.toLowerCase() === link.toLowerCase());
                if (!server) return interaction.reply({ content: 'Invalid link!', ephemeral: true });

                const embed = new EmbedBuilder();
                embed.setTitle(`Scoreboard`);
                embed.setURL(`https://diep.io/#${link}`);
                embed.setDescription(`Showing the top **${server.leaderboard.length}** players on this server.`);
                embed.setColor(5763719);

                const fields = [];
                let i = 0;
                for (const entry of server.leaderboard) {
                    i++;
                    fields.push({
                        name: `${i}. ${client.ALIASES.COLORS[entry.color]} ${scoreFormat(entry.score)} ${entry.tank} | **${entry.name}**`,
                        value: `${server.gamemode} ${server.region}`
                    });
                }

                embed.addFields(fields);
                interaction.reply({ embeds: [embed] });

                break;
            }
            case 'uncached': {
                let servers = JSON.parse(JSON.stringify(client.servers));
                const uncached = servers.filter(server => server.uncached || !server.leaderboard.length);

                if (!uncached.length) return interaction.channel.send({ content: 'All servers are cached!', ephemeral: true });
                let description = '';

                for (const server of uncached) {
                    description += `https://diep.io/#${server.url.toUpperCase()}\n`;
                }

                const embed = new EmbedBuilder();
                embed.setTitle('Uncached Servers');
                embed.setDescription(description);
                embed.setColor(5763719);
                interaction.reply({ embeds: [embed] });
            }
        }
    }
});*/