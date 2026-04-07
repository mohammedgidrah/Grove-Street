const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        try {
            const logger = newMember.client.logger;
            
            // Check for role changes
            const oldRoles = oldMember.roles.cache;
            const newRoles = newMember.roles.cache;
            
            const addedRoles = newRoles.filter(role => !oldRoles.has(role.id) && role.id !== newMember.guild.id);
            const removedRoles = oldRoles.filter(role => !newRoles.has(role.id) && role.id !== newMember.guild.id);
            
            // Log role additions
            if (addedRoles.size > 0) {
                const rolesList = addedRoles.map(role => `<@&${role.id}>`).join(', ');
                
                // Fetch audit log to find who added the roles
                let executor = null;
                try {
                    const auditLogs = await newMember.guild.fetchAuditLogs({
                        type: AuditLogEvent.MemberRoleUpdate,
                        limit: 1
                    });
                    const auditEntry = auditLogs.entries.first();
                    if (auditEntry && auditEntry.target.id === newMember.user.id) {
                        executor = auditEntry.executor;
                    }
                } catch (error) {
                    console.error('Error fetching audit log:', error);
                }

                const fields = [
                    { name: '👤 Member', value: `${newMember.user.tag}\n<@${newMember.user.id}>`, inline: true },
                    { name: '🆔 User ID', value: newMember.user.id, inline: true },
                    { name: '📊 Roles Added', value: `${addedRoles.size} role(s)`, inline: true }
                ];

                if (executor) {
                    fields.push({ name: '👤 Added By', value: `${executor.tag}\n<@${executor.id}>`, inline: true });
                }

                fields.push(
                    { name: '🎭 Roles', value: rolesList, inline: false },
                    { name: '📋 Total Roles Now', value: `${newRoles.size - 1} role(s)`, inline: true }
                );
                
                await logger.log('roleLogs', {
                    title: '➕ Roles Added to Member',
                    description: executor ? `Roles were added to ${newMember.user} by ${executor.tag}` : `Roles were added to ${newMember.user}`,
                    color: '#00FF00',
                    fields: fields
                });
            }
            
            // Log role removals
            if (removedRoles.size > 0) {
                const rolesList = removedRoles.map(role => `<@&${role.id}>`).join(', ');
                
                // Fetch audit log to find who removed the roles
                let executor = null;
                try {
                    const auditLogs = await newMember.guild.fetchAuditLogs({
                        type: AuditLogEvent.MemberRoleUpdate,
                        limit: 1
                    });
                    const auditEntry = auditLogs.entries.first();
                    if (auditEntry && auditEntry.target.id === newMember.user.id) {
                        executor = auditEntry.executor;
                    }
                } catch (error) {
                    console.error('Error fetching audit log:', error);
                }

                const fields = [
                    { name: '👤 Member', value: `${newMember.user.tag}\n<@${newMember.user.id}>`, inline: true },
                    { name: '🆔 User ID', value: newMember.user.id, inline: true },
                    { name: '📊 Roles Removed', value: `${removedRoles.size} role(s)`, inline: true }
                ];

                if (executor) {
                    fields.push({ name: '👤 Removed By', value: `${executor.tag}\n<@${executor.id}>`, inline: true });
                }

                fields.push(
                    { name: '🎭 Roles', value: rolesList, inline: false },
                    { name: '📋 Total Roles Now', value: `${newRoles.size - 1} role(s)`, inline: true }
                );
                
                await logger.log('roleLogs', {
                    title: '➖ Roles Removed from Member',
                    description: executor ? `Roles were removed from ${newMember.user} by ${executor.tag}` : `Roles were removed from ${newMember.user}`,
                    color: '#FF0000',
                    fields: fields
                });
            }
            
            // Check for nickname changes
            if (oldMember.nickname !== newMember.nickname) {
                // Fetch audit log to find who changed the nickname
                let executor = null;
                try {
                    const auditLogs = await newMember.guild.fetchAuditLogs({
                        type: AuditLogEvent.MemberUpdate,
                        limit: 1
                    });
                    const auditEntry = auditLogs.entries.first();
                    if (auditEntry && auditEntry.target.id === newMember.user.id) {
                        executor = auditEntry.executor;
                    }
                } catch (error) {
                    console.error('Error fetching audit log:', error);
                }

                const fields = [
                    { name: '👤 Member', value: `${newMember.user.tag}\n<@${newMember.user.id}>`, inline: true },
                    { name: '🆔 User ID', value: newMember.user.id, inline: true },
                    { name: '📝 Old Nickname', value: oldMember.nickname || 'None', inline: true },
                    { name: '📝 New Nickname', value: newMember.nickname || 'None', inline: true }
                ];

                if (executor) {
                    fields.push({ name: '👤 Changed By', value: `${executor.tag}\n<@${executor.id}>`, inline: true });
                }

                await logger.log('memberLogs', {
                    title: '✏️ Nickname Changed',
                    description: executor ? `${newMember.user}'s nickname was changed by ${executor.tag}` : `${newMember.user}'s nickname was changed`,
                    color: '#3498DB',
                    fields: fields
                });
            }
            
        } catch (error) {
            console.error('Error in guildMemberUpdate event:', error);
        }
    }
};
