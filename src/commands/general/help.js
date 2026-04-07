const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('عرض جميع الأوامر والميزات المتاحة'),

    async execute(interaction) {
        const categories = {
            system: {
                emoji: '🔧',
                name: 'النظام',
                description: 'معلومات عن البوت وآلية عمله',
                features: [
                    '🔄 حذف تلقائي للأوامر القديمة عند إعادة التشغيل',
                    '📝 تسجيل جميع الأوامر مجدداً بشكل نظيف',
                    '⚡ تحديث فوري للأوامر في السيرفر',
                    '🌍 دعم النشر العام أو للسيرفر المحدد'
                ]
            },
            general: {
                emoji: '📋',
                name: 'أوامر عامة',
                description: 'معلومات عن السيرفر والأعضاء',
                commands: {
                    help: 'عرض قائمة المساعدة الشاملة',
                    info: 'معلومات عن البوت',
                    serverinfo: 'معلومات تفصيلية عن السيرفر',
                    profile: 'عرض معلومات عضو معين',
                    banner: 'عرض بانر عضو'
                }
            },
            admin: {
                emoji: '⚙️',
                name: 'أوامر الإدارة',
                description: 'أدوات إدارة السيرفر والأعضاء',
                commands: {
                    setupmuterole: 'إعداد رتبة الكتم',
                    setuplogs: 'إعداد قنوات السجلات',
                    setupadminrole: 'تحديد رتبة المشرفين للتذاكر',
                    lock: 'قفل قناة (Text/Voice/Thread/Category)',
                    unlock: 'فتح قناة',
                    hide: 'إخفاء قناة عن الأعضاء',
                    show: 'إظهار قناة مخفية',
                    mute: 'كتم عضو مع سبب اختياري',
                    unmute: 'إلغاء كتم عضو',
                    timeout: 'تايم آوت لعضو (1-28 يوم)',
                    untimeout: 'إلغاء التايم آوت',
                    ban: 'حظر عضو من السيرفر',
                    unban: 'إلغاء حظر عضو',
                    clear: 'حذف رسائل (1-100)',
                    clearforone: 'حذف رسائل عضو معين'
                }
            },
            voice: {
                emoji: '🎤',
                name: 'نظام الصوتيات المؤقتة',
                description: 'نظام غرف صوتية مؤقتة مع لوحة تحكم تفاعلية',
                features: [
                    '🔒 قفل/فتح الغرفة',
                    '👁️ إخفاء/إظهار الغرفة',
                    '✏️ تغيير اسم الغرفة',
                    '👥 تحديد عدد الأعضاء (0-99)',
                    '✅ منح ثقة لأعضاء',
                    '🚫 حظر أعضاء من الغرفة',
                    '⏱️ حذف تلقائي بعد دقيقتين من الفراغ'
                ],
                commands: {
                    setupvoice: 'إعداد نظام الغرف الصوتية المؤقتة',
                    deletevoice: 'حذف إعدادات الغرف الصوتية',
                    sendvoicecontrol: 'إعادة إرسال لوحة التحكم (للمالك فقط)'
                }
            },
            tickets: {
                emoji: '🎫',
                name: 'نظام التذاكر',
                description: 'نظام دعم فني احترافي مع خيارات متعددة',
                features: [
                    '📝 خيارات تذاكر مخصصة',
                    '🔒 تذكرة خاصة (Thread) لكل طلب',
                    '👨‍💼 نظام استدعاء الإدارة مع Cooldown',
                    '📊 سجل كامل لجميع التذاكر',
                    '⏰ Cooldown ساعة واحدة بين الاستدعاءات',
                    '🔢 حد أقصى 3 استدعاءات في 24 ساعة'
                ],
                commands: {
                    setupticket: 'إعداد لوحة التذاكر',
                    addticketoption: 'إضافة خيار جديد للتذاكر',
                    deleteticketoption: 'حذف خيار تذكرة'
                },
                fixes: [
                    '✅ إصلاح خطأ التذاكر المؤرشفة',
                    '✅ التحقق التلقائي من حالة الأرشفة قبل الإغلاق'
                ]
            },
            lol: {
                emoji: '🎭',
                name: 'نظام LOL للمرح',
                description: 'نظام ترفيهي تفاعلي في قناة صوتية',
                features: [
                    '🤖 البوت يدخل القناة تلقائياً',
                    '👤 طرد تلقائي للأعضاء برسائل عشوائية مضحكة',
                    '⚪ القائمة البيضاء: 80-90% فرصة للدخول',
                    '⚫ القائمة السوداء: 5% فرصة فقط',
                    '🎲 مستخدمون عاديون: 30% فرصة',
                    '⏱️ طرد تلقائي بعد 10 دقائق',
                    '🔒 حظر مؤقت لمدة 2-5 دقائق بعد الطرد',
                    '💾 البوت يعيد الدخول تلقائياً عند إعادة التشغيل',
                    '🎬 رسائل مخصصة حسب حالة المستخدم'
                ],
                commands: {
                    'setuplol channel': 'إعداد القناة الصوتية',
                    'setuplol whitelist': 'إضافة مستخدم للقائمة البيضاء',
                    'setuplol blacklist': 'إضافة مستخدم للقائمة السوداء',
                    'setuplol remove': 'إزالة مستخدم من القوائم',
                    'setuplol list': 'عرض القوائم'
                }
            },
            giveaways: {
                emoji: '🎉',
                name: 'نظام السحوبات',
                description: 'نظام سحوبات احترافي مع تفاعل كامل',
                features: [
                    '⏰ سحوبات بتوقيت محدد',
                    '🏆 اختيار عدد الفائزين',
                    '👥 متطلبات الرتب (اختياري)',
                    '🎯 عدد دخولات محدد لكل مستخدم',
                    '📊 تتبع المشاركين',
                    '🔄 إعادة السحب عند الحاجة',
                    '💾 استمرارية بعد إعادة تشغيل البوت'
                ],
                commands: {
                    'start-giveaway': 'بدء سحب جديد',
                    'end-giveaway': 'إنهاء سحب مبكراً',
                    'reroll-giveaway': 'إعادة اختيار الفائزين',
                    'list-giveaways': 'عرض جميع السحوبات النشطة'
                }
            },
            autorole: {
                emoji: '👑',
                name: 'نظام الرتب التلقائية',
                description: 'منح رتب تلقائية للأعضاء والبوتات الجدد',
                features: [
                    '👤 رتبة تلقائية للأعضاء الجدد',
                    '🤖 رتبة منفصلة للبوتات',
                    '✅ التحقق من صلاحيات البوت',
                    '📊 تسجيل كامل في السجلات'
                ],
                commands: {
                    'setup-autorole': 'إعداد الرتب التلقائية (أعضاء/بوتات)'
                }
            },
            welcome: {
                emoji: '👋',
                name: 'نظام الترحيب',
                description: 'رسائل ترحيب مخصصة للأعضاء الجدد',
                features: [
                    '📝 رسالة مخصصة قابلة للتعديل',
                    '🎨 Embed احترافي',
                    '📊 متغيرات ديناميكية: {user}, {server}, {membercount}',
                    '💾 حفظ تلقائي للإعدادات'
                ],
                commands: {
                    'setup-welcome': 'إعداد نظام الترحيب والقناة'
                }
            }
        };

        const mainEmbed = new EmbedBuilder()
            .setTitle('📚 دليل الأوامر الشامل')
            .setDescription('نظام بوت ديسكورد متكامل مع 9 أنظمة متقدمة\n\n**🔄 التحديثات الأخيرة:**\n• 🎭 نظام LOL للمرح مع طرد تلقائي تفاعلي\n• 🎉 نظام سحوبات احترافي كامل\n• 👑 نظام رتب تلقائية للأعضاء والبوتات\n• 👋 نظام ترحيب مخصص\n• 📊 9 أنواع سجلات منفصلة\n• ✅ حذف تلقائي للأوامر القديمة\n• 🔧 إصلاح مشاكل التذاكر والعقوبات')
            .setColor('#3498DB')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `طلب بواسطة ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        // Add each category
        for (const [key, category] of Object.entries(categories)) {
            let fieldValue = `${category.description}\n\n`;

            if (category.features) {
                fieldValue += category.features.join('\n') + '\n\n';
            }

            if (category.commands) {
                fieldValue += '**الأوامر:**\n';
                for (const [cmd, desc] of Object.entries(category.commands)) {
                    fieldValue += `\`/${cmd}\` - ${desc}\n`;
                }
            }

            if (category.fixes) {
                fieldValue += '\n**التحسينات:**\n' + category.fixes.join('\n');
            }

            mainEmbed.addFields({
                name: `${category.emoji} ${category.name}`,
                value: fieldValue,
                inline: false
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('🔽 اختر فئة لعرض التفاصيل')
            .addOptions([
                {
                    label: 'النظام',
                    description: 'معلومات عن البوت وآلية عمله',
                    value: 'system',
                    emoji: '🔧'
                },
                {
                    label: 'الأوامر العامة',
                    description: 'معلومات السيرفر والأعضاء',
                    value: 'general',
                    emoji: '📋'
                },
                {
                    label: 'أوامر الإدارة',
                    description: 'كتم، حظر، عزل، وإدارة الرسائل',
                    value: 'admin',
                    emoji: '⚙️'
                },
                {
                    label: 'نظام الصوتيات',
                    description: 'غرف صوتية مؤقتة بلوحة تحكم',
                    value: 'voice',
                    emoji: '🎤'
                },
                {
                    label: 'نظام التذاكر',
                    description: 'دعم فني احترافي',
                    value: 'tickets',
                    emoji: '🎫'
                },
                {
                    label: 'نظام LOL للمرح',
                    description: 'قناة صوتية ترفيهية تفاعلية',
                    value: 'lol',
                    emoji: '🎭'
                },
                {
                    label: 'نظام السحوبات',
                    description: 'سحوبات احترافية مع جوائز',
                    value: 'giveaways',
                    emoji: '🎉'
                },
                {
                    label: 'الرتب التلقائية',
                    description: 'رتب تلقائية للأعضاء والبوتات',
                    value: 'autorole',
                    emoji: '👑'
                },
                {
                    label: 'نظام الترحيب',
                    description: 'رسائل ترحيب مخصصة',
                    value: 'welcome',
                    emoji: '👋'
                },
                {
                    label: 'العودة للقائمة الرئيسية',
                    description: 'رجوع إلى صفحة البداية',
                    value: 'main',
                    emoji: '🏠'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({
            embeds: [mainEmbed],
            components: [row],
            ephemeral: true
        });

        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 300000
        });

        collector.on('collect', async i => {
            if (i.customId === 'help_category') {
                if (i.values[0] === 'main') {
                    await i.update({ embeds: [mainEmbed], components: [row] });
                    return;
                }

                const category = categories[i.values[0]];

                const categoryEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`${category.emoji} ${category.name}`)
                    .setTimestamp()
                    .setFooter({ 
                        text: 'استخدم / قبل اسم الأمر للتنفيذ',
                        iconURL: interaction.client.user.displayAvatarURL()
                    });

                if (category.description) {
                    categoryEmbed.setDescription(`**${category.description}**\n`);
                }

                if (category.features) {
                    categoryEmbed.addFields({
                        name: '✨ المميزات',
                        value: category.features.join('\n'),
                        inline: false
                    });
                }

                categoryEmbed.addFields({
                    name: '📝 الأوامر المتاحة',
                    value: '**━━━━━━━━━━━━━**',
                    inline: false
                });

                for (const [cmd, desc] of Object.entries(category.commands)) {
                    categoryEmbed.addFields({
                        name: `\`/${cmd}\``,
                        value: `${desc}`,
                        inline: false
                    });
                }
                
                if (category.fixes) {
                    categoryEmbed.addFields({
                        name: '🔧 التحسينات',
                        value: category.fixes.join('\n'),
                        inline: false
                    });
                }

                await i.update({ embeds: [categoryEmbed], components: [row] });
            }
        });

        collector.on('end', async () => {
            try {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        StringSelectMenuBuilder.from(selectMenu)
                            .setDisabled(true)
                    );
                await response.edit({ components: [disabledRow] });
            } catch (error) {
                console.error('Error disabling components:', error);
            }
        });
    }
};