const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../../data.json");

// =====================
// LOAD / SAVE SAFE
// =====================
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { guilds: {} };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// =====================
// INIT GUILD SAFE
// =====================
function ensureGuild(data, guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      mjRoles: []
    };
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mj")
    .setDescription("Système JDR multi-serveur")

    // =====================
    // CREATE JDR
    // =====================
    .addSubcommand(sub =>
      sub
        .setName("add")
        .setDescription("Créer un JDR")
        .addStringOption(o =>
          o.setName("nom")
            .setDescription("Nom du JDR")
            .setRequired(true)
        )
        .addUserOption(o =>
          o.setName("owner")
            .setDescription("Propriétaire du JDR")
            .setRequired(true)
        )
    )

    // =====================
    // DELETE JDR
    // =====================
    .addSubcommand(sub =>
      sub
        .setName("delete")
        .setDescription("Supprimer un JDR")
        .addStringOption(o =>
          o.setName("category_id")
            .setDescription("ID catégorie")
            .setRequired(true)
        )
    )

    // =====================
    // GESTION GROUP
    // =====================
    .addSubcommandGroup(group =>
      group
        .setName("gestion")
        .setDescription("Gestion MJ (admin only)")

        .addSubcommand(sub =>
          sub
            .setName("add")
            .setDescription("Ajouter rôle MJ")
            .addRoleOption(o =>
              o.setName("role")
                .setDescription("Rôle autorisé")
                .setRequired(true)
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
              o.setName("role")
                .setDescription("Rôle à retirer")
                .setRequired(true)
            )
        )
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    const sub = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();

    const data = loadData();

    ensureGuild(data, guild.id);

    const guildData = data.guilds[guild.id];

    const isAdmin = interaction.member.permissions.has(
      PermissionFlagsBits.Administrator
    );

    // =====================
    // CREATE JDR
    // =====================
    if (sub === "add") {
      const name = interaction.options.getString("nom");
      const owner = interaction.options.getUser("owner");

      const category = await guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          }
        ]
      });

      const member = await guild.members.fetch(owner.id);

      const role = await guild.roles.create({
        name: `MJ-${name}`,
        permissions: []
      });

      await member.roles.add(role);

      await category.permissionOverwrites.create(role, {
        ViewChannel: true,
        SendMessages: true,
        ManageChannels: true,
        ManageRoles: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true,
        Connect: true,
        Speak: true
      });

      return interaction.reply({
        content: `✅ JDR "${name}" créé`,
        ephemeral: true
      });
    }

    // =====================
    // DELETE JDR
    // =====================
    if (sub === "delete") {
      const id = interaction.options.getString("category_id");

      const category = guild.channels.cache.get(id);

      if (!category || category.type !== ChannelType.GuildCategory) {
        return interaction.reply({
          content: "❌ catégorie invalide",
          ephemeral: true
        });
      }

      const channels = guild.channels.cache.filter(c => c.parentId === id);

      for (const ch of channels.values()) {
        await ch.delete().catch(() => {});
      }

      await category.delete().catch(() => {});

      return interaction.reply({
        content: "🗑️ JDR supprimé",
        ephemeral: true
      });
    }

    // =====================
    // GESTION SYSTEM (ADMIN ONLY)
    // =====================
    if (group === "gestion") {

      if (!isAdmin) {
        return interaction.reply({
          content: "⛔ admin uniquement",
          ephemeral: true
        });
      }

      // ADD ROLE
      if (sub === "add") {
        const role = interaction.options.getRole("role");

        if (!guildData.mjRoles.includes(role.id)) {
          guildData.mjRoles.push(role.id);
        }

        saveData(data);

        return interaction.reply({
          content: `✅ rôle ajouté: ${role.name}`,
          ephemeral: true
        });
      }

      // LIST ROLE
      if (sub === "list") {
        const list = guildData.mjRoles;

        const text = list.length
          ? list.map(r => `<@&${r}>`).join("\n")
          : "Aucun rôle MJ";

        return interaction.reply({
          content: `📜 rôles MJ:\n${text}`,
          ephemeral: true
        });
      }

      // DELETE ROLE
      if (sub === "delete") {
        const role = interaction.options.getRole("role");

        if (!guildData.mjRoles.includes(role.id)) {
          return interaction.reply({
            content: "❌ ce rôle n'est pas gestionnaire",
            ephemeral: true
          });
        }

        guildData.mjRoles = guildData.mjRoles.filter(r => r !== role.id);

        saveData(data);

        return interaction.reply({
          content: `🗑️ rôle supprimé: ${role.name}`,
          ephemeral: true
        });
      }
    }
  }
};