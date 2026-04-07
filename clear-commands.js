
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv').config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Configure with your bot token and client ID from .env file
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    
    try {
        // Initialize REST API with your bot token
        const rest = new REST({ version: '10' }).setToken(token);
        
        console.log('🗑️ Started clearing application (/) commands...');
        
        // Clear all global commands
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: [] }, // Empty array will clear all global commands
        );
        
        console.log('✅ Successfully deleted all global application commands.');
        
        // Clear guild-specific commands for all guilds
        const guilds = client.guilds.cache;
        
        for (const guild of guilds.values()) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guild.id),
                { body: [] }, // Empty array will clear all guild commands
            );
            console.log(`✅ Successfully deleted all commands in guild: ${guild.name}`);
        }
        
        console.log('✅ Command cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
});

// Log in to Discord with your client's token
client.login(token);
