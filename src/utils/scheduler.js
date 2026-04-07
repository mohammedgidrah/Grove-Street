const DataStore = require('./dataStore');

const punishmentsStore = new DataStore('./data/punishments.json');

/**
 * Scheduler - Manages timed punishment expirations
 * Handles auto-unmute, auto-unban, and auto-untimeout when durations expire
 */
class Scheduler {
    constructor(client) {
        this.client = client;
        this.timers = new Map(); // Map of punishmentId -> timeout
        this.checkInterval = null;
    }

    /**
     * Initialize scheduler - load all active punishments on boot
     */
    async initialize() {
        console.log('⏰ Initializing punishment scheduler...');
        
        // Start periodic check every 60 seconds for missed expirations
        this.checkInterval = setInterval(() => this.checkExpiredPunishments(), 60000);
        
        // Load and schedule all active punishments
        await this.loadActivePunishments();
    }

    /**
     * Load all active punishments from storage and schedule them
     */
    async loadActivePunishments() {
        const data = punishmentsStore.read();
        const now = Date.now();

        for (const punishment of data.punishments) {
            if (!punishment.expiresAt) continue; // Permanent punishment
            
            const timeLeft = punishment.expiresAt - now;
            
            if (timeLeft <= 0) {
                // Already expired, execute immediately
                await this.executePunishmentExpiration(punishment.id);
            } else if (timeLeft < 2147483647) {
                // Schedule with setTimeout (max timeout is ~24.8 days)
                this.schedulePunishment(punishment.id, timeLeft);
            }
            // If timeout is too far in future, periodic check will catch it
        }
    }

    /**
     * Schedule a punishment expiration
     * @param {string} punishmentId - Unique punishment ID
     * @param {number} duration - Duration in milliseconds
     */
    schedulePunishment(punishmentId, duration) {
        // Clear existing timer if any
        if (this.timers.has(punishmentId)) {
            clearTimeout(this.timers.get(punishmentId));
        }

        // Schedule new timer
        const timer = setTimeout(async () => {
            await this.executePunishmentExpiration(punishmentId);
        }, duration);

        this.timers.set(punishmentId, timer);
    }

    /**
     * Check for expired punishments (fallback for missed timers)
     */
    async checkExpiredPunishments() {
        const data = punishmentsStore.read();
        const now = Date.now();

        for (const punishment of data.punishments) {
            if (punishment.expiresAt && punishment.expiresAt <= now) {
                await this.executePunishmentExpiration(punishment.id);
            }
        }
    }

    /**
     * Execute punishment expiration - remove punishment and restore user
     * @param {string} punishmentId - Unique punishment ID
     */
    async executePunishmentExpiration(punishmentId) {
        try {
            const data = punishmentsStore.read();
            const punishment = data.punishments.find(p => p.id === punishmentId);
            
            if (!punishment) return; // Already removed

            const guild = await this.client.guilds.fetch(punishment.guildId);
            if (!guild) {
                // Guild not found, just remove punishment
                this.removePunishment(punishmentId);
                return;
            }

            console.log(`⏰ Expiring ${punishment.type} for user ${punishment.userId}`);

            // Execute expiration based on type
            switch (punishment.type) {
                case 'mute':
                    await this.unmute(guild, punishment.userId);
                    break;
                case 'ban':
                    await this.unban(guild, punishment.userId);
                    break;
                case 'timeout':
                    await this.untimeout(guild, punishment.userId);
                    break;
            }

            // Remove punishment from storage
            this.removePunishment(punishmentId);

            // Clear timer
            if (this.timers.has(punishmentId)) {
                clearTimeout(this.timers.get(punishmentId));
                this.timers.delete(punishmentId);
            }

        } catch (error) {
            console.error(`Error expiring punishment ${punishmentId}:`, error);
        }
    }

    /**
     * Remove mute role from user
     */
    async unmute(guild, userId) {
        try {
            const configStore = new DataStore('./data/config.json');
            const config = configStore.read();
            
            if (!config.muteRoleId) return;

            const member = await guild.members.fetch(userId);
            const muteRole = await guild.roles.fetch(config.muteRoleId);
            
            if (member && muteRole && member.roles.cache.has(muteRole.id)) {
                await member.roles.remove(muteRole, 'Mute duration expired');
                console.log(`✅ Auto-unmuted ${member.user.tag}`);
            }
        } catch (error) {
            console.error(`Error auto-unmuting user ${userId}:`, error);
        }
    }

    /**
     * Unban user from guild
     */
    async unban(guild, userId) {
        try {
            await guild.members.unban(userId, 'Ban duration expired');
            console.log(`✅ Auto-unbanned user ${userId}`);
        } catch (error) {
            console.error(`Error auto-unbanning user ${userId}:`, error);
        }
    }

    /**
     * Remove timeout from user
     */
    async untimeout(guild, userId) {
        try {
            const member = await guild.members.fetch(userId);
            if (member && member.communicationDisabledUntil) {
                await member.timeout(null, 'Timeout duration expired');
                console.log(`✅ Auto-untimeout ${member.user.tag}`);
            }
        } catch (error) {
            console.error(`Error auto-untimeout user ${userId}:`, error);
        }
    }

    /**
     * Remove punishment from storage
     */
    removePunishment(punishmentId) {
        punishmentsStore.update(data => {
            data.punishments = data.punishments.filter(p => p.id !== punishmentId);
            return data;
        });
    }

    /**
     * Cleanup timers on shutdown
     */
    shutdown() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
    }
}

module.exports = Scheduler;
