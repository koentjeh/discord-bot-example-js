//make a simple discord bot that responds to ping with pong
const { Client, Discord, GatewayIntentBits, ApplicationCommand } = require('discord.js');
//get token from .env file (make sure to add .env to .gitignore)
require('dotenv').config();

const fs = require("fs"); //this package is for reading files and getting their inputs
const client = new Client({ intents: 
    [           
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ] },
    
    {
        messageCacheLifetime: 60,
        fetchAllMembers: false,
        messageCacheMaxSize: 10,
        restTimeOffset: 0,
        restWsBridgetimeout: 100,
        disableEveryone: true,
        partials: ['MESSAGE', 'CHANNEL', 'REACTION']
      }
    );
    
    const reactions = require('./reactions.json');


    client.on('ready', () => {
        client.application.commands.cache.clear();
        //show the bot is ready in the console using ready.js
        require('./events/ready.js')(client);

        const { SlashCommandBuilder } = require('@discordjs/builders');

//add a slash command for each command in commands.json and add it to the bot
fs.readFile('./botconfig/commands.json', (err, data) => {
    if (err) throw err;
    let commands = JSON.parse(data);
    Object.keys(commands).forEach(command => {
        client.application.commands.create(new SlashCommandBuilder()
            .setName(command)
            .setDescription(commands[command].description)
        );
    });
});
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    //make a variable called command and set it to the command name
    const command = interaction.commandName;

    if (interaction.commandName === 'ping') {
        //reply with the amount of ping
        await interaction.reply(`Pong! ${client.ws.ping}ms`);
        console.log(`Pong! ${client.ws.ping}ms`);
    }

    else if (interaction.commandName === 'list') {
        //list all of the reactions that the bot has
        const reactionList = Object.keys(reactions).join(', ');
        await interaction.reply(`Reactions: ${reactionList}`);
    }

    else if (interaction.commandName === 'help') {
        const { EmbedBuilder } = require('discord.js');
        const config = require('./botconfig/embed.json');
        const embed = new EmbedBuilder()
            .setThumbnail(client.user.displayAvatarURL())
            .setTitle("HELP MENU 🔰 Commands")
            .setDescription('List of commands')
            .addFields(
                { name: 'ping', value: 'Replies with Pong!'},
                { name: 'list', value: 'Replies with a list of reactions!'},
                { name: 'help', value: 'Replies with a list of commands!'},
            )
            .setColor(config.color)
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });

    }

    else if (interaction.commandName === 'control') {
        //make embed with buttons for the user to control the bot
        const { MessageActionRow, ButtonBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
        const config = require('./botconfig/embed.json');
        const embed = new EmbedBuilder()
            .setTitle('Control Panel')
            .setDescription('Use the buttons below to control the bot')
            .setColor(config.color)
            .setTimestamp();

            const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('primary')
					.setLabel('Blink')
					.setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('secondary')
                    .setLabel('Turn on (constant)')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('tertiary')
                    .setLabel('Turn off')
                    .setStyle(ButtonStyle.Danger),
			);

		await interaction.reply({ content: 'Control LED of Pico W,', components: [row] });

        const filter = i => i.customId === 'primary' || i.customId === 'secondary' || i.customId === 'tertiary';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
        //a webserver is hosted on Raspberry Pico W with a small python script that controls the Onboard LED, this command can send a request to the local webserver to turn the LED on, off or blink
        
        collector.on('collect', async i => {
            if (i.customId === 'primary') {
                await i.update({ content: 'Blinking!', components: [] });
                //send a link to the pico w to blink
                const { exec } = require('child_process');
                exec('curl -X POST http://192.168.178.59/"?led=blink\"', (err, stdout, stderr) => {
                    if (err) {
                        console.log(err);
                        console.log('BLINK');
                    }
                    //console.log(stdout);

                    //close the collector
                    collector.stop();
                });
            }

            else if (i.customId === 'secondary') {
                await i.update({ content: 'On!', components: [] });
                //send a link to the pico w to turn on
                const { exec } = require('child_process');
                exec('curl -X POST http://192.168.178.59/"?led=on\"', (err, stdout, stderr) => {
                    if (err) {
                        console.log(err);
                        console.log('ON');
                    }
                    //console.log(stdout);

                    //close the collector
                    collector.stop();
                });
            }

            else if (i.customId === 'tertiary') {
                await i.update({ content: 'Off!', components: [] });
                //send a link to the pico w to turn off
                const { exec } = require('child_process');
                exec('curl -X POST http://192.168.178.59/"?led=off\"', (err, stdout, stderr) => {
                    if (err) {
                        console.log(err);
                        console.log('OFF');
                    }
                    //console.log(stdout);

                    //close the collector
                    collector.stop();
                }
                );
            }
        });

    }

    //when someone uses a command, log it in the console and log which command they used
    console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered ${command}`);
    //log the command in a file and if it already exists, add 1 to the count and log who used it
    fs.readFile('./log.json', (err, data) => {
        if (err) throw err;
        let commands = JSON.parse(data);
        if (commands[interaction.commandName]) {
            commands[interaction.commandName].count++;
            if (commands[interaction.commandName].users.includes(interaction.user.id)) return;
            commands[interaction.commandName].users.push(interaction.user.id);
        } else {
            commands[interaction.commandName] = {
                count: 1,
                users: [interaction.user.tag]
            };
        }
        fs.writeFile('./log.json', JSON.stringify(commands, null, 2), err => {
            if (err) throw err;
        });
    });
});

// Path: commands/ping.js


client.on('messageCreate', message => {
    if (message.author.bot){
        if (message.content.includes('Pong')){
            message.react('🏓');
        }
    }
    else{
        //make an array of all the words in the message and make them lowercase
            const words = message.content.toLowerCase().split(' ');
            //if the message contains a space, put all words in an array and check each word for a reaction emoji in the reactions.json file and add it to the message
            if (message.content.includes(' ')){
                for (const word of words) {
                    for (const [emoji, words] of Object.entries(reactions)) {
                        if (words.some(word => message.content.includes(word))) {
                            message.react(emoji);
                        }
                    }
            }
            } else{
                //if the message doesn't contain a space, check if the message contains a reaction emoji in the reactions.json file and add it to the message
                for (const [emoji, words] of Object.entries(reactions)) {
                    if (words.some(word => message.content.includes(word))) {
                        message.react(emoji);
                    }
                }
            }
    }
});

//get token from .env file
client.login(process.env.TOKEN);