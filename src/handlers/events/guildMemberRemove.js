const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        try {
            const logger = member.client.logger;
            
            // Calculate how long the member was in the server
            const joinedAt = member.joinedAt;
            const leftAt = new Date();
            const timeInServer = joinedAt ? Math.floor((leftAt - joinedAt) / (1000 * 60 * 60 * 24)) : null; // days
            
            const timeText = timeInServer === null 
                ? 'Unknown' 
                : timeInServer < 1 
                    ? 'Less than 1 day' 
                    : timeInServer === 1 
                        ? '1 day' 
                        : `${timeInServer} days`;
            
            // Get roles (excluding @everyone)
            const roles = member.roles.cache
                .filter(role => role.id !== member.guild.id)
                .map(role => role.name)
                .join(', ') || 'No roles';
            
            await logger.log('joinleaveLogs', {
                title: '📤 Member Left',
                description: `${member.user} left the server`,
                color: '#FF0000',
                fields: [
                    { name: '👤 User', value: `${member.user.tag}\n<@${member.user.id}>`, inline: true },
                    { name: '🆔 User ID', value: member.user.id, inline: true },
                    { name: '📅 Joined Server', value: joinedAt ? `<t:${Math.floor(joinedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true },
                    { name: '⏰ Time in Server', value: timeText, inline: true },
                    { name: '📊 Member Count', value: `${member.guild.memberCount} members`, inline: true },
                    { name: '🤖 Was Bot', value: member.user.bot ? 'Yes' : 'No', inline: true },
                    { name: '🎭 Roles', value: roles.length > 1024 ? roles.substring(0, 1021) + '...' : roles, inline: false }
                ]
            });
        } catch (error) {
            console.error('Error in guildMemberRemove event:', error);
        }
    }
};
