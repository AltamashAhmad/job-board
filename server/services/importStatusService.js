const ImportLog = require('../models/ImportLog');

class ImportStatusService {
  // Status transition map defines valid status transitions
  static STATUS_TRANSITIONS = {
    pending: ['in_progress'],
    in_progress: ['completed', 'failed', 'partially_completed'],
    completed: [], // Terminal state
    failed: [], // Terminal state
    partially_completed: [] // Terminal state
  };

  // Status descriptions for logging and display
  static STATUS_DESCRIPTIONS = {
    pending: 'Import job is queued and waiting to start',
    in_progress: 'Import job is currently running',
    completed: 'Import job completed successfully',
    failed: 'Import job failed due to critical errors',
    partially_completed: 'Import job completed with some errors'
  };

  /**
   * Validate if the status transition is allowed
   * @param {string} currentStatus - Current status of the import
   * @param {string} newStatus - Proposed new status
   * @returns {boolean} - Whether the transition is valid
   */
  static isValidTransition(currentStatus, newStatus) {
    const allowedTransitions = this.STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Update import status with validation
   * @param {string} importId - Import log ID
   * @param {string} newStatus - New status to set
   * @param {Object} options - Additional options (metrics, errors, etc.)
   * @returns {Promise<Object>} - Updated import log
   */
  static async updateStatus(importId, newStatus, options = {}) {
    const importLog = await ImportLog.findById(importId);
    if (!importLog) {
      throw new Error(`Import log not found: ${importId}`);
    }

    // Validate status transition
    if (!this.isValidTransition(importLog.status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${importLog.status} to ${newStatus}`
      );
    }

    // Update status and related fields
    importLog.status = newStatus;

    // Handle status-specific updates
    switch (newStatus) {
      case 'in_progress':
        importLog.startTime = new Date();
        break;

      case 'completed':
      case 'failed':
      case 'partially_completed':
        importLog.endTime = new Date();
        importLog.calculateDuration();
        break;
    }

    // Update metrics if provided
    if (options.metrics) {
      const {
        totalFetched,
        totalImported,
        newJobs,
        updatedJobs,
        failedJobs,
        skippedJobs
      } = options.metrics;

      if (totalFetched !== undefined) importLog.totalFetched = totalFetched;
      if (totalImported !== undefined) importLog.totalImported = totalImported;
      if (newJobs !== undefined) importLog.newJobs = newJobs;
      if (updatedJobs !== undefined) importLog.updatedJobs = updatedJobs;
      if (failedJobs !== undefined) importLog.failedJobs = failedJobs;
      if (skippedJobs !== undefined) importLog.skippedJobs = skippedJobs;
    }

    // Add any additional metadata
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        importLog.metadata.set(key, value);
      });
    }

    // Determine completion status based on metrics
    if (newStatus === 'completed' && importLog.failedJobs > 0) {
      importLog.status = 'partially_completed';
    }

    // Save and return updated import log
    await importLog.save();
    return importLog;
  }

  /**
   * Get current status details
   * @param {string} importId - Import log ID
   * @returns {Promise<Object>} - Status details
   */
  static async getStatusDetails(importId) {
    const importLog = await ImportLog.findById(importId);
    if (!importLog) {
      throw new Error(`Import log not found: ${importId}`);
    }

    const {
      status,
      startTime,
      endTime,
      duration,
      totalFetched,
      totalImported,
      newJobs,
      updatedJobs,
      failedJobs,
      skippedJobs,
      errorSummary,
      processingStats
    } = importLog;

    return {
      status,
      description: this.STATUS_DESCRIPTIONS[status],
      timing: {
        startTime,
        endTime,
        duration,
        ...(processingStats || {})
      },
      metrics: {
        totalFetched,
        totalImported,
        newJobs,
        updatedJobs,
        failedJobs,
        skippedJobs
      },
      errorSummary: Object.fromEntries(errorSummary || new Map()),
      isTerminal: this.STATUS_TRANSITIONS[status].length === 0
    };
  }

  /**
   * Check if import is stuck (in_progress for too long)
   * @param {string} importId - Import log ID
   * @param {number} timeoutMinutes - Minutes to consider as timeout
   * @returns {Promise<boolean>} - Whether the import is stuck
   */
  static async checkStuckImport(importId, timeoutMinutes = 60) {
    const importLog = await ImportLog.findById(importId);
    if (!importLog || importLog.status !== 'in_progress') {
      return false;
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const now = new Date();
    const timeSinceStart = now.getTime() - importLog.startTime.getTime();

    return timeSinceStart > timeoutMs;
  }

  /**
   * Handle stuck imports (mark as failed)
   * @param {number} timeoutMinutes - Minutes to consider as timeout
   * @returns {Promise<Array>} - Array of handled stuck imports
   */
  static async handleStuckImports(timeoutMinutes = 60) {
    const stuckImports = await ImportLog.find({
      status: 'in_progress',
      startTime: {
        $lt: new Date(Date.now() - timeoutMinutes * 60 * 1000)
      }
    });

    const results = [];
    for (const importLog of stuckImports) {
      try {
        const updated = await this.updateStatus(importLog._id, 'failed', {
          metadata: {
            failureReason: 'Import timeout - exceeded maximum duration',
            timeoutMinutes
          }
        });
        results.push(updated);
      } catch (error) {
        console.error(`Failed to handle stuck import ${importLog._id}:`, error);
      }
    }

    return results;
  }
}

module.exports = ImportStatusService; 