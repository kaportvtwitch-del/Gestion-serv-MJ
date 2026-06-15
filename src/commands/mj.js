const {
  SlashCommandBuilder,
  ChannelType
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mj")
    .setDescription("Gestion JDR complète")

    // =====================
    // AJOUT JDR
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
    )

    // =====================
    // SUPPRIMER
    // =====================
    .addSubcommand(sub =>
      sub
        .setName("delete")
        .setDescription("Supprimer une catégorie JDR")
        .addStringOption(o =>
          o.setName("category_id")
            .setDescription("ID de la catégorie")
            .setRequired(true)
        )
    )

    // =====================
    // GESTION GROUP
    // =====================
    .addSubcommandGroup(group =>
      group
        .setName("gestion")
        .setDescription("Gestion des rôles MJ")

        .addSubcommand(sub =>
          sub
            .setName("add")
            .setDescription("Ajouter un rôle MJ")
        )

        .addSubcommand(sub =>
          sub
            .setName("list")
            .setDescription("Lister les rôles MJ")
        )

        .addSubcommand(sub =>
          sub
            .setName("delete")
            .setDescription("Supprimer un rôle MJ")
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();
    const guild = interaction.guild;

    console.log("[MJ] sub =", sub, "| group =", group);

    // =====================
    // SAFETY DEFAULT (évite crash silencieux)
    // =====================
    const safeReply = async (msg) => {
      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({ content: msg, ephemeral: true });
      }
      return interaction.reply({ content: msg, ephemeral: true });
    };

    try {

      // =====================
      // CREATE JDR
      // =====================
      if (sub === "add") {
        const name = interaction.options.getString("nom");

        const category = await guild.channels.create({
          name,
          type: ChannelType.GuildCategory
        });

        return safeReply(`✅ JDR "${name}" créé (${category.id})`);
      }

      // =====================
      // DELETE CATEGORY
      // =====================
      if (sub === "delete") {
        const id = interaction.options.getString("category_id");

        const category = guild.channels.cache.get(id);

        if (!category || category.type !== ChannelType.GuildCategory) {
          return safeReply("❌ Catégorie invalide");
        }

        const channels = guild.channels.cache.filter(c => c.parentId === id);

        for (const ch of channels.values()) {
          await ch.delete().catch(() => {});
        }

        await category.delete().catch(() => {});

        return safeReply("🗑️ Catégorie supprimée");
      }

      // =====================
      // GESTION ADD
      // =====================
      if (group === "gestion" && sub === "add") {
        return safeReply("✅ gestion add OK");
      }

      // =====================
      // GESTION LIST
      // =====================
      if (group === "gestion" && sub === "list") {
        return safeReply("📜 gestion list OK");
      }

      // =====================
      // GESTION DELETE
      // =====================
      if (group === "gestion" && sub === "delete") {
        return safeReply("🗑️ gestion delete OK");
      }

      // =====================
      // FALLBACK (IMPORTANT)
      // =====================
      return safeReply("⚠️ commande inconnue");

    } catch (err) {
      console.error("[MJ ERROR]", err);
      return safeReply("❌ erreur interne commande MJ");
    }
  }
};