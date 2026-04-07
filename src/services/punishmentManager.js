const { EmbedBuilder } = require('discord.js');
const DataStore = require('../utils/dataStore');
const { randomBytes } = require('crypto');

const punishmentsStore = new DataStore('./data/punishments.json');

/**
 * Punishment Manager - Handles mute, ban, timeout operations with persistence
 */
class PunishmentManager {
    constructor(client, logger, scheduler) {
        this.client = client;
        this.logger = logger;
        this.scheduler = scheduler;
    }

    /**
     * Generate unique punishment ID
     */
    generateId() {
        return randomBytes(16).toString('hex');
    }

    /**
     * Parse duration string to milliseconds
     * Examples: "10m", "2h", "1d", "30s"
     */
    parseDuration(durationStr) {
        if (!durationStr) return null;

        const regex = /^(\d+)([smhd])$/;
        const match = durationStr.match(regex);
        
        if (!match) return null;

        const value = parseInt(match[1]);
        const unit = match[2];

        const multipliers = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };

        return value * multipliers[unit];
    }

    /**
     * Format duration for display
     */
    formatDuration(ms) {
        if (!ms) return 'Permanent';

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day(s)`;
        if (hours > 0) return `${hours} hour(s)`;
        if (minutes > 0) return `${minutes} minute(s)`;
        return `${seconds} second(s)`;
    }

    /**
     * Mute a user
     */
    async muteUser(guild, user, executor, duration, reason) {
        try {
            const configStore = new DataStore('./data/config.json');
            const config = configStore.read();

            if (!config.muteRoleId) {
                return { success: false, error: 'Mute role not configured. Use /setupmuterole first.' };
            }

            const member = await guild.members.fetch(user.id);
            const muteRole = await guild.roles.fetch(config.muteRoleId);

            if (!muteRole) {
                return { success: false, error: 'Mute role not found.' };
            }

            await member.roles.add(muteRole, reason || 'No reason provided');

            const durationMs = this.parseDuration(duration);
            const expiresAt = durationMs ? Date.now() + durationMs : null;

            const punishment = {
                id: this.generateId(),
                type: 'mute',
                userId: user.id,
                guildId: guild.id,
                executorId: executor.id,
                reason: reason || 'No reason provided',
                expiresAt,
                createdAt: Date.now()
            };

            // Save punishment
            punishmentsStore.update(data => {
                data.punishments.push(punishment);
                return data;
            });

            // Schedule expiration if temporary
            if (expiresAt) {
                this.scheduler.schedulePunishment(punishment.id, durationMs);
            }

            await this.logger.logModeration('Mute', executor.id, user.id, reason, this.formatDuration(durationMs), [
                { name: '🆔 User ID', value: user.id, inline: true },
                { name: '⏱️ Expires', value: expiresAt ? `<t:${Math.floor(expiresAt / 1000)}:R>` : 'Never (Permanent)', inline: true }
            ]);

            return { success: true, punishment };

        } catch (error) {
            console.error('Error muting user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unmute a user
     */
    async unmuteUser(guild, user, executor) {
        try {
            const configStore = new DataStore('./data/config.json');
            const config = configStore.read();

            if (!config.muteRoleId) {
                return { success: false, error: 'Mute role not configured.' };
            }

            const member = await guild.members.fetch(user.id);
            const muteRole = await guild.roles.fetch(config.muteRoleId);

            if (!muteRole) {
                return { success: false, error: 'Mute role not found.' };
            }

            if (!member.roles.cache.has(muteRole.id)) {
                return { success: false, error: 'User is not muted.' };
            }

            await member.roles.remove(muteRole, 'Unmuted by moderator');

            // Remove punishment from storage
            punishmentsStore.update(data => {
                data.punishments = data.punishments.filter(
                    p => !(p.userId === user.id && p.type === 'mute' && p.guildId === guild.id)
                );
                return data;
            });

            await this.logger.logModeration('Unmute', executor.id, user.id, 'Unmuted by moderator', null, [
                { name: '🆔 User ID', value: user.id, inline: true }
            ]);

            return { success: true };

        } catch (error) {
            console.error('Error unmuting user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Ban a user
     */
    async banUser(guild, user, executor, duration, reason) {
        try {
            await guild.members.ban(user.id, { reason: reason || 'No reason provided' });

            const durationMs = this.parseDuration(duration);
            const expiresAt = durationMs ? Date.now() + durationMs : null;

            const punishment = {
                id: this.generateId(),
                type: 'ban',
                userId: user.id,
                guildId: guild.id,
                executorId: executor.id,
                reason: reason || 'No reason provided',
                expiresAt,
                createdAt: Date.now()
            };

            punishmentsStore.update(data => {
                data.punishments.push(punishment);
                return data;
            });

            if (expiresAt) {
                this.scheduler.schedulePunishment(punishment.id, durationMs);
            }

            await this.logger.logModeration('Ban', executor.id, user.id, reason, this.formatDuration(durationMs), [
                { name: '🆔 User ID', value: user.id, inline: true },
                { name: '⏱️ Expires', value: expiresAt ? `<t:${Math.floor(expiresAt / 1000)}:R>` : 'Never (Permanent)', inline: true }
            ]);

            return { success: true, punishment };

        } catch (error) {
            console.error('Error banning user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unban a user
     */
    async unbanUser(guild, userId, executor) {
        try {
            await guild.members.unban(userId, 'Unbanned by moderator');

            punishmentsStore.update(data => {
                data.punishments = data.punishments.filter(
                    p => !(p.userId === userId && p.type === 'ban' && p.guildId === guild.id)
                );
                return data;
            });

            await this.logger.logModeration('Unban', executor.id, userId, 'Unbanned by moderator', null, [
                { name: '🆔 User ID', value: userId, inline: true }
            ]);

            return { success: true };

        } catch (error) {
            console.error('Error unbanning user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Timeout a user
     */
    async timeoutUser(guild, user, executor, duration, reason) {
        try {
            const durationMs = this.parseDuration(duration) || 60000; // Default 1 minute

            const member = await guild.members.fetch(user.id);
            await member.timeout(durationMs, reason || 'No reason provided');

            const expiresAt = Date.now() + durationMs;

            const punishment = {
                id: this.generateId(),
                type: 'timeout',
                userId: user.id,
                guildId: guild.id,
                executorId: executor.id,
                reason: reason || 'No reason provided',
                expiresAt,
                createdAt: Date.now()
            };

            punishmentsStore.update(data => {
                data.punishments.push(punishment);
                return data;
            });

            this.scheduler.schedulePunishment(punishment.id, durationMs);

            await this.logger.logModeration('Timeout', executor.id, user.id, reason, this.formatDuration(durationMs), [
                { name: '🆔 User ID', value: user.id, inline: true },
                { name: '⏱️ Expires', value: `<t:${Math.floor(expiresAt / 1000)}:R>`, inline: true }
            ]);

            return { success: true, punishment };

        } catch (error) {
            console.error('Error timing out user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove timeout from user
     */
    async untimeoutUser(guild, user, executor) {
        try {
            const member = await guild.members.fetch(user.id);

            if (!member.communicationDisabledUntil) {
                return { success: false, error: 'User is not timed out.' };
            }

            await member.timeout(null, 'Timeout removed by moderator');

            punishmentsStore.update(data => {
                data.punishments = data.punishments.filter(
                    p => !(p.userId === user.id && p.type === 'timeout' && p.guildId === guild.id)
                );
                return data;
            });

            await this.logger.logModeration('Remove Timeout', executor.id, user.id, 'Timeout removed by moderator', null, [
                { name: '🆔 User ID', value: user.id, inline: true }
            ]);

            return { success: true };

        } catch (error) {
            console.error('Error removing timeout:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create punishment confirmation embed
     */
    createPunishmentEmbed(type, user, executor, punishment) {
        const embed = new EmbedBuilder()
            .setTitle(`🔨 ${type.charAt(0).toUpperCase() + type.slice(1)} Applied`)
            .setColor('#FF0000')
            .addFields(
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'Executor', value: `<@${executor.id}>`, inline: true },
                { name: 'Duration', value: this.formatDuration(punishment.expiresAt ? punishment.expiresAt - punishment.createdAt : null), inline: true },
                { name: 'Reason', value: punishment.reason, inline: false }
            )
            .setTimestamp();

        if (punishment.expiresAt) {
            embed.addFields({ 
                name: 'Expires', 
                value: `<t:${Math.floor(punishment.expiresAt / 1000)}:R>`, 
                inline: true 
            });
        }

        return embed;
    }
}

module.exports = PunishmentManager;
