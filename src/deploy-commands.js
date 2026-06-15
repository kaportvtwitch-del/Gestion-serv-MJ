const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

console.log("[DEPLOY] 🚀 START");
console.log("[DEPLOY] CLIENT_ID =", process.env.CLIENT_ID);
console.log("[DEPLOY] GUILD_ID =", process.env.GUILD_ID);

function loadCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, "commands");

  if (!fs.existsSync(commandsPath)) {
    console.log("[DEPLOY] ❌ commands folder not found");
    return [];
  }

  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  console.log("[DEPLOY] files found:", files.length);

  for (const file of files) {
    const cmd = require(path.join(commandsPath, file));

    if (!cmd?.data) {
      console.log("[DEPLOY] skip:", file);
      continue;
    }

    commands.push(cmd.data.toJSON());
    console.log("[DEPLOY] loaded:", cmd.data.name);
  }

  return commands;
}

async function deploy() {
  try {
    const commands = loadCommands();

    console.log("[DEPLOY] total commands:", commands.length);

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("[DEPLOY] ✅ DONE");
  } catch (err) {
    console.error("[DEPLOY] ❌ ERROR", err);
  }
}

deploy();