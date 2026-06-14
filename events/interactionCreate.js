const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(
            interaction.commandName
        );

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {

            console.error(error);

            await interaction.reply({
                content: 'Erreur lors de l’exécution.',
                ephemeral: true
            });
        }
    }
};