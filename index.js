//make a simple discord bot that responds to ping with pong
const { Client, Discord, REST, Routes, GatewayIntentBits, ApplicationCommand, MessageActionRow, ButtonBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
//get token from .env file (make sure to add .env to .gitignore)
require('dotenv').config();

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: ""
});


const token = process.env.TOKEN;

const { exec } = require('child_process');

//get the ip from the .env file and put it in a variable. This is the ip of the server that the bot can connect to and send GET requests to (Ex: turn on a light with http://(ip)/"?led=on\")
const ip = process.env.IP;

const fs = require("fs"); //this package is for reading files and getting their inputs
const client = new Client({
    intents:
        [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences
        ]
},

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

//make a function to log something to the console and to a file
function log(message) {
    console.log(message);
    //put the message in a file called log.txt and add the date and time to the message and leave 2 lines between each message
    fs.appendFile('log.txt', `${new Date().toLocaleString()} - ${message}\n\n`, function (err) {
        if (err) {
            return console.log(err);
        }
    });
}

//make a function to show the error in an embed
function error(message) {
    const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(message)
        .setColor(0xff0000)
        .setTimestamp()
    return embed;
}


const reactions = require('./reactions.json');


client.on('ready', () => {
    //send an embed message to the channel that the bot is online and change the message to say "Loading..." after 5 seconds
    const embed = new EmbedBuilder()
        .setTitle("Bot Online")
        .setDescription("The bot is online!")
        .setColor(0x00ff00)
        .setTimestamp()
    client.channels.cache.get("1033726233684492391").send({ embeds: [embed] }).then(msg => {
        //change the description of the message to "Loading..." after 5 seconds
        setTimeout(() => {
            msg.edit({ embeds: [embed.setDescription("Loading...")] });
            setTimeout(() => {
                //connect to the database
                con.connect(function (err) {
                    if (err){
                        log(err);
                        msg.edit({ embeds: [error("Error connecting to the database.")] });
                        //change the color of the embed to red
                        embed.setColor(0xff0000);
                    } else{
                    //change the description of the message to "Connected to database" after 5 seconds
                    msg.edit({ embeds: [embed.setDescription("Connected to database")] });
                    }
                }, 1000);
            });
        }, 1000);


    });
    client.application.commands.cache.clear();

    //remove slash commands from the bot to avoid keeping old commands
    //comment this out after running it once and restart discord client to see effect.

    // rest.put(Routes.applicationCommands(clientId), { body: [] })
    // .then(() => console.log('Successfully deleted all application commands.'))
    // .catch(console.error);

    //clear log.txt file to avoid having a huge file
    fs.writeFile("log.txt", "", function (err) {
        if (err) {
            return console.log(err);
        }
    });


    //show the bot is ready in the console using ready.js
    require('./events/ready.js')(client);

    const { SlashCommandBuilder } = require('@discordjs/builders');

    //add a slash command for each command in commands.json and add it to the bot
    fs.readFile('./botconfig/commands.json', (err, data) => {
        if (err) throw err;
        if (err) {
            log(err);
        }
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
        exec(`curl -X POST ${ip}"?led=on\"`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            //return the light to its original state after 2 seconds
            setTimeout(() => {
                exec(`curl -X POST ${ip}"?led=off\"`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            }, 1000);
        });
    }

    else if (interaction.commandName === 'list') {
        //list all of the reactions that the bot has
        const reactionList = Object.keys(reactions).join(', ');
        await interaction.reply(`Reactions: ${reactionList}`);
    }

    else if (interaction.commandName === 'help') {
        const config = require('./botconfig/embed.json');
        const embed = new EmbedBuilder()
            .setThumbnail(client.user.displayAvatarURL())
            .setTitle("HELP MENU 🔰 Commands")
            .setDescription('List of commands')
            .addFields(
                { name: 'ping', value: 'Replies with Pong!' },
                { name: 'list', value: 'Replies with a list of reactions!' },
                { name: 'help', value: 'Replies with a list of commands!' },
                { name: 'control', value: 'Replies with options to control the Pico W' },
            )
            .setColor(config.color)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    }

    else if (interaction.commandName === 'control') {
        //make embed with buttons for the user to control the bot
        const config = require('./botconfig/embed.json');
        const embed = new EmbedBuilder()
            .setTitle('Control Panel')
            .setDescription('Use the buttons below to control the LED')
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
                //get the ip address of the pico w from the .env file
                exec(`curl -X POST ${ip}"?led=blink\"`, (err, stdout, stderr) => {
                    if (err) {
                        const blinkErr = "BLINK ERROR. Could not send request to Pico W";
                        log(err);
                        log(blinkErr);
                        //get embed from error function
                        const embed = error(blinkErr);
                        //send embed to channel
                        i.channel.send({ embeds: [embed] });

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
                exec(`curl -X POST ${ip}"?led=on\"`, (err, stdout, stderr) => {
                    if (err) {
                        const onErr = "ON ERROR. Could not send request to Pico W";
                        log(err);
                        log(onErr);
                        const embed = error(onErr);
                        i.channel.send({ embeds: [embed] });
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
                exec(`curl -X POST ${ip}"?led=off\"`, (err, stdout, stderr) => {
                    if (err) {
                        const offErr = "OFF ERROR. Could not send request to Pico W";
                        log(err);
                        log(offErr);
                        const embed = error(offErr);
                        i.channel.send({ embeds: [embed] });
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
        if (err) {
            log(err);
        }
        let commands = JSON.parse(data);
        if (commands[interaction.commandName]) {
            commands[interaction.commandName].count++;
            //if the user is already in the list, don't add them again
            if (!commands[interaction.commandName].users.includes(interaction.user.id)) {
                commands[interaction.commandName].users.push(interaction.user.id);
            }
        }

        fs.writeFile('./log.json', JSON.stringify(commands, null, 2), err => {
            if (err) throw err;
            if (err) {
                log(err);
                //send message in the channel that there was an error writing to the log file
                interaction.channel.send('Error. Could not write to log file');
            }
        });
    });
});

// Path: commands/ping.js


client.on('messageCreate', message => {
    if (message.author.bot) {
        if (message.content.includes('Pong')) {
            message.react('🏓');
        }
    }
    else {
        //make an array of all the words in the message and make them lowercase
        const words = message.content.toLowerCase().split(' ');
        //log words
        log(words);
        //if the message contains a space, put all words in an array and check each word for a reaction emoji in the reactions.json file and add it to the message
        if (message.content.includes(' ')) {
            for (const word of words) {
                for (const [emoji, words] of Object.entries(reactions)) {
                    if (words.some(word => message.content.match(word))) {
                        message.react(emoji);
                    }
                }
            }
        } else {
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
client.login(token);