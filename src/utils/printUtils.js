export const handlePrintCard = (table, restaurant) => {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>Print QR - ${table.table_number}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Bricolage Grotesque', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background-color: #ffffff;
            padding: 20px;
          }
          .card {
            width: 320px;
            background-color: #ffffff;
            border: 1px solid #d3d3d3;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
          }
          /* Card Header Style */
          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #d3d3d3;
            background-color: #ffffff;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .cafe-logo {
            width: 32px;
            height: 32px;
            border-radius: 4px;
            object-fit: cover;
            border: 1px solid #d3d3d3;
          }
          .cafe-info {
            text-align: left;
          }
          .cafe-name {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            color: #0b090a;
          }
          .cafe-type {
            margin: 1px 0 0 0;
            font-size: 11px;
            color: #b1a7a6;
          }
          .status-badge {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 3px;
            letter-spacing: 0.5px;
          }
          .status-badge.active {
            background-color: #f5f3f4;
            color: #ba181b;
          }
          .status-badge.disabled {
            background-color: #f5f3f4;
            color: #b1a7a6;
          }
          /* Table Banner Style */
          .table-banner {
            background-color: #161a1d;
            color: #ffffff;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .table-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
          .table-label {
            font-size: 10px;
            color: #b1a7a6;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .table-number {
            font-size: 32px;
            font-weight: 800;
            line-height: 1;
            margin-top: 2px;
          }
          .dine-in-badge {
            font-size: 11px;
            font-weight: 600;
            background-color: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 3px;
          }
          /* QR Section Style */
          .qr-section {
            padding: 24px 20px;
            background-color: #f5f3f4;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .scan-title {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            color: #161a1d;
          }
          .scan-subtitle {
            margin: 4px 0 16px 0;
            font-size: 11px;
            color: #b1a7a6;
            text-align: center;
          }
          .qr-code-wrapper {
            background-color: #ffffff;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #d3d3d3;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
            display: inline-block;
          }
          .qr-code-wrapper img {
            display: block;
          }
          .scan-footer {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 16px;
            font-size: 11px;
            color: #b1a7a6;
            font-weight: 500;
          }
          @media print {
            * {
              color: #000000 !important;
              background-color: transparent !important;
              font-weight: 800 !important;
              opacity: 1 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="card-header">
            <div class="header-left">
              ${restaurant?.logo_url ? `<img class="cafe-logo" src="${restaurant.logo_url}" />` : ''}
              <div class="cafe-info">
                <p class="cafe-name">${restaurant?.name || 'Restaurant'}</p>
                <p class="cafe-type">Dine-in</p>
              </div>
            </div>
            <span class="status-badge ${table.is_active ? 'active' : 'disabled'}">
              ${table.is_active ? 'Active' : 'Disabled'}
            </span>
          </div>

          <div class="table-banner">
            <div class="table-info">
              <span class="table-label">Table</span>
              <span class="table-number">${String(table.table_number).toLowerCase().startsWith('table') ? String(table.table_number).substring(5).trim() : table.table_number}</span>
            </div>
            <span class="dine-in-badge">Dine In</span>
          </div>

          <div class="qr-section">
            <p class="scan-title">Scan to Order</p>
            <p class="scan-subtitle">Point your phone camera at this QR code</p>
            <div class="qr-code-wrapper">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="180" height="180" />
            </div>
            <div class="scan-footer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Scan with phone camera</span>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

export const handlePrintAll = (tables, restaurant) => {
  const printWindow = window.open('', '_blank')
  let cardsHtml = ''

  tables.forEach(table => {
    cardsHtml += `
      <div class="card">
        <div class="card-header">
          <div class="header-left">
            ${restaurant?.logo_url ? `<img class="cafe-logo" src="${restaurant.logo_url}" />` : ''}
            <div class="cafe-info">
              <p class="cafe-name">${restaurant?.name || 'Restaurant'}</p>
              <p class="cafe-type">Dine-in</p>
            </div>
          </div>
          <span class="status-badge ${table.is_active ? 'active' : 'disabled'}">
            ${table.is_active ? 'Active' : 'Disabled'}
          </span>
        </div>

        <div class="table-banner">
          <div class="table-info">
            <span class="table-label">Table</span>
            <span class="table-number">${String(table.table_number).toLowerCase().startsWith('table') ? String(table.table_number).substring(5).trim() : table.table_number}</span>
          </div>
          <span class="dine-in-badge">Dine In</span>
        </div>

        <div class="qr-section">
          <p class="scan-title">Scan to Order</p>
          <p class="scan-subtitle">Point your phone camera at this QR code</p>
          <div class="qr-code-wrapper">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="180" height="180" />
          </div>
          <div class="scan-footer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>Scan with phone camera</span>
          </div>
        </div>
      </div>
    `
  })

  printWindow.document.write(`
    <html>
      <head>
        <title>Print All QR Cards</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Bricolage Grotesque', sans-serif;
            margin: 20px;
            background-color: #ffffff;
          }
          .grid {
            display: grid;
            grid-template-cols: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
            justify-items: center;
          }
          .card {
            width: 320px;
            background-color: #ffffff;
            border: 1px solid #d3d3d3;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Card Header Style */
          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #d3d3d3;
            background-color: #ffffff;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .cafe-logo {
            width: 32px;
            height: 32px;
            border-radius: 4px;
            object-fit: cover;
            border: 1px solid #d3d3d3;
          }
          .cafe-info {
            text-align: left;
          }
          .cafe-name {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            color: #0b090a;
          }
          .cafe-type {
            margin: 1px 0 0 0;
            font-size: 11px;
            color: #b1a7a6;
          }
          .status-badge {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 3px;
            letter-spacing: 0.5px;
          }
          .status-badge.active {
            background-color: #f5f3f4;
            color: #ba181b;
          }
          .status-badge.disabled {
            background-color: #f5f3f4;
            color: #b1a7a6;
          }
          /* Table Banner Style */
          .table-banner {
            background-color: #161a1d;
            color: #ffffff;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .table-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
          .table-label {
            font-size: 10px;
            color: #b1a7a6;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .table-number {
            font-size: 32px;
            font-weight: 800;
            line-height: 1;
            margin-top: 2px;
          }
          .dine-in-badge {
            font-size: 11px;
            font-weight: 600;
            background-color: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 3px;
          }
          /* QR Section Style */
          .qr-section {
            padding: 24px 20px;
            background-color: #f5f3f4;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .scan-title {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            color: #161a1d;
          }
          .scan-subtitle {
            margin: 4px 0 16px 0;
            font-size: 11px;
            color: #b1a7a6;
            text-align: center;
          }
          .qr-code-wrapper {
            background-color: #ffffff;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #d3d3d3;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
            display: inline-block;
          }
          .qr-code-wrapper img {
            display: block;
          }
          .scan-footer {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 16px;
            font-size: 11px;
            color: #b1a7a6;
            font-weight: 500;
          }
          @media print {
            * {
              color: #000000 !important;
              background-color: transparent !important;
              font-weight: 800 !important;
              opacity: 1 !important;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .grid {
              grid-template-cols: repeat(2, 1fr);
              gap: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${cardsHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
