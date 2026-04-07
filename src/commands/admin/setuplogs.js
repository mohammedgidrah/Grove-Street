const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplogs')
        .setDescription('Set up logging channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const yesButton = new ButtonBuilder()
            .setCustomId('logs_autocreate')
            .setLabel('Yes - Auto Create')
            .setStyle(ButtonStyle.Success);

        const noButton = new ButtonBuilder()
            .setCustomId('logs_manual')
            .setLabel('No - Manual Setup')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(yesButton, noButton);

        await interaction.reply({
            content: '**Setup Logging Channels**\n\nDo you want to automatically create a logs category with all log channels?',
            components: [row],
            ephemeral: true
        });
    }
};
