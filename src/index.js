const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField
} = require("discord.js");

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// =====================
// CLIENT
// =====================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// =====================
// COMMAND LOGIC
// =====================
client.commands.set("mj", {
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

    await interaction.reply(`✅ JDR **${name}** créé avec succès`);
  }
});

// =====================
// DEPLOY SLASH COMMANDS AUTO
// =====================
async function deployCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("mj")
      .setDescription("Gestion des JDR")
      .addSubcommand(sub =>
        sub
          .setName("ajouter")
          .setDescription("Créer un JDR complet")
          .addStringOption(opt =>
            opt.setName("nom").setDescription("Nom").setRequired(true)
          )
          .addUserOption(opt =>
            opt.setName("owner").setDescription("MJ").setRequired(true)
          )
      )
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("🚀 Déploiement slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Slash commands prêtes !");
  } catch (err) {
    console.error("❌ Deploy error:", err);
  }
}

// =====================
// READY EVENT
// =====================
client.once("ready", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  await deployCommands(); // 🔥 AUTO DEPLOY
});

// =====================
// INTERACTIONS
// =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Erreur commande",
        ephemeral: true
      });
    }
  }
});

// =====================
// LOGIN
// =====================
client.login(process.env.DISCORD_TOKEN);