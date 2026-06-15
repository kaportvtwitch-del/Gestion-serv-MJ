const fs = require("fs");
const path = require("path");

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
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

client.commands = new Collection();

// =====================
// DATA
// =====================
const dataPath = path.join(__dirname, "../data.json");

function loadData() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ guilds: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

let data = loadData();

function getGuildData(guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = { allowedRoles: [] };
  }
  return data.guilds[guildId];
}

// =====================
// MJ PERMISSIONS (MJ ROLE)
// =====================
const mjPermissions = [
  PermissionsBitField.Flags.ViewChannel,
  PermissionsBitField.Flags.SendMessages,
  PermissionsBitField.Flags.ManageMessages,
  PermissionsBitField.Flags.ReadMessageHistory,
  PermissionsBitField.Flags.Connect,
  PermissionsBitField.Flags.Speak,
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.ManageRoles
];

// =====================
// INTERACTION HANDLER (DEBUG SAFE)
// =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  console.log("\n==============================");
  console.log("CMD:", interaction.commandName);
  console.log("SUB:", interaction.options.getSubcommand(false));
  console.log("GROUP:", interaction.options.getSubcommandGroup(false));
  console.log("==============================\n");

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    if (interaction.deferred || interaction.replied) return;
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

// =====================
// READY
// =====================
client.once("clientReady", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);
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