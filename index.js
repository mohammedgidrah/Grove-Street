const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');


// Import services and utilities
const Logger = require('./src/utils/logger');
const Scheduler = require('./src/utils/scheduler');
const VoiceManager = require('./src/services/voiceManager');
const PunishmentManager = require('./src/services/punishmentManager');
const TicketManager = require('./src/services/ticketManager');
const PresenceManager = require('./src/services/presenceManager');
const GiveawayManager = require('./src/services/giveawayManager');
const LolManager = require('./src/services/lolManager');

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.GuildMember]
});

// Initialize command collection
client.commands = new Collection();

// Load commands from all subdirectories
const commandFolders = ['general', 'admin', 'voice', 'tickets'];
let commandCount = 0;

for (const folder of commandFolders) {
    const commandsPath = path.join(__dirname, 'src', 'commands', folder);

    if (!fs.existsSync(commandsPath)) continue;

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandCount++;
        }
    }
}

console.log(`📁 تم تحميل ${commandCount} أمر`);

// Initialize services
const logger = new Logger(client);
const voiceManager = new VoiceManager(client, logger);
const ticketManager = new TicketManager(client, logger);
const presenceManager = new PresenceManager(client);
const giveawayManager = new GiveawayManager(client);

// Attach logger and other services to client first
client.logger = logger;
client.voiceManager = voiceManager;
client.ticketManager = ticketManager;
client.presenceManager = presenceManager;
client.giveawayManager = giveawayManager;

// Initialize scheduler (needs client)
const scheduler = new Scheduler(client);
client.scheduler = scheduler;

// Initialize punishment manager (needs scheduler)
const punishmentManager = new PunishmentManager(client, logger, scheduler);
client.punishmentManager = punishmentManager;

// Initialize Lol Manager
const lolManager = new LolManager(client, logger);
client.lolManager = lolManager;

// Load event handlers
const eventsPath = path.join(__dirname, 'src', 'handlers', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

console.log(`⚡ تم تحميل ${eventFiles.length} حدث`);

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    scheduler.shutdown();
    client.destroy();
    process.exit(0);
});

// Auto-deploy commands on startup (non-blocking with timeout)
const { exec } = require('child_process');
exec('timeout 30 node deploy-commands.js', (error, stdout, stderr) => {
    if (error) {
        console.log('⚠️  تحذير: تعذر نشر الأوامر تلقائياً');
    }
    // لا تطبع stdout لتقليل الرسائل
});

// Login to Discord
const token = process.env.TOKEN;

client.login(token).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
