const { Events, PermissionFlagsBits, ChannelType, ActionRowBuilder, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const configStore = new DataStore('./data/config.json');
const voiceStore = new DataStore('./data/voiceInformation.json');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`Command ${interaction.commandName} not found`);
                return;
            }

            try {
                // Log command usage
                const logger = interaction.client.logger;
                const options = interaction.options.data.map(opt => {
                    let value = opt.value;
                    if (opt.channel) value = `#${opt.channel.name}`;
                    if (opt.user) value = `@${opt.user.tag}`;
                    if (opt.role) value = `@${opt.role.name}`;
                    return `${opt.name}: ${value}`;
                }).join(', ') || 'No options';

                await logger.log('commandLogs', {
                    title: '⚡ Command Executed',
                    description: `/${interaction.commandName}`,
                    color: '#00FF00',
                    fields: [
                        { name: '👤 User', value: `${interaction.user.tag}\n<@${interaction.user.id}>`, inline: true },
                        { name: '📍 Channel', value: `<#${interaction.channel.id}>`, inline: true },
                        { name: '🆔 User ID', value: interaction.user.id, inline: true },
                        { name: '🎯 Command', value: `\`/${interaction.commandName}\``, inline: true },
                        { name: '⚙️ Options', value: options.length > 1024 ? options.substring(0, 1021) + '...' : options, inline: false }
                    ]
                });

                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'An error occurred while executing this command.', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
                }
            }
            return;
        }

        // Handle button interactions
        if (interaction.isButton()) {
            // Giveaway entry buttons
            if (interaction.customId.startsWith('giveaway_enter_')) {
                const giveawayId = interaction.customId.replace('giveaway_enter_', '');
                await interaction.client.giveawayManager.handleEntry(interaction, giveawayId);
                return;
            }
            
            await handleButtonInteraction(interaction);
            return;
        }

        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction);
            return;
        }

        // Handle select menus
        if (interaction.isUserSelectMenu()) {
            await handleUserSelectMenu(interaction);
            return;
        }

        if (interaction.isStringSelectMenu()) {
            await handleStringSelectMenu(interaction);
            return;
        }

        if (interaction.isRoleSelectMenu()) {
            await handleRoleSelectMenu(interaction);
            return;
        }
    }
};

/**
 * Handle button interactions
 */
async function handleButtonInteraction(interaction) {
    const customId = interaction.customId;

    // Mute role setup buttons
    if (customId === 'muterole_create') {
        await createMuteRole(interaction);
        return;
    }

    if (customId === 'muterole_select') {
        await showRoleSelectMenu(interaction);
        return;
    }

    // Logs setup buttons
    if (customId === 'logs_autocreate') {
        await autoCreateLogChannels(interaction);
        return;
    }

    if (customId === 'logs_manual') {
        await showManualLogsModal(interaction);
        return;
    }

    // Voice room control panel buttons
    if (customId.startsWith('lock_')) {
        await lockVoiceRoom(interaction, customId.split('_')[1]);
        return;
    }

    if (customId.startsWith('unlock_')) {
        await unlockVoiceRoom(interaction, customId.split('_')[1]);
        return;
    }

    if (customId.startsWith('hide_')) {
        await hideVoiceRoom(interaction, customId.split('_')[1]);
        return;
    }

    if (customId.startsWith('show_')) {
        await showVoiceRoom(interaction, customId.split('_')[1]);
        return;
    }

    if (customId.startsWith('rename_')) {
        await showRenameModal(interaction, customId.split('_')[1]);
        return;
    }

    if (customId.startsWith('limit_')) {
        await showLimitModal(interaction, customId.split('_')[1]);
        return;
    }

    // User action buttons (trust, untrust, ban, unban)
    if (customId.startsWith('user_action_')) {
        const parts = customId.split('_');
        const action = parts[2]; // trust, untrust, ban, unban
        const channelId = parts[3];
        const userIds = parts.slice(4).join('_').split(',');
        await handleUserAction(interaction, action, channelId, userIds);
        return;
    }

    // Ticket buttons
    if (customId.startsWith('ticket_mention_')) {
        const ticketId = customId.replace('ticket_mention_', '');
        await handleTicketMention(interaction, ticketId);
        return;
    }

    if (customId.startsWith('ticket_close_')) {
        const ticketId = customId.replace('ticket_close_', '');
        await handleTicketClose(interaction, ticketId);
        return;
    }
}

