const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

const { isAdminMJ } = require('../../utils/permissions');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('mj-ajouter')
        .setDescription('Créer un espace MJ')
        .addStringOption(option =>
            option
                .setName('nom')
                .setDescription('Nom du JDR')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('proprietaire')
                .setDescription('MJ propriétaire')
                .setRequired(true)
        ),

    async execute(interaction) {

        if (!isAdminMJ(interaction.member)) {

            return interaction.reply({
                content: "Tu n'as pas la permission.",
                ephemeral: true
            });
        }

        const nom =
            interaction.options.getString('nom');

        const proprietaire =
            interaction.options.getUser('proprietaire');

        const guild = interaction.guild;

        const role = await guild.roles.create({
            name: nom
        });

        const membre =
            await guild.members.fetch(
                proprietaire.id
            );

        await membre.roles.add(role);

        const category =
            await guild.channels.create({
                name: nom.toUpperCase(),
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [
                            PermissionFlagsBits.ViewChannel
                        ]
                    },
                    {
                        id: role.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.Connect
                        ]
                    },
                    {
                        id: membre.id,
                        allow: [
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.ManageRoles,
                            PermissionFlagsBits.ViewChannel
                        ]
                    }
                ]
            });

        await guild.channels.create({
            name: '📜-annonces',
            type: ChannelType.GuildText,
            parent: category.id
        });

        await guild.channels.create({
            name: '💬-general',
            type: ChannelType.GuildText,
            parent: category.id
        });

        await guild.channels.create({
            name: '🎲-rp',
            type: ChannelType.GuildText,
            parent: category.id
        });

        await guild.channels.create({
            name: '🔊-vocal',
            type: ChannelType.GuildVoice,
            parent: category.id
        });

        await interaction.reply({
            content:
                `✅ Espace MJ **${nom}** créé pour ${proprietaire}.`
        });
    }
};