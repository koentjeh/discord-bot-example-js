function error(message) {

    const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(message)
        .setColor(0xff0000)
        .setTimestamp()

        
    return embed;

}