const fs = require("fs");
const path = require("path");

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

// =====================
// DEBUG START
// =====================
console.log("====================================");
console.log("🚀 BOT START");
console.log("PID:", process.pid);
console.log("====================================");

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =====================
// COMMANDS
// =====================
client.commands = new Collection();

// ⚠️ ici tu gardes ton système de commandes existant
// (mj command déjà définie chez toi)

// =====================
// INTERACTION HANDLER (DEBUG AJOUTÉ)
// =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // 🔥 DEBUG AJOUTÉ (ce que tu m’as demandé)
  console.log("================================");
  console.log("COMMAND:", interaction.commandName);
  console.log("SUB:", interaction.options.getSubcommand(false));
  console.log("GROUP:", interaction.options.getSubcommandGroup(false));
  console.log("PID:", process.pid);
  console.log("TIME:", Date.now());
  console.log("================================");

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error("❌ ERROR COMMAND:", err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur commande",
        ephemeral: true
      });
    }
  }
});

// =====================
// READY
// =====================
client.once("clientReady", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);
  console.log(`🆔 PID actif : ${process.pid}`);

  await deployCommands();
});

// =====================
// DEPLOY COMMANDS
// =====================
async function deployCommands() {
  const commands = [
    client.commands.get("mj").data.toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  console.log("🚀 Deploy commands...");

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("✅ Commands OK");
}

// =====================
// LOGIN
// =====================
client.login(process.env.DISCORD_TOKEN);