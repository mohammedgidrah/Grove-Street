
const { Events, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.ChannelUpdate,
    async execute(oldChannel, newChannel) {
        try {
            const logger = newChannel.client.logger;
            
            // تتبع تغييرات البيرميشنز
            const oldPermissions = oldChannel.permissionOverwrites?.cache || new Map();
            const newPermissions = newChannel.permissionOverwrites?.cache || new Map();
            
            const changes = [];
            
            // التحقق من البيرميشنز المضافة أو المعدلة
            for (const [id, newPerm] of newPermissions) {
                const oldPerm = oldPermissions.get(id);
                
                if (!oldPerm) {
                    // بيرميشن جديد تم إضافته
                    const target = newPerm.type === 0 ? `<@&${id}>` : `<@${id}>`;
                    const allowed = newPerm.allow.toArray();
                    const denied = newPerm.deny.toArray();
                    
                    changes.push({
                        type: 'added',
                        target,
                        targetType: newPerm.type === 0 ? 'Role' : 'Member',
                        allowed,
                        denied
                    });
                } else {
                    // التحقق من التغييرات
                    const oldAllowed = oldPerm.allow.toArray();
                    const newAllowed = newPerm.allow.toArray();
                    const oldDenied = oldPerm.deny.toArray();
                    const newDenied = newPerm.deny.toArray();
                    
                    const addedAllowed = newAllowed.filter(p => !oldAllowed.includes(p));
                    const removedAllowed = oldAllowed.filter(p => !newAllowed.includes(p));
                    const addedDenied = newDenied.filter(p => !oldDenied.includes(p));
                    const removedDenied = oldDenied.filter(p => !newDenied.includes(p));
                    
                    if (addedAllowed.length > 0 || removedAllowed.length > 0 || 
                        addedDenied.length > 0 || removedDenied.length > 0) {
                        const target = newPerm.type === 0 ? `<@&${id}>` : `<@${id}>`;
                        changes.push({
                            type: 'modified',
                            target,
                            targetType: newPerm.type === 0 ? 'Role' : 'Member',
                            addedAllowed,
                            removedAllowed,
                            addedDenied,
                            removedDenied
                        });
                    }
                }
            }
            
            // التحقق من البيرميشنز المحذوفة
            for (const [id, oldPerm] of oldPermissions) {
                if (!newPermissions.has(id)) {
                    const target = oldPerm.type === 0 ? `<@&${id}>` : `<@${id}>`;
                    changes.push({
                        type: 'removed',
                        target,
                        targetType: oldPerm.type === 0 ? 'Role' : 'Member'
                    });
                }
            }
            
            // إذا لم تكن هناك تغييرات في البيرميشنز، تحقق من تغييرات أخرى
            const otherChanges = [];
            
            if (oldChannel.name !== newChannel.name) {
                otherChanges.push({ name: '📝 Name', value: `${oldChannel.name} → ${newChannel.name}`, inline: true });
            }
            
            if (oldChannel.position !== newChannel.position) {
                otherChanges.push({ name: '📊 Position', value: `${oldChannel.position} → ${newChannel.position}`, inline: true });
            }
            
            if (oldChannel.parent?.id !== newChannel.parent?.id) {
                const oldParent = oldChannel.parent ? oldChannel.parent.name : 'None';
                const newParent = newChannel.parent ? newChannel.parent.name : 'None';
                otherChanges.push({ name: '📂 Category', value: `${oldParent} → ${newParent}`, inline: true });
            }
            
            // سجل تغييرات البيرميشنز
            if (changes.length > 0) {
                const fields = [
                    { name: '📍 Channel', value: `<#${newChannel.id}>`, inline: true },
                    { name: '🆔 Channel ID', value: newChannel.id, inline: true },
                    { name: '📂 Type', value: getChannelType(newChannel.type), inline: true }
                ];
                
                for (const change of changes) {
                    if (change.type === 'added') {
                        fields.push({
                            name: `➕ Permission Added for ${change.targetType}`,
                            value: `${change.target}`,
                            inline: false
                        });
                        
                        if (change.allowed.length > 0) {
                            fields.push({
                                name: '✅ Allowed',
                                value: change.allowed.join(', '),
                                inline: false
                            });
                        }
                        
                        if (change.denied.length > 0) {
                            fields.push({
                                name: '❌ Denied',
                                value: change.denied.join(', '),
                                inline: false
                            });
                        }
                    } else if (change.type === 'modified') {
                        fields.push({
                            name: `✏️ Permission Modified for ${change.targetType}`,
                            value: `${change.target}`,
                            inline: false
                        });
                        
                        if (change.addedAllowed.length > 0) {
                            fields.push({
                                name: '➕ Added to Allowed',
                                value: change.addedAllowed.join(', '),
                                inline: false
                            });
                        }
                        
                        if (change.removedAllowed.length > 0) {
                            fields.push({
                                name: '➖ Removed from Allowed',
                                value: change.removedAllowed.join(', '),
                                inline: false
                            });
                        }
                        
                        if (change.addedDenied.length > 0) {
                            fields.push({
                                name: '➕ Added to Denied',
                                value: change.addedDenied.join(', '),
                                inline: false
                            });
                        }
                        
                        if (change.removedDenied.length > 0) {
                            fields.push({
                                name: '➖ Removed from Denied',
                                value: change.removedDenied.join(', '),
                                inline: false
                            });
                        }
                    } else if (change.type === 'removed') {
                        fields.push({
                            name: `🗑️ Permission Removed for ${change.targetType}`,
                            value: `${change.target}`,
                            inline: false
                        });
                    }
                }
                
                await logger.log('settingLogs', {
                    title: '🔐 Channel Permissions Updated',
                    description: `Permissions were changed for <#${newChannel.id}>`,
                    color: '#E67E22',
                    fields
                });
            }
            
            // سجل التغييرات الأخرى
            if (otherChanges.length > 0 && changes.length === 0) {
                await logger.log('settingLogs', {
                    title: '⚙️ Channel Settings Updated',
                    description: `Settings were changed for <#${newChannel.id}>`,
                    color: '#3498DB',
                    fields: [
                        { name: '📍 Channel', value: `<#${newChannel.id}>`, inline: true },
                        { name: '🆔 Channel ID', value: newChannel.id, inline: true },
                        { name: '📂 Type', value: getChannelType(newChannel.type), inline: true },
                        ...otherChanges
                    ]
                });
            }
            
        } catch (error) {
            console.error('Error in channelUpdate event:', error);
        }
    }
};

function getChannelType(type) {
    const types = {
        0: 'Text Channel',
        2: 'Voice Channel',
        4: 'Category',
        5: 'Announcement Channel',
        10: 'Announcement Thread',
        11: 'Public Thread',
        12: 'Private Thread',
        13: 'Stage Channel',
        15: 'Forum Channel'
    };
    return types[type] || 'Unknown';
}
