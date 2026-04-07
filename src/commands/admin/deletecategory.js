
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletecategory')
        .setDescription('Delete a category and all channels inside it')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('The category to delete')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory)),
    
    async execute(interaction) {
        const category = interaction.options.getChannel('category');

        try {
            // Defer reply since this might take time
            await interaction.deferReply({ ephemeral: true });

            // Get all channels in the category
            const channelsInCategory = Array.from(
                interaction.guild.channels.cache.filter(
                    channel => channel.parentId === category.id
                ).values()
            );

            const totalChannels = channelsInCategory.length;

            if (totalChannels === 0) {
                // No channels, just delete category
                await category.delete('Admin requested category deletion');
                
                const logger = interaction.client.logger;
                await logger.logSetting(`🗑️ <@${interaction.user.id}> deleted empty category "${category.name}"`);

                return await interaction.editReply({ 
                    content: `✅ Successfully deleted empty category **${category.name}**.`
                });
            }

            // Delete channels in batches to avoid rate limits
            let deletedCount = 0;
            const batchSize = 5;
            
            for (let i = 0; i < channelsInCategory.length; i += batchSize) {
                const batch = channelsInCategory.slice(i, i + batchSize);
                
                await Promise.all(
                    batch.map(async (channel) => {
                        try {
                            await channel.delete('Category deletion');
                            deletedCount++;
                        } catch (err) {
                            console.error(`Failed to delete channel ${channel.name}:`, err);
                        }
                    })
                );

                // Update progress
                await interaction.editReply({ 
                    content: `⏳ Deleting channels... (${deletedCount}/${totalChannels})`
                });

                // Small delay between batches to avoid rate limits
                if (i + batchSize < channelsInCategory.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Delete the category itself after all channels are deleted
            await category.delete('Admin requested category deletion');

            const logger = interaction.client.logger;
            await logger.logSetting(`🗑️ <@${interaction.user.id}> deleted category "${category.name}" and ${deletedCount} channels inside it`);

            await interaction.editReply({ 
                content: `✅ Successfully deleted category **${category.name}** and **${deletedCount}/${totalChannels}** channels inside it.`
            });

        } catch (error) {
            console.error('Error deleting category:', error);
            await interaction.editReply({ 
                content: '❌ Failed to delete category. Make sure I have the necessary permissions.'
            });
        }
    }
};
