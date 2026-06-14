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
// COMMAND HANDLER
// =====================
client.commands = new Collection();

// =====================
// COMMAND MJ
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

        // ADD
        .addSubcommand(sub =>
          sub
            .setName("add")
            .setDescription("Ajouter rôle gestionnaire")
            .addRoleOption(o =>
              o.setName("role").setDescription("Rôle").setRequired(true)
            )
        )

        // LIST
        .addSubcommand(sub =>
          sub
            .setName("list")
            .setDescription("Lister les rôles gestionnaires")
        )

        // DELETE
        .addSubcommand(sub =>
          sub
            .setName("delete")
            .setDescription("Supprimer rôle gestionnaire")
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
    // GESTION ADD
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
        content: `✅ ${role.name} ajouté comme gestionnaire MJ`,
        ephemeral: true
      });
    }

    // =====================
    // GESTION LIST
    // =====================
    if (group === "gestion" && sub === "list") {
      const roles = guildData.allowedRoles
        .map(id => guild.roles.cache.get(id))
        .filter(Boolean)
        .map(r => `• ${r.name}`)
        .join("\n");

      return interaction.reply({
        content: roles.length
          ? `📋 Rôles MJ :\n${roles}`
          : "❌ Aucun rôle MJ configuré",
        ephemeral: true
      });
    }

    // =====================
    // GESTION DELETE
    // =====================
    if (group === "gestion" && sub === "delete") {
      if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const role = interaction.options.getRole("role");

      if (!guildData.allowedRoles.includes(role.id)) {
        return interaction.reply({
          content: "❌ Ce rôle n'est pas gestionnaire",
          ephemeral: true
        });
      }

      guildData.allowedRoles = guildData.allowedRoles.filter(id => id !== role.id);
      saveData(data);

      return interaction.reply({
        content: `🗑️ ${role.name} supprimé des gestionnaires MJ`,
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
// DEPLOY COMMANDS FIX
// =====================
async function deployCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("mj")
      .setDescription("Gestion des JDR")

      .addSubcommand(sub =>
        sub
          .setName("ajouter")
          .setDescription("Créer un JDR")
          .addStringOption(o =>
            o.setName("nom").setDescription("Nom du JDR").setRequired(true)
          )
          .addUserOption(o =>
            o.setName("owner").setDescription("MJ").setRequired(true)
          )
      )

      .addSubcommandGroup(group =>
        group
          .setName("gestion")
          .setDescription("Gestion MJ")

          .addSubcommand(sub =>
            sub.setName("add")
              .setDescription("Ajouter rôle MJ")
              .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true))
          )

          .addSubcommand(sub =>
            sub.setName("list")
              .setDescription("Lister rôles MJ")
          )

          .addSubcommand(sub =>
            sub.setName("delete")
              .setDescription("Supprimer rôle MJ")
              .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true))
          )
      )
      .toJSON()
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
  } catch (e) {
    console.error(e);
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