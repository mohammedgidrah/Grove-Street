const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const configStore = new DataStore('./data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupadminrole')
        .setDescription('Set admin role for ticket mentions')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The admin role to mention in tickets')
                .setRequired(true)),
    
    async execute(interaction) {
        const role = interaction.options.getRole('role');

        configStore.update(data => {
            data.adminRoleId = role.id;
            return data;
        });

        await interaction.reply({ 
            content: `✅ Admin role set to ${role}. This role will be mentioned when tickets are opened.`, 
            ephemeral: true 
        });
    }
};
