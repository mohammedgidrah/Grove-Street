const { SlashCommandBuilder } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const voiceStore = new DataStore('./data/voiceInformation.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendvoicecontrol')
        .setDescription('Resend control panel in your voice room (owner only)'),
    
    async execute(interaction) {
        const data = voiceStore.read();
        const voiceRoom = data.voices.find(v => v.ownerID === interaction.user.id && v.active);

        if (!voiceRoom) {
            return interaction.reply({ 
                content: '❌ You do not own an active voice room.', 
                ephemeral: true 
            });
        }

        // Check if user is in a voice channel
        if (!interaction.member.voice.channel) {
            return interaction.reply({ 
                content: '❌ You must be in your voice channel to use this command.', 
                ephemeral: true 
            });
        }

        // Check if they're in their own voice room
        if (interaction.member.voice.channel.id !== voiceRoom.channelID) {
            return interaction.reply({ 
                content: 'You can only use this command in your own voice room.', 
                ephemeral: true 
            });
        }

        const voiceManager = interaction.client.voiceManager;
        await voiceManager.updateControlPanel(voiceRoom.channelID);

        await interaction.reply({ 
            content: '✅ Control panel updated!', 
            ephemeral: true 
        });
    }
};
