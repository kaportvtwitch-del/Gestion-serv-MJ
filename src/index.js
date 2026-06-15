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
// GLOBAL LOCK (multi-process safe inside runtime)
// =====================
if (!global.__MJ_BOT_RUNNING__) {
  global.__MJ_BOT_RUNNING__ = true;
} else {
  console.log("⛔ INSTANCE DOUBLON DETECTÉE → STOP");
  process.exit(0);
}

// =====================
// COMMANDS
// =====================
client.commands = new Collection();

// ⚠️ ton système MJ reste identique ici

// =====================
// INTERACTION HANDLER (SAFE)
// =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

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
    if (interaction.deferred || interaction.replied) {
      console.log("⛔ INTERACTION IGNORÉE (déjà traitée)");
      return;
    }

    await command.execute(interaction);

  } catch (err) {
    console.error("❌ ERROR:", err);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Erreur commande",
        ephemeral: true
      });
    }
  }
});

// =====================
// READY (FIX FINAL ANTI DOUBLE INSTANCE)
// =====================
client.once("clientReady", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);
  console.log(`🆔 PID actif : ${process.pid}`);

  // 🔥 ANTI DOUBLE INSTANCE RÉEL (après connexion Discord)
  if (global.__MJ_BOT_ACTIVE__) {
    console.log("⛔ DOUBLE INSTANCE APRÈS LOGIN → EXIT");
    process.exit(0);
  }

  global.__MJ_BOT_ACTIVE__ = true;

  console.log("🔐 INSTANCE UNIQUE CONFIRMÉE");

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