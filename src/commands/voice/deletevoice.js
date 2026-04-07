const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const configStore = new DataStore('./data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletevoice')
        .setDescription('Remove base voice channel configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const config = configStore.read();
        const oldChannelId = config.baseVoiceChannelId;
        const oldChannel = oldChannelId ? interaction.guild.channels.cache.get(oldChannelId) : null;

        configStore.update(data => {
            data.baseVoiceChannelId = null;
            return data;
        });

        await interaction.reply({ 
            content: '✅ Base voice channel configuration removed.', 
            ephemeral: true 
        });

        const logger = interaction.client.logger;
        await logger.logRoom(
            `🗑️ **Voice System Disabled** - <@${interaction.user.id}> removed base voice channel configuration`,
            '#E74C3C',
            [
                { name: '👤 Admin', value: `<@${interaction.user.id}>`, inline: true },
                { name: '📍 Previous Channel', value: oldChannel ? `<#${oldChannelId}> (${oldChannel.name})` : 'Unknown', inline: true },
                { name: 'ℹ️ Effect', value: 'Voice room creation system is now disabled. Existing rooms will continue to work until deleted.', inline: false }
            ]
        );
    }
};
