const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        try {
            // Ignore DMs, bot messages, and non-content updates (embeds, etc.)
            if (!newMessage.guild || newMessage.author?.bot) return;
            if (oldMessage.content === newMessage.content) return; // Ignore if content didn't change
            
            const logger = newMessage.client.logger;
            
            // Get old and new content
            const oldContent = oldMessage.content || '*Content not cached*';
            const newContent = newMessage.content || '*Empty*';
            
            // Skip if old content wasn't cached
            if (oldContent === '*Content not cached*') return;
            
            await logger.log('messageLogs', {
                title: '✏️ Message Edited',
                description: `A message was edited in <#${newMessage.channel.id}>`,
                color: '#FFA500',
                fields: [
                    { name: '👤 Author', value: `${newMessage.author.tag}\n<@${newMessage.author.id}>`, inline: true },
                    { name: '📍 Channel', value: `<#${newMessage.channel.id}>`, inline: true },
                    { name: '🔗 Message Link', value: `[Jump to Message](${newMessage.url})`, inline: true },
                    { name: '📝 Before', value: oldContent.length > 1024 ? oldContent.substring(0, 1021) + '...' : oldContent, inline: false },
                    { name: '📝 After', value: newContent.length > 1024 ? newContent.substring(0, 1021) + '...' : newContent, inline: false },
                    { name: '📅 Original Created', value: `<t:${Math.floor(newMessage.createdAt.getTime() / 1000)}:R>`, inline: true },
                    { name: '📅 Edited At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                ]
            });
        } catch (error) {
            console.error('Error in messageUpdate event:', error);
        }
    }
};
