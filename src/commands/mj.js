const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mj")
    .setDescription("Gestion des JDR")
    .addSubcommand(sub =>
      sub
        .setName("ajouter")
        .setDescription("Créer un JDR complet")
        .addStringOption(opt =>
          opt.setName("nom")
            .setDescription("Nom du JDR")
            .setRequired(true)
        )
        .addUserOption(opt =>
          opt.setName("owner")
            .setDescription("MJ propriétaire")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const name = interaction.options.getString("nom");
    const owner = interaction.options.getUser("owner");

    const guild = interaction.guild;
    const member = await guild.members.fetch(owner.id);

    // ROLE
    const role = await guild.roles.create({
      name,
      permissions: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageMessages
      ]
    });

    await member.roles.add(role);

    // CATEGORY
    const category = await guild.channels.create({
      name,
      type: 4,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: role.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.Connect
          ]
        },
        {
          id: member.id,
          allow: [
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.ViewChannel
          ]
        }
      ]
    });

    // CHANNELS
    await guild.channels.create({
      name: "général",
      type: 0,
      parent: category.id
    });

    await guild.channels.create({
      name: "hrp",
      type: 0,
      parent: category.id
    });

    await guild.channels.create({
      name: "vocal",
      type: 2,
      parent: category.id
    });

    await interaction.reply(`✅ JDR **${name}** créé !`);
  }
};