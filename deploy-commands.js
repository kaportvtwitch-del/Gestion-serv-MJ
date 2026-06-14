const {
    REST,
    Routes
} = require('discord.js');

const fs = require('fs');

const config = require('./config.json');

const commands = [];

const folders = fs.readdirSync('./commands');

for (const folder of folders) {

    const files = fs
        .readdirSync(`./commands/${folder}`)
        .filter(file => file.endsWith('.js'));

    for (const file of files) {

        const command = require(
            `./commands/${folder}/${file}`
        );

        commands.push(
            command.data.toJSON()
        );
    }
}

const rest = new REST({
    version: '10'
}).setToken(config.token);

(async () => {

    try {

        await rest.put(
            Routes.applicationGuildCommands(
                config.clientId,
                config.guildId
            ),
            { body: commands }
        );

        console.log('Slash commands déployées.');
    }
    catch (error) {
        console.error(error);
    }

})();