const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const configStore = new DataStore('./data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupmuterole')
        .setDescription('Set up mute role')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const config = configStore.read();

        if (config.muteRoleId) {
            return interaction.reply({
                content: `✅ Mute role is already set up: <@&${config.muteRoleId}>`,
                ephemeral: true
            });
        }

        const createButton = new ButtonBuilder()
            .setCustomId('muterole_create')
            .setLabel('Create New Role')
            .setStyle(ButtonStyle.Success);

        const selectButton = new ButtonBuilder()
            .setCustomId('muterole_select')
            .setLabel('Select Existing Role')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(createButton, selectButton);

        await interaction.reply({
            content: 'Mute role is not configured. Do you want to create one automatically?',
            components: [row],
            ephemeral: true
        });
    }
};