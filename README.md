
# Discord bot JS
  
  

## Introduction

  

Discord bot written in JS using:

* Official JS library https://discord.js.org/#/

  

This is just a hobby project of mine, I haven't done much with JS and the code is not optimized, but that's something I'll work on as I go. This was mainly to try out something new, no matter the outcome.


  

# Functions

  

 ## Use slash commands
* Slash commands have been added to Discord. 

## React

  * The bot can react to messages if it contains a certain string. If there are spaces, all words will be put into a string and it will check the reactions.json for a match and react with the corresponding emotes, including custom ones.

## list
   * Show the emotes from reactions.json.

  

## Ping

  * The bot can be pinged with /ping, it will return with the ping in ms and react to it's own message with 🏓.
  * It will also log the ping in the console.

  

## Help
 * The bot can reply with an embed with all the commands when using /help

  

## Control LED of Raspberry Pico W

   When using /control, it will respond with a message and 3 buttons:

  * on (turns LED on)

  * off (turns LED off)

  * blink (blinks LED for 10 seconds)

The bot will send a POST request to a webserver with a GET variable to turn the onboard-LED on, off or make it blink.

*Note: The webserver is a seperate project on my Raspberry Pico W, this was just a fun way to interact with it.*
