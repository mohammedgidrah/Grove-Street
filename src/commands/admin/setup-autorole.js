const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const settingsStore = new DataStore('./data/guild-settings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-autorole')
        .setDescription('إعداد الأدوار التلقائية للأعضاء الجدد')
        .addRoleOption(option =>
            option.setName('member-role')
                .setDescription('الرتبة التي سيحصل عليها الأعضاء الجدد تلقائياً')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('bot-role')
                .setDescription('الرتبة التي سيحصل عليها البوتات الجديدة تلقائياً')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const memberRole = interaction.options.getRole('member-role');
            const botRole = interaction.options.getRole('bot-role');

            if (!memberRole && !botRole) {
                return await interaction.reply({
                    content: '❌ يجب عليك تحديد رتبة واحدة على الأقل (للأعضاء أو للبوتات)',
                    ephemeral: true
                });
            }

            // Check bot's highest role position
            const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
            const botHighestRole = botMember.roles.highest;

            if (memberRole && memberRole.position >= botHighestRole.position) {
                return await interaction.reply({
                    content: '❌ لا يمكنني إعطاء رتبة الأعضاء لأنها أعلى من رتبتي أو مساوية لها. يرجى نقل رتبتي لمكان أعلى.',
                    ephemeral: true
                });
            }

            if (botRole && botRole.position >= botHighestRole.position) {
                return await interaction.reply({
                    content: '❌ لا يمكنني إعطاء رتبة البوتات لأنها أعلى من رتبتي أو مساوية لها. يرجى نقل رتبتي لمكان أعلى.',
                    ephemeral: true
                });
            }

            settingsStore.update(data => {
                if (!data.guilds) data.guilds = {};
                if (!data.guilds[interaction.guild.id]) data.guilds[interaction.guild.id] = {};
                
                data.guilds[interaction.guild.id].autorole = {
                    enabled: true,
                    memberRoleId: memberRole?.id || null,
                    botRoleId: botRole?.id || null
                };
                
                return data;
            });

            let responseText = '✅ **تم إعداد نظام الأدوار التلقائية بنجاح!**\n\n';
            if (memberRole) {
                responseText += `👤 **رتبة الأعضاء:** ${memberRole}\n`;
            }
            if (botRole) {
                responseText += `🤖 **رتبة البوتات:** ${botRole}\n`;
            }
            responseText += '\n**سيتم إعطاء الرتب تلقائياً عند انضمام أعضاء جدد**';

            await interaction.reply({
                content: responseText,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in setup-autorole command:', error);
            await interaction.reply({
                content: '❌ حدث خطأ أثناء إعداد نظام الأدوار التلقائية',
                ephemeral: true
            });
        }
    }
};
