const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove timeout from a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove timeout from')
                .setRequired(true)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');

        const punishmentManager = interaction.client.punishmentManager;
        const result = await punishmentManager.untimeoutUser(
            interaction.guild,
            user,
            interaction.user
        );

        if (!result.success) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('✅ Timeout Removed')
            .setDescription(`<@${user.id}> timeout has been removed.`)
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
