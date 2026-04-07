const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} متصل بـ ${client.guilds.cache.size} سيرفر`);

        // Initialize scheduler
        await client.scheduler.initialize();

        // Load active giveaways
        await client.giveawayManager.loadActiveGiveaways();
        console.log('🎉 تم تحميل السحوبات النشطة');

        // Auto-join LOL channel if configured
        const DataStore = require('../../utils/dataStore');
        const configStore = new DataStore('./data/config.json');
        const config = configStore.read();
        
        if (config.lolVoiceChannelId) {
            for (const guild of client.guilds.cache.values()) {
                const lolChannel = guild.channels.cache.get(config.lolVoiceChannelId);
                if (lolChannel) {
                    await client.lolManager.joinLolChannel(guild, config.lolVoiceChannelId);
                    console.log(`🎭 Bot auto-joined LOL channel in ${guild.name}`);
                    break;
                }
            }
        }

        // Set presence
        client.presenceManager.updatePresence();

        console.log('🚀 جميع الأنظمة جاهزة!');
    }
};