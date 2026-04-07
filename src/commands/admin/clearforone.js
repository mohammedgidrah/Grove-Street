const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearforone')
        .setDescription('Delete messages from a specific user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose messages to delete')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of messages to check (1-100)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const limit = interaction.options.getInteger('limit') || 50;

        try {
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit });
            
            // Filter messages from specific user
            const userMessages = messages.filter(msg => msg.author.id === user.id);

            if (userMessages.size === 0) {
                return interaction.reply({ 
                    content: `❌ No messages found from ${user.tag} in the last ${limit} messages.`, 
                    ephemeral: true 
                });
            }

            // Delete messages
            const deleted = await interaction.channel.bulkDelete(userMessages, true);

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Messages Cleared')
                .setDescription(`Successfully deleted ${deleted.size} messages from <@${user.id}>.`)
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error clearing user messages:', error);
            await interaction.reply({ 
                content: '❌ Failed to delete messages. They might be too old (>14 days).', 
                ephemeral: true 
            });
        }
    }
};
