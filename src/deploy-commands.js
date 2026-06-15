const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

// =====================
// LOG CLEAN
// =====================
const log = (...args) => console.log("[DEPLOY]", ...args);

// =====================
// LOAD COMMANDS DYNAMICALLY
// =====================
function loadCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, "commands");

  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const cmd = require(path.join(commandsPath, file));

    if (!cmd?.data) continue;

    commands.push(cmd.data.toJSON());
  }

  return commands;
}

// =====================
// DEPLOY FUNCTION
// =====================
async function deploy() {
  try {
    log("🚀 Starting deploy...");

    const commands = loadCommands();

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

    log(`📦 Commands found: ${commands.length}`);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    log("✅ Commands deployed successfully");
  } catch (err) {
    log("❌ Deploy failed");
    console.error(err);
    process.exit(1);
  }
}

// =====================
// RUN
// =====================
deploy();