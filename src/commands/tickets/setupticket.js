const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const configStore = new DataStore('./data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupticket')
        .setDescription('Send ticket panel in a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send ticket panel')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addRoleOption(option =>
            option.setName('admin_role')
                .setDescription('Admin role to mention in tickets (optional)')
                .setRequired(false)),
    
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const adminRole = interaction.options.getRole('admin_role');
        const ticketManager = interaction.client.ticketManager;

        // Save admin role if provided
        if (adminRole) {
            configStore.update(data => {
                data.adminRoleId = adminRole.id;
                return data;
            });
        }

        const result = await ticketManager.createTicketPanel(channel);

        if (!result.success) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }

        let responseMessage = `✅ Ticket panel sent to ${channel}!`;
        if (adminRole) {
            responseMessage += `\n✅ Admin role set to ${adminRole}`;
        }

        await interaction.reply({ 
            content: responseMessage, 
            ephemeral: true 
        });
    }
};
