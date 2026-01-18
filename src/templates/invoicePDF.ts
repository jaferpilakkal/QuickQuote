import { ParsedInvoice, SUPPORTED_CURRENCIES } from '../types/invoice';

/**
 * Generate PDF HTML content
 */
export function generateInvoiceHTML(invoice: ParsedInvoice): string {
    const currencyInfo = SUPPORTED_CURRENCIES[invoice.currency as keyof typeof SUPPORTED_CURRENCIES] || SUPPORTED_CURRENCIES.INR;

    // Format dates
    const createdDate = new Date(invoice.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    // Calculate totals
    const subtotal = invoice.subtotal.toFixed(2);
    const taxAmount = invoice.taxAmount.toFixed(2);
    const discountAmount = invoice.discountAmount.toFixed(2);
    const total = invoice.total.toFixed(2);

    // Generate items rows
    const itemsHtml = invoice.items.map(item => `
    <tr>
      <td class="description">
        <div class="item-name">${item.description}</div>
      </td>
      <td class="quantity">${item.quantity}</td>
      <td class="price">${currencyInfo.symbol}${item.unitPrice.toFixed(2)}</td>
      <td class="amount">${currencyInfo.symbol}${item.amount.toFixed(2)}</td>
    </tr>
  `).join('');

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            color: #1F2937;
            margin: 0;
            padding: 40px;
            -webkit-font-smoothing: antialiased;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 60px;
          }

          .logo-area {
            font-size: 24px;
            font-weight: 700;
            color: #4F46E5;
            letter-spacing: -0.5px;
          }

          .invoice-details {
            text-align: right;
          }

          .invoice-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #111827;
          }

          .invoice-meta {
            color: #6B7280;
            font-size: 14px;
            line-height: 1.5;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }

          th {
            text-align: left;
            padding: 12px 16px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6B7280;
            border-bottom: 1px solid #E5E7EB;
            font-weight: 600;
          }

          td {
            padding: 16px;
            font-size: 14px;
            border-bottom: 1px solid #F3F4F6;
          }

          .description { width: 45%; }
          .quantity { width: 15%; text-align: center; }
          .price { width: 20%; text-align: right; }
          .amount { width: 20%; text-align: right; font-weight: 600; }

          th.quantity { text-align: center; }
          th.price, th.amount { text-align: right; }

          .item-name {
            font-weight: 600;
            color: #111827;
          }

          .totals-section {
            display: flex;
            justify-content: flex-end;
          }

          .totals-table {
            width: 300px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
            color: #6B7280;
          }

          .grand-total {
            border-top: 2px solid #E5E7EB;
            margin-top: 12px;
            padding-top: 12px;
            color: #111827;
            font-weight: 700;
            font-size: 18px;
            align-items: center;
          }

          .footer {
            margin-top: 80px;
            border-top: 1px solid #E5E7EB;
            padding-top: 24px;
            text-align: center;
            color: #9CA3AF;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            QUICKQUOTE
          </div>
          <div class="invoice-details">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
              #${invoice.id.slice(-6).toUpperCase()}<br>
              Date: ${createdDate}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="description">Item / Description</th>
              <th class="quantity">Qty</th>
              <th class="price">Price</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-table">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${currencyInfo.symbol}${subtotal}</span>
            </div>
            ${invoice.taxAmount > 0 ? `
            <div class="total-row">
              <span>Tax (${invoice.taxPercent}%)</span>
              <span>${currencyInfo.symbol}${taxAmount}</span>
            </div>
            ` : ''}
            ${invoice.discountAmount > 0 ? `
            <div class="total-row">
              <span>Discount</span>
              <span>-${currencyInfo.symbol}${discountAmount}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Total</span>
              <span>${currencyInfo.symbol}${total}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          Generated with QuickQuote AI
          ${invoice.notes ? `<br><br><strong>Notes:</strong> ${invoice.notes}` : ''}
        </div>
      </body>
    </html>
  `;
}
