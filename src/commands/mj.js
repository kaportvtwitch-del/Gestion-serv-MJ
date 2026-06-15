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
// SAFE DATA
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

    .addSubcommand(sub =>
      sub
        .setName("add")
        .setDescription("Créer un JDR")
        .addStringOption(o =>
          o.setName("nom").setDescription("Nom du JDR").setRequired(true)
        )
        .addUserOption(o =>
          o.setName("owner").setDescription("Propriétaire").setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("delete")
        .setDescription("Supprimer un JDR")
        .addStringOption(o =>
          o.setName("category_id").setDescription("ID catégorie").setRequired(true)
        )
    )

    .addSubcommandGroup(group =>
      group
        .setName("gestion")
        .setDescription("Gestion MJ")

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
    try {
      console.log("[MJ] START");

      // 🔥 IMPORTANT : évite timeout Discord
      await interaction.deferReply({ ephemeral: true });

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
      if (sub === "add" && !group) {
        const name = interaction.options.getString("nom");
        const owner = interaction.options.getUser("owner");

        console.log("[MJ] CREATE JDR:", name);

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

        return interaction.editReply(
          `✅ JDR "${name}" créé`
        );
      }

      // =====================
      // DELETE JDR
      // =====================
      if (sub === "delete") {
        const id = interaction.options.getString("category_id");

        console.log("[MJ] DELETE CATEGORY:", id);

        const category = guild.channels.cache.get(id);

        if (!category || category.type !== ChannelType.GuildCategory) {
          return interaction.editReply("❌ catégorie invalide");
        }

        const channels = guild.channels.cache.filter(
          c => c.parentId === id
        );

        for (const ch of channels.values()) {
          await ch.delete().catch(console.error);
        }

        await category.delete().catch(console.error);

        return interaction.editReply("🗑️ JDR supprimé");
      }

      // =====================
      // GESTION MJ SYSTEM
      // =====================
      if (group === "gestion") {
        if (!isAdmin) {
          return interaction.editReply("⛔ admin uniquement");
        }

        // ADD ROLE
        if (sub === "add") {
          const role = interaction.options.getRole("role");

          if (!guildData.mjRoles.includes(role.id)) {
            guildData.mjRoles.push(role.id);
            saveData(data);
          }

          return interaction.editReply(`✅ rôle ajouté: ${role.name}`);
        }

        // LIST
        if (sub === "list") {
          const list = guildData.mjRoles;

          const text = list.length
            ? list.map(r => `<@&${r}>`).join("\n")
            : "Aucun rôle MJ";

          return interaction.editReply(`📜 rôles MJ:\n${text}`);
        }

        // DELETE ROLE
        if (sub === "delete") {
          const role = interaction.options.getRole("role");

          if (!guildData.mjRoles.includes(role.id)) {
            return interaction.editReply("❌ rôle non trouvé");
          }

          guildData.mjRoles = guildData.mjRoles.filter(
            r => r !== role.id
          );

          saveData(data);

          return interaction.editReply(`🗑️ rôle supprimé: ${role.name}`);
        }
      }

      return interaction.editReply("❓ commande inconnue");

    } catch (err) {
      console.error("[MJ ERROR]", err);

      // évite crash silencieux + réponse Discord propre
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply("❌ Une erreur est survenue.");
      } else {
        return interaction.reply({
          content: "❌ Une erreur est survenue.",
          ephemeral: true
        });
      }
    }
  }
};