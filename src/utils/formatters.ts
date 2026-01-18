/**
 * Formatting Utilities
 * Text and display formatting functions
 */

import { format, formatDistanceToNow } from 'date-fns';
import type { InvoiceData } from '../types/invoice';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '../types/invoice';

/**
 * Format duration from milliseconds to MM:SS
 */
export function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration with hours if needed
 */
export function formatDurationLong(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return formatDuration(ms);
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
    return format(new Date(timestamp), 'dd MMM yyyy');
}

/**
 * Format timestamp to readable date and time
 */
export function formatDateTime(timestamp: number): string {
    return format(new Date(timestamp), 'dd MMM yyyy, HH:mm');
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'INR'): string {
    const currency = SUPPORTED_CURRENCIES[currencyCode];
    const formatted = amount.toLocaleString(currency.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${currency.symbol}${formatted}`;
}

/**
 * Format invoice as WhatsApp text message
 * Based on PRD Section 6.E template
 */
export function formatInvoiceText(invoice: InvoiceData): string {
    const currency = SUPPORTED_CURRENCIES[invoice.currency as CurrencyCode] || SUPPORTED_CURRENCIES.INR;
    const symbol = currency.symbol;

    let text = '📋 *INVOICE*\n\n';

    // Items
    invoice.items.forEach((item, index) => {
        const itemNumber = index + 1;
        if (item.quantity > 1) {
            text += `${itemNumber}. ${item.description} x${item.quantity}\n`;
            text += `   @ ${symbol}${item.unitPrice.toFixed(2)} = ${symbol}${item.subtotal.toFixed(2)}\n\n`;
        } else {
            text += `${itemNumber}. ${item.description}\n`;
            text += `   = ${symbol}${item.subtotal.toFixed(2)}\n\n`;
        }
    });

    // Divider
    text += '────────────────\n';

    // Totals
    text += `Subtotal: ${symbol}${invoice.subtotal.toFixed(2)}\n`;

    if (invoice.tax > 0) {
        text += `Tax: ${symbol}${invoice.tax.toFixed(2)}\n`;
    }

    if (invoice.discount > 0) {
        text += `Discount: -${symbol}${invoice.discount.toFixed(2)}\n`;
    }

    text += `*Total: ${symbol}${invoice.total.toFixed(2)}*\n\n`;

    // Footer
    text += '_Created with QuickQuote_';

    return text;
}

/**
 * Format invoice as HTML for PDF generation
 * Based on Development Package Section 5.5
 */
export function formatInvoiceHTML(invoice: InvoiceData, businessName?: string): string {
    const currency = SUPPORTED_CURRENCIES[invoice.currency as CurrencyCode] || SUPPORTED_CURRENCIES.INR;
    const symbol = currency.symbol;
    const today = format(new Date(), 'dd MMMM yyyy');

    const itemsHTML = invoice.items
        .map(
            (item) => `
      <tr>
        <td>${escapeHtml(item.description)}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${symbol}${item.unitPrice.toFixed(2)}</td>
        <td style="text-align: right;">${symbol}${item.subtotal.toFixed(2)}</td>
      </tr>
    `
        )
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      padding: 40px;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #007AFF;
    }
    .header h1 {
      margin: 0;
      color: #007AFF;
      font-size: 28px;
    }
    .header .business-name {
      margin-top: 8px;
      font-size: 14px;
      color: #666;
    }
    .header .date {
      margin-top: 4px;
      font-size: 12px;
      color: #999;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #f8f9fa;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      border-bottom: 2px solid #e9ecef;
    }
    td {
      padding: 12px 8px;
      border-bottom: 1px solid #e9ecef;
      font-size: 14px;
    }
    .summary {
      text-align: right;
      margin-top: 20px;
    }
    .summary-row {
      display: flex;
      justify-content: flex-end;
      padding: 4px 0;
    }
    .summary-label {
      width: 120px;
      text-align: right;
      color: #666;
    }
    .summary-value {
      width: 100px;
      text-align: right;
      font-weight: 500;
    }
    .total-row {
      font-size: 18px;
      font-weight: 700;
      color: #007AFF;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 2px solid #007AFF;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      color: #999;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    ${businessName ? `<div class="business-name">${escapeHtml(businessName)}</div>` : ''}
    <div class="date">${today}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Description</th>
        <th style="width: 15%; text-align: center;">Qty</th>
        <th style="width: 17%; text-align: right;">Price</th>
        <th style="width: 18%; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>
  
  <div class="summary">
    <div class="summary-row">
      <span class="summary-label">Subtotal:</span>
      <span class="summary-value">${symbol}${invoice.subtotal.toFixed(2)}</span>
    </div>
    ${invoice.tax > 0
            ? `
    <div class="summary-row">
      <span class="summary-label">Tax:</span>
      <span class="summary-value">${symbol}${invoice.tax.toFixed(2)}</span>
    </div>
    `
            : ''
        }
    ${invoice.discount > 0
            ? `
    <div class="summary-row">
      <span class="summary-label">Discount:</span>
      <span class="summary-value">-${symbol}${invoice.discount.toFixed(2)}</span>
    </div>
    `
            : ''
        }
    <div class="summary-row total-row">
      <span class="summary-label">Total:</span>
      <span class="summary-value">${symbol}${invoice.total.toFixed(2)}</span>
    </div>
  </div>
  
  <div class="footer">
    Created with QuickQuote
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
