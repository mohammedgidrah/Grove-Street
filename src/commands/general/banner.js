const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Display user banner')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get banner from')
                .setRequired(false)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        
        // Fetch full user to get banner
        const fetchedUser = await interaction.client.users.fetch(user.id, { force: true });
        const bannerURL = fetchedUser.bannerURL({ dynamic: true, size: 512 });

        if (!bannerURL) {
            return interaction.reply({ 
                content: `❌ ${user.tag} does not have a banner set.`, 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎨 ${user.tag}'s Banner`)
            .setImage(bannerURL)
            .setColor(fetchedUser.accentColor || '#5865F2')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
