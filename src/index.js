const { Client, Events, SlashCommandBuilder} = require('discord.js');

const client = new Client({
    intents: []
});


client.on(Events.MessageCreate, event => {

});

client.login(process.env.TOKEN);
