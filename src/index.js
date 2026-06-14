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
// ERROR HANDLING SAFE
// =====================
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// =====================
// CLIENT
// =====================
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
// MJ PERMISSIONS
// =====================
const mjPermissions = [
  PermissionsBitField.Flags.ViewChannel,
  PermissionsBitField.Flags.SendMessages,
  PermissionsBitField.Flags.ManageMessages,
  PermissionsBitField.Flags.ReadMessageHistory,
  PermissionsBitField.Flags.Connect,
  PermissionsBitField.Flags.Speak,
  PermissionsBitField.Flags.ManageChannels
];

// =====================
// COMMAND STORAGE
// =====================
client.commands = new Collection();

// =====================
// MJ COMMAND
// =====================
client.commands.set("mj", {
  data: new SlashCommandBuilder()
    .setName("mj")
    .setDescription("Gestion des JDR")

    // CREATE JDR
    .addSubcommand(sub =>
      sub
        .setName("ajouter")
        .setDescription("Créer un JDR")
        .addStringOption(o =>
          o.setName("nom").setDescription("Nom du JDR").setRequired(true)
        )
        .addUserOption(o =>
          o.setName("owner").setDescription("MJ propriétaire").setRequired(true)
        )
    )

    // GESTION GROUP
    .addSubcommandGroup(group =>
      group
        .setName("gestion")
        .setDescription("Gestion des rôles MJ")

        .addSubcommand(sub =>
          sub
            .setName("add")
            .setDescription("Ajouter rôle MJ")
            .addRoleOption(o =>
              o.setName("role").setDescription("Rôle").setRequired(true)
            )
        )

        .addSubcommand(sub =>
          sub
            .setName("list")
            .setDescription("Lister rôles MJ")
        )

        .addSubcommand(sub =>
          sub
            .setName("delete")
            .setDescription("Supprimer rôle MJ")
            .addRoleOption(o =>
              o.setName("role").setDescription("Rôle").setRequired(true)
            )
        )
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    const guildData = getGuildData(guild.id);

    const sub = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();

    // =====================
    // ADD ROLE MJ
    // =====================
    if (group === "gestion" && sub === "add") {
      if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const role = interaction.options.getRole("role");

      if (!guildData.allowedRoles.includes(role.id)) {
        guildData.allowedRoles.push(role.id);
        saveData(data);
      }

      return interaction.reply({
        content: `✅ ${role.name} ajouté MJ`,
        ephemeral: true
      });
    }

    // =====================
    // LIST MJ ROLES
    // =====================
    if (group === "gestion" && sub === "list") {
      const roles = guildData.allowedRoles
        .map(id => guild.roles.cache.get(id))
        .filter(Boolean)
        .map(r => `• ${r.name}`)
        .join("\n");

      return interaction.reply({
        content: roles.length
          ? `📋 MJ :\n${roles}`
          : "❌ Aucun rôle MJ",
        ephemeral: true
      });
    }

    // =====================
    // DELETE MJ ROLE
    // =====================
    if (group === "gestion" && sub === "delete") {
      if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const role = interaction.options.getRole("role");

      if (!guildData.allowedRoles.includes(role.id)) {
        return interaction.reply({
          content: "❌ Ce rôle n'est pas MJ",
          ephemeral: true
        });
      }

      guildData.allowedRoles = guildData.allowedRoles.filter(id => id !== role.id);
      saveData(data);

      return interaction.reply({
        content: `🗑️ ${role.name} supprimé MJ`,
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
        return interaction.reply({ content: "❌ Pas autorisé", ephemeral: true });
      }

      const name = interaction.options.getString("nom");
      const owner = interaction.options.getUser("owner");

      const target = await guild.members.fetch(owner.id);

      // MJ ROLE
      const mjRole = await guild.roles.create({
        name: `MJ - ${name}`,
        permissions: []
      });

      // PLAYER ROLE
      const playerRole = await guild.roles.create({
        name: `JDR - ${name}`,
        permissions: []
      });

      await target.roles.add(mjRole);
      await target.roles.add(playerRole);

      // CATEGORY
      const category = await guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: mjRole.id,
            allow: mjPermissions
          },
          {
            id: playerRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.Speak
            ]
          }
        ]
      });

      await guild.channels.create({ name: "général", type: ChannelType.GuildText, parent: category.id });
      await guild.channels.create({ name: "hrp", type: ChannelType.GuildText, parent: category.id });
      await guild.channels.create({ name: "vocal", type: ChannelType.GuildVoice, parent: category.id });

      return interaction.reply({
        content: `✅ JDR **${name}** créé`,
        ephemeral: true
      });
    }
  }
});

// =====================
// INTERACTIONS HANDLER (CRUCIAL)
// =====================
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

// =====================
// DEPLOY COMMANDS
// =====================
async function deployCommands() {
  const commands = [
    client.commands.get("mj").data.toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("🚀 Deploy commands...");
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