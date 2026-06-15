const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mj")
    .setDescription("Gestion JDR")
    .addSubcommand(sub =>
      sub.setName("ajouter")
        .setDescription("Créer un JDR")
    )
    .addSubcommand(sub =>
      sub.setName("supprimer")
        .setDescription("Supprimer une catégorie")
        .addStringOption(o =>
          o.setName("category_id").setDescription("ID").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    // =====================
    // CREATE (simplifié)
    // =====================
    if (sub === "ajouter") {
      await interaction.deferReply({ ephemeral: true });

      const category = await guild.channels.create({
        name: "JDR",
        type: ChannelType.GuildCategory
      });

      return interaction.editReply("✅ JDR créé");
    }

    // =====================
    // DELETE CATEGORY
    // =====================
    if (sub === "supprimer") {
      await interaction.deferReply({ ephemeral: true });

      const id = interaction.options.getString("category_id");
      const cat = guild.channels.cache.get(id);

      if (!cat) {
        return interaction.editReply("❌ introuvable");
      }

      const channels = guild.channels.cache.filter(c => c.parentId === id);

      for (const ch of channels.values()) {
        await ch.delete().catch(() => {});
      }

      await cat.delete().catch(() => {});

      return interaction.editReply("🗑️ supprimé");
    }
  }
};