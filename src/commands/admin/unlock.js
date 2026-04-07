
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('فتح قناة للسماح للأعضاء بالإرسال/الدخول')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('القناة المراد فتحها (افتراضياً: القناة الحالية)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        
        try {
            const permissionToUnlock = targetChannel.type === ChannelType.GuildVoice || 
                                      targetChannel.type === ChannelType.GuildStageVoice
                ? 'Connect'
                : 'SendMessages';

            await targetChannel.permissionOverwrites.edit(interaction.guild.id, {
                [permissionToUnlock]: null
            });

            await interaction.client.logger.log('settingLogs', {
                title: '🔓 Channel Unlocked',
                description: `${interaction.user} unlocked ${targetChannel}`,
                color: '#2ECC71',
                fields: [
                    { name: '📍 Channel', value: `${targetChannel}`, inline: true },
                    { name: '🆔 Channel ID', value: targetChannel.id, inline: true },
                    { name: '📂 Type', value: getChannelTypeName(targetChannel.type), inline: true },
                    { name: '👤 Unlocked By', value: `${interaction.user}`, inline: true },
                    { name: '🔐 Permission', value: permissionToUnlock, inline: true }
                ]
            });

            await interaction.reply({
                content: `🔓 تم فتح ${targetChannel} بنجاح`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error unlocking channel:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء فتح القناة',
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
