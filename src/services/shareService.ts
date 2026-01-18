import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ParsedInvoice } from '../types/invoice';
import { generateInvoiceHTML } from '../templates/invoicePDF';

/**
 * Share Service
 * Handles PDF generation and sharing
 */
class ShareService {
    /**
     * Generate PDF from invoice data
     * @param invoice - The invoice to generate PDF for
     * @returns Promise resolving to the URI of the generated PDF
     */
    async generatePDF(invoice: ParsedInvoice): Promise<string> {
        try {
            const html = generateInvoiceHTML(invoice);
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
            });
            return uri;
        } catch (error) {
            console.error('[ShareService] PDF Generation failed:', error);
            throw new Error('Failed to generate PDF');
        }
    }

    /**
     * Share invoice as PDF
     * @param invoice - The invoice to share
     */
    async shareInvoice(invoice: ParsedInvoice): Promise<void> {
        try {
            // check availability
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                throw new Error('Sharing is not available on this device');
            }

            const pdfUri = await this.generatePDF(invoice);

            // Rename file for better UX
            const cleanDate = new Date().toISOString().split('T')[0];
            const fileName = `Invoice_${invoice.currency}_${cleanDate}.pdf`;
            const newPath = `${FileSystem.documentDirectory}${fileName}`;

            await FileSystem.moveAsync({
                from: pdfUri,
                to: newPath,
            });

            await Sharing.shareAsync(newPath, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Invoice PDF',
                UTI: 'com.adobe.pdf',
            });

        } catch (error) {
            console.error('[ShareService] Share failed:', error);
            throw error;
        }
    }
}

export const shareService = new ShareService();
