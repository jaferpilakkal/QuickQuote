/**
 * PDF Service
 * Handles invoice PDF generation and sharing
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateInvoiceHTML } from '../utils/pdfTemplate';
import type { ParsedInvoice } from '../types/invoice';

/**
 * Generate invoice PDF file
 * @returns URI to the generated PDF file
 */
export async function generateInvoicePDF(invoice: ParsedInvoice): Promise<string> {
    try {
        const html = generateInvoiceHTML(invoice);

        const { uri } = await Print.printToFileAsync({
            html,
            base64: false,
        });

        console.log('[pdfService] PDF generated at:', uri);
        return uri;
    } catch (error) {
        console.error('[pdfService] PDF generation failed:', error);
        throw new Error('Failed to generate PDF');
    }
}

/**
 * Share invoice PDF via native share sheet
 */
export async function shareInvoicePDF(pdfUri: string): Promise<void> {
    try {
        const isAvailable = await Sharing.isAvailableAsync();

        if (!isAvailable) {
            throw new Error('Sharing is not available on this device');
        }

        await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Invoice',
            UTI: 'com.adobe.pdf',
        });

        console.log('[pdfService] Share completed');
    } catch (error) {
        console.error('[pdfService] Sharing failed:', error);
        throw error;
    }
}

/**
 * Generate and share invoice in one step
 */
export async function generateAndShareInvoice(invoice: ParsedInvoice): Promise<void> {
    const pdfUri = await generateInvoicePDF(invoice);
    await shareInvoicePDF(pdfUri);
}
