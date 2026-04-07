const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const DataStore = require('../../utils/dataStore');

const configStore = new DataStore('./data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplol')
        .setDescription('Set up fun troll voice channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Set the LOL voice channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The voice channel for trolling')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildVoice)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Add user to whitelist (higher chance to stay)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklist')
                .setDescription('Add user to blacklist (lower chance to stay)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to blacklist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove user from whitelist/blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show whitelist and blacklist')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel');

            configStore.update(data => {
                data.lolVoiceChannelId = channel.id;
                return data;
            });

            // Make bot join the LOL channel
            const lolManager = interaction.client.lolManager;
            await lolManager.joinLolChannel(interaction.guild, channel.id);

            await interaction.reply({ 
                content: `✅ تم إعداد نظام LOL في القناة الصوتية ${channel}\n🤖 البوت الآن في الروم!`, 
                ephemeral: true 
            });

            const logger = interaction.client.logger;
            await logger.logSetting(
                `🎭 **LOL System Setup** - <@${interaction.user.id}> configured LOL voice channel`,
                '#FF1493',
                [
                    { name: '📍 LOL Channel', value: `<#${channel.id}>`, inline: true },
                    { name: '👤 Admin', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📂 Category', value: channel.parent ? channel.parent.name : 'None', inline: true },
                    { name: '🤖 Bot Status', value: 'Bot joined the channel', inline: true },
                    { name: 'ℹ️ How It Works', value: 'Users joining will be kicked with funny messages. Use /setuplol whitelist or /setuplol blacklist to control user chances.', inline: false }
                ]
            );
        } else if (subcommand === 'whitelist') {
            const user = interaction.options.getUser('user');
            const lolManager = interaction.client.lolManager;
            
            lolManager.addToWhitelist(user.id);
            
            await interaction.reply({
                content: `✅ تم إضافة ${user} إلى القائمة البيضاء!\nالآن لديه فرصة 80-90% للدخول لمدة 10 دقائق.`,
                ephemeral: true
            });

            const logger = interaction.client.logger;
            await logger.logSetting(
                `⚪ **LOL Whitelist Added** - <@${interaction.user.id}> added user to whitelist`,
                '#00FF00',
                [
                    { name: '👤 User', value: `<@${user.id}>`, inline: true },
                    { name: '📊 Chance', value: '80-90%', inline: true },
                    { name: '👨‍💼 Admin', value: `<@${interaction.user.id}>`, inline: true }
                ]
            );
        } else if (subcommand === 'blacklist') {
            const user = interaction.options.getUser('user');
            const lolManager = interaction.client.lolManager;
            
            lolManager.addToBlacklist(user.id);
            
            await interaction.reply({
                content: `✅ تم إضافة ${user} إلى القائمة السوداء!\nالآن لديه فرصة 5% فقط للدخول لمدة 10 دقائق.`,
                ephemeral: true
            });

            const logger = interaction.client.logger;
            await logger.logSetting(
                `⚫ **LOL Blacklist Added** - <@${interaction.user.id}> added user to blacklist`,
                '#FF0000',
                [
                    { name: '👤 User', value: `<@${user.id}>`, inline: true },
                    { name: '📊 Chance', value: '5%', inline: true },
                    { name: '👨‍💼 Admin', value: `<@${interaction.user.id}>`, inline: true }
                ]
            );
        } else if (subcommand === 'remove') {
            const user = interaction.options.getUser('user');
            const lolManager = interaction.client.lolManager;
            
            const result = lolManager.removeFromLists(user.id);
            
            if (result) {
                await interaction.reply({
                    content: `✅ تم إزالة ${user} من القوائم!\nالآن لديه فرصة عادية 30% للدخول.`,
                    ephemeral: true
                });

                const logger = interaction.client.logger;
                await logger.logSetting(
                    `🔄 **LOL List Removed** - <@${interaction.user.id}> removed user from lists`,
                    '#FFA500',
                    [
                        { name: '👤 User', value: `<@${user.id}>`, inline: true },
                        { name: '📊 New Chance', value: '30%', inline: true },
                        { name: '👨‍💼 Admin', value: `<@${interaction.user.id}>`, inline: true }
                    ]
                );
            } else {
                await interaction.reply({
                    content: `❌ ${user} ليس في أي قائمة!`,
                    ephemeral: true
                });
            }
        } else if (subcommand === 'list') {
            const lolManager = interaction.client.lolManager;
            const { whitelist, blacklist } = lolManager.getLists();

            const whitelistText = whitelist.length > 0 
                ? whitelist.map(id => `<@${id}>`).join('\n') 
                : 'لا يوجد';
            
            const blacklistText = blacklist.length > 0 
                ? blacklist.map(id => `<@${id}>`).join('\n') 
                : 'لا يوجد';

            await interaction.reply({
                embeds: [{
                    title: '📋 قوائم LOL',
                    color: 0xFF1493,
                    fields: [
                        {
                            name: '⚪ القائمة البيضاء (80-90% فرصة)',
                            value: whitelistText,
                            inline: true
                        },
                        {
                            name: '⚫ القائمة السوداء (5% فرصة)',
                            value: blacklistText,
                            inline: true
                        }
                    ],
                    footer: { text: 'المستخدمون العاديون لديهم فرصة 30%' }
                }],
                ephemeral: true
            });
        }
    }
};