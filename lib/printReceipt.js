export const printReceipt = (transaction, storeName = 'Bakhsh Pharmacy') => {
    const {
        id,
        created_at,
        product_name,
        quantity,
        unit_price,
        discount,
        total,
        payment_method,
        customer_name,
        notes,
    } = transaction

    const receiptDate = new Date(created_at).toLocaleString('en-PK')
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Receipt</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Courier New', monospace;
                    background-color: #f5f5f5;
                    padding: 20px;
                }
                .receipt {
                    background-color: white;
                    width: 300px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                .store-name {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .divider {
                    border-bottom: 1px dashed #000;
                    margin: 15px 0;
                }
                .divider-solid {
                    border-bottom: 1px solid #000;
                    margin: 15px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 12px;
                }
                .info-label {
                    font-weight: bold;
                }
                .items-section {
                    margin-bottom: 15px;
                }
                .item-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    margin-bottom: 8px;
                }
                .item-name {
                    flex: 1;
                    word-break: break-word;
                }
                .item-price {
                    text-align: right;
                    font-weight: bold;
                }
                .totals-section {
                    font-size: 13px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .total-label {
                    font-weight: bold;
                }
                .total-amount {
                    text-align: right;
                    font-weight: bold;
                }
                .grand-total {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                    font-weight: bold;
                    padding-top: 10px;
                    border-top: 2px solid #000;
                }
                .footer {
                    text-align: center;
                    font-size: 11px;
                    margin-top: 15px;
                    color: #666;
                }
                .notes {
                    background-color: #f9f9f9;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    margin-top: 10px;
                    text-align: center;
                }
                @media print {
                    body {
                        background-color: white;
                        padding: 0;
                    }
                    .receipt {
                        box-shadow: none;
                        border: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <div class="store-name">${storeName}</div>
                    <div style="font-size: 11px; color: #666;">Pharmacy Receipt</div>
                </div>

                <div class="info-row">
                    <span class="info-label">Receipt #:</span>
                    <span>${id?.substring(0, 8).toUpperCase() || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span>${receiptDate}</span>
                </div>
                ${customer_name ? `<div class="info-row">
                    <span class="info-label">Customer:</span>
                    <span>${customer_name}</span>
                </div>` : ''}

                <div class="divider"></div>

                <div class="items-section">
                    <div class="item-row" style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                        <span class="item-name" style="font-weight: bold;">Product</span>
                        <span style="text-align: right; font-weight: bold;">Qty | Total</span>
                    </div>
                    <div class="item-row">
                        <span class="item-name">${product_name || 'Product'}</span>
                        <span style="text-align: right;">${quantity} × Rs ${parseFloat(unit_price || 0).toFixed(0)}</span>
                    </div>
                    <div class="item-row">
                        <span></span>
                        <span class="item-price">Rs ${(parseFloat(unit_price || 0) * quantity).toFixed(0)}</span>
                    </div>
                </div>

                <div class="divider-solid"></div>

                <div class="totals-section">
                    <div class="total-row">
                        <span class="total-label">Subtotal:</span>
                        <span class="total-amount">Rs ${(parseFloat(unit_price || 0) * quantity).toFixed(0)}</span>
                    </div>
                    ${discount > 0 ? `<div class="total-row">
                        <span class="total-label">Discount:</span>
                        <span class="total-amount">-Rs ${parseFloat(discount || 0).toFixed(0)}</span>
                    </div>` : ''}
                </div>

                <div class="divider"></div>

                <div class="grand-total">
                    <span>TOTAL DUE:</span>
                    <span>Rs ${parseFloat(total || 0).toFixed(0)}</span>
                </div>

                <div class="info-row" style="margin-top: 15px;">
                    <span class="info-label">Payment:</span>
                    <span style="text-transform: capitalize;">${(payment_method || 'cash').replace(/_/g, ' ')}</span>
                </div>

                ${notes ? `<div class="notes">Note: ${notes}</div>` : ''}

                <div class="footer">
                    <p>Thank you for your purchase!</p>
                    <p style="margin-top: 10px; font-size: 10px;">
                        ${new Date().toLocaleString('en-PK')}
                    </p>
                </div>
            </div>

            <script>
                window.print();
            </script>
        </body>
        </html>
    `

    const printWindow = window.open('', '', 'width=400,height=600')
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
}
