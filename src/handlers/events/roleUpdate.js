const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildRoleUpdate,
    async execute(oldRole, newRole) {
        try {
            const logger = newRole.client.logger;
            
            const changes = [];
            
            // Check for name change
            if (oldRole.name !== newRole.name) {
                changes.push({ name: '📝 Name', value: `${oldRole.name} → ${newRole.name}`, inline: true });
            }
            
            // Check for color change
            if (oldRole.hexColor !== newRole.hexColor) {
                changes.push({ name: '🎨 Color', value: `${oldRole.hexColor} → ${newRole.hexColor}`, inline: true });
            }
            
            // Check for position change
            if (oldRole.position !== newRole.position) {
                changes.push({ name: '📊 Position', value: `${oldRole.position} → ${newRole.position}`, inline: true });
            }
            
            // Check for mentionable change
            if (oldRole.mentionable !== newRole.mentionable) {
                changes.push({ name: '🔒 Mentionable', value: `${oldRole.mentionable ? 'Yes' : 'No'} → ${newRole.mentionable ? 'Yes' : 'No'}`, inline: true });
            }
            
            // Check for hoist change
            if (oldRole.hoist !== newRole.hoist) {
                changes.push({ name: '👁️ Hoisted', value: `${oldRole.hoist ? 'Yes' : 'No'} → ${newRole.hoist ? 'Yes' : 'No'}`, inline: true });
            }
            
            // Check for permission changes
            const oldPerms = oldRole.permissions.toArray();
            const newPerms = newRole.permissions.toArray();
            const addedPerms = newPerms.filter(p => !oldPerms.includes(p));
            const removedPerms = oldPerms.filter(p => !newPerms.includes(p));
            
            if (addedPerms.length > 0) {
                changes.push({ name: '➕ Permissions Added', value: addedPerms.join(', '), inline: false });
            }
            
            if (removedPerms.length > 0) {
                changes.push({ name: '➖ Permissions Removed', value: removedPerms.join(', '), inline: false });
            }
            
            // Only log if there were actual changes
            if (changes.length === 0) return;

            // Fetch audit log to find who updated the role
            let executor = null;
            try {
                const auditLogs = await newRole.guild.fetchAuditLogs({
                    type: AuditLogEvent.RoleUpdate,
                    limit: 1
                });
                const auditEntry = auditLogs.entries.first();
                if (auditEntry && auditEntry.target.id === newRole.id) {
                    executor = auditEntry.executor;
                }
            } catch (error) {
                console.error('Error fetching audit log:', error);
            }

            const baseFields = [
                { name: '🎭 Role', value: `${newRole.name}\n<@&${newRole.id}>`, inline: true },
                { name: '🆔 Role ID', value: newRole.id, inline: true },
                { name: '👥 Members', value: `${newRole.members.size} member(s)`, inline: true }
            ];

            if (executor) {
                baseFields.push({ name: '👤 Updated By', value: `${executor.tag}\n<@${executor.id}>`, inline: true });
            }
            
            await logger.log('roleLogs', {
                title: '✏️ Role Updated',
                description: executor ? `Role <@&${newRole.id}> was modified by ${executor.tag}` : `Role <@&${newRole.id}> was modified`,
                color: '#FFA500',
                fields: [...baseFields, ...changes]
            });
        } catch (error) {
            console.error('Error in roleUpdate event:', error);
        }
    }
};
