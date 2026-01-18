/**
 * Invoice PDF HTML Template
 * Generates professional invoice HTML for PDF conversion
 */

import type { ParsedInvoice } from '../types/invoice';

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

/**
 * Format date for invoice
 */
function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

/**
 * Generate invoice items rows HTML
 */
function generateItemsHTML(invoice: ParsedInvoice): string {
    return invoice.items.map((item, index) => `
        <tr>
            <td class="item-no">${index + 1}</td>
            <td class="item-desc">${item.description}</td>
            <td class="item-qty">${item.quantity}</td>
            <td class="item-price">${formatCurrency(item.unitPrice, invoice.currency)}</td>
            <td class="item-amount">${formatCurrency(item.amount, invoice.currency)}</td>
        </tr>
    `).join('');
}

/**
 * Generate full invoice HTML
 */
export function generateInvoiceHTML(invoice: ParsedInvoice): string {
    const today = new Date();
    const invoiceNumber = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #1a1a2e;
            background: #fff;
            padding: 40px;
        }
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563EB;
        }
        .brand {
            font-size: 28px;
            font-weight: 700;
            color: #2563EB;
        }
        .brand-sub {
            font-size: 12px;
            color: #64748B;
            margin-top: 4px;
        }
        .invoice-details {
            text-align: right;
        }
        .invoice-title {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 8px;
        }
        .invoice-meta {
            font-size: 13px;
            color: #64748B;
        }
        .invoice-meta span {
            display: block;
            margin-bottom: 4px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        .items-table th {
            background: #F8FAFC;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            color: #1a1a2e;
            border-bottom: 2px solid #E2E8F0;
        }
        .items-table th:last-child,
        .items-table td:last-child {
            text-align: right;
        }
        .items-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #E2E8F0;
        }
        .item-no {
            width: 50px;
            color: #64748B;
        }
        .item-desc {
            max-width: 200px;
        }
        .item-qty, .item-price {
            text-align: center;
        }
        .item-amount {
            font-weight: 600;
        }
        .summary {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #F1F5F9;
        }
        .summary-row.total {
            border-top: 2px solid #2563EB;
            border-bottom: none;
            padding-top: 16px;
            margin-top: 8px;
        }
        .summary-label {
            color: #64748B;
        }
        .summary-value {
            font-weight: 500;
        }
        .summary-row.total .summary-label,
        .summary-row.total .summary-value {
            font-size: 18px;
            font-weight: 700;
            color: #2563EB;
        }
        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #E2E8F0;
            text-align: center;
            color: #94A3B8;
            font-size: 12px;
        }
        .footer strong {
            color: #64748B;
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div>
            <div class="brand">QuickQuote</div>
            <div class="brand-sub">Voice-to-Invoice</div>
        </div>
        <div class="invoice-details">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
                <span><strong>Invoice #:</strong> ${invoiceNumber}</span>
                <span><strong>Date:</strong> ${formatDate(today)}</span>
            </div>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            ${generateItemsHTML(invoice)}
        </tbody>
    </table>

    <div class="summary">
        <div class="summary-row">
            <span class="summary-label">Subtotal</span>
            <span class="summary-value">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
        </div>
        ${invoice.taxPercent > 0 ? `
        <div class="summary-row">
            <span class="summary-label">Tax (${invoice.taxPercent}%)</span>
            <span class="summary-value">+ ${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
        </div>
        ` : ''}
        ${invoice.discountPercent > 0 ? `
        <div class="summary-row">
            <span class="summary-label">Discount (${invoice.discountPercent}%)</span>
            <span class="summary-value">- ${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
        </div>
        ` : ''}
        <div class="summary-row total">
            <span class="summary-label">Total</span>
            <span class="summary-value">${formatCurrency(invoice.total, invoice.currency)}</span>
        </div>
    </div>

    <div class="footer">
        <p>Generated by <strong>QuickQuote</strong> • ${formatDate(today)}</p>
        <p>Thank you for your business!</p>
    </div>
</body>
</html>
    `;
}
