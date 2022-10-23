const { Client, Events, GatewayIntentBits, ButtonBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { exec } = require('child_process');
const fs = require("fs");
const reactions = require('./reactions.json');

//get token from .env file (make sure to add .env to .gitignore)
require('dotenv').config();

// Use this repositories Database class.
const { Database } = require('database/database');
// store in variable so we can use the Class functions.
const database = new Database({
    host: "localhost",
    user: "root",
    password: ""
});

// Use this repositories Logger class.
const { Logger } = require('logging/logger');
// store in variable so we can use the Class functions.
const logger = new Logger('log.txt');

// Use the Discord.js Client so we can access the class functions.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});


// Define database configuration once
// const connection = database.connect();


//make a function to show the error in an embed
function error(message) {
    const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(message)
        .setColor(0xff0000)
        .setTimestamp()
    return embed;
}

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
    logger.log(''); // I doubt this Copilot clears the log file.


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
            // .setColor(config.color)
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
    // if a bot creates a message exit current function.
    // this is important to prevent infinite loops when message.send() is executed.
    if (message.author.bot) {
        // exit the current function and do nothing
        return;
        // this method is executed when a message is created.
        // if a bot creates a message after a message is created this method will be executed again,
        // therefore causing an infinite loop.
    }

    // Does exactly what function names say.
    const messageContent = message.content
        .toLowerCase()
        .removeWhitespaceCharacters();

    // play ping pong with bot.
    if (respondTo(message.content, 'pong')) {
        message.react('🏓');
    }

    // let bot react to with emoji's to certain words in reactions.json.
    for (const [emoji, words] of Object.entries(reactions)) {
        if (respondsTo(messageContent, words)) {
            message.react(emoji);
        }
    }
});

/**
 * Adds removeWhitespaceCharacters() function to String which removes all whitespace characters.
 * - space character
 * - tab character
 * - carriage return character
 * - new line character
 * - vertical tab character
 * - form feed character
 * @returns {string}
 */
String.prototype.removeWhitespaceCharacters = () => {
    return this.replace(/\s+/g, '');
}

/**
 * Check if message contains one word from a list of words.
 * @param {string} message - contents of a message
 * @param {array} triggers - list of words that should be in the message
 * @returns {boolean}
 */
function respondsTo(message, triggers) {
    return message.some(word => triggers.includes(word));
}

/**
 * Check if message contains word.
 * @param {string} message - contents of a message
 * @param {string} trigger - word that should be in the message
 * @returns {boolean}
 */
function respondTo(message, trigger) {
    return message.content.includes(trigger);
}
/**
 * Same as respondTo(..) but prevents double code by converting single word to array and re-using respondsTo(..)
 * @param {string} message - contents of a message
 * @param {string} trigger - word that should be in the message
 * @returns {boolean}
 */
// function respondTo(message, trigger) {
//     return respondsTo(message, [trigger]);
// }

client.login(process.env.TOKEN);
