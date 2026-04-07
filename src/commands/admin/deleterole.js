
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleterole')
        .setDescription('Delete a role from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to delete')
                .setRequired(true)),
    
    async execute(interaction) {
        const role = interaction.options.getRole('role');

        try {
            // Check if bot can delete this role
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ 
                    content: '❌ I cannot delete this role because it is higher than or equal to my highest role.', 
                    ephemeral: true 
                });
            }

            // Check if user can delete this role
            if (role.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
                return interaction.reply({ 
                    content: '❌ You cannot delete this role because it is higher than or equal to your highest role.', 
                    ephemeral: true 
                });
            }

            const roleName = role.name;
            await role.delete('Admin requested role deletion');

            const logger = interaction.client.logger;
            await logger.logRole(`🗑️ <@${interaction.user.id}> deleted role "${roleName}"`);

            await interaction.reply({ 
                content: `✅ Successfully deleted role **${roleName}**.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error deleting role:', error);
            await interaction.reply({ 
                content: '❌ Failed to delete role. Make sure I have the necessary permissions.', 
                ephemeral: true 
            });
        }
    }
};
