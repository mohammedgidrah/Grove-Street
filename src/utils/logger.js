const { EmbedBuilder } = require('discord.js');
const DataStore = require('./dataStore');

const configStore = new DataStore('./data/config.json');

/**
 * Logger utility - Sends formatted log messages to configured Discord channels
 */
class Logger {
    constructor(client) {
        this.client = client;
    }

    /**
     * Get log channel by type
     * @param {string} type - Log type (e.g., 'roomLogs', 'commandLogs')
     * @returns {TextChannel|null}
     */
    async getLogChannel(type) {
        try {
            const config = configStore.read();
            const channelId = config.logChannels?.[type];
            
            if (!channelId) return null;
            
            const channel = await this.client.channels.fetch(channelId);
            return channel;
        } catch (error) {
            console.error(`Error fetching log channel ${type}:`, error);
            return null;
        }
    }

    /**
     * Send log message to specified log channel
     * @param {string} type - Log channel type
     * @param {Object} options - Log options
     * @param {string} options.title - Embed title
     * @param {string} options.description - Embed description
     * @param {string} options.color - Embed color (hex)
     * @param {Array} options.fields - Embed fields
     */
    async log(type, { title, description, color = '#5865F2', fields = [] }) {
        try {
            const channel = await this.getLogChannel(type);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color)
                .setTimestamp();

            if (fields.length > 0) {
                embed.addFields(fields);
            }

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Error sending log to ${type}:`, error);
        }
    }

    /**
     * Log room-related actions with detailed information
     */
    async logRoom(description, color = '#5865F2', fields = []) {
        await this.log('roomLogs', {
            title: '🏠 Room Action',
            description,
            color,
            fields
        });
    }

    /**
     * Log command usage
     */
    async logCommand(executor, command, details = '') {
        await this.log('commandLogs', {
            title: '⚡ Command Executed',
            description: `<@${executor}> used \`/${command}\`${details ? `\n${details}` : ''}`,
            color: '#00FF00'
        });
    }

    /**
     * Log moderation actions with full details
     */
    async logModeration(action, executor, target, reason = '', duration = null, fields = []) {
        const baseFields = [
            { name: '🔨 Action', value: action, inline: true },
            { name: '👮 Moderator', value: `<@${executor}>`, inline: true },
            { name: '🎯 Target', value: `<@${target}>`, inline: true }
        ];

        if (duration) {
            baseFields.push({ name: '⏰ Duration', value: duration, inline: true });
        }

        if (reason) {
            baseFields.push({ name: '📝 Reason', value: reason, inline: false });
        }

        // Add any additional fields
        const allFields = [...baseFields, ...fields];

        await this.log('memberLogs', {
            title: '🔨 Moderation Action',
            description: `**${action}** action executed`,
            color: '#FF0000',
            fields: allFields
        });
    }

    /**
     * Log voice state changes
     */
    async logVoice(description, color = '#9B59B6') {
        await this.log('voiceLogs', {
            title: '🎤 Voice Activity',
            description,
            color
        });
    }

    /**
     * Log ticket actions
     */
    async logTicket(description, color = '#3498DB') {
        await this.log('ticketLogs', {
            title: '🎫 Ticket Action',
            description,
            color
        });
    }

    /**
     * Log setting changes
     */
    async logSetting(description, color = '#FFA500', fields = []) {
        await this.log('settingLogs', {
            title: '⚙️ Setting Changed',
            description,
            color,
            fields
        });
    }
}

module.exports = Logger;
