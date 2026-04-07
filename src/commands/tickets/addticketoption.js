const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addticketoption')
        .setDescription('Add a ticket option')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('addticket_modal')
            .setTitle('Add Ticket Option');

        const nameInput = new TextInputBuilder()
            .setCustomId('ticket_name')
            .setLabel('Option Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., Support Request')
            .setRequired(true)
            .setMaxLength(100);

        const messageInput = new TextInputBuilder()
            .setCustomId('ticket_message')
            .setLabel('Initial Message')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Message shown when ticket is opened')
            .setRequired(true)
            .setMaxLength(1000);

        const nameRow = new ActionRowBuilder().addComponents(nameInput);
        const messageRow = new ActionRowBuilder().addComponents(messageInput);

        modal.addComponents(nameRow, messageRow);

        await interaction.showModal(modal);
    }
};
