const http = require("http");

const PORT_LOCK = 3111;

const server = http.createServer();

server.listen(PORT_LOCK, "127.0.0.1", () => {
  console.log("🔒 LOCK ACQUIS - seul process actif");
});

server.on("error", (err) => {
  console.log("⛔ Autre instance détectée → arrêt");
  process.exit(1);
});

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
// CLIENT
// =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =====================
// COMMANDS
// =====================
client.commands = new Collection();

// ⚠️ ici tu gardes ton command builder MJ déjà existant
// (je ne le réécris pas pour éviter d’écraser ton setup actuel)

// =====================
// INTERACTION HANDLER (FIX DOUBLE EXECUTION)
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
    // 🔥 PROTECTION ANTI DOUBLE EXECUTION
    if (interaction.deferred || interaction.replied) {
      console.log("⛔ Interaction déjà traitée (bloquée)");
      return;
    }

    await command.execute(interaction);
  } catch (err) {
    console.error("❌ ERROR COMMAND:", err);

    if (!interaction.replied && !interaction.deferred) {
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