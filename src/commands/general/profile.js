const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Display user profile card')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get profile from')
                .setRequired(false)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        const fetchedUser = await interaction.client.users.fetch(user.id, { force: true });

        const embed = new EmbedBuilder()
            .setTitle(`👤 ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor(member.displayHexColor || fetchedUser.accentColor || '#5865F2')
            .addFields(
                { name: '🆔 User ID', value: user.id, inline: true },
                { name: '📅 Joined', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🎭 Highest Role', value: member.roles.highest.toString(), inline: true }
            )
            .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setTimestamp();

        if (fetchedUser.bannerURL()) {
            embed.setImage(fetchedUser.bannerURL({ dynamic: true, size: 512 }));
        }

        await interaction.reply({ embeds: [embed] });
    }
};
