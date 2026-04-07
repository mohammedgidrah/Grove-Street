const { PermissionFlagsBits } = require('discord.js');

/**
 * LOL Manager - Handles fun troll voice channel
 * Kicks anyone who joins with random funny messages
 */
class LolManager {
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
        this.kickedUsers = new Map(); // Map of userId -> timeout timestamp
        this.allowedUsers = new Map(); // Map of userId -> timeout for allowed users
        this.whitelist = new Set(); // Whitelisted users (higher chance)
        this.blacklist = new Set(); // Blacklisted users (lower chance)
    }

    /**
     * Add user to whitelist
     */
    addToWhitelist(userId) {
        this.blacklist.delete(userId);
        this.whitelist.add(userId);
    }

    /**
     * Add user to blacklist
     */
    addToBlacklist(userId) {
        this.whitelist.delete(userId);
        this.blacklist.add(userId);
    }

    /**
     * Remove user from both lists
     */
    removeFromLists(userId) {
        const wasInList = this.whitelist.has(userId) || this.blacklist.has(userId);
        this.whitelist.delete(userId);
        this.blacklist.delete(userId);
        return wasInList;
    }

    /**
     * Get both lists
     */
    getLists() {
        return {
            whitelist: Array.from(this.whitelist),
            blacklist: Array.from(this.blacklist)
        };
    }

    /**
     * Get chance for user based on their list status
     */
    getChanceForUser(userId) {
        if (this.whitelist.has(userId)) {
            // 80-90% chance for whitelisted users
            return 0.8 + Math.random() * 0.1;
        } else if (this.blacklist.has(userId)) {
            // 5% chance for blacklisted users
            return 0.05;
        } else {
            // 30% chance for normal users
            return 0.3;
        }
    }

    /**
     * Get random kick message based on user status
     */
    getRandomKickMessage(userId) {
        if (this.whitelist.has(userId)) {
            const messages = [
                'أنت كويس... خليك 10 دقائق بس!',
                'حسناً، أنت مقبول... لكن 10 دقائق فقط!',
                'ماشي، أنت استثناء... 10 دقائق!',
                'طيب، سأسمح لك... لكن لا تطول!'
            ];
            return messages[Math.floor(Math.random() * messages.length)];
        } else if (this.blacklist.has(userId)) {
            const messages = [
                'أنت مرة أخرى؟! اخرج حالاً!',
                'لا أريد رؤيتك هنا! إلى الخارج!',
                'أنت في القائمة السوداء! اخرج!',
                'ممنوع دخولك! إلى الخارج فوراً!'
            ];
            return messages[Math.floor(Math.random() * messages.length)];
        } else {
            const messages = [
                'لماذا دخلت إلى مكاني؟ إلى الخارج!',
                'هذا مكاني الخاص! اخرج من هنا!',
                'من أعطاك الإذن بالدخول؟ إلى الخارج!',
                'لا أريد زوار الآن! اخرج!'
            ];
            return messages[Math.floor(Math.random() * messages.length)];
        }
    }

    /**
     * Make bot join LOL channel
     */
    async joinLolChannel(guild, lolChannelId) {
        try {
            const { joinVoiceChannel } = require('@discordjs/voice');

            const lolChannel = guild.channels.cache.get(lolChannelId);
            if (!lolChannel) return;

            const connection = joinVoiceChannel({
                channelId: lolChannelId,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: true
            });

            console.log(`🤖 Bot joined LOL channel`);

            return connection;
        } catch (error) {
            console.error('Error joining LOL channel:', error);
        }
    }

    /**
     * Handle user joining LOL channel
     */
    async handleJoinLolChannel(member, lolChannelId) {
        try {
            // Skip if it's the bot itself
            if (member.user.bot) return;

            const lolChannel = member.guild.channels.cache.get(lolChannelId);
            if (!lolChannel) return;

            // Get chance based on user's list status
            const chance = this.getChanceForUser(member.id);
            const allowEntry = Math.random() < chance;

            // Get appropriate message based on user status
            const randomMessage = this.getRandomKickMessage(member.id);

            // Send message in voice text chat
            await lolChannel.send(`${randomMessage} ${member}`);

            if (allowEntry) {
                // Allow for 10 minutes
                await lolChannel.send(`حسنًا... سأسمح لك بالدخول لكن 10 دقائق فقط!`);

                // Set timeout for 10 minutes
                setTimeout(async () => {
                    try {
                        // Check if user is still in channel
                        const currentMember = lolChannel.guild.members.cache.get(member.id);
                        if (currentMember && currentMember.voice.channel?.id === lolChannelId) {
                            await lolChannel.send(`لقد مللت منك، اخرج! ${member}`);
                            await currentMember.voice.disconnect();

                            // Block for 5 minutes
                            await lolChannel.permissionOverwrites.edit(member.id, {
                                Connect: false
                            });

                            setTimeout(async () => {
                                await lolChannel.permissionOverwrites.delete(member.id);
                                console.log(`✅ Unblocked ${member.user.tag} from LOL channel`);
                            }, 5 * 60 * 1000); // 5 minutes
                        }
                    } catch (error) {
                        console.error('Error in LOL timeout:', error);
                    }
                }, 10 * 60 * 1000); // 10 minutes

                console.log(`🎭 ${member.user.tag} was allowed in LOL channel for 10 minutes`);
            } else {
                // Kick immediately
                await member.voice.disconnect();

                // Block for 2 minutes
                await lolChannel.permissionOverwrites.edit(member.id, {
                    Connect: false
                });

                setTimeout(async () => {
                    await lolChannel.permissionOverwrites.delete(member.id);
                    console.log(`✅ Unblocked ${member.user.tag} from LOL channel`);
                }, 2 * 60 * 1000); // 2 minutes

                console.log(`🎭 ${member.user.tag} was kicked from LOL channel`);
            }

        } catch (error) {
            console.error('Error handling LOL channel join:', error);
        }
    }

    /**
     * Cleanup timers on shutdown
     */
    shutdown() {
        this.kickedUsers.clear();
        this.allowedUsers.clear();
    }
}

module.exports = LolManager;