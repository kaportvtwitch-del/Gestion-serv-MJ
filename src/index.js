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

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =====================
// DATA JSON
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
// PERMISSIONS MJ (SAFE)
// =====================
const ownerPermissions = [
  // =====================
  // VIEW / TEXT
  // =====================
  PermissionsBitField.Flags.ViewChannel,
  PermissionsBitField.Flags.SendMessages,
  PermissionsBitField.Flags.SendMessagesInThreads,
  PermissionsBitField.Flags.CreatePublicThreads,
  PermissionsBitField.Flags.CreatePrivateThreads,
  PermissionsBitField.Flags.ManageMessages,
  PermissionsBitField.Flags.EmbedLinks,
  PermissionsBitField.Flags.AttachFiles,
  PermissionsBitField.Flags.ReadMessageHistory,
  PermissionsBitField.Flags.AddReactions,
  PermissionsBitField.Flags.UseExternalEmojis,
  PermissionsBitField.Flags.UseExternalStickers,
  PermissionsBitField.Flags.SendTTSMessages,
  PermissionsBitField.Flags.UseApplicationCommands,

  // =====================
  // 🔥 GESTION SALONS (IMPORTANT)
  // =====================
  PermissionsBitField.Flags.ManageChannels,

  // =====================
  // 🔥 GESTION THREADS
  // =====================
  PermissionsBitField.Flags.ManageThreads,

  // =====================
  // 🎙️ VOICE
  // =====================
  PermissionsBitField.Flags.Connect,
  PermissionsBitField.Flags.Speak,
  PermissionsBitField.Flags.Stream,
  PermissionsBitField.Flags.UseVAD,
  PermissionsBitField.Flags.PrioritySpeaker,
  PermissionsBitField.Flags.RequestToSpeak,
  PermissionsBitField.Flags.UseEmbeddedActivities
];

// =====================
// COMMANDS
// =====================
client.commands = new Collection();

// =====================
// MJ COMMAND
// =====================
client.commands.set("mj", {
  data: new SlashCommandBuilder()
    .setName("mj")
    .setDescription("Gestion des JDR")

    // CREATE
    .addSubcommand(sub =>
      sub
        .setName("ajouter")
        .setDescription("Créer un JDR")
        .addStringOption(o => o.setName("nom").setRequired(true))
        .addUserOption(o => o.setName("owner").setRequired(true))
    )

    // AUTHORIZE ROLE
    .addSubcommand(sub =>
      sub
        .setName("add-gestion")
        .setDescription("Autoriser un rôle à créer des JDR")
        .addRoleOption(o => o.setName("role").setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const guildData = getGuildData(guild.id);

    // =====================
    // ADD ROLE AUTH
    // =====================
    if (sub === "add-gestion") {
      if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: "❌ Admin uniquement",
          ephemeral: true
        });
      }

      const role = interaction.options.getRole("role");

      if (!guildData.allowedRoles.includes(role.id)) {
        guildData.allowedRoles.push(role.id);
        saveData(data);
      }

      return interaction.reply({
        content: `✅ Rôle **${role.name}** autorisé sur ce serveur`,
        ephemeral: true
      });
    }

    // =====================
    // CREATE JDR
    // =====================
    if (sub === "ajouter") {
      const member = interaction.member;

      const isAllowed = member.roles.cache.some(r =>
        guildData.allowedRoles.includes(r.id)
      );

      if (!isAllowed) {
        return interaction.reply({
          content: "❌ Tu n'as pas la permission d'utiliser cette commande",
          ephemeral: true
        });
      }

      const name = interaction.options.getString("nom");
      const owner = interaction.options.getUser("owner");

      const target = await guild.members.fetch(owner.id);

      const role = await guild.roles.create({
        name: `MJ - ${name}`,
        permissions: []
      });

      await target.roles.add(role);

      const category = await guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: role.id,
            allow: ownerPermissions
          },
          {
            id: target.id,
            allow: ownerPermissions
          }
        ]
      });

      await guild.channels.create({
        name: "général",
        type: ChannelType.GuildText,
        parent: category.id
      });

      await guild.channels.create({
        name: "hrp",
        type: ChannelType.GuildText,
        parent: category.id
      });

      await guild.channels.create({
        name: "vocal",
        type: ChannelType.GuildVoice,
        parent: category.id
      });

      return interaction.reply({
        content: `✅ JDR **${name}** créé avec succès`,
        ephemeral: true
      });
    }
  }
});

// =====================
// DEPLOY COMMANDS
// =====================
async function deployCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("mj")
      .setDescription("Gestion JDR")

      .addSubcommand(sub =>
        sub.setName("ajouter")
          .setDescription("Créer un JDR")
          .addStringOption(o => o.setName("nom").setRequired(true))
          .addUserOption(o => o.setName("owner").setRequired(true))
      )

      .addSubcommand(sub =>
        sub.setName("add-gestion")
          .setDescription("Autoriser un rôle MJ")
          .addRoleOption(o => o.setName("role").setRequired(true))
      )
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("🚀 Deploy slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("✅ Commands OK");
  } catch (err) {
    console.error(err);
  }
}

// =====================
// READY
// =====================
client.once("ready", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);
  await deployCommands();
});

// =====================
// LOGIN
// =====================
client.login(process.env.DISCORD_TOKEN);