require("./deploy-commands.js");
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
const fs = require("fs");
const path = require("path");
const process = require("process");

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes
} = require("discord.js");

// =====================
// CONFIG
// =====================
const LOCK_FILE = path.join(__dirname, "../bot.lock");
const LOG = (...args) => console.log("[BOT]", ...args);

// =====================
// ANTI DOUBLE INSTANCE (FIABLE)
// =====================
function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const pid = fs.readFileSync(LOCK_FILE, "utf8");

      try {
        process.kill(parseInt(pid), 0);
        LOG("⛔ Bot déjà actif (PID:", pid, ") → EXIT");
        process.exit(0);
      } catch {
        LOG("🧹 Ancien lock mort supprimé");
      }
    }

    fs.writeFileSync(LOCK_FILE, process.pid.toString(), "utf8");

    process.on("exit", () => {
      if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    });

    LOG("🔐 LOCK ACQUIS");
  } catch (err) {
    LOG("❌ LOCK ERROR", err);
  }
}

acquireLock();

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// =====================
// GLOBAL ERROR HANDLING (ANTI CRASH)
// =====================
process.on("uncaughtException", (err) => {
  LOG("💥 UNCAUGHT EXCEPTION");
  console.error(err);
});

process.on("unhandledRejection", (err) => {
  LOG("💥 UNHANDLED REJECTION");
  console.error(err);
});

// =====================
// CLEAN LOG SYSTEM
// =====================
function logCommand(interaction) {
  LOG("================================");
  LOG("CMD:", interaction.commandName);
  LOG("SUB:", interaction.options.getSubcommand(false));
  LOG("ID:", interaction.id);
  LOG("USER:", interaction.user.tag);
  LOG("================================");
}

// =====================
// INTERACTIONS
// =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  logCommand(interaction);

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
    LOG("✅ EXEC OK");
  } catch (err) {
    LOG("❌ COMMAND ERROR");
    console.error(err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur serveur",
        ephemeral: true
      });
    }
  }
});

// =====================
// READY
// =====================
client.once("clientReady", async () => {
  LOG("🚀 CONNECTÉ:", client.user.tag);
  LOG("PID:", process.pid);

  await deployCommands();
});

// =====================
// DEPLOY COMMANDS
// =====================
async function deployCommands() {
  const commands = client.commands.map(c => c.data.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  LOG("🚀 DEPLOY COMMANDS...");

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  LOG("✅ COMMANDS OK");
}

// =====================
// AUTO RECOVERY SYSTEM
// =====================
function restart() {
  LOG("🔁 AUTO RESTART TRIGGERED");

  setTimeout(() => {
    process.exit(1);
  }, 1000);
}

process.on("exit", () => {
  LOG("👋 BOT STOPPED");
});

// =====================
// LOGIN
// =====================
client.login(process.env.DISCORD_TOKEN);