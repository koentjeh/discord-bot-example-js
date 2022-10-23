const { Client, GatewayIntentBits, Events } = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

require('Event/Handler/onReadyEventHandler')(client, Events.ClientReady);
require('Event/Handler/Message/onMessageCreateHandler')(client, Events.MessageCreate);





client.on(Events.ClientReady, () => {
    console.log('im ready');
});

client.on(Events.InteractionCreate, (interaction) => {
   console.log(interaction);
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) {
        return;
    }



    // message.channel.send('hi there vsauce here');
});

client.login(process.env.TOKEN);
