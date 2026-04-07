const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start-giveaway')
        .setDescription('إنشاء سحب جديد')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('giveaway_create_modal')
            .setTitle('🎉 إنشاء سحب جديد');

        const prizeInput = new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('الجائزة')
            .setPlaceholder('مثال: نيترو شهر، 100$، رول مميز')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);

        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('المدة')
            .setPlaceholder('مثال: 1h, 30m, 1d, 2h30m')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(20);

        const winnersInput = new TextInputBuilder()
            .setCustomId('winners')
            .setLabel('عدد الفائزين')
            .setPlaceholder('مثال: 1, 2, 3')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(2);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('الوصف (اختياري)')
            .setPlaceholder('وصف السحب والمتطلبات...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(500);

        const requirementsInput = new TextInputBuilder()
            .setCustomId('requirements')
            .setLabel('المتطلبات (اختياري)')
            .setPlaceholder('مثال: أن تكون عضو نشط، متابع للسيرفر، وغيره...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(300);

        const row1 = new ActionRowBuilder().addComponents(prizeInput);
        const row2 = new ActionRowBuilder().addComponents(durationInput);
        const row3 = new ActionRowBuilder().addComponents(winnersInput);
        const row4 = new ActionRowBuilder().addComponents(descriptionInput);
        const row5 = new ActionRowBuilder().addComponents(requirementsInput);

        modal.addComponents(row1, row2, row3, row4, row5);

        await interaction.showModal(modal);
    }
};
