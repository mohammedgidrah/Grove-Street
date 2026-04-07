const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reroll-giveaway')
        .setDescription('إعادة اختيار فائزين جدد للسحب')
        .addStringOption(option =>
            option.setName('giveaway-id')
                .setDescription('معرف السحب')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        const giveawayId = interaction.options.getString('giveaway-id');
        const giveawayManager = interaction.client.giveawayManager;

        try {
            await interaction.deferReply({ ephemeral: true });

            const newWinners = await giveawayManager.rerollGiveaway(giveawayId);

            if (newWinners.length > 0) {
                await interaction.editReply({
                    content: `✅ تم إعادة السحب بنجاح!\n🎊 الفائزون الجدد: ${newWinners.map(id => `<@${id}>`).join(', ')}`
                });
            } else {
                await interaction.editReply({
                    content: '❌ لا يوجد مشاركين آخرين لإعادة السحب'
                });
            }
        } catch (error) {
            console.error('Error rerolling giveaway:', error);
            await interaction.editReply({
                content: `❌ حدث خطأ: ${error.message}`
            });
        }
    }
};
