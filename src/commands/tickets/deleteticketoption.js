const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteticketoption')
        .setDescription('Delete a ticket option')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('option_name')
                .setDescription('The name of the ticket option to delete')
                .setRequired(true)),
    
    async execute(interaction) {
        const optionName = interaction.options.getString('option_name');
        const ticketManager = interaction.client.ticketManager;

        const result = ticketManager.deleteTicketOption(optionName);

        if (!result.success) {
            return interaction.reply({ 
                content: `❌ ${result.error}`, 
                ephemeral: true 
            });
        }

        await interaction.reply({ 
            content: `✅ Ticket option "${optionName}" has been deleted.`, 
            ephemeral: true 
        });
    }
};
