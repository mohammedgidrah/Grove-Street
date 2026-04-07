const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const DataStore = require('../utils/dataStore');

const giveawaysStore = new DataStore('./data/giveaways.json');

class GiveawayManager {
    constructor(client) {
        this.client = client;
    }

    async createGiveaway(options) {
        const {
            guildId,
            channelId,
            prize,
            duration,
            winners,
            description,
            hostedBy,
            requirements
        } = options;

        const giveawayId = this.generateId();
        const endsAt = Date.now() + duration;

        const giveaway = {
            id: giveawayId,
            guildId,
            channelId,
            messageId: null,
            prize,
            description,
            winners,
            hostedBy,
            requirements: requirements || null,
            entries: [],
            endsAt,
            ended: false,
            createdAt: Date.now()
        };

        const channel = await this.client.channels.fetch(channelId);
        const message = await this.sendGiveawayMessage(channel, giveaway);
        
        giveaway.messageId = message.id;

        giveawaysStore.update(data => {
            if (!data.giveaways) data.giveaways = [];
            data.giveaways.push(giveaway);
            return data;
        });

        this.scheduleGiveawayEnd(giveaway);

        return giveaway;
    }

    async sendGiveawayMessage(channel, giveaway) {
        const embed = new EmbedBuilder()
            .setTitle(`🎉 ${giveaway.prize}`)
            .setDescription(giveaway.description || 'اضغط على الزر أدناه للمشاركة!')
            .setColor('#FF0090')
            .addFields(
                { name: '🏆 عدد الفائزين', value: `${giveaway.winners}`, inline: true },
                { name: '⏰ ينتهي', value: `<t:${Math.floor(giveaway.endsAt / 1000)}:R>`, inline: true },
                { name: '👥 المشاركين', value: '0', inline: true }
            )
            .setFooter({ text: `المعرف: ${giveaway.id}` })
            .setTimestamp(giveaway.endsAt);

        if (giveaway.hostedBy) {
            embed.addFields({ name: '🎭 بواسطة', value: `<@${giveaway.hostedBy}>`, inline: false });
        }

        if (giveaway.requirements) {
            embed.addFields({ name: '📋 المتطلبات', value: giveaway.requirements, inline: false });
        }

        const button = new ButtonBuilder()
            .setCustomId(`giveaway_enter_${giveaway.id}`)
            .setLabel('🎉 شارك في السحب')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        return await channel.send({ embeds: [embed], components: [row] });
    }

    async handleEntry(interaction, giveawayId) {
        const data = giveawaysStore.read();
        if (!data.giveaways) data.giveaways = [];
        const giveaway = data.giveaways.find(g => g.id === giveawayId);

        if (!giveaway) {
            return await interaction.reply({
                content: '❌ هذا السحب غير موجود!',
                ephemeral: true
            });
        }

        if (giveaway.ended) {
            return await interaction.reply({
                content: '❌ هذا السحب قد انتهى بالفعل!',
                ephemeral: true
            });
        }

        if (Date.now() > giveaway.endsAt) {
            return await interaction.reply({
                content: '❌ هذا السحب قد انتهى!',
                ephemeral: true
            });
        }

        const userId = interaction.user.id;
        const hasEntered = giveaway.entries.includes(userId);

        if (hasEntered) {
            giveawaysStore.update(data => {
                const g = data.giveaways.find(g => g.id === giveawayId);
                g.entries = g.entries.filter(id => id !== userId);
                return data;
            });

            await this.updateGiveawayMessage(giveaway);

            return await interaction.reply({
                content: '✅ تم إلغاء مشاركتك من السحب!',
                ephemeral: true
            });
        } else {
            giveawaysStore.update(data => {
                const g = data.giveaways.find(g => g.id === giveawayId);
                g.entries.push(userId);
                return data;
            });

            await this.updateGiveawayMessage(giveaway);

            return await interaction.reply({
                content: '🎉 تم تسجيل مشاركتك في السحب! حظاً موفقاً!',
                ephemeral: true
            });
        }
    }

    async updateGiveawayMessage(giveaway) {
        try {
            const data = giveawaysStore.read();
            if (!data.giveaways) return;
            
            const updatedGiveaway = data.giveaways.find(g => g.id === giveaway.id);
            if (!updatedGiveaway) return;
            
            const channel = await this.client.channels.fetch(updatedGiveaway.channelId);
            const message = await channel.messages.fetch(updatedGiveaway.messageId);

            if (!message.embeds || !message.embeds[0]) {
                console.error('Giveaway message has no embeds');
                return;
            }

            const embed = EmbedBuilder.from(message.embeds[0]);
            
            const fields = embed.data.fields;
            if (!fields) return;
            
            const participantsField = fields.find(f => f.name === '👥 المشاركين');
            if (participantsField) {
                participantsField.value = `${updatedGiveaway.entries.length}`;
            }

            await message.edit({ embeds: [embed] });
        } catch (error) {
            console.error('Error updating giveaway message:', error.message);
        }
    }

