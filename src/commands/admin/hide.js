
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hide')
        .setDescription('إخفاء قناة عن الأعضاء')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('القناة المراد إخفاؤها (افتراضياً: القناة الحالية)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        
        try {
            await targetChannel.permissionOverwrites.edit(interaction.guild.id, {
                ViewChannel: false
            });

            await interaction.client.logger.log('settingLogs', {
                title: '🙈 Channel Hidden',
                description: `${interaction.user} hid ${targetChannel}`,
                color: '#9B59B6',
                fields: [
                    { name: '📍 Channel', value: `${targetChannel}`, inline: true },
                    { name: '🆔 Channel ID', value: targetChannel.id, inline: true },
                    { name: '📂 Type', value: getChannelTypeName(targetChannel.type), inline: true },
                    { name: '👤 Hidden By', value: `${interaction.user}`, inline: true },
                    { name: 'ℹ️ Effect', value: 'Channel is now invisible to @everyone', inline: false }
                ]
            });

            await interaction.reply({
                content: `🙈 تم إخفاء ${targetChannel} بنجاح`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error hiding channel:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء إخفاء القناة',
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
