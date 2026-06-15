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
// START LOG
// =====================
console.log("====================================");
console.log("🚀 BOT START");
console.log("PID:", process.pid);
console.log("====================================");

// =====================
// ANTI DOUBLE INSTANCE SIMPLE SAFE
// =====================
if (!global.__MJ_BOT_RUNNING__) {
  global.__MJ_BOT_RUNNING__ = true;
} else {
  console.log("⛔ INSTANCE DOUBLON DETECTÉE → STOP");
  process.exit(0);
}

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

// =====================
// INTERACTION HANDLER (FULL DEBUG)
// =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // 🔥 DEBUG 1 : réception Discord
  console.log("\n==============================");
  console.log("📩 DISCORD COMMAND RECEIVED");
  console.log("CMD:", interaction.commandName);
  console.log("SUB:", interaction.options.getSubcommand(false));
  console.log("GROUP:", interaction.options.getSubcommandGroup(false));
  console.log("INTERACTION ID:", interaction.id);
  console.log("PID:", process.pid);
  console.log("==============================\n");

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.log("❌ COMMAND NOT FOUND");
    return;
  }

  try {
    console.log("⚙️ HANDLER START EXECUTION");

    await command.execute(interaction);

    console.log("✅ COMMAND EXECUTION FINISHED");
    console.log("📤 RESPONSE SENT OR DEFERRED");

  } catch (err) {
    console.log("❌ ERROR DURING COMMAND EXECUTION");
    console.error(err);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Erreur commande",
        ephemeral: true
      });
    }
  }
});

// =====================
// READY EVENT
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