    async endGiveaway(giveawayId, userId = null) {
        const data = giveawaysStore.read();
        if (!data.giveaways) data.giveaways = [];
        const giveaway = data.giveaways.find(g => g.id === giveawayId);

        if (!giveaway) {
            throw new Error('السحب غير موجود');
        }

        if (giveaway.ended) {
            throw new Error('السحب قد انتهى بالفعل');
        }

        const winners = this.pickWinners(giveaway);

        giveawaysStore.update(data => {
            const g = data.giveaways.find(g => g.id === giveawayId);
            g.ended = true;
            g.winners = winners;
            g.endedBy = userId;
            g.endedAt = Date.now();
            return data;
        });

        await this.announceWinners(giveaway, winners);

        return { giveaway, winners };
    }

    pickWinners(giveaway) {
        const entries = [...giveaway.entries];
        const winnersCount = Math.min(giveaway.winners, entries.length);
        const winners = [];

        for (let i = 0; i < winnersCount; i++) {
            const randomIndex = Math.floor(Math.random() * entries.length);
            winners.push(entries[randomIndex]);
            entries.splice(randomIndex, 1);
        }

        return winners;
    }

    async announceWinners(giveaway, winners) {
        try {
            const channel = await this.client.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(giveaway.messageId);

            const embed = new EmbedBuilder()
                .setTitle(`🎉 ${giveaway.prize}`)
                .setDescription(giveaway.description || '')
                .setColor('#00FF00')
                .addFields(
                    { name: '🏆 عدد الفائزين', value: `${giveaway.winners}`, inline: true },
                    { name: '👥 المشاركين', value: `${giveaway.entries.length}`, inline: true },
                    { name: '⏰ انتهى', value: '<t:' + Math.floor(Date.now() / 1000) + ':R>', inline: true }
                )
                .setFooter({ text: `المعرف: ${giveaway.id} | انتهى` })
                .setTimestamp();

            if (winners.length > 0) {
                embed.addFields({
                    name: '🎊 الفائزون',
                    value: winners.map(id => `<@${id}>`).join('\n'),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '😢 لا يوجد فائزون',
                    value: 'لم يشارك أحد في السحب',
                    inline: false
                });
            }

            const button = new ButtonBuilder()
                .setCustomId(`giveaway_ended_${giveaway.id}`)
                .setLabel('انتهى السحب')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);

            const row = new ActionRowBuilder().addComponents(button);

            await message.edit({ embeds: [embed], components: [row] });

            if (winners.length > 0) {
                await channel.send({
                    content: `🎉 تهانينا ${winners.map(id => `<@${id}>`).join(', ')}! لقد فزتم بـ **${giveaway.prize}**!`
                });
            }
        } catch (error) {
            console.error('Error announcing winners:', error);
        }
    }

    async rerollGiveaway(giveawayId) {
        const data = giveawaysStore.read();
        if (!data.giveaways) data.giveaways = [];
        const giveaway = data.giveaways.find(g => g.id === giveawayId);

        if (!giveaway) {
            throw new Error('السحب غير موجود');
        }

        if (!giveaway.ended) {
            throw new Error('لا يمكن إعادة السحب قبل انتهائه');
        }

        const newWinners = this.pickWinners(giveaway);

        giveawaysStore.update(data => {
            const g = data.giveaways.find(g => g.id === giveawayId);
            g.winners = newWinners;
            return data;
        });

        const channel = await this.client.channels.fetch(giveaway.channelId);
        
        if (newWinners.length > 0) {
            await channel.send({
                content: `🔄 **إعادة سحب جديدة!**\n🎉 الفائزون الجدد: ${newWinners.map(id => `<@${id}>`).join(', ')}\nالجائزة: **${giveaway.prize}**`
            });
        } else {
            await channel.send({
                content: '😢 لا يوجد مشاركين آخرين لإعادة السحب'
            });
        }

        return newWinners;
    }

    scheduleGiveawayEnd(giveaway) {
        const delay = giveaway.endsAt - Date.now();
        
        if (delay <= 0) {
            this.endGiveaway(giveaway.id);
            return;
        }

        const MAX_TIMEOUT = 2147483647;

        if (delay < MAX_TIMEOUT) {
            setTimeout(() => {
                this.endGiveaway(giveaway.id);
            }, delay);
        } else {
            setTimeout(() => {
                this.scheduleGiveawayEnd(giveaway);
            }, MAX_TIMEOUT - 60000);
        }
    }

    async loadActiveGiveaways() {
        const data = giveawaysStore.read();
        if (!data.giveaways) return;

        const now = Date.now();
        
        for (const giveaway of data.giveaways) {
            if (!giveaway.ended) {
                if (giveaway.endsAt <= now) {
                    await this.endGiveaway(giveaway.id);
                } else {
                    this.scheduleGiveawayEnd(giveaway);
                }
            }
        }
    }

    getActiveGiveaways(guildId) {
        const data = giveawaysStore.read();
        if (!data.giveaways) return [];
        return data.giveaways.filter(g => g.guildId === guildId && !g.ended);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    parseDuration(durationStr) {
        const regex = /(\d+)([smhd])/g;
        let totalMs = 0;
        let match;

        while ((match = regex.exec(durationStr)) !== null) {
            const value = parseInt(match[1]);
            const unit = match[2];

            switch (unit) {
                case 's': totalMs += value * 1000; break;
                case 'm': totalMs += value * 60 * 1000; break;
                case 'h': totalMs += value * 60 * 60 * 1000; break;
                case 'd': totalMs += value * 24 * 60 * 60 * 1000; break;
            }
        }

        return totalMs;
    }
}

module.exports = GiveawayManager;
