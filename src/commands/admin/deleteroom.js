
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteroom')
        .setDescription('Delete a voice or text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to delete')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildText)),
    
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        try {
            const channelName = channel.name;
            const channelType = channel.type === ChannelType.GuildVoice ? 'voice' : 'text';

            await channel.delete('Admin requested channel deletion');

            const logger = interaction.client.logger;
            await logger.logSetting(`🗑️ <@${interaction.user.id}> deleted ${channelType} channel "${channelName}"`);

            await interaction.reply({ 
                content: `✅ Successfully deleted ${channelType} channel **${channelName}**.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error deleting channel:', error);
            await interaction.reply({ 
                content: '❌ Failed to delete channel. Make sure I have the necessary permissions.', 
                ephemeral: true 
            });
        }
    }
};
