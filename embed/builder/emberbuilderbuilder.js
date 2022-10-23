// Use Discord.js EmbedBuilder
const { EmbedBuilder } = require('discord.js');

// Read configuration
let embeds = require('../../botconfig/embed.json');
const {config} = require("dotenv");

// Parse string to usable object
embeds = JSON.parse(embeds);

class Emberbuilderbuilder {

    /**
     * Store the embeds configuration file as object in class.
     * @param {object} embeds
     */
    constructor(embeds) {
        this.embeds = embeds;
    }

    pub

    /**
     *
     * @param {string} commandName
     * @param {Client} client
     * @returns {EmbedBuilder}
     */
    test(commandName, client) {
        if (!this.embeds.hasOwnProperty(commandName)) {
            return;
        }

        const embed = this.embeds[commandName];

        return new EmbedBuilder()
            .setThumbnail(client.user.displayAvatarURL())
            .setTitle("HELP MENU 🔰 Commands")
            .setDescription('List of commands')
            .addFields({
                name: 'ping',
                value: 'Replies with Pong!'
            }, {
                name: 'list',
                value: 'Replies with a list of reactions!'
            }, {
                name: 'help',
                value: 'Replies with a list of commands!'
            }, {
                name: 'control',
                value: 'Replies with options to control the Pico W'
            })
            // .setColor(embed.color) this could be a key within commands.json
    }
}
