//if the bot sent a message containing the word pong, add a pingpong reaction to it
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