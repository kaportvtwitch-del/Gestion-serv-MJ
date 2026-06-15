const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mj")
    .setDescription("Gestion JDR")

    // CREATE
    .addSubcommand(sub =>
      sub
        .setName("ajouter")
        .setDescription("Créer un JDR")
        .addStringOption(o =>
          o.setName("nom").setDescription("Nom JDR").setRequired(true)
        )
        .addUserOption(o =>
          o.setName("owner").setDescription("MJ").setRequired(true)
        )
    )

    // DELETE CATEGORY
    .addSubcommand(sub =>
      sub
        .setName("supprimer")
        .setDescription("Supprimer une catégorie JDR")
        .addStringOption(o =>
          o.setName("category_id").setDescription("ID catégorie").setRequired(true)
        )
    )

    // GESTION
    .addSubcommandGroup(group =>
      group
        .setName("gestion")
        .setDescription("Gestion MJ")

        .addSubcommand(sub =>
          sub.setName("add").setDescription("Ajouter rôle MJ")
            .addRoleOption(o => o.setName("role").setDescription("Rôle").setRequired(true))
        )

        .addSubcommand(sub =>
          sub.setName("list").setDescription("Lister MJ roles")
        )

        .addSubcommand(sub =>
          sub.setName("delete").setDescription("Supprimer MJ role")
            .addRoleOption(o => o.setName("role").setDescription("Rôle").setRequired(true))
        )
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    const sub = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();

    const dataPath = require("path").join(__dirname, "../../data.json");
    const data = JSON.parse(require("fs").readFileSync(dataPath, "utf8"));

    if (!data.guilds[guild.id]) data.guilds[guild.id] = { allowedRoles: [] };
    const guildData = data.guilds[guild.id];

    // =====================
    // AJOUT JDR
    // =====================
    if (sub === "ajouter") {
      await interaction.deferReply({ ephemeral: true });

      const name = interaction.options.getString("nom");
      const owner = interaction.options.getUser("owner");

      const member = await guild.members.fetch(owner.id);

      const mjRole = await guild.roles.create({
        name: `MJ - ${name}`,
        permissions: mjPermissions
      });

      const playerRole = await guild.roles.create({
        name: `JDR - ${name}`,
        permissions: []
      });

      await member.roles.add(mjRole);
      await member.roles.add(playerRole);

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

      await guild.channels.create({ name: "general", type: ChannelType.GuildText, parent: category.id });
      await guild.channels.create({ name: "hrp", type: ChannelType.GuildText, parent: category.id });

      return interaction.editReply(`✅ JDR ${name} créé`);
    }

    // =====================
    // DELETE CATEGORY
    // =====================
    if (sub === "supprimer") {
      await interaction.deferReply({ ephemeral: true });

      const id = interaction.options.getString("category_id");
      const category = guild.channels.cache.get(id);

      if (!category || category.type !== ChannelType.GuildCategory) {
        return interaction.editReply("❌ Catégorie invalide");
      }

      const channels = guild.channels.cache.filter(c => c.parentId === id);

      for (const ch of channels.values()) {
        await ch.delete().catch(() => {});
      }

      await category.delete().catch(() => {});

      return interaction.editReply("🗑️ Catégorie supprimée");
    }

    // =====================
    // GESTION ADD
    // =====================
    if (group === "gestion" && sub === "add") {
      const role = interaction.options.getRole("role");

      if (!guildData.allowedRoles.includes(role.id)) {
        guildData.allowedRoles.push(role.id);
        require("fs").writeFileSync(dataPath, JSON.stringify(data, null, 2));
      }

      return interaction.reply({ content: "✅ Ajouté", ephemeral: true });
    }

    // =====================
    // GESTION LIST
    // =====================
    if (group === "gestion" && sub === "list") {
      const roles = guildData.allowedRoles
        .map(id => guild.roles.cache.get(id))
        .filter(Boolean)
        .map(r => r.name)
        .join("\n");

      return interaction.reply({
        content: roles || "Aucun rôle",
        ephemeral: true
      });
    }

    // =====================
    // GESTION DELETE
    // =====================
    if (group === "gestion" && sub === "delete") {
      const role = interaction.options.getRole("role");

      guildData.allowedRoles = guildData.allowedRoles.filter(id => id !== role.id);
      require("fs").writeFileSync(dataPath, JSON.stringify(data, null, 2));

      return interaction.reply({ content: "🗑️ supprimé", ephemeral: true });
    }
  }
};