const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete messages in channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100)),
    
    async execute(interaction) {
        const limit = interaction.options.getInteger('limit') || 10;

        try {
            const deleted = await interaction.channel.bulkDelete(limit, true);

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Messages Cleared')
                .setDescription(`Successfully deleted ${deleted.size} messages.`)
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error clearing messages:', error);
            await interaction.reply({ 
                content: '❌ Failed to delete messages. They might be too old (>14 days).', 
                ephemeral: true 
            });
        }
    }
};
