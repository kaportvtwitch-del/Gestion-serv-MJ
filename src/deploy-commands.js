const { REST, Routes } = require("discord.js");

const clientId = process.env.CLIENT_ID;
const token = process.env.DISCORD_TOKEN;

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
            description: "Nom du JDR",
            required: true
          },
          {
            name: "owner",
            type: 6,
            description: "MJ propriétaire",
            required: true
          }
        ]
      }
    ]
  }
];

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("🚀 Déploiement des commandes...");

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log("✅ Commandes déployées");
  } catch (err) {
    console.error(err);
  }
})();