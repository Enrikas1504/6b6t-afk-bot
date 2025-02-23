const mineflayer = require('mineflayer');

// Microsoft authentication with your Microsoft account (use email)
const bot = mineflayer.createBot({
  host: '6b6t.org',       // Minecraft server address
  username: '', // Your Microsoft account email
  auth: 'microsoft',      
});

// Handle bot events
bot.on('kicked', console.log);
bot.on('error', console.log);

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  bot.chat(message);
});
