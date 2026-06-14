const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType
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
// PERMISSIONS MJ (SAFE - CATÉGORIE ONLY)
// =====================
const ownerPermissions = [
  // =====================
  // VIEW / TEXT
  // =====================
  PermissionsBitField.Flags.ViewChannel,
  PermissionsBitField.Flags.SendMessages,
  PermissionsBitField.Flags.SendMessagesInThreads,
  PermissionsBitField.Flags.CreatePublicThreads,
  PermissionsBitField.Flags.CreatePrivateThreads,
  PermissionsBitField.Flags.ManageMessages,
  PermissionsBitField.Flags.EmbedLinks,
  PermissionsBitField.Flags.AttachFiles,
  PermissionsBitField.Flags.ReadMessageHistory,
  PermissionsBitField.Flags.AddReactions,
  PermissionsBitField.Flags.UseExternalEmojis,
  PermissionsBitField.Flags.UseExternalStickers,
  PermissionsBitField.Flags.SendTTSMessages,
  PermissionsBitField.Flags.UseApplicationCommands,

  // =====================
  // 🔥 GESTION SALONS (IMPORTANT)
  // =====================
  PermissionsBitField.Flags.ManageChannels,

  // =====================
  // 🔥 GESTION THREADS
  // =====================
  PermissionsBitField.Flags.ManageThreads,

  // =====================
  // 🎙️ VOICE
  // =====================
  PermissionsBitField.Flags.Connect,
  PermissionsBitField.Flags.Speak,
  PermissionsBitField.Flags.Stream,
  PermissionsBitField.Flags.UseVAD,
  PermissionsBitField.Flags.PrioritySpeaker,
  PermissionsBitField.Flags.RequestToSpeak,
  PermissionsBitField.Flags.UseEmbeddedActivities
];

// =====================
// COMMAND MJ
// =====================
client.commands.set("mj", {
  data: new SlashCommandBuilder()
    .setName("mj")
    .setDescription("Créer un JDR")
    .addSubcommand(sub =>
      sub
        .setName("ajouter")
        .setDescription("Créer un univers JDR")
        .addStringOption(opt =>
          opt.setName("nom").setDescription("Nom du JDR").setRequired(true)
        )
        .addUserOption(opt =>
          opt.setName("owner").setDescription("MJ propriétaire").setRequired(true)
        )
    ),

  async execute(interaction) {
    const name = interaction.options.getString("nom");
    const owner = interaction.options.getUser("owner");

    const guild = interaction.guild;
    const member = await guild.members.fetch(owner.id);

    // =====================
    // ROLE MJ
    // =====================
    const role = await guild.roles.create({
      name: `MJ - ${name}`,
      permissions: []
    });

    await member.roles.add(role);

    // =====================
    // CATEGORY
    // =====================
    const category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: role.id,
          allow: ownerPermissions
        },
        {
          id: member.id,
          allow: ownerPermissions
        }
      ]
    });

    // =====================
    // CHANNELS
    // =====================

    await guild.channels.create({
      name: "général",
      type: ChannelType.GuildText,
      parent: category.id
    });

    await guild.channels.create({
      name: "hrp",
      type: ChannelType.GuildText,
      parent: category.id
    });

    await guild.channels.create({
      name: "vocal",
      type: ChannelType.GuildVoice,
      parent: category.id
    });

    await interaction.reply({
      content: `✅ JDR **${name}** créé avec succès`,
      ephemeral: true
    });
  }
});

// =====================
// AUTO DEPLOY SLASH COMMAND
// =====================
async function deployCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("mj")
      .setDescription("Créer un JDR")
      .addSubcommand(sub =>
        sub
          .setName("ajouter")
          .setDescription("Créer un univers JDR")
          .addStringOption(opt =>
            opt.setName("nom").setRequired(true)
          )
          .addUserOption(opt =>
            opt.setName("owner").setRequired(true)
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

    console.log("✅ Slash commands OK");
  } catch (err) {
    console.error(err);
  }
}

// =====================
// READY
// =====================
client.once("ready", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  await deployCommands();
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
  }
});

// =====================
// LOGIN
// =====================
client.login(process.env.DISCORD_TOKEN);