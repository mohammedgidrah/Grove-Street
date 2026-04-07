const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

// Load all commands from subdirectories
const commandFolders = ['general', 'admin', 'voice', 'tickets'];

for (const folder of commandFolders) {
    const commandsPath = path.join(__dirname, 'src', 'commands', folder);
    
    if (!fs.existsSync(commandsPath)) continue;
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }
}

// Construct and prepare an instance of the REST module with timeout
const rest = new REST({ timeout: 15000 }).setToken(process.env.TOKEN);

// Helper function to run async operation with timeout
function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

// Deploy commands
(async () => {
    try {
        const clientId = '1490860881821831308';
        const guildId = '605292549212602368';

        let data;

        if (guildId) {
            data = await withTimeout(
                rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                ),
                20000
            );
        } else {
            data = await withTimeout(
                rest.put(
                    Routes.applicationCommands(clientId),
                    { body: commands }
                ),
                20000
            );
        }

        console.log(`✅ تم نشر ${data.length} أمر بنجاح`);
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error.message);
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            console.error('💡 Tip: Discord API may be slow. Commands might still deploy.');
        }
        process.exit(1);
    }
})();
