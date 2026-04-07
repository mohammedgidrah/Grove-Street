const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        try {
            // Ignore DMs and bot messages
            if (!message.guild || message.author?.bot) return;
            
            const logger = message.client.logger;
            
            // Get message content (may be partial/cached)
            const content = message.content || '*Content not cached*';
            const author = message.author || { tag: 'Unknown User', id: 'Unknown' };
            
            // Get attachments info
            const attachments = message.attachments.size > 0 
                ? message.attachments.map(att => `[${att.name}](${att.url})`).join('\n')
                : 'None';
            
            // Get embeds info
            const embeds = message.embeds.length > 0 
                ? `${message.embeds.length} embed(s)`
                : 'None';
            
            await logger.log('messageLogs', {
                title: '🗑️ Message Deleted',
                description: `A message was deleted in <#${message.channel.id}>`,
                color: '#FF0000',
                fields: [
                    { name: '👤 Author', value: `${author.tag}\n<@${author.id}>`, inline: true },
                    { name: '📍 Channel', value: `<#${message.channel.id}>`, inline: true },
                    { name: '🆔 Message ID', value: message.id, inline: true },
                    { name: '💬 Content', value: content.length > 1024 ? content.substring(0, 1021) + '...' : content || '*Empty message*', inline: false },
                    { name: '📎 Attachments', value: attachments.length > 1024 ? attachments.substring(0, 1021) + '...' : attachments, inline: true },
                    { name: '📋 Embeds', value: embeds, inline: true },
                    { name: '📅 Created At', value: message.createdAt ? `<t:${Math.floor(message.createdAt.getTime() / 1000)}:R>` : 'Unknown', inline: true }
                ]
            });
        } catch (error) {
            console.error('Error in messageDelete event:', error);
        }
    }
};
