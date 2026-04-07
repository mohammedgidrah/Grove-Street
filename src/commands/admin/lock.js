
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('قفل قناة لمنع الأعضاء من الإرسال/الدخول')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('القناة المراد قفلها (افتراضياً: القناة الحالية)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        
        try {
            // Determine permission based on channel type
            const permissionToLock = targetChannel.type === ChannelType.GuildVoice || 
                                    targetChannel.type === ChannelType.GuildStageVoice
                ? 'Connect'
                : 'SendMessages';

            await targetChannel.permissionOverwrites.edit(interaction.guild.id, {
                [permissionToLock]: false
            });

            await interaction.client.logger.log('settingLogs', {
                title: '🔒 Channel Locked',
                description: `${interaction.user} locked ${targetChannel}`,
                color: '#E74C3C',
                fields: [
                    { name: '📍 Channel', value: `${targetChannel}`, inline: true },
                    { name: '🆔 Channel ID', value: targetChannel.id, inline: true },
                    { name: '📂 Type', value: getChannelTypeName(targetChannel.type), inline: true },
                    { name: '👤 Locked By', value: `${interaction.user}`, inline: true },
                    { name: '🔐 Permission', value: permissionToLock, inline: true }
                ]
            });

            await interaction.reply({
                content: `🔒 تم قفل ${targetChannel} بنجاح`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error locking channel:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء قفل القناة',
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
