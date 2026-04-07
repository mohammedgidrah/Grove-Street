
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unmute')
                .setRequired(true)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');

        const punishmentManager = interaction.client.punishmentManager;
        const result = await punishmentManager.unmuteUser(
            interaction.guild,
            user,
            interaction.user
        );

        if (!result.success) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }

        const embed = punishmentManager.createPunishmentEmbed('unmute', user, interaction.user);
        await interaction.reply({ embeds: [embed] });
    }
};
