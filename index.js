require('dotenv').config();
const Discord = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_PRESENCES"] });

const configuration = new Configuration({
    apiKey: process.env.API
});
const openai = new OpenAIApi(configuration);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        status: 'online',
        activity: {
            type: 'PLAYING',
            name: 'Ready to chat!'
        }
    });
});

// Store the previous messages in an array
const chatContext = [];

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;

    // Binary search for "who are you?" or "what is your name?" in a sorted array of possible inputs
    const input = msg.content.toLowerCase();
    const possibleInputs = ['who are you?', 'what is your name?'];
    let left = 0;
    let right = possibleInputs.length - 1;
    let found = false;
    while (left <= right && !found) {
        const mid = Math.floor((left + right) / 2);
        if (input === possibleInputs[mid]) {
            found = true;
            msg.channel.send(`I am ${client.user.username}`);
        } else if (input < possibleInputs[mid]) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }

    // Add the current message to the chat context
    chatContext.push(`${msg.author.username}\n${msg.content}`);

    // If the input is not "who are you?" or "what is your name?", generate a response using the OpenAI API
    if (!found) {
        try {
            const timestamp = new Date().toISOString();
            const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: `${client.user.username}\n${msg.author.username}\nTimestamp: ${timestamp}\nContext: ${chatContext.join('\n')}\n\n`,
                n: 1,
                max_tokens: 4000,
                stop: null,
                temperature: 0.7
            });

            msg.channel.send(`<@${msg.author.id}>: ${response.data.choices[0].text}`);

            // Only keep the last 10 messages in the chat context array
            chatContext.splice(0, chatContext.length - 10);
        } catch (error) {
            console.error(error);
            msg.reply(`<@${msg.author.id}>:` + 'Oops, something went wrong!');
        }
    }
});

client.login(process.env.TOKEN);
