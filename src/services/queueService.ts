/**
 * Queue Service
 * Manages the offline processing queue for STT and parsing operations
 * Part of Phase 5: Offline & Sync
 */

import {
    addToQueue as dbAddToQueue,
    getPendingQueueItems,
    updateQueueItemStatus,
    deleteCompletedQueueItems,
    getDraftById,
    updateDraftTranscript,
    updateDraftInvoice,
} from '../database';
import { sttService } from './sttService';
import { geminiService } from './geminiService';
import type { QueueItem } from '../types/database';

/**
 * Generate a unique ID (React Native compatible)
 */
function generateId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Queue processing result
 */
export interface QueueProcessResult {
    /** Number of items successfully processed */
    processed: number;
    /** Number of items that failed */
    failed: number;
    /** Total items attempted */
    total: number;
    /** Error messages for failed items */
    errors: Array<{ id: string; error: string }>;
}

/**
 * Queue status summary
 */
export interface QueueStatus {
    /** Number of pending items */
    pending: number;
    /** Number of processing items */
    processing: number;
    /** Number of failed items */
    failed: number;
    /** Total items in queue */
    total: number;
}

/**
 * Maximum retry attempts for failed jobs
 */
const MAX_RETRIES = 3;

/**
 * Delay between retries (exponential backoff base)
 */
const RETRY_BASE_DELAY_MS = 1000;

/**
 * Queue Service
 */
export const queueService = {
    /**
     * Add an item to the processing queue
     * @param draftId - ID of the draft to process
     * @param type - Type of processing needed
     * @returns Queue item ID
     */
    async addToQueue(
        draftId: string,
        type: 'stt' | 'parse' | 'both' = 'both'
    ): Promise<string> {
        const id = generateId();
        await dbAddToQueue(id, draftId, type);
        console.log(`[Queue] Added item ${id} for draft ${draftId} (${type})`);
        return id;
    },

    /**
     * Process all pending queue items
     * @returns Processing result summary
     */
    async processQueue(): Promise<QueueProcessResult> {
        const result: QueueProcessResult = {
            processed: 0,
            failed: 0,
            total: 0,
            errors: [],
        };

        try {
            const pendingItems = await getPendingQueueItems();
            result.total = pendingItems.length;

            if (pendingItems.length === 0) {
                console.log('[Queue] No pending items to process');
                return result;
            }

            console.log(`[Queue] Processing ${pendingItems.length} pending items`);

            for (const item of pendingItems) {
                try {
                    await this.processItem(item);
                    result.processed++;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    result.failed++;
                    result.errors.push({ id: item.id, error: errorMessage });
                    console.warn(`[Queue] Item ${item.id} failed:`, errorMessage);
                }
            }

            // Clean up completed items
            await deleteCompletedQueueItems();

            console.log(`[Queue] Processed ${result.processed}/${result.total}, Failed: ${result.failed}`);
            return result;

        } catch (error) {
            console.error('[Queue] Failed to process queue:', error);
            throw error;
        }
    },

    /**
     * Process a single queue item
     * @param item - Queue item to process
     */
    async processItem(item: QueueItem): Promise<void> {
        console.log(`[Queue] Processing item ${item.id} (type: ${item.type})`);

        // Mark as processing
        await updateQueueItemStatus(item.id, 'processing', null, item.retryCount);

        try {
            // Get the draft
            const draft = await getDraftById(item.draftId);
            if (!draft) {
                throw new Error(`Draft ${item.draftId} not found`);
            }

            // Process based on type
            if (item.type === 'stt' || item.type === 'both') {
                if (draft.audioPath && !draft.transcript) {
                    const sttResult = await sttService.transcribe(draft.audioPath);
                    await updateDraftTranscript(item.draftId, sttResult.transcript, sttResult.confidence);
                    console.log(`[Queue] STT completed for draft ${item.draftId}`);
                }
            }

            if (item.type === 'parse' || item.type === 'both') {
                // Refresh draft to get updated transcript
                const updatedDraft = await getDraftById(item.draftId);
                if (updatedDraft?.transcript && !updatedDraft.invoiceData) {
                    const parsedInvoice = await geminiService.parseTranscript(updatedDraft.transcript);
                    const confidence = geminiService.getAverageConfidence(parsedInvoice);
                    await updateDraftInvoice(
                        item.draftId,
                        JSON.stringify(parsedInvoice),
                        confidence
                    );
                    console.log(`[Queue] Parse completed for draft ${item.draftId}`);
                }
            }

            // Mark as completed
            await updateQueueItemStatus(item.id, 'completed', null, item.retryCount);
            console.log(`[Queue] Item ${item.id} completed successfully`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const newRetryCount = item.retryCount + 1;

            if (newRetryCount >= MAX_RETRIES) {
                // Max retries exceeded - mark as failed
                await updateQueueItemStatus(item.id, 'failed', errorMessage, newRetryCount);
                console.error(`[Queue] Item ${item.id} failed after ${MAX_RETRIES} retries`);
                throw error;
            } else {
                // Mark as pending for retry
                await updateQueueItemStatus(item.id, 'pending', errorMessage, newRetryCount);
                console.log(`[Queue] Item ${item.id} will retry (attempt ${newRetryCount}/${MAX_RETRIES})`);
                throw error;
            }
        }
    },

    /**
     * Retry all failed items
     */
    async retryFailedItems(): Promise<void> {
        try {
            const pendingItems = await getPendingQueueItems();
            const failedItems = pendingItems.filter(
                item => item.status === 'failed' || (item.lastError && item.retryCount < MAX_RETRIES)
            );

            console.log(`[Queue] Retrying ${failedItems.length} failed items`);

            for (const item of failedItems) {
                // Reset to pending for retry
                await updateQueueItemStatus(item.id, 'pending', null, item.retryCount);
            }
        } catch (error) {
            console.error('[Queue] Failed to retry items:', error);
            throw error;
        }
    },

    /**
     * Get queue status summary
     */
    async getQueueStatus(): Promise<QueueStatus> {
        try {
            const items = await getPendingQueueItems();

            return {
                pending: items.filter(i => i.status === 'pending').length,
                processing: items.filter(i => i.status === 'processing').length,
                failed: items.filter(i => i.status === 'failed').length,
                total: items.length,
            };
        } catch (error) {
            console.error('[Queue] Failed to get status:', error);
            return { pending: 0, processing: 0, failed: 0, total: 0 };
        }
    },

    /**
     * Clear all completed items from queue
     */
    async clearCompletedItems(): Promise<void> {
        try {
            await deleteCompletedQueueItems();
            console.log('[Queue] Cleared completed items');
        } catch (error) {
            console.error('[Queue] Failed to clear completed items:', error);
            throw error;
        }
    },

    /**
     * Clear ALL items from queue (user reset)
     */
    async clearAllItems(): Promise<void> {
        try {
            const { deleteAllQueueItems } = await import('../database');
            await deleteAllQueueItems();
            console.log('[Queue] Cleared all queue items');
        } catch (error) {
            console.error('[Queue] Failed to clear all items:', error);
            throw error;
        }
    },

    /**
     * Get exponential backoff delay
     */
    getRetryDelay(retryCount: number): number {
        return RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
    },
};

export default queueService;
