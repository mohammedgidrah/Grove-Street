const { Events } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const configStore = new DataStore('./data/config.json');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const client = newState.client;
        const voiceManager = client.voiceManager;
        const lolManager = client.lolManager;
        const logger = client.logger;
        const config = configStore.read();

        // User joined a channel
        if (!oldState.channel && newState.channel) {
            // Log voice join
            await logger.log('voiceLogs', {
                title: '🎤 Voice Channel Joined',
                description: `${newState.member.user} joined a voice channel`,
                color: '#00FF00',
                fields: [
                    { name: '👤 Member', value: `${newState.member.user.tag}\n<@${newState.member.user.id}>`, inline: true },
                    { name: '📍 Channel', value: `<#${newState.channel.id}>`, inline: true },
                    { name: '📂 Category', value: newState.channel.parent ? newState.channel.parent.name : 'None', inline: true },
                    { name: '👥 Members in Channel', value: `${newState.channel.members.size}`, inline: true },
                    { name: '🔇 Muted', value: newState.selfMute ? 'Yes' : 'No', inline: true },
                    { name: '🔊 Deafened', value: newState.selfDeaf ? 'Yes' : 'No', inline: true }
                ]
            });

            // Check if user joined LOL channel
            if (config.lolVoiceChannelId && newState.channel.id === config.lolVoiceChannelId) {
                await lolManager.handleJoinLolChannel(newState.member, config.lolVoiceChannelId);
            }
            // Check if user joined base voice channel
            else if (newState.channel.id === config.baseVoiceChannelId) {
                await voiceManager.handleJoinBaseChannel(newState.member, config.baseVoiceChannelId);
            } else {
                // Check if user rejoined their temp room
                const voiceData = voiceManager.findRoomByVoiceId(newState.channel.id);
                if (voiceData) {
                    voiceManager.cancelDeletionTimer(newState.channel.id);
                }
            }
        }

        // User left a channel
        if (oldState.channel && !newState.channel) {
            // Log voice leave
            await logger.log('voiceLogs', {
                title: '📤 Voice Channel Left',
                description: `${oldState.member.user} left a voice channel`,
                color: '#FF0000',
                fields: [
                    { name: '👤 Member', value: `${oldState.member.user.tag}\n<@${oldState.member.user.id}>`, inline: true },
                    { name: '📍 Channel', value: `<#${oldState.channel.id}>`, inline: true },
                    { name: '📂 Category', value: oldState.channel.parent ? oldState.channel.parent.name : 'None', inline: true },
                    { name: '👥 Members Remaining', value: `${oldState.channel.members.size}`, inline: true }
                ]
            });

            await voiceManager.handleLeaveVoiceChannel(oldState.member, oldState.channel);
        }

        // User switched channels
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            // Log voice switch
            await logger.log('voiceLogs', {
                title: '🔄 Voice Channel Switched',
                description: `${newState.member.user} switched voice channels`,
                color: '#FFA500',
                fields: [
                    { name: '👤 Member', value: `${newState.member.user.tag}\n<@${newState.member.user.id}>`, inline: true },
                    { name: '📤 From', value: `<#${oldState.channel.id}>`, inline: true },
                    { name: '📥 To', value: `<#${newState.channel.id}>`, inline: true },
                    { name: '👥 Old Channel Members', value: `${oldState.channel.members.size}`, inline: true },
                    { name: '👥 New Channel Members', value: `${newState.channel.members.size}`, inline: true }
                ]
            });

            // Handle leaving old channel
            await voiceManager.handleLeaveVoiceChannel(oldState.member, oldState.channel);

            // Handle joining new channel
            if (config.lolVoiceChannelId && newState.channel.id === config.lolVoiceChannelId) {
                await lolManager.handleJoinLolChannel(newState.member, config.lolVoiceChannelId);
            }
            else if (newState.channel.id === config.baseVoiceChannelId) {
                await voiceManager.handleJoinBaseChannel(newState.member, config.baseVoiceChannelId);
            } else {
                const voiceData = voiceManager.findRoomByVoiceId(newState.channel.id);
                if (voiceData) {
                    await voiceManager.cancelDeletionTimer(newState.channel.id);
                }
            }
        }

        // Log mute/unmute changes
        if (oldState.channel && newState.channel && oldState.channel.id === newState.channel.id) {
            if (oldState.selfMute !== newState.selfMute) {
                await logger.log('voiceLogs', {
                    title: newState.selfMute ? '🔇 Member Muted' : '🔊 Member Unmuted',
                    description: `${newState.member.user} ${newState.selfMute ? 'muted' : 'unmuted'} themselves`,
                    color: newState.selfMute ? '#95A5A6' : '#3498DB',
                    fields: [
                        { name: '👤 Member', value: `${newState.member.user.tag}\n<@${newState.member.user.id}>`, inline: true },
                        { name: '📍 Channel', value: `<#${newState.channel.id}>`, inline: true },
                        { name: '🔇 Status', value: newState.selfMute ? 'Muted' : 'Unmuted', inline: true }
                    ]
                });
            }

            if (oldState.selfDeaf !== newState.selfDeaf) {
                await logger.log('voiceLogs', {
                    title: newState.selfDeaf ? '🔇 Member Deafened' : '🔊 Member Undeafened',
                    description: `${newState.member.user} ${newState.selfDeaf ? 'deafened' : 'undeafened'} themselves`,
                    color: newState.selfDeaf ? '#95A5A6' : '#3498DB',
                    fields: [
                        { name: '👤 Member', value: `${newState.member.user.tag}\n<@${newState.member.user.id}>`, inline: true },
                        { name: '📍 Channel', value: `<#${newState.channel.id}>`, inline: true },
                        { name: '🔊 Status', value: newState.selfDeaf ? 'Deafened' : 'Undeafened', inline: true }
                    ]
                });
            }
        }
    }
};