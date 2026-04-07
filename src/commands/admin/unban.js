const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The user ID to unban')
                .setRequired(true)),
    
    async execute(interaction) {
        const userId = interaction.options.getString('userid');

        const punishmentManager = interaction.client.punishmentManager;
        const result = await punishmentManager.unbanUser(
            interaction.guild,
            userId,
            interaction.user
        );

        if (!result.success) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('✅ User Unbanned')
            .setDescription(`User ID ${userId} has been unbanned.`)
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
