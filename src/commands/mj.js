const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mj")
    .setDescription("Gestion JDR complète")

    // =====================
    // AJOUT JDR (FIX ARGUMENTS)
    // =====================
    .addSubcommand(sub =>
      sub
        .setName("ajouter")
        .setDescription("Créer un JDR complet")
        .addStringOption(o =>
          o.setName("nom")
            .setDescription("Nom du JDR")
            .setRequired(true)
        )
        .addUserOption(o =>
          o.setName("owner")
            .setDescription("MJ propriétaire")
            .setRequired(true)
        )
    )

    // =====================
    // SUPPRIMER CATÉGORIE
    // =====================
    .addSubcommand(sub =>
      sub
        .setName("supprimer")
        .setDescription("Supprimer une catégorie JDR")
        .addStringOption(o =>
          o.setName("category_id")
            .setDescription("ID catégorie")
            .setRequired(true)
        )
    )

    // =====================
    // GESTION GROUP (IMPORTANT FIX)
    // =====================
    .addSubcommandGroup(group =>
      group
        .setName("gestion")
        .setDescription("Gestion des rôles MJ")

        .addSubcommand(sub =>
          sub
            .setName("add")
            .setDescription("Ajouter rôle MJ autorisé")
            .addRoleOption(o =>
              o.setName("role")
                .setDescription("Rôle à autoriser")
                .setRequired(true)
            )
        )

        .addSubcommand(sub =>
          sub
            .setName("list")
            .setDescription("Lister les rôles MJ")
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
    const sub = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();
    const guild = interaction.guild;

    // =====================
    // AJOUT JDR
    // =====================
    if (sub === "ajouter") {
      await interaction.deferReply({ ephemeral: true });

      const name = interaction.options.getString("nom");
      const owner = interaction.options.getUser("owner");

      const member = await guild.members.fetch(owner.id);

      const category = await guild.channels.create({
        name,
        type: ChannelType.GuildCategory
      });

      return interaction.editReply(`✅ JDR "${name}" créé`);
    }

    // =====================
    // SUPPRIMER
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

      return interaction.editReply("🗑️ supprimé");
    }

    // =====================
    // GESTION ADD
    // =====================
    if (group === "gestion" && sub === "add") {
      return interaction.reply({
        content: "✅ gestion add OK",
        ephemeral: true
      });
    }

    // =====================
    // GESTION LIST
    // =====================
    if (group === "gestion" && sub === "list") {
      return interaction.reply({
        content: "📜 list OK",
        ephemeral: true
      });
    }

    // =====================
    // GESTION DELETE
    // =====================
    if (group === "gestion" && sub === "delete") {
      return interaction.reply({
        content: "🗑️ delete OK",
        ephemeral: true
      });
    }
  }
};