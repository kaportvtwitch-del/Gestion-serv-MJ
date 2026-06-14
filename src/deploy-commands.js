const { REST, Routes } = require("discord.js");

const commands = [
  {
    name: "mj",
    description: "Gestion des JDR",
    options: [
      {
        name: "ajouter",
        type: 1,
        description: "Créer un JDR",
        options: [
          {
            name: "nom",
            type: 3,
            required: true,
            description: "Nom du JDR"
          },
          {
            name: "owner",
            type: 6,
            required: true,
            description: "MJ propriétaire"
          }
        ]
      }
    ]
  }
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🚀 Déploiement GUILD commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Commandes disponibles immédiatement !");
  } catch (err) {
    console.error(err);
  }
})();