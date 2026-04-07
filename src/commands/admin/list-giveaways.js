const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-giveaways')
        .setDescription('عرض جميع السحوبات النشطة')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        const giveawayManager = interaction.client.giveawayManager;
        const activeGiveaways = giveawayManager.getActiveGiveaways(interaction.guild.id);

        if (activeGiveaways.length === 0) {
            return await interaction.reply({
                content: '📭 لا توجد سحوبات نشطة حالياً',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎉 السحوبات النشطة')
            .setColor('#FF0090')
            .setTimestamp();

        for (const giveaway of activeGiveaways) {
            const channel = await interaction.client.channels.fetch(giveaway.channelId).catch(() => null);
            const channelMention = channel ? `<#${channel.id}>` : 'قناة محذوفة';
            
            embed.addFields({
                name: `🎁 ${giveaway.prize}`,
                value: [
                    `**المعرف:** \`${giveaway.id}\``,
                    `**القناة:** ${channelMention}`,
                    `**المشاركين:** ${giveaway.entries.length}`,
                    `**الفائزين:** ${giveaway.winners}`,
                    `**ينتهي:** <t:${Math.floor(giveaway.endsAt / 1000)}:R>`
                ].join('\n'),
                inline: false
            });
        }

        embed.setFooter({ text: `إجمالي السحوبات النشطة: ${activeGiveaways.length}` });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
