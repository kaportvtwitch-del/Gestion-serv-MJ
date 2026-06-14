const { Client, GatewayIntentBits, Collection } = require("discord.js");

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const mj = require("./commands/mj");
client.commands.set(mj.data.name, mj);

client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur commande",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);