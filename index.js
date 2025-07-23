const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();
const keepAlive = require('./keep_alive');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const countData = new Map(); // channelId => { lastNumber, lastUserId }

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const channel = message.channel;

  // Only run in channels with "count" in the name
  if (!channel.name.toLowerCase().includes('count')) return;

  const content = message.content.trim();
  const channelId = channel.id;

  // Check if content is a valid positive integer
  if (!/^\d+$/.test(content)) return;

  const number = parseInt(content);

  if (!countData.has(channelId)) {
    countData.set(channelId, { lastNumber: 0, lastUserId: null });
  }

  const { lastNumber, lastUserId } = countData.get(channelId);

  // If number is wrong or same user as last time
  if (number !== lastNumber + 1 || message.author.id === lastUserId) {
    await message.react('❌');
    await channel.send(`${message.author} ruined it at **${number}** 💥`);
    countData.set(channelId, { lastNumber: 0, lastUserId: null });
    await message.delete().catch(() => {});
    return;
  }

  // Valid count
  await message.react('✅');
  countData.set(channelId, {
    lastNumber: number,
    lastUserId: message.author.id
  });
});

keepAlive();
client.login(process.env.TOKEN);
