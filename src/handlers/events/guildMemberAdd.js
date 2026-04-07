const { Events, EmbedBuilder } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const settingsStore = new DataStore('./data/guild-settings.json');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            const logger = member.client.logger;
            
            // Calculate account age
            const accountCreated = member.user.createdAt;
            const now = new Date();
            const accountAge = Math.floor((now - accountCreated) / (1000 * 60 * 60 * 24)); // days
            
            // Check if account is new (less than 7 days old)
            const isNewAccount = accountAge < 7;
            const accountAgeText = accountAge < 1 
                ? 'Less than 1 day' 
                : accountAge === 1 
                    ? '1 day' 
                    : `${accountAge} days`;
            
            await logger.log('joinleaveLogs', {
                title: '📥 Member Joined',
                description: `${member.user} joined the server`,
                color: '#00FF00',
                fields: [
                    { name: '👤 User', value: `${member.user.tag}\n<@${member.user.id}>`, inline: true },
                    { name: '🆔 User ID', value: member.user.id, inline: true },
                    { name: '📅 Account Created', value: `<t:${Math.floor(accountCreated.getTime() / 1000)}:R>`, inline: true },
                    { name: '⏰ Account Age', value: accountAgeText + (isNewAccount ? ' ⚠️ **NEW**' : ''), inline: true },
                    { name: '📊 Member Count', value: `${member.guild.memberCount} members`, inline: true },
                    { name: '🤖 Is Bot', value: member.user.bot ? 'Yes' : 'No', inline: true },
                    { name: '📸 Avatar', value: member.user.displayAvatarURL() ? '[Click Here](' + member.user.displayAvatarURL() + ')' : 'No Avatar', inline: true }
                ]
            });

            // Load guild settings
            const settings = settingsStore.read();
            const guildSettings = settings.guilds?.[member.guild.id];

            // Handle welcome message
            if (guildSettings?.welcome?.enabled && guildSettings.welcome.channelId) {
                try {
                    const welcomeChannel = await member.guild.channels.fetch(guildSettings.welcome.channelId);
                    if (welcomeChannel) {
                        let welcomeMessage = guildSettings.welcome.message
                            .replace(/{user}/g, `${member}`)
                            .replace(/{server}/g, member.guild.name)
                            .replace(/{membercount}/g, member.guild.memberCount);
                        
                        await welcomeChannel.send(welcomeMessage);
                    }
                } catch (error) {
                    console.error('Error sending welcome message:', error);
                }
            }

            // Handle auto role
            if (guildSettings?.autorole?.enabled) {
                try {
                    const roleId = member.user.bot 
                        ? guildSettings.autorole.botRoleId 
                        : guildSettings.autorole.memberRoleId;
                    
                    if (roleId) {
                        const role = await member.guild.roles.fetch(roleId);
                        if (role) {
                            await member.roles.add(role);
                            console.log(`✅ Auto-role assigned: ${role.name} to ${member.user.tag}`);
                        }
                    }
                } catch (error) {
                    console.error('Error assigning auto role:', error);
                }
            }
        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    }
};
