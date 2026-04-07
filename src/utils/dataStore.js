const fs = require('fs-extra');
const path = require('path');

/**
 * DataStore - Handles atomic JSON file operations
 * Provides concurrency-safe read/write operations using temp files and atomic renames
 */
class DataStore {
    constructor(filePath) {
        this.filePath = filePath;
        this.ensureFileExists();
    }

    /**
     * Ensure the data file exists, create with default content if not
     */
    ensureFileExists() {
        if (!fs.existsSync(this.filePath)) {
            const dir = path.dirname(this.filePath);
            fs.ensureDirSync(dir);
            fs.writeJsonSync(this.filePath, {}, { spaces: 2 });
        }
    }

    /**
     * Read data from JSON file
     * @returns {Object} Parsed JSON data
     */
    read() {
        try {
            return fs.readJsonSync(this.filePath);
        } catch (error) {
            console.error(`Error reading ${this.filePath}:`, error);
            return {};
        }
    }

    /**
     * Write data to JSON file atomically
     * Uses temp file and rename for concurrency safety
     * @param {Object} data - Data to write
     */
    write(data) {
        try {
            const tempPath = `${this.filePath}.tmp`;
            // Write to temp file first
            fs.writeJsonSync(tempPath, data, { spaces: 2 });
            // Atomic rename
            fs.renameSync(tempPath, this.filePath);
        } catch (error) {
            console.error(`Error writing ${this.filePath}:`, error);
            throw error;
        }
    }

    /**
     * Update data using a callback function
     * Provides atomic read-modify-write operation
     * @param {Function} callback - Function that receives current data and returns modified data
     */
    update(callback) {
        const data = this.read();
        const updatedData = callback(data);
        this.write(updatedData);
        return updatedData;
    }
}

module.exports = DataStore;