/**
 * Handle modal submissions
 */
async function handleModalSubmit(interaction) {
    const customId = interaction.customId;

    // Add ticket option modal
    if (customId === 'addticket_modal') {
        const name = interaction.fields.getTextInputValue('ticket_name');
        const message = interaction.fields.getTextInputValue('ticket_message');

        const ticketManager = interaction.client.ticketManager;
        ticketManager.addTicketOption(name, message);

        await interaction.reply({ content: `✅ Ticket option "${name}" added!`, ephemeral: true });
        return;
    }

    // Rename voice room modal
    if (customId.startsWith('rename_modal_')) {
        const channelId = customId.replace('rename_modal_', '');
        const newName = interaction.fields.getTextInputValue('new_name');
        await renameVoiceRoom(interaction, channelId, newName);
        return;
    }

    // Limit voice room modal
    if (customId.startsWith('limit_modal_')) {
        const channelId = customId.replace('limit_modal_', '');
        const limit = interaction.fields.getTextInputValue('limit_value');
        await setVoiceLimit(interaction, channelId, parseInt(limit));
        return;
    }

    // Manual logs modal - Part 1
    if (customId === 'manual_logs_modal_part1') {
        await handleManualLogsModalPart1(interaction);
        return;
    }

    // Manual logs modal - Part 2
    if (customId === 'manual_logs_modal_part2') {
        await handleManualLogsModalPart2(interaction);
        return;
    }

    // Giveaway creation modal
    if (customId === 'giveaway_create_modal') {
        await handleGiveawayCreateModal(interaction);
        return;
    }
}

/**
 * Handle user select menus
 */
async function handleUserSelectMenu(interaction) {
    const customId = interaction.customId;

    if (customId.startsWith('user_select_action_')) {
        const channelId = customId.replace('user_select_action_', '');
        const selectedUsers = interaction.values;

        // Show action selection buttons
        const trustButton = new ButtonBuilder()
            .setCustomId(`user_action_trust_${channelId}_${selectedUsers.join(',')}`)
            .setLabel('✅ Trust')
            .setStyle(ButtonStyle.Success);

        const untrustButton = new ButtonBuilder()
            .setCustomId(`user_action_untrust_${channelId}_${selectedUsers.join(',')}`)
            .setLabel('❌ Untrust')
            .setStyle(ButtonStyle.Secondary);

        const banButton = new ButtonBuilder()
            .setCustomId(`user_action_ban_${channelId}_${selectedUsers.join(',')}`)
            .setLabel('🚫 Ban')
            .setStyle(ButtonStyle.Danger);

        const unbanButton = new ButtonBuilder()
            .setCustomId(`user_action_unban_${channelId}_${selectedUsers.join(',')}`)
            .setLabel('✅ Unban')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(trustButton, untrustButton, banButton, unbanButton);

        await interaction.reply({
            content: `Selected ${selectedUsers.length} user(s). Choose an action:`,
            components: [row],
            ephemeral: true
        });
        return;
    }
}

/**
 * Handle string select menus
 */
async function handleStringSelectMenu(interaction) {
    const customId = interaction.customId;

    // Ticket selection
    if (customId === 'ticket_select') {
        const optionName = interaction.values[0];
        const ticketManager = interaction.client.ticketManager;

        const result = await ticketManager.openTicket(interaction, optionName);

        if (!result.success) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }

        await interaction.reply({ 
            content: `✅ Ticket created: ${result.thread}`, 
            ephemeral: true 
        });
        return;
    }
}

/**
 * Handle role select menus
 */
async function handleRoleSelectMenu(interaction) {
    const customId = interaction.customId;

    if (customId === 'muterole_select_menu') {
        const roleId = interaction.values[0];

        configStore.update(data => {
            data.muteRoleId = roleId;
            return data;
        });

        await interaction.update({ 
            content: `✅ Mute role set to <@&${roleId}>.`, 
            components: [] 
        });
        return;
    }
}

// Voice room control functions

