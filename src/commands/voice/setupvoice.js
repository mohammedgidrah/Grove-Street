const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const configStore = new DataStore('./data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupvoice')
        .setDescription('Set up base voice channel for temporary rooms')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('base_channel')
                .setDescription('The voice channel to use as base')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)),
    
    async execute(interaction) {
        const channel = interaction.options.getChannel('base_channel');

        configStore.update(data => {
            data.baseVoiceChannelId = channel.id;
            return data;
        });

        await interaction.reply({ 
            content: `✅ Base voice channel set to ${channel}. Users joining this channel will get their own temporary room!`, 
            ephemeral: true 
        });

        const logger = interaction.client.logger;
        await logger.logRoom(
            `🎤 **Voice System Setup** - <@${interaction.user.id}> configured base voice channel`,
            '#3498DB',
            [
                { name: '📍 Base Channel', value: `<#${channel.id}>`, inline: true },
                { name: '👤 Admin', value: `<@${interaction.user.id}>`, inline: true },
                { name: '📂 Category', value: channel.parent ? channel.parent.name : 'None', inline: true },
                { name: 'ℹ️ How It Works', value: 'Users joining this channel will automatically get their own temporary voice room with full control panel', inline: false },
                { name: '⚙️ Features', value: '• Lock/Unlock room\n• Hide/Show room\n• Rename room\n• Set user limit\n• Trust/Ban users\n• Auto-save settings', inline: false }
            ]
        );
    }
};
