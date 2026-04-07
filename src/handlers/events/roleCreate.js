const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildRoleCreate,
    async execute(role) {
        try {
            const logger = role.client.logger;
            
            // Get role permissions
            const permissions = role.permissions.toArray().join(', ') || 'None';
            
            // Fetch audit log to find who created the role
            let executor = null;
            try {
                const auditLogs = await role.guild.fetchAuditLogs({
                    type: AuditLogEvent.RoleCreate,
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
                { name: '🎭 Role', value: `${role.name}\n<@&${role.id}>`, inline: true },
                { name: '🆔 Role ID', value: role.id, inline: true },
                { name: '🎨 Color', value: role.hexColor, inline: true }
            ];

            if (executor) {
                fields.push({ name: '👤 Created By', value: `${executor.tag}\n<@${executor.id}>`, inline: true });
            }

            fields.push(
                { name: '📊 Position', value: `${role.position}`, inline: true },
                { name: '🔒 Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
                { name: '👁️ Hoisted', value: role.hoist ? 'Yes (Displayed separately)' : 'No', inline: true },
                { name: '🔐 Permissions', value: permissions.length > 1024 ? permissions.substring(0, 1021) + '...' : permissions, inline: false }
            );
            
            await logger.log('roleLogs', {
                title: '➕ Role Created',
                description: executor ? `A new role was created by ${executor.tag}` : `A new role was created`,
                color: '#00FF00',
                fields: fields
            });
        } catch (error) {
            console.error('Error in roleCreate event:', error);
        }
    }
};