async function lockVoiceRoom(interaction, channelId) {
    const voiceData = voiceStore.read().voices.find(v => v.channelID === channelId);

    if (!voiceData) {
        return interaction.reply({ content: '❌ Voice room not found.', ephemeral: true });
    }

    if (interaction.user.id !== voiceData.ownerID) {
        return interaction.reply({ content: 'You are not the owner of this voice channel.', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    if (!voiceChannel) return;

    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
        Connect: false
    });

    // Allow owner and trusted users to connect
    await voiceChannel.permissionOverwrites.edit(voiceData.ownerID, {
        Connect: true
    });

    for (const userId of voiceData.trustedUsers) {
        await voiceChannel.permissionOverwrites.edit(userId, {
            Connect: true
        });
    }

    voiceStore.update(data => {
        const room = data.voices.find(v => v.channelID === channelId);
        if (room) room.settings.locked = true;
        return data;
    });

    await interaction.client.voiceManager.updateControlPanel(channelId);
    await interaction.client.logger.logRoom(
        `🔒 **Room Locked** - <@${interaction.user.id}> locked their voice room`,
        '#FFA500',
        [
            { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
            { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
            { name: '🔐 Status', value: 'Locked ✅', inline: true },
            { name: 'ℹ️ Effect', value: 'Only owner and trusted users can join', inline: false },
            { name: '✅ Trusted Users', value: voiceData.trustedUsers.length > 0 ? voiceData.trustedUsers.map(id => `<@${id}>`).join(', ') : 'None', inline: false }
        ]
    );
    await interaction.reply({ content: '🔒 Voice room locked!', ephemeral: true });
}

async function unlockVoiceRoom(interaction, channelId) {
    const voiceData = voiceStore.read().voices.find(v => v.channelID === channelId);

    if (!voiceData) {
        return interaction.reply({ content: '❌ Voice room not found.', ephemeral: true });
    }

    if (interaction.user.id !== voiceData.ownerID) {
        return interaction.reply({ content: 'You are not the owner of this voice channel.', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    if (!voiceChannel) return;

    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
        Connect: true
    });

    voiceStore.update(data => {
        const room = data.voices.find(v => v.channelID === channelId);
        if (room) room.settings.locked = false;
        return data;
    });

    await interaction.client.voiceManager.updateControlPanel(channelId);
    await interaction.client.logger.logRoom(
        `🔓 **Room Unlocked** - <@${interaction.user.id}> unlocked their voice room`,
        '#00FF00',
        [
            { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
            { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
            { name: '🔐 Status', value: 'Unlocked ✅', inline: true },
            { name: 'ℹ️ Effect', value: 'Everyone can now join the room', inline: false }
        ]
    );
    await interaction.reply({ content: '🔓 Voice room unlocked!', ephemeral: true });
}

async function hideVoiceRoom(interaction, channelId) {
    const voiceData = voiceStore.read().voices.find(v => v.channelID === channelId);

    if (!voiceData) {
        return interaction.reply({ content: '❌ Voice room not found.', ephemeral: true });
    }

    if (interaction.user.id !== voiceData.ownerID) {
        return interaction.reply({ content: 'You are not the owner of this voice channel.', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    if (!voiceChannel) return;

    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
        ViewChannel: false
    });

    // Allow owner and trusted users to view
    await voiceChannel.permissionOverwrites.edit(voiceData.ownerID, {
        ViewChannel: true
    });

    for (const userId of voiceData.trustedUsers) {
        await voiceChannel.permissionOverwrites.edit(userId, {
            ViewChannel: true
        });
    }

    voiceStore.update(data => {
        const room = data.voices.find(v => v.channelID === channelId);
        if (room) room.settings.hidden = true;
        return data;
    });

    await interaction.client.voiceManager.updateControlPanel(channelId);
    await interaction.client.logger.logRoom(
        `🙈 **Room Hidden** - <@${interaction.user.id}> hid their voice room from others`,
        '#9B59B6',
        [
            { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
            { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
            { name: '👁️ Visibility', value: 'Hidden ✅', inline: true },
            { name: 'ℹ️ Effect', value: 'Only owner and trusted users can see the room', inline: false },
            { name: '✅ Trusted Users', value: voiceData.trustedUsers.length > 0 ? voiceData.trustedUsers.map(id => `<@${id}>`).join(', ') : 'None', inline: false }
        ]
    );
    await interaction.reply({ content: '🙈 Voice room hidden!', ephemeral: true });
}

async function showVoiceRoom(interaction, channelId) {
    const voiceData = voiceStore.read().voices.find(v => v.channelID === channelId);

    if (!voiceData) {
        return interaction.reply({ content: '❌ Voice room not found.', ephemeral: true });
    }

    if (interaction.user.id !== voiceData.ownerID) {
        return interaction.reply({ content: 'You are not the owner of this voice channel.', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    if (!voiceChannel) return;

    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
        ViewChannel: true
    });

    voiceStore.update(data => {
        const room = data.voices.find(v => v.channelID === channelId);
        if (room) room.settings.hidden = false;
        return data;
    });

    await interaction.client.voiceManager.updateControlPanel(channelId);
    await interaction.client.logger.logRoom(
        `👀 **Room Shown** - <@${interaction.user.id}> made their voice room visible to everyone`,
        '#00FF00',
        [
            { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
            { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
            { name: '👁️ Visibility', value: 'Visible ✅', inline: true },
            { name: 'ℹ️ Effect', value: 'Everyone can now see the room', inline: false }
        ]
    );
    await interaction.reply({ content: '👀 Voice room visible!', ephemeral: true });
}

async function showRenameModal(interaction, channelId) {
    const modal = new ModalBuilder()
        .setCustomId(`rename_modal_${channelId}`)
        .setTitle('Rename Voice Room');

    const nameInput = new TextInputBuilder()
        .setCustomId('new_name')
        .setLabel('New Room Name')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter new name (1-100 characters)')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(100);

    const row = new ActionRowBuilder().addComponents(nameInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function renameVoiceRoom(interaction, channelId, newName) {
    const voiceData = voiceStore.read().voices.find(v => v.channelID === channelId);

    if (!voiceData) {
        return interaction.reply({ content: '❌ Voice room not found.', ephemeral: true });
    }

    if (interaction.user.id !== voiceData.ownerID) {
        return interaction.reply({ content: 'You are not the owner of this voice channel.', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    if (!voiceChannel) return;

    const oldName = voiceChannel.name;
    await voiceChannel.setName(newName);

    await interaction.client.voiceManager.updateControlPanel(channelId);
    await interaction.client.logger.logRoom(
        `✏️ **Room Renamed** - <@${interaction.user.id}> renamed their voice room`,
        '#3498DB',
        [
            { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
            { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📝 Old Name', value: oldName, inline: true },
            { name: '📝 New Name', value: newName, inline: true }
        ]
    );
    await interaction.reply({ content: `✏️ Room renamed to: ${newName}`, ephemeral: true });
}

async function showLimitModal(interaction, channelId) {
    const modal = new ModalBuilder()
        .setCustomId(`limit_modal_${channelId}`)
        .setTitle('Set User Limit');

    const limitInput = new TextInputBuilder()
        .setCustomId('limit_value')
        .setLabel('User Limit (0-99, 0 = no limit)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter number 0-99')
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(limitInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function setVoiceLimit(interaction, channelId, limit) {
    const voiceData = voiceStore.read().voices.find(v => v.channelID === channelId);

    if (!voiceData) {
        return interaction.reply({ content: '❌ Voice room not found.', ephemeral: true });
    }

    if (interaction.user.id !== voiceData.ownerID) {
        return interaction.reply({ content: 'You are not the owner of this voice channel.', ephemeral: true });
    }

    if (isNaN(limit) || limit < 0 || limit > 99) {
        return interaction.reply({ content: '❌ Limit must be between 0 and 99.', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    if (!voiceChannel) return;

    const oldLimit = voiceData.settings.limit;
    await voiceChannel.setUserLimit(limit);

    voiceStore.update(data => {
        const room = data.voices.find(v => v.channelID === channelId);
        if (room) room.settings.limit = limit;
        return data;
    });

    await interaction.client.voiceManager.updateControlPanel(channelId);
    await interaction.client.logger.logRoom(
        `🎚️ **User Limit Changed** - <@${interaction.user.id}> changed the user limit`,
        '#E74C3C',
        [
            { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
            { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📊 Old Limit', value: oldLimit === 0 ? 'No Limit' : `${oldLimit} users`, inline: true },
            { name: '📊 New Limit', value: limit === 0 ? 'No Limit' : `${limit} users`, inline: true },
            { name: 'ℹ️ Effect', value: limit === 0 ? 'Unlimited users can join' : `Maximum ${limit} users can join`, inline: false }
        ]
    );
    await interaction.reply({ content: `🎚️ User limit set to: ${limit === 0 ? 'No limit' : limit}`, ephemeral: true });
}

async function handleUserAction(interaction, action, channelId, userIds) {
    const voiceData = voiceStore.read().voices.find(v => v.channelID === channelId);

    if (!voiceData) {
        return interaction.update({ content: '❌ Voice room not found.', components: [] });
    }

    if (interaction.user.id !== voiceData.ownerID) {
        return interaction.update({ content: 'You are not the owner of this voice channel.', components: [] });
    }

    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    if (!voiceChannel) return;

    let message = '';

    for (const userId of userIds) {
        switch (action) {
            case 'trust':
                // Remove from banned if present
                voiceStore.update(data => {
                    const room = data.voices.find(v => v.channelID === channelId);
                    if (room) {
                        room.bannedUsers = room.bannedUsers.filter(id => id !== userId);
                        if (!room.trustedUsers.includes(userId)) {
                            room.trustedUsers.push(userId);
                        }
                    }
                    return data;
                });

                await voiceChannel.permissionOverwrites.edit(userId, {
                    Connect: true,
                    ViewChannel: true
                });

                message += `✅ Trusted <@${userId}>\n`;
                const updatedDataTrust = voiceStore.read().voices.find(v => v.channelID === channelId);
                await interaction.client.logger.logRoom(
                    `✅ **User Trusted** - <@${interaction.user.id}> added a trusted user to their room`,
                    '#2ECC71',
                    [
                        { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
                        { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '✅ Trusted User', value: `<@${userId}>`, inline: true },
                        { name: '🔐 Permissions', value: 'Can view and join room even if locked/hidden', inline: false },
                        { name: '📋 Total Trusted', value: `${updatedDataTrust?.trustedUsers.length || 0} user(s)`, inline: true }
                    ]
                );
                break;

            case 'untrust':
                voiceStore.update(data => {
                    const room = data.voices.find(v => v.channelID === channelId);
                    if (room) {
                        room.trustedUsers = room.trustedUsers.filter(id => id !== userId);
                    }
                    return data;
                });

                await voiceChannel.permissionOverwrites.delete(userId);

                message += `❌ Untrusted <@${userId}>\n`;
                const updatedDataUntrust = voiceStore.read().voices.find(v => v.channelID === channelId);
                await interaction.client.logger.logRoom(
                    `❌ **User Untrusted** - <@${interaction.user.id}> removed a trusted user from their room`,
                    '#F39C12',
                    [
                        { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
                        { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '❌ Untrusted User', value: `<@${userId}>`, inline: true },
                        { name: '🔐 Effect', value: 'User no longer has special permissions', inline: false },
                        { name: '📋 Remaining Trusted', value: `${updatedDataUntrust?.trustedUsers.length || 0} user(s)`, inline: true }
                    ]
                );
                break;

            case 'ban':
                // Remove from trusted if present
                voiceStore.update(data => {
                    const room = data.voices.find(v => v.channelID === channelId);
                    if (room) {
                        room.trustedUsers = room.trustedUsers.filter(id => id !== userId);
                        if (!room.bannedUsers.includes(userId)) {
                            room.bannedUsers.push(userId);
                        }
                    }
                    return data;
                });

                await voiceChannel.permissionOverwrites.edit(userId, {
                    Connect: false,
                    ViewChannel: false
                });

                // Kick if in channel
                const member = interaction.guild.members.cache.get(userId);
                const wasKicked = member && member.voice.channel?.id === channelId;
                if (wasKicked) {
                    await member.voice.disconnect();
                }

                message += `🚫 Banned <@${userId}>\n`;
                const updatedDataBan = voiceStore.read().voices.find(v => v.channelID === channelId);
                await interaction.client.logger.logRoom(
                    `🚫 **User Banned** - <@${interaction.user.id}> banned a user from their room`,
                    '#E74C3C',
                    [
                        { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
                        { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '🚫 Banned User', value: `<@${userId}>`, inline: true },
                        { name: '👢 Kicked', value: wasKicked ? 'Yes - User was in room' : 'No - User was not in room', inline: false },
                        { name: '🔐 Effect', value: 'Cannot view or join this room', inline: false },
                        { name: '📋 Total Banned', value: `${updatedDataBan?.bannedUsers.length || 0} user(s)`, inline: true }
                    ]
                );
                break;

            case 'unban':
                voiceStore.update(data => {
                    const room = data.voices.find(v => v.channelID === channelId);
                    if (room) {
                        room.bannedUsers = room.bannedUsers.filter(id => id !== userId);
                    }
                    return data;
                });

                await voiceChannel.permissionOverwrites.delete(userId);

                message += `✅ Unbanned <@${userId}>\n`;
                const updatedDataUnban = voiceStore.read().voices.find(v => v.channelID === channelId);
                await interaction.client.logger.logRoom(
                    `✅ **User Unbanned** - <@${interaction.user.id}> unbanned a user from their room`,
                    '#2ECC71',
                    [
                        { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
                        { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '✅ Unbanned User', value: `<@${userId}>`, inline: true },
                        { name: '🔐 Effect', value: 'User can now view and join the room normally', inline: false },
                        { name: '📋 Remaining Banned', value: `${updatedDataUnban?.bannedUsers.length || 0} user(s)`, inline: true }
                    ]
                );
                break;
        }
    }

    await interaction.client.voiceManager.updateControlPanel(channelId);
    await interaction.update({ content: message, components: [] });
}

// Voice channel setup functions

async function createMuteRole(interaction) {
    try {
        const guild = interaction.guild;

        // Create role
        const muteRole = await guild.roles.create({
            name: 'Muted',
            color: '#808080',
            permissions: []
        });

        // Apply permissions to all channels
        const channels = guild.channels.cache;
        let successCount = 0;

        for (const [, channel] of channels) {
            try {
                if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice) {
                    await channel.permissionOverwrites.edit(muteRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Connect: false,
                        Speak: false
                    });
                    successCount++;
                }
            } catch (err) {
                // Skip channels where bot lacks permissions
                console.log(`Could not set permissions in ${channel.name}`);
            }
        }

        // Save to config
        configStore.update(data => {
            data.muteRoleId = muteRole.id;
            return data;
        });

        await interaction.update({ 
            content: `✅ Mute role created: ${muteRole}\nPermissions applied to ${successCount} channels.`, 
            components: [] 
        });

    } catch (error) {
        console.error('Error creating mute role:', error);
        await interaction.update({ 
            content: '❌ Failed to create mute role. Check bot permissions.', 
            components: [] 
        });
    }
}

async function showRoleSelectMenu(interaction) {
    const selectMenu = new RoleSelectMenuBuilder()
        .setCustomId('muterole_select_menu')
        .setPlaceholder('Select a role to use as mute role');

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.update({
        content: 'Select an existing role to use as the mute role:',
        components: [row]
    });
}

async function autoCreateLogChannels(interaction) {
    try {
        const guild = interaction.guild;

        // Create category
        const category = await guild.channels.create({
            name: '📁-logs',
            type: ChannelType.GuildCategory
        });

        const logTypes = [
            'role-logs',
            'room-logs',
            'join-leave-logs',
            'member-logs',
            'voice-logs',
            'setting-logs',
            'command-logs',
            'message-logs',
            'ticket-logs'
        ];

        const logChannels = {};

        for (const logType of logTypes) {
            const channel = await guild.channels.create({
                name: logType,
                type: ChannelType.GuildText,
                parent: category
            });

            const key = logType.replace(/-/g, '').replace(/logs/g, 'Logs');
            const properKey = key.charAt(0).toLowerCase() + key.slice(1);
            logChannels[properKey] = channel.id;
        }

        // Save to config
        configStore.update(data => {
            data.autoCreateLogs = true;
            data.logChannels = logChannels;
            return data;
        });

        await interaction.update({ 
            content: `✅ Log channels created under category: ${category}`, 
            components: [] 
        });

    } catch (error) {
        console.error('Error creating log channels:', error);
        await interaction.update({ 
            content: '❌ Failed to create log channels. Check bot permissions.', 
            components: [] 
        });
    }
}

// Manual logs modal setup

async function showManualLogsModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('manual_logs_modal_part1')
        .setTitle('📋 Log Channels Setup (Part 1/2)');

    // Part 1: First 5 channels
    const roleLogsInput = new TextInputBuilder()
        .setCustomId('role_logs')
        .setLabel('Role Logs - سجلات الأدوار')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Channel ID')
        .setRequired(true);

    const roomLogsInput = new TextInputBuilder()
        .setCustomId('room_logs')
        .setLabel('Room Logs - سجلات الغرف الصوتية')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Channel ID')
        .setRequired(true);

    const joinLeaveLogsInput = new TextInputBuilder()
        .setCustomId('joinleave_logs')
        .setLabel('Join/Leave Logs - سجلات الدخول/الخروج')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Channel ID')
        .setRequired(true);

    const memberLogsInput = new TextInputBuilder()
        .setCustomId('member_logs')
        .setLabel('Member Logs - سجلات الأعضاء')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Channel ID')
        .setRequired(true);

    const voiceLogsInput = new TextInputBuilder()
        .setCustomId('voice_logs')
        .setLabel('Voice Logs - سجلات الصوت')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Channel ID')
        .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(roleLogsInput);
    const row2 = new ActionRowBuilder().addComponents(roomLogsInput);
    const row3 = new ActionRowBuilder().addComponents(joinLeaveLogsInput);
    const row4 = new ActionRowBuilder().addComponents(memberLogsInput);
    const row5 = new ActionRowBuilder().addComponents(voiceLogsInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    await interaction.showModal(modal);
}

async function handleManualLogsModalPart1(interaction) {
    // Store Part 1 data temporarily
    const roleLogs = interaction.fields.getTextInputValue('role_logs');
    const roomLogs = interaction.fields.getTextInputValue('room_logs');
    const joinLeaveLogs = interaction.fields.getTextInputValue('joinleave_logs');
    const memberLogs = interaction.fields.getTextInputValue('member_logs');
    const voiceLogs = interaction.fields.getTextInputValue('voice_logs');

    // Validate Part 1 IDs
    const guild = interaction.guild;
    const part1Ids = { roleLogs, roomLogs, joinLeaveLogs, memberLogs, voiceLogs };

    for (const [key, id] of Object.entries(part1Ids)) {
        const channel = guild.channels.cache.get(id);
        if (!channel) {
            return interaction.reply({ 
                content: `❌ معرف قناة غير صحيح لـ ${key}: ${id}`, 
                ephemeral: true 
            });
        }
    }

    // Show Part 2 modal
    const modal = new ModalBuilder()
        .setCustomId('manual_logs_modal_part2')
        .setTitle('📋 Log Channels Setup (Part 2/2)');

    const settingLogsInput = new TextInputBuilder()
        .setCustomId('setting_logs')
        .setLabel('Setting Logs - سجلات الإعدادات')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Channel ID')
        .setRequired(true);

    const commandLogsInput = new TextInputBuilder()
        .setCustomId('command_logs')
        .setLabel('Command Logs - سجلات الأوامر')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Channel ID')
        .setRequired(true);

    const messageLogsInput = new TextInputBuilder()
        .setCustomId('message_logs')
        .setLabel('Message Logs - سجلات الرسائل')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Channel ID')
        .setRequired(true);

    const ticketLogsInput = new TextInputBuilder()
        .setCustomId('ticket_logs')
        .setLabel('Ticket Logs - سجلات التذاكر')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Channel ID')
        .setRequired(true);

    // Store Part 1 data in customId
    const part1Data = `${roleLogs}|${roomLogs}|${joinLeaveLogs}|${memberLogs}|${voiceLogs}`;
    const dataInput = new TextInputBuilder()
        .setCustomId('part1_data')
        .setLabel('⚠️ لا تعدل هذا - بيانات الجزء الأول')
        .setStyle(TextInputStyle.Short)
        .setValue(part1Data)
        .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(settingLogsInput);
    const row2 = new ActionRowBuilder().addComponents(commandLogsInput);
    const row3 = new ActionRowBuilder().addComponents(messageLogsInput);
    const row4 = new ActionRowBuilder().addComponents(ticketLogsInput);
    const row5 = new ActionRowBuilder().addComponents(dataInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    await interaction.showModal(modal);
}

async function handleManualLogsModalPart2(interaction) {
    // Get Part 2 data
    const settingLogs = interaction.fields.getTextInputValue('setting_logs');
    const commandLogs = interaction.fields.getTextInputValue('command_logs');
    const messageLogs = interaction.fields.getTextInputValue('message_logs');
    const ticketLogs = interaction.fields.getTextInputValue('ticket_logs');

    // Retrieve Part 1 data
    const part1Data = interaction.fields.getTextInputValue('part1_data').split('|');
    const [roleLogs, roomLogs, joinLeaveLogs, memberLogs, voiceLogs] = part1Data;

    // Validate Part 2 IDs
    const guild = interaction.guild;
    const part2Ids = { settingLogs, commandLogs, messageLogs, ticketLogs };

    for (const [key, id] of Object.entries(part2Ids)) {
        const channel = guild.channels.cache.get(id);
        if (!channel) {
            return interaction.reply({ 
                content: `❌ معرف قناة غير صحيح لـ ${key}: ${id}`, 
                ephemeral: true 
            });
        }
    }

    // Save all 9 channels to config
    configStore.update(data => {
        data.autoCreateLogs = false;
        data.logChannels = {
            roleLogs: roleLogs,
            roomLogs: roomLogs,
            joinleaveLogs: joinLeaveLogs,
            memberLogs: memberLogs,
            voiceLogs: voiceLogs,
            settingLogs: settingLogs,
            commandLogs: commandLogs,
            messageLogs: messageLogs,
            ticketLogs: ticketLogs
        };
        return data;
    });

    await interaction.reply({ 
        content: `✅ تم إعداد قنوات السجلات يدوياً:\n\n` +
                `👔 Role Logs: <#${roleLogs}>\n` +
                `🏠 Room Logs: <#${roomLogs}>\n` +
                `🚪 Join/Leave Logs: <#${joinLeaveLogs}>\n` +
                `👤 Member Logs: <#${memberLogs}>\n` +
                `🎤 Voice Logs: <#${voiceLogs}>\n` +
                `⚙️ Setting Logs: <#${settingLogs}>\n` +
                `⚡ Command Logs: <#${commandLogs}>\n` +
                `💬 Message Logs: <#${messageLogs}>\n` +
                `🎫 Ticket Logs: <#${ticketLogs}>`, 
        ephemeral: true 
    });
}


// Ticket functions

async function handleTicketMention(interaction, ticketId) {
    const ticketManager = interaction.client.ticketManager;
    const result = await ticketManager.mentionAdmins(interaction, ticketId);

    if (!result.success) {
        return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    await interaction.reply({ content: '📢 Admins have been notified!', ephemeral: true });
}

async function handleTicketClose(interaction, ticketId) {
    const ticketManager = interaction.client.ticketManager;
    const result = await ticketManager.closeTicket(interaction, ticketId);

    if (!result.success) {
        return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    await interaction.reply({ content: '🔒 Ticket closed!', ephemeral: true });
}

// Giveaway functions

async function handleGiveawayCreateModal(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const prize = interaction.fields.getTextInputValue('prize');
        const durationStr = interaction.fields.getTextInputValue('duration');
        const winners = parseInt(interaction.fields.getTextInputValue('winners'));
        const description = interaction.fields.getTextInputValue('description') || null;
        const requirements = interaction.fields.getTextInputValue('requirements') || null;

        if (isNaN(winners) || winners < 1 || winners > 20) {
            return await interaction.editReply({
                content: '❌ عدد الفائزين يجب أن يكون بين 1 و 20'
            });
        }

        const giveawayManager = interaction.client.giveawayManager;
        const duration = giveawayManager.parseDuration(durationStr);

        if (!duration || duration < 60000) {
            return await interaction.editReply({
                content: '❌ المدة غير صحيحة! استخدم تنسيق مثل: 1h, 30m, 1d, 2h30m (الحد الأدنى: 1 دقيقة)'
            });
        }

        if (duration > 30 * 24 * 60 * 60 * 1000) {
            return await interaction.editReply({
                content: '❌ المدة طويلة جداً! الحد الأقصى: 30 يوم'
            });
        }

        const giveaway = await giveawayManager.createGiveaway({
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            prize,
            duration,
            winners,
            description,
            hostedBy: interaction.user.id,
            requirements
        });

        const endsAt = Math.floor(giveaway.endsAt / 1000);

        await interaction.editReply({
            content: `✅ تم إنشاء السحب بنجاح!\n\n` +
                    `🎁 **الجائزة:** ${prize}\n` +
                    `⏰ **ينتهي:** <t:${endsAt}:R> (<t:${endsAt}:F>)\n` +
                    `🏆 **عدد الفائزين:** ${winners}\n` +
                    `🆔 **المعرف:** \`${giveaway.id}\`\n\n` +
                    `📢 تم نشر السحب في هذه القناة!`
        });
    } catch (error) {
        console.error('Error creating giveaway:', error);
        await interaction.editReply({
            content: '❌ حدث خطأ أثناء إنشاء السحب'
        });
    }
}