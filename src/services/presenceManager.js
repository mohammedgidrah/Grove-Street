
const { ActivityType } = require('discord.js');

class PresenceManager {
    constructor(client) {
        this.client = client;
        this.currentIndex = 0;
        this.statuses = [
            { type: ActivityType.Watching, name: 'by Monther && Qedrah' },
            { type: ActivityType.Playing, name: 'Programer Shop' },
            { type: ActivityType.Custom, name: 'Want bot? Join here!' }
        ];
        this.interval = null;
    }

    /**
     * Start rotating presence
     */
    start() {
        // Set initial presence
        this.updatePresence();
        
        // Rotate every 10 seconds
        this.interval = setInterval(() => {
            this.updatePresence();
        }, 300000);
    }

    /**
     * Update bot presence
     */
    updatePresence() {
        const status = this.statuses[this.currentIndex];
        
        this.client.user.setPresence({
            activities: [{
                name: status.name,
                type: status.type
            }],
            status: 'online'
        });

        this.currentIndex = (this.currentIndex + 1) % this.statuses.length;
    }

    /**
     * Stop rotating presence
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

module.exports = PresenceManager;
