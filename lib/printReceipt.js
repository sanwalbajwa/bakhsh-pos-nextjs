const money = (value) => Number(value || 0).toFixed(0)

const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export const printReceipt = (transaction, storeName = 'Bakhsh Pharmacy') => {
    const transactions = Array.isArray(transaction) ? transaction : [transaction]
    const firstTransaction = transactions[0] || {}
    const receiptDate = firstTransaction.created_at
        ? new Date(firstTransaction.created_at).toLocaleString('en-PK')
        : new Date().toLocaleString('en-PK')
    const receiptNumber = `${firstTransaction.id?.substring(0, 8).toUpperCase() || 'N/A'}${transactions.length > 1 ? `+${transactions.length - 1}` : ''}`

    const subtotal = transactions.reduce(
        (sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0),
        0
    )
    const totalDiscount = transactions.reduce((sum, item) => sum + Number(item.discount || 0), 0)
    const grandTotal = transactions.reduce((sum, item) => sum + Number(item.total || 0), 0)

    const itemRows = transactions.map((item) => {
        const lineSubtotal = Number(item.unit_price || 0) * Number(item.quantity || 0)
        const lineDiscount = Number(item.discount || 0)
        return `
                    <div class="item-row">
                        <span class="item-name">${escapeHtml(item.product_name || item.products?.name || 'Product')}</span>
                        <span style="text-align: right;">${item.quantity} x Rs ${money(item.unit_price)}</span>
                    </div>
                    <div class="item-row">
                        <span>${lineDiscount > 0 ? `Discount Rs ${money(lineDiscount)}` : ''}</span>
                        <span class="item-price">Rs ${money(lineSubtotal - lineDiscount)}</span>
                    </div>
        `
    }).join('')

    const notes = transactions.map((item) => item.notes).filter(Boolean).join(' | ')
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Receipt</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Courier New', monospace; background-color: #f5f5f5; padding: 20px; }
                .receipt { background-color: white; width: 300px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
                .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
                .divider-solid { border-bottom: 1px solid #000; margin: 15px 0; }
                .info-row { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; font-size: 12px; }
                .info-label { font-weight: bold; }
                .items-section { margin-bottom: 15px; }
                .item-row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; margin-bottom: 8px; }
                .item-name { flex: 1; word-break: break-word; }
                .item-price { text-align: right; font-weight: bold; }
                .totals-section { font-size: 13px; }
                .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .total-label, .total-amount { font-weight: bold; }
                .grand-total { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; padding-top: 10px; border-top: 2px solid #000; }
                .footer { text-align: center; font-size: 11px; margin-top: 15px; color: #666; }
                .notes { background-color: #f9f9f9; padding: 8px; border-radius: 4px; font-size: 11px; margin-top: 10px; text-align: center; }
                @media print {
                    body { background-color: white; padding: 0; }
                    .receipt { box-shadow: none; border: none; }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <div class="store-name">${escapeHtml(storeName)}</div>
                    <div style="font-size: 11px; color: #666;">Pharmacy Receipt</div>
                </div>

                <div class="info-row">
                    <span class="info-label">Receipt #:</span>
                    <span>${receiptNumber}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span>${receiptDate}</span>
                </div>
                ${firstTransaction.customer_name ? `<div class="info-row">
                    <span class="info-label">Customer:</span>
                    <span>${escapeHtml(firstTransaction.customer_name)}</span>
                </div>` : ''}

                <div class="divider"></div>

                <div class="items-section">
                    <div class="item-row" style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                        <span class="item-name" style="font-weight: bold;">Product</span>
                        <span style="text-align: right; font-weight: bold;">Qty | Total</span>
                    </div>
                    ${itemRows}
                </div>

                <div class="divider-solid"></div>

                <div class="totals-section">
                    <div class="total-row">
                        <span class="total-label">Subtotal:</span>
                        <span class="total-amount">Rs ${money(subtotal)}</span>
                    </div>
                    ${totalDiscount > 0 ? `<div class="total-row">
                        <span class="total-label">Discount:</span>
                        <span class="total-amount">-Rs ${money(totalDiscount)}</span>
                    </div>` : ''}
                </div>

                <div class="divider"></div>

                <div class="grand-total">
                    <span>TOTAL DUE:</span>
                    <span>Rs ${money(grandTotal)}</span>
                </div>

                <div class="info-row" style="margin-top: 15px;">
                    <span class="info-label">Payment:</span>
                    <span style="text-transform: capitalize;">${escapeHtml(firstTransaction.payment_method || 'cash').replace(/_/g, ' ')}</span>
                </div>

                ${notes ? `<div class="notes">Note: ${escapeHtml(notes)}</div>` : ''}

                <div class="footer">
                    <p>Thank you for your purchase!</p>
                    <p style="margin-top: 10px; font-size: 10px;">${new Date().toLocaleString('en-PK')}</p>
                </div>
            </div>

            <script>window.print();</script>
        </body>
        </html>
    `

    const printWindow = window.open('', '', 'width=400,height=600')
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
}
