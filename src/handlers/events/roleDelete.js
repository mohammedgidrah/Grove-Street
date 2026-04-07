const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildRoleDelete,
    async execute(role) {
        try {
            const logger = role.client.logger;
            
            // Count members who had this role
            const memberCount = role.members.size;

            // Fetch audit log to find who deleted the role
            let executor = null;
            try {
                const auditLogs = await role.guild.fetchAuditLogs({
                    type: AuditLogEvent.RoleDelete,
                    limit: 1
                });
                const auditEntry = auditLogs.entries.first();
                if (auditEntry && auditEntry.target.id === role.id) {
                    executor = auditEntry.executor;
                }
            } catch (error) {
                console.error('Error fetching audit log:', error);
            }

            const fields = [
                { name: '🎭 Role', value: role.name, inline: true },
                { name: '🆔 Role ID', value: role.id, inline: true },
                { name: '🎨 Color', value: role.hexColor, inline: true }
            ];

            if (executor) {
                fields.push({ name: '👤 Deleted By', value: `${executor.tag}\n<@${executor.id}>`, inline: true });
            }

            fields.push(
                { name: '📊 Position', value: `${role.position}`, inline: true },
                { name: '👥 Members Had Role', value: `${memberCount} member(s)`, inline: true },
                { name: '🔒 Was Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true }
            );
            
            await logger.log('roleLogs', {
                title: '🗑️ Role Deleted',
                description: executor ? `A role was deleted by ${executor.tag}` : `A role was deleted`,
                color: '#FF0000',
                fields: fields
            });
        } catch (error) {
            console.error('Error in roleDelete event:', error);
        }
    }
};
