const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, UserSelectMenuBuilder } = require('discord.js');

/**
 * Control Panel Builder - Creates interactive control panels for voice rooms
 */
class ControlPanelBuilder {
    /**
     * Build control panel embed
     * @param {Object} voiceData - Voice room data from storage
     * @param {VoiceChannel} voiceChannel - Discord voice channel
     * @param {TextChannel} textChannel - Discord text channel
     * @param {Guild} guild - Discord guild
     * @returns {Object} - { embed, components }
     */
    static async buildPanel(voiceData, voiceChannel, textChannel, guild) {
        try {
            const owner = await guild.members.fetch(voiceData.ownerID);
            const settings = voiceData.settings;

            // Build embed
            const embed = new EmbedBuilder()
                .setTitle(`${voiceChannel.name} — Control Panel`)
                .setColor('#5865F2')
                .addFields(
                    { name: '👑 Owner', value: `<@${voiceData.ownerID}>`, inline: true },
                    { name: '📝 Channel Name', value: voiceChannel.name, inline: true },
                    { 
                        name: '🔒 Status', 
                        value: `${settings.locked ? 'Locked' : 'Unlocked'} • ${settings.hidden ? 'Hidden' : 'Visible'}`, 
                        inline: true 
                    },
                    { 
                        name: '👥 Limit', 
                        value: settings.limit === 0 ? 'No limit' : `${voiceChannel.members.size}/${settings.limit}`, 
                        inline: true 
                    },
                    { name: '✅ Trusted Users', value: `${voiceData.trustedUsers.length}`, inline: true },
                    { name: '🚫 Banned Users', value: `${voiceData.bannedUsers.length}`, inline: true }
                )
                .setFooter({ text: `Channel ID: ${voiceData.channelID}` })
                .setTimestamp();

            // Build components
            const components = this.buildComponents(voiceData.channelID);

            return { embed, components };
        } catch (error) {
            console.error('Error building control panel:', error);
            throw error;
        }
    }

    /**
     * Build action row components for control panel
     * @param {string} channelId - Voice channel ID
     * @returns {Array<ActionRowBuilder>}
     */
    static buildComponents(channelId) {
        // Row 1: Lock/Unlock and Rename
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`lock_${channelId}`)
                    .setLabel('🔒 Lock')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`unlock_${channelId}`)
                    .setLabel('🔓 Unlock')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`rename_${channelId}`)
                    .setLabel('✏️ Rename')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Row 2: Hide/Show and Limit
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`hide_${channelId}`)
                    .setLabel('🙈 Hide')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`show_${channelId}`)
                    .setLabel('👀 Show')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`limit_${channelId}`)
                    .setLabel('🎚️ Limit')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Row 3: User management select menu
        const row3 = new ActionRowBuilder()
            .addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId(`user_select_action_${channelId}`)
                    .setPlaceholder('Select users to Trust / Untrust / Ban / Unban')
                    .setMinValues(1)
                    .setMaxValues(10)
            );

        return [row1, row2, row3];
    }
}

module.exports = ControlPanelBuilder;
