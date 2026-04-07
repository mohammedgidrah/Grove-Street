const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('end-giveaway')
        .setDescription('إنهاء سحب قبل وقته المحدد')
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

            const result = await giveawayManager.endGiveaway(giveawayId, interaction.user.id);

            await interaction.editReply({
                content: `✅ تم إنهاء السحب بنجاح!\n🎁 الجائزة: **${result.giveaway.prize}**\n👥 عدد المشاركين: **${result.giveaway.entries.length}**\n🏆 عدد الفائزين: **${result.winners.length}**`
            });
        } catch (error) {
            console.error('Error ending giveaway:', error);
            await interaction.editReply({
                content: `❌ حدث خطأ: ${error.message}`
            });
        }
    }
};
