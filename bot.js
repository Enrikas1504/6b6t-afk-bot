const mineflayer = require('mineflayer');
const readline = require('readline');
const { loader: autoEat } = require('mineflayer-auto-eat');
const axios = require('axios'); 
const { Client, GatewayIntentBits } = require('discord.js');

let bot;
let discordClient;

// Webhook URLs
const chatLogWebhook = ''; // Replace with Webhook
const autoEatLogWebhook = ''; // Replace with Webhook
const joinLeaveLogWebhook = ''; // Replace with Webhook
const messageLogWebhook = ''; // Replace with Webhook

// Function to send logs to a webhook
function sendWebhookLog(url, message) {
  axios.post(url, { content: message })
    .then((response) => {
      console.log(`Log sent: ${message}`);
    })
    .catch((error) => {
      console.error('Error sending log:', error);
    });
}

// Create the Minecraft bot
function createBot() {
  bot = mineflayer.createBot({
    host: '6b6t.org', // Server IP
    username: '',  // Use Email
    auth: 'microsoft',
  });

  bot.once('spawn', async () => {
    bot.loadPlugin(autoEat);
    bot.autoEat.enableAuto();

    bot.autoEat.on('eatStart', (opts) => {
      const message = `Started eating ${opts.food.name} in ${opts.offhand ? 'offhand' : 'hand'}`;
      console.log(message);
      sendWebhookLog(autoEatLogWebhook, message);
    });

    bot.autoEat.on('eatFinish', (opts) => {
      const message = `Finished eating ${opts.food.name}`;
      console.log(message);
      sendWebhookLog(autoEatLogWebhook, message);
    });

    bot.autoEat.on('eatFail', (error) => {
      const message = `Eating failed: ${error}`;
      console.error(message);
      sendWebhookLog(autoEatLogWebhook, message);
    });

    // Send a message in Discord channel when bot is online
    const onlineMessage = 'The Discord Bot is Online';
    const channel = discordClient.channels.cache.get(''); // Replace with the actual channel ID
    if (channel) {
      channel.send(onlineMessage);
    } else {
      console.log('Failed to find channel to send online message.');
    }

    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, 500);
    }, 1000);
  });

  bot.on('health', () => {
    if (bot.health < bot.maxHealth * 0.9) {
      const goldenApple = bot.inventory.findInventoryItem(322, null);
      if (goldenApple) {
        const message = 'Health is low, eating Golden Apple...';
        console.log(message);
        bot.equip(goldenApple, 'hand', () => {
          bot.consume();
          console.log('Golden Apple consumed');
          sendWebhookLog(autoEatLogWebhook, `Golden Apple consumed`);
        });
      } else {
        const message = 'No Golden Apple in inventory!';
        console.log(message);
        sendWebhookLog(autoEatLogWebhook, message);
      }
    }
  });

  bot.on('chat', (username, message) => {
    const logMessage = `[${username}]: ${message}`;
    console.log(logMessage);
    sendWebhookLog(chatLogWebhook, logMessage);
  });

  bot.on('error', (err) => {
    const message = `Error: ${err}`;
    console.log(message);
    sendWebhookLog(joinLeaveLogWebhook, message);
  });

  bot.on('kicked', (reason) => {
    const message = `Bot kicked: ${reason}`;
    console.log(message);
    sendWebhookLog(joinLeaveLogWebhook, message);
  });

  bot.on('end', () => {
    const message = 'Bot disconnected.';
    console.log(message);
    sendWebhookLog(joinLeaveLogWebhook, message);
    attemptReconnect();
  });

  bot.on('spawn', () => {
    const message = 'Minecraft Bot is Online';
    console.log(message);
    sendWebhookLog(joinLeaveLogWebhook, message);
  });
}

// Reconnect function
function attemptReconnect() {
  const message = 'Attempting to reconnect in 5 seconds...';
  console.log(message);
  sendWebhookLog(joinLeaveLogWebhook, message);
  setTimeout(() => {
    createBot();
  }, 5000);
}

// Create the Discord bot
discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

discordClient.once('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
  createBot(); // Start the Minecraft bot when the Discord bot is ready
});

// Listen for messages in Discord
discordClient.on('messageCreate', (message) => {
  if (message.author.bot) return; 

  // Check if the message starts with the command !msg
  if (message.content.startsWith('!msg ')) {
    // Check if the user has the 'admin' role
    if (!message.member.roles.cache.has('')) {  // Replace with the ADMIN ID
      message.reply('You do not have permission to use this command!');
      return;
    }

    const msgToSend = message.content.slice(5); // Extract the message part

    
    const confirmationChannel = discordClient.channels.cache.get('');  // Replace with the actual channel ID
    if (confirmationChannel) {
      confirmationChannel.send(`Message Sent! Check in <#>`); // Replace with the actual channel ID
    }

    // Send the message to Minecraft
    if (bot) {
      try {
        bot.chat(msgToSend);
        console.log(`Sent message to Minecraft: "${msgToSend}"`);

        // Log the message in the designated channel
        const logChannel = discordClient.channels.cache.get(''); // Replace with the actual channel ID
        if (logChannel) {
          logChannel.send(`Message sent to Minecraft: ${msgToSend}`);
        } else {
          console.log('Failed to find channel to log message.');
        }

        const logMessage = `Sent to Minecraft: ${msgToSend}`;
        sendWebhookLog(messageLogWebhook, logMessage);
      } catch (err) {
        console.error('Error sending message to Minecraft:', err);
        message.channel.send(`Message failed: ${err.message}`);
      }
    } else {
      message.channel.send('Minecraft bot is not connected!');
    }
  }
});
discordClient.login(''); // Replace with your Discord bot token
