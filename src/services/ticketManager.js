const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const DataStore = require('../utils/dataStore');
const { randomBytes } = require('crypto');

const ticketsStore = new DataStore('./data/tickets.json');
const configStore = new DataStore('./data/config.json');

/**
 * Ticket Manager - Handles ticket system with options and cooldowns
 */
class TicketManager {
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
    }

    /**
     * Generate unique ticket ID
     */
    generateId() {
        return randomBytes(8).toString('hex');
    }

    /**
     * Add ticket option
     */
    addTicketOption(name, initialMessage) {
        ticketsStore.update(data => {
            if (!data.options) data.options = [];
            
            // Check if option already exists
            const exists = data.options.find(opt => opt.name === name);
            if (exists) {
                return data; // Don't add duplicate
            }

            data.options.push({
                name,
                initialMessage,
                createdAt: Date.now()
            });
            return data;
        });
    }

    /**
     * Delete ticket option
     */
    deleteTicketOption(name) {
        const exists = ticketsStore.read().options?.find(opt => opt.name === name);
        
        if (!exists) {
            return { success: false, error: 'Ticket option not found.' };
        }

        ticketsStore.update(data => {
            if (!data.options) data.options = [];
            data.options = data.options.filter(opt => opt.name !== name);
            return data;
        });
        
        return { success: true };
    }

    /**
     * Get all ticket options
     */
    getTicketOptions() {
        const data = ticketsStore.read();
        return data.options || [];
    }

    /**
     * Create ticket panel with select menu
     */
    async createTicketPanel(channel) {
        try {
            const options = this.getTicketOptions();

            if (options.length === 0) {
                return { success: false, error: 'No ticket options configured. Use /addticketoption first.' };
            }

            const embed = new EmbedBuilder()
                .setTitle('🎫 Support Tickets')
                .setDescription('Select a ticket type from the dropdown below to open a support ticket.')
                .setColor('#3498DB')
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('Select a ticket type...')
                .addOptions(
                    options.map(opt => ({
                        label: opt.name,
                        value: opt.name,
                        description: opt.initialMessage.substring(0, 100)
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await channel.send({ embeds: [embed], components: [row] });

            return { success: true };

        } catch (error) {
            console.error('Error creating ticket panel:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Open a new ticket
     */
    async openTicket(interaction, optionName) {
        try {
            const option = this.getTicketOptions().find(opt => opt.name === optionName);
            if (!option) {
                return { success: false, error: 'Ticket option not found.' };
            }

            const ticketId = this.generateId();
            const threadName = `ticket-${ticketId}-${interaction.user.username}`;

            // Create PRIVATE thread
            const thread = await interaction.channel.threads.create({
                name: threadName,
                autoArchiveDuration: 60,
                type: ChannelType.PrivateThread,
                reason: `Ticket opened by ${interaction.user.tag}`
            });

            // Get admin role from config
            const config = configStore.read();
            const adminRoleId = config.adminRoleId;
            
            // Mention admin role outside embed
            let mentionText = `<@${interaction.user.id}> Your ticket has been created!`;
            if (adminRoleId) {
                mentionText += ` <@&${adminRoleId}>`;
            }

            // Send initial message with ticket controls
            const embed = new EmbedBuilder()
                .setTitle(`🎫 Ticket: ${optionName}`)
                .setDescription(option.initialMessage)
                .setColor('#3498DB')
                .addFields(
                    { name: 'Opened By', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Ticket ID', value: ticketId, inline: true }
                )
                .setTimestamp();

            const mentionButton = new ButtonBuilder()
                .setCustomId(`ticket_mention_${ticketId}`)
                .setLabel('📢 Mention Admins')
                .setStyle(ButtonStyle.Primary);

            const closeButton = new ButtonBuilder()
                .setCustomId(`ticket_close_${ticketId}`)
                .setLabel('🔒 Close Ticket')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(mentionButton, closeButton);

            await thread.send({ 
                content: mentionText,
                embeds: [embed], 
                components: [row] 
            });

            // Save ticket to storage
            const ticket = {
                id: ticketId,
                openerId: interaction.user.id,
                threadId: thread.id,
                optionName,
                createdAt: Date.now(),
                closedAt: null,
                mentionCount: 0,
                mentionTimestamps: []
            };

            ticketsStore.update(data => {
                if (!data.tickets) data.tickets = [];
                data.tickets.push(ticket);
                return data;
            });

            await this.logger.logTicket(`🎫 <@${interaction.user.id}> opened a ticket: **${optionName}** (<#${thread.id}>)`);

            return { success: true, thread };

        } catch (error) {
            console.error('Error opening ticket:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle admin mention with cooldown
     */
    async mentionAdmins(interaction, ticketId) {
        try {
            const data = ticketsStore.read();
            const ticket = data.tickets.find(t => t.id === ticketId);

            if (!ticket) {
                return { success: false, error: 'Ticket not found.' };
            }

            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            const twentyFourHours = 24 * 60 * 60 * 1000;

            // Check hourly cooldown
            const lastMention = ticket.mentionTimestamps[ticket.mentionTimestamps.length - 1];
            if (lastMention && now - lastMention < oneHour) {
                const timeLeft = Math.ceil((oneHour - (now - lastMention)) / 60000);
                return { 
                    success: false, 
                    error: `Please wait ${timeLeft} minute(s) before mentioning admins again.` 
                };
            }

            // Check 24-hour limit (max 3 mentions)
            const recentMentions = ticket.mentionTimestamps.filter(ts => now - ts < twentyFourHours);
            if (recentMentions.length >= 3) {
                return { 
                    success: false, 
                    error: 'Maximum admin mentions (3) reached for this 24-hour period.' 
                };
            }

            // Update ticket
            ticketsStore.update(data => {
                const index = data.tickets.findIndex(t => t.id === ticketId);
                if (index !== -1) {
                    data.tickets[index].mentionCount++;
                    data.tickets[index].mentionTimestamps.push(now);
                }
                return data;
            });

            // Get admin role from config
            const config = configStore.read();
            const adminRoleId = config.adminRoleId;

            const mentionText = adminRoleId 
                ? `<@&${adminRoleId}> - Admin assistance requested by <@${interaction.user.id}>`
                : `@Admins - Admin assistance requested by <@${interaction.user.id}>`;

            await interaction.channel.send(mentionText);

            await this.logger.logTicket(`📢 <@${interaction.user.id}> mentioned admins in ticket ${ticketId}`);

            return { success: true };

        } catch (error) {
            console.error('Error mentioning admins:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close a ticket
     */
    async closeTicket(interaction, ticketId) {
        try {
            const data = ticketsStore.read();
            const ticket = data.tickets.find(t => t.id === ticketId);

            if (!ticket) {
                return { success: false, error: 'Ticket not found.' };
            }

            // Check if already closed
            if (ticket.closedAt) {
                return { success: false, error: 'This ticket is already closed.' };
            }

            const thread = interaction.channel;
            
            if (thread.isThread()) {
                // Fetch latest thread data
                await thread.fetch();
                
                // Check if already archived
                if (thread.archived) {
                    // Update ticket as closed in database only
                    ticketsStore.update(data => {
                        const index = data.tickets.findIndex(t => t.id === ticketId);
                        if (index !== -1) {
                            data.tickets[index].closedAt = Date.now();
                        }
                        return data;
                    });
                    return { success: false, error: 'Ticket thread is already archived.' };
                }

                // Remove all members from thread (except bot)
                try {
                    const members = await thread.members.fetch();
                    for (const [memberId] of members) {
                        if (memberId !== this.client.user.id) {
                            try {
                                await thread.members.remove(memberId);
                            } catch (err) {
                                console.log(`Could not remove member ${memberId}:`, err.message);
                            }
                        }
                    }
                } catch (err) {
                    console.log('Error removing members:', err.message);
                }

                // Archive and lock thread
                try {
                    await thread.setArchived(true, 'Ticket closed');
                    await thread.setLocked(true, 'Ticket closed');
                } catch (err) {
                    console.log('Thread archiving error:', err.message);
                }
            }

            // Update ticket as closed
            ticketsStore.update(data => {
                const index = data.tickets.findIndex(t => t.id === ticketId);
                if (index !== -1) {
                    data.tickets[index].closedAt = Date.now();
                }
                return data;
            });

            await this.logger.logTicket(`🔒 Ticket ${ticketId} was closed by <@${interaction.user.id}>`);

            return { success: true };

        } catch (error) {
            console.error('Error closing ticket:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = TicketManager;
