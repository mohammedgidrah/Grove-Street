
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show')
        .setDescription('إظهار قناة مخفية للأعضاء')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('القناة المراد إظهارها')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        
        try {
            await targetChannel.permissionOverwrites.edit(interaction.guild.id, {
                ViewChannel: null
            });

            await interaction.client.logger.log('settingLogs', {
                title: '👁️ Channel Shown',
                description: `${interaction.user} made ${targetChannel} visible`,
                color: '#3498DB',
                fields: [
                    { name: '📍 Channel', value: `${targetChannel}`, inline: true },
                    { name: '🆔 Channel ID', value: targetChannel.id, inline: true },
                    { name: '📂 Type', value: getChannelTypeName(targetChannel.type), inline: true },
                    { name: '👤 Shown By', value: `${interaction.user}`, inline: true },
                    { name: 'ℹ️ Effect', value: 'Channel is now visible to @everyone', inline: false }
                ]
            });

            await interaction.reply({
                content: `👁️ تم إظهار ${targetChannel} بنجاح`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error showing channel:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء إظهار القناة',
                ephemeral: true
            });
        }
    }
};

function getChannelTypeName(type) {
    const types = {
        0: 'Text Channel',
        2: 'Voice Channel',
        4: 'Category',
        5: 'Announcement',
        10: 'Announcement Thread',
        11: 'Public Thread',
        12: 'Private Thread',
        13: 'Stage Channel',
        15: 'Forum'
    };
    return types[type] || 'Unknown';
}
