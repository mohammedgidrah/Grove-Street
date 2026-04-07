const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const settingsStore = new DataStore('./data/guild-settings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('إعداد نظام الترحيب للأعضاء الجدد')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('قناة الترحيب')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('رسالة الترحيب (استخدم {user} للإشارة للعضو، {server} لاسم السيرفر، {membercount} لعدد الأعضاء)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('channel');
            const message = interaction.options.getString('message');

            settingsStore.update(data => {
                if (!data.guilds) data.guilds = {};
                if (!data.guilds[interaction.guild.id]) data.guilds[interaction.guild.id] = {};
                
                data.guilds[interaction.guild.id].welcome = {
                    enabled: true,
                    channelId: channel.id,
                    message: message
                };
                
                return data;
            });

            await interaction.reply({
                content: `✅ **تم إعداد نظام الترحيب بنجاح!**\n\n📢 **القناة:** ${channel}\n📝 **الرسالة:** ${message}\n\n**معاينة:**\n${message.replace('{user}', interaction.user).replace('{server}', interaction.guild.name).replace('{membercount}', interaction.guild.memberCount)}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in setup-welcome command:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء إعداد نظام الترحيب',
                ephemeral: true
            });
        }
    }
};
