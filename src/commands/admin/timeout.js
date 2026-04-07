
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 10m, 2h, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout')
                .setRequired(false)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const punishmentManager = interaction.client.punishmentManager;
        const result = await punishmentManager.timeoutUser(
            interaction.guild,
            user,
            interaction.user,
            duration,
            reason
        );

        if (!result.success) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }

        const embed = punishmentManager.createPunishmentEmbed('timeout', user, interaction.user, result.punishment);
        await interaction.reply({ embeds: [embed] });
    }
};
