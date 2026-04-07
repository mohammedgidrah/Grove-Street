const { ChannelType, PermissionFlagsBits } = require('discord.js');
const DataStore = require('../utils/dataStore');
const ControlPanelBuilder = require('../utils/controlPanelBuilder');
const { randomUUID } = require('crypto');

const voiceStore = new DataStore('./data/voiceInformation.json');

/**
 * Voice Manager - Handles temporary voice channel creation and management
 * Control panels are sent in the voice channel's built-in text chat
 */
class VoiceManager {
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
        this.deleteTimers = new Map(); // Map of channelId -> timeout
    }

    /**
     * Handle user joining base voice channel
     * Creates temporary voice channel with control panel in its text chat
     */
    async handleJoinBaseChannel(member, baseChannelId) {
        try {
            const guild = member.guild;
            
            // Check if user already has an active room
            const existingActiveRoom = this.findUserRoom(member.id);
            if (existingActiveRoom) {
                // Move to existing room instead of creating new one
                const existingVoice = guild.channels.cache.get(existingActiveRoom.channelID);
                if (existingVoice) {
                    await member.voice.setChannel(existingVoice);
                    console.log(`Moved ${member.user.tag} to existing active room`);
                    return;
                }
            }

            const baseChannel = guild.channels.cache.get(baseChannelId);
            if (!baseChannel) return;

            const category = baseChannel.parent;
            const roomName = `${member.displayName}'s Room`;

            // Check for previous inactive room to reuse its data
            const previousRoom = this.findUserInactiveRoom(member.id);
            let voiceData;

            // Create voice channel
            const voiceChannel = await guild.channels.create({
                name: roomName,
                type: ChannelType.GuildVoice,
                parent: category,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
                    },
                    {
                        id: member.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels]
                    },
                    {
                        id: this.client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                ]
            });

            if (previousRoom) {
                // Reuse old room data with new channel ID
                voiceData = {
                    ...previousRoom,
                    channelID: voiceChannel.id,
                    panelMessageId: null,
                    active: true,
                    createdAt: Date.now()
                };
                
                // Delete old inactive entry
                this.removeVoiceRoom(previousRoom.channelID);
                
                console.log(`♻️ Reusing saved data for ${member.user.tag}'s room`);
            } else {
                // Create new data for first-time room
                voiceData = {
                    channelID: voiceChannel.id,
                    ownerID: member.id,
                    panelMessageId: null,
                    active: true,
                    trustedUsers: [],
                    bannedUsers: [],
                    settings: {
                        locked: false,
                        hidden: false,
                        limit: 0
                    },
                    createdAt: Date.now()
                };
            }

            // Save to storage FIRST
            this.saveVoiceRoom(voiceData);

            // Move user to new channel
            await member.voice.setChannel(voiceChannel);

            // Apply saved settings immediately if reusing data
            if (previousRoom) {
                await this.reapplyRoomPermissions(voiceChannel.id);
            }

            // Send control panel in voice channel's text chat (after user joins)
            setTimeout(async () => {
                try {
                    const { embed, components } = await ControlPanelBuilder.buildPanel(voiceData, voiceChannel, voiceChannel, guild);
                    const panelMessage = await voiceChannel.send({ embeds: [embed], components });

                    // Update with panel message ID
                    this.updateVoiceRoom(voiceChannel.id, { panelMessageId: panelMessage.id });
                    
                    if (previousRoom) {
                        await this.logger.logRoom(
                            `♻️ **Room Restored** - <@${member.id}> restored their voice room with saved settings`,
                            '#00D9FF',
                            [
                                { name: '🏠 Room Name', value: voiceChannel.name, inline: true },
                                { name: '📍 Channel', value: `<#${voiceChannel.id}>`, inline: true },
                                { name: '👤 Owner', value: `<@${member.id}>`, inline: true },
                                { name: '📂 Category', value: category ? category.name : 'None', inline: true },
                                { name: '🔒 Locked', value: previousRoom.settings.locked ? 'Yes' : 'No', inline: true },
                                { name: '🙈 Hidden', value: previousRoom.settings.hidden ? 'Yes' : 'No', inline: true },
                                { name: '🎚️ User Limit', value: previousRoom.settings.limit > 0 ? `${previousRoom.settings.limit}` : 'No Limit', inline: true },
                                { name: '✅ Trusted Users', value: previousRoom.trustedUsers.length > 0 ? previousRoom.trustedUsers.map(id => `<@${id}>`).join(', ') : 'None', inline: true },
                                { name: '🚫 Banned Users', value: previousRoom.bannedUsers.length > 0 ? previousRoom.bannedUsers.map(id => `<@${id}>`).join(', ') : 'None', inline: true }
                            ]
                        );
                    } else {
                        await this.logger.logRoom(
                            `🏠 **New Room Created** - <@${member.id}> created a new voice room`,
                            '#00FF00',
                            [
                                { name: '🏠 Room Name', value: voiceChannel.name, inline: true },
                                { name: '📍 Channel', value: `<#${voiceChannel.id}>`, inline: true },
                                { name: '👤 Owner', value: `<@${member.id}>`, inline: true },
                                { name: '📂 Category', value: category ? category.name : 'None', inline: true },
                                { name: '🔒 Initial Settings', value: 'Unlocked, Visible, No Limit', inline: false }
                            ]
                        );
                    }
                } catch (err) {
                    console.error('Error sending control panel:', err);
                }
            }, 2000); // Wait 2 seconds for channel to be fully ready

            console.log(`✅ Created voice room for ${member.user.tag}${previousRoom ? ' (restored from saved data)' : ''}`);

        } catch (error) {
            console.error('Error creating voice room:', error);
        }
    }

    /**
     * Handle user leaving voice channel
     * Start deletion timer if channel becomes empty
     */
    async handleLeaveVoiceChannel(member, channel) {
        try {
            const voiceData = this.findRoomByVoiceId(channel.id);
            if (!voiceData) return;

            // If owner left and channel is empty, start deletion timer
            if (member.id === voiceData.ownerID && channel.members.size === 0) {
                this.startDeletionTimer(voiceData);
            }
        } catch (error) {
            console.error('Error handling voice leave:', error);
        }
    }

    /**
     * Start 5-second deletion timer for empty voice room
     */
    startDeletionTimer(voiceData) {
        // Cancel existing timer if any
        if (this.deleteTimers.has(voiceData.channelID)) {
            clearTimeout(this.deleteTimers.get(voiceData.channelID));
        }

        console.log(`⏰ Starting deletion timer for room ${voiceData.channelID}`);

        const timer = setTimeout(async () => {
            await this.deleteVoiceRoom(voiceData.channelID);
        }, 5000); // 5 seconds

        this.deleteTimers.set(voiceData.channelID, timer);
    }

    /**
     * Cancel deletion timer if someone rejoins
     */
    async cancelDeletionTimer(channelId) {
        if (this.deleteTimers.has(channelId)) {
            clearTimeout(this.deleteTimers.get(channelId));
            this.deleteTimers.delete(channelId);
            console.log(`✅ Cancelled deletion timer for room ${channelId}`);
            
            // Reapply saved permissions when room becomes active again
            await this.reapplyRoomPermissions(channelId);
        }
    }

    /**
     * Reapply saved permissions to voice room
     */
    async reapplyRoomPermissions(voiceChannelId) {
        try {
            const voiceData = this.findRoomByVoiceId(voiceChannelId);
            if (!voiceData) return;

            const guild = this.client.guilds.cache.first();
            const voiceChannel = guild.channels.cache.get(voiceChannelId);
            if (!voiceChannel) return;

            // Reapply lock settings
            if (voiceData.settings.locked) {
                await voiceChannel.permissionOverwrites.edit(guild.id, {
                    Connect: false
                });

                // Allow owner
                await voiceChannel.permissionOverwrites.edit(voiceData.ownerID, {
                    Connect: true
                });

                // Allow trusted users
                for (const userId of voiceData.trustedUsers) {
                    await voiceChannel.permissionOverwrites.edit(userId, {
                        Connect: true,
                        ViewChannel: true
                    });
                }
            }

            // Reapply hide settings
            if (voiceData.settings.hidden) {
                await voiceChannel.permissionOverwrites.edit(guild.id, {
                    ViewChannel: false
                });

                // Allow owner
                await voiceChannel.permissionOverwrites.edit(voiceData.ownerID, {
                    ViewChannel: true
                });

                // Allow trusted users
                for (const userId of voiceData.trustedUsers) {
                    await voiceChannel.permissionOverwrites.edit(userId, {
                        ViewChannel: true
                    });
                }
            }

            // Apply banned users
            for (const userId of voiceData.bannedUsers) {
                await voiceChannel.permissionOverwrites.edit(userId, {
                    Connect: false,
                    ViewChannel: false
                });
            }

            // Reapply user limit
            if (voiceData.settings.limit > 0) {
                await voiceChannel.setUserLimit(voiceData.settings.limit);
            }

            console.log(`✅ Reapplied permissions for room ${voiceChannelId}`);

        } catch (error) {
            console.error('Error reapplying room permissions:', error);
        }
    }

    /**
     * Delete voice room
     */
    async deleteVoiceRoom(voiceChannelId) {
        try {
            const voiceData = this.findRoomByVoiceId(voiceChannelId);
            if (!voiceData) return;

            // Check if channel still exists and is still empty
            const voiceChannel = this.client.channels.cache.get(voiceChannelId);
            if (voiceChannel && voiceChannel.members.size > 0) {
                // Someone rejoined, cancel deletion
                this.cancelDeletionTimer(voiceChannelId);
                return;
            }

            // Delete voice channel
            if (voiceChannel) {
                await voiceChannel.delete('Voice room empty for 5 seconds');
            }

            // Calculate room duration
            const duration = Date.now() - voiceData.createdAt;
            const durationMinutes = Math.floor(duration / 60000);
            const durationHours = Math.floor(durationMinutes / 60);
            const remainingMinutes = durationMinutes % 60;
            const durationText = durationHours > 0 
                ? `${durationHours}h ${remainingMinutes}m` 
                : `${durationMinutes}m`;

            // Mark as inactive instead of removing - keep all data for restoration
            this.updateVoiceRoom(voiceChannelId, { 
                active: false,
                deletedAt: Date.now()
            });

            // Clear timer
            this.deleteTimers.delete(voiceChannelId);

            await this.logger.logRoom(
                `🗑️ **Room Deleted** - Voice room was automatically deleted after being empty for 5 seconds`,
                '#FF6B6B',
                [
                    { name: '👤 Owner', value: `<@${voiceData.ownerID}>`, inline: true },
                    { name: '⏱️ Duration', value: durationText, inline: true },
                    { name: '💾 Data Status', value: 'Preserved for restoration', inline: true },
                    { name: '🔒 Was Locked', value: voiceData.settings.locked ? 'Yes' : 'No', inline: true },
                    { name: '🙈 Was Hidden', value: voiceData.settings.hidden ? 'Yes' : 'No', inline: true },
                    { name: '🎚️ User Limit', value: voiceData.settings.limit > 0 ? `${voiceData.settings.limit}` : 'No Limit', inline: true },
                    { name: '✅ Trusted Users', value: voiceData.trustedUsers.length > 0 ? `${voiceData.trustedUsers.length} user(s)` : 'None', inline: true },
                    { name: '🚫 Banned Users', value: voiceData.bannedUsers.length > 0 ? `${voiceData.bannedUsers.length} user(s)` : 'None', inline: true }
                ]
            );
            console.log(`✅ Deleted voice room ${voiceChannelId} - Data kept for restoration`);

        } catch (error) {
            console.error('Error deleting voice room:', error);
        }
    }

    /**
     * Update control panel message in voice channel's text chat
     */
    async updateControlPanel(voiceChannelId) {
        try {
            const voiceData = this.findRoomByVoiceId(voiceChannelId);
            if (!voiceData || !voiceData.panelMessageId) return;

            const guild = this.client.guilds.cache.first();
            const voiceChannel = guild.channels.cache.get(voiceData.channelID);
            
            if (!voiceChannel) return;

            const { embed, components } = await ControlPanelBuilder.buildPanel(voiceData, voiceChannel, voiceChannel, guild);

            // Fetch and update message from voice channel's text chat
            const message = await voiceChannel.messages.fetch(voiceData.panelMessageId);
            if (message) {
                await message.edit({ embeds: [embed], components });
            }
        } catch (error) {
            console.error('Error updating control panel:', error);
        }
    }

    // Storage operations

    saveVoiceRoom(voiceData) {
        voiceStore.update(data => {
            data.voices.push(voiceData);
            return data;
        });
    }

    updateVoiceRoom(channelId, updates) {
        voiceStore.update(data => {
            const index = data.voices.findIndex(v => v.channelID === channelId);
            if (index !== -1) {
                data.voices[index] = { ...data.voices[index], ...updates };
            }
            return data;
        });
    }

    removeVoiceRoom(channelId) {
        voiceStore.update(data => {
            data.voices = data.voices.filter(v => v.channelID !== channelId);
            return data;
        });
    }

    findRoomByVoiceId(channelId) {
        const data = voiceStore.read();
        return data.voices.find(v => v.channelID === channelId);
    }

    findUserRoom(userId) {
        const data = voiceStore.read();
        return data.voices.find(v => v.ownerID === userId && v.active);
    }

    findUserInactiveRoom(userId) {
        const data = voiceStore.read();
        // Find the most recent inactive room for this user
        const inactiveRooms = data.voices.filter(v => v.ownerID === userId && !v.active);
        if (inactiveRooms.length === 0) return null;
        
        // Return the most recently deleted one
        return inactiveRooms.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))[0];
    }

    getAllVoiceRooms() {
        const data = voiceStore.read();
        return data.voices;
    }
}

module.exports = VoiceManager;
