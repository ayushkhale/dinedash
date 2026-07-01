import logoRed from '../assets/logored.png'

export const handlePrintCard = (table, restaurant) => {
  const printWindow = window.open('', '_blank')
  
  const tableNumber = String(table.table_number).toLowerCase().startsWith('table')
    ? String(table.table_number).substring(5).trim()
    : table.table_number;

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Table Card - ${tableNumber}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f3f4f6;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          .tent-container {
            width: 5.0in;
            height: 17.0in;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 15px 35px rgba(0,0,0,0.05);
            border: 1px solid #cbd5e1;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Fold Score Lines */
          .score-line {
            width: 100%;
            height: 0;
            position: relative;
            text-align: center;
            z-index: 20;
          }
          .score-line::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            border-top: 1.5px dashed #cbd5e1;
          }
          .score-label {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 1px 8px;
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 1px;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .center-score::after {
            border-top: 2px dashed #ffffff;
          }
          .center-score .score-label {
            color: #ba181b;
            border: 1px solid #ffffff;
            background-color: #ffffff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }

          /* Panel Sections */
          .panel-flap-top {
            height: 2.5in;
            background-color: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 15px;
            color: #64748b;
          }
          
          .panel-back {
            height: 6.0in;
            transform: rotate(180deg);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 35px 20px;
            background: linear-gradient(rgba(186, 24, 27, 0.75), rgba(120, 10, 15, 0.9)), url('/qr_bg.png') center/cover no-repeat;
            color: #ffffff;
            text-align: center;
            position: relative;
            box-sizing: border-box;
          }

          .panel-front {
            height: 6.0in;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 35px 20px;
            background: linear-gradient(rgba(186, 24, 27, 0.75), rgba(120, 10, 15, 0.9)), url('/qr_bg.png') center/cover no-repeat;
            color: #ffffff;
            text-align: center;
            position: relative;
            box-sizing: border-box;
          }

          .panel-flap-bottom {
            height: 2.5in;
            background-color: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 15px;
            color: #64748b;
          }

          /* Logo & Name elements */
          .logo-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
          .cafe-logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            object-fit: cover;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          }
          .logo-fallback {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.15);
            border: 2px dashed rgba(255, 255, 255, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-fallback svg {
            color: #ffffff;
          }
          .restaurant-name {
            font-size: 22px;
            font-weight: 800;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff;
          }
          .restaurant-tagline {
            font-size: 10px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.85);
            margin: 1px 0 0 0;
            letter-spacing: 1.5px;
            text-transform: uppercase;
          }

          /* Table Badge */
          .table-badge {
            background-color: #ffffff;
            color: #ba181b;
            font-weight: 800;
            font-size: 13px;
            padding: 6px 18px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            text-align: center;
            display: inline-block;
            margin: 8px 0;
          }

          /* QR Code Elements */
          .qr-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 8px 0;
          }
          .qr-frame {
            background-color: #ffffff;
            padding: 12px;
            border-radius: 16px;
            border: 4px solid #ba181b;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            display: inline-block;
          }
          .qr-frame img {
            display: block;
          }

          /* Brand Footer */
          .brand-footer {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: auto;
            background-color: #ffffff;
            padding: 6px 18px;
            border-radius: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .dinedash-logo {
            height: 20px;
            width: auto;
            object-fit: contain;
          }
          .footer-tagline {
            font-size: 9px;
            font-weight: 800;
            color: #ba181b;
            letter-spacing: 1px;
            text-transform: uppercase;
            border-left: 1px solid #cbd5e1;
            padding-left: 8px;
          }

          /* Assembly Indicators */
          .assembly-text {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .glue-guide {
            font-size: 8px;
            color: #64748b;
            border: 1px dashed #cbd5e1;
            padding: 4px 10px;
            border-radius: 4px;
            background-color: #ffffff;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          @media print {
            @page {
              size: 5.0in 17.0in;
              margin: 0;
            }
            body {
              background-color: #ffffff !important;
              padding: 0;
              margin: 0;
            }
            .tent-container {
              box-shadow: none !important;
              border: none !important;
              width: 5.0in !important;
              height: 17.0in !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .panel-back, .panel-front {
              background: linear-gradient(rgba(186, 24, 27, 0.75), rgba(120, 10, 15, 0.9)), url('/qr_bg.png') center/cover no-repeat !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .panel-flap-top, .panel-flap-bottom {
              background-color: #f8fafc !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="tent-container">
          <!-- TOP FLAP (2.5in) -->
          <div class="panel-flap-top">
            <span class="assembly-text">Top Flap</span>
            <div class="glue-guide">FOLD BACK & JOIN WITH BOTTOM FLAP</div>
          </div>
          
          <!-- SCORE LINE -->
          <div class="score-line">
            <span class="score-label">Fold Line</span>
          </div>

          <!-- BACK PANEL (6.0in) - Rotated 180° -->
          <div class="panel-back">
            <div class="logo-wrapper">
              ${restaurant?.logo_url ? `
                <img class="cafe-logo" src="${restaurant.logo_url}" />
              ` : `
                <div class="logo-fallback">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2v6c0 2.2 1.8 4 4 4v10h4V12c2.2 0 4-1.8 4-4V2"></path>
                    <path d="M9 2v4M15 2v4M12 2v4"></path>
                  </svg>
                </div>
              `}
              <h1 class="restaurant-name">${restaurant?.name || 'Dine Dash Bistro'}</h1>
              <p class="restaurant-tagline">Dine-in Menu</p>
            </div>

            <div class="table-badge">
              Table ${tableNumber}
            </div>

            <div class="qr-wrapper">
              <div class="qr-frame">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="220" height="220" />
              </div>
            </div>

            <div class="brand-footer">
              <img class="dinedash-logo" src="${logoRed}" />
              <div class="footer-tagline">Scan &amp; Order</div>
            </div>
          </div>

          <!-- CENTER SCORE LINE (Top of the tent) -->
          <div class="score-line center-score">
            <span class="score-label">Top Fold</span>
          </div>

          <!-- FRONT PANEL (6.0in) -->
          <div class="panel-front">
            <div class="logo-wrapper">
              ${restaurant?.logo_url ? `
                <img class="cafe-logo" src="${restaurant.logo_url}" />
              ` : `
                <div class="logo-fallback">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2v6c0 2.2 1.8 4 4 4v10h4V12c2.2 0 4-1.8 4-4V2"></path>
                    <path d="M9 2v4M15 2v4M12 2v4"></path>
                  </svg>
                </div>
              `}
              <h1 class="restaurant-name">${restaurant?.name || 'Dine Dash Bistro'}</h1>
              <p class="restaurant-tagline">Dine-in Menu</p>
            </div>

            <div class="table-badge">
              Table ${tableNumber}
            </div>

            <div class="qr-wrapper">
              <div class="qr-frame">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="220" height="220" />
              </div>
            </div>

            <div class="brand-footer">
              <img class="dinedash-logo" src="${logoRed}" />
              <div class="footer-tagline">Scan &amp; Order</div>
            </div>
          </div>

          <!-- SCORE LINE -->
          <div class="score-line">
            <span class="score-label">Fold Line</span>
          </div>

          <!-- BOTTOM FLAP (2.5in) -->
          <div class="panel-flap-bottom">
            <span class="assembly-text">Bottom Flap</span>
            <div class="glue-guide">FOLD BACK & JOIN WITH TOP FLAP</div>
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
  
  const tableNumber = (table) => String(table.table_number).toLowerCase().startsWith('table')
    ? String(table.table_number).substring(5).trim()
    : table.table_number;

  let cardsHtml = ''
  tables.forEach(table => {
    cardsHtml += `
      <div class="tent-container">
        <!-- TOP FLAP (2.5in) -->
        <div class="panel-flap-top">
          <span class="assembly-text">Top Flap</span>
          <div class="glue-guide">FOLD BACK & JOIN WITH BOTTOM FLAP</div>
        </div>
        
        <!-- SCORE LINE -->
        <div class="score-line">
          <span class="score-label">Fold Line</span>
        </div>

        <!-- BACK PANEL (6.0in) - Rotated 180° -->
        <div class="panel-back">
          <div class="logo-wrapper">
            ${restaurant?.logo_url ? `
              <img class="cafe-logo" src="${restaurant.logo_url}" />
            ` : `
              <div class="logo-fallback">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2v6c0 2.2 1.8 4 4 4v10h4V12c2.2 0 4-1.8 4-4V2"></path>
                  <path d="M9 2v4M15 2v4M12 2v4"></path>
                </svg>
              </div>
            `}
            <h1 class="restaurant-name">${restaurant?.name || 'Dine Dash Bistro'}</h1>
            <p class="restaurant-tagline">Dine-in Menu</p>
          </div>

          <div class="table-badge">
            Table ${tableNumber(table)}
          </div>

          <div class="qr-wrapper">
            <div class="qr-frame">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="220" height="220" />
            </div>
          </div>

          <div class="brand-footer">
            <img class="dinedash-logo" src="${logoRed}" />
            <div class="footer-tagline">Scan &amp; Order</div>
          </div>
        </div>

        <!-- CENTER SCORE LINE (Top of the tent) -->
        <div class="score-line center-score">
          <span class="score-label">Top Fold</span>
        </div>

        <!-- FRONT PANEL (6.0in) -->
        <div class="panel-front">
          <div class="logo-wrapper">
            ${restaurant?.logo_url ? `
              <img class="cafe-logo" src="${restaurant.logo_url}" />
            ` : `
              <div class="logo-fallback">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ba181b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2v6c0 2.2 1.8 4 4 4v10h4V12c2.2 0 4-1.8 4-4V2"></path>
                  <path d="M9 2v4M15 2v4M12 2v4"></path>
                </svg>
              </div>
            `}
            <h1 class="restaurant-name">${restaurant?.name || 'Dine Dash Bistro'}</h1>
            <p class="restaurant-tagline">Dine-in Menu</p>
          </div>

          <div class="table-badge">
            Table ${tableNumber(table)}
          </div>

          <div class="qr-wrapper">
            <div class="qr-frame">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="220" height="220" />
            </div>
          </div>

          <div class="brand-footer">
            <img class="dinedash-logo" src="${logoRed}" />
            <div class="footer-tagline">Scan &amp; Order</div>
          </div>
        </div>

        <!-- SCORE LINE -->
        <div class="score-line">
          <span class="score-label">Fold Line</span>
        </div>

        <!-- BOTTOM FLAP (2.5in) -->
        <div class="panel-flap-bottom">
          <span class="assembly-text">Bottom Flap</span>
          <div class="glue-guide">FOLD BACK & JOIN WITH TOP FLAP</div>
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
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f3f4f6;
          }
          .page-container {
            display: flex;
            flex-wrap: wrap;
            gap: 40px;
            justify-content: center;
          }
          .tent-container {
            width: 5.0in;
            height: 17.0in;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 15px 35px rgba(0,0,0,0.05);
            border: 1px solid #cbd5e1;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Fold Score Lines */
          .score-line {
            width: 100%;
            height: 0;
            position: relative;
            text-align: center;
            z-index: 20;
          }
          .score-line::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            border-top: 1.5px dashed #cbd5e1;
          }
          .score-label {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 1px 8px;
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 1px;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .center-score::after {
            border-top: 2px dashed #ffffff;
          }
          .center-score .score-label {
            color: #ba181b;
            border: 1px solid #ffffff;
            background-color: #ffffff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }

          /* Panel Sections */
          .panel-flap-top {
            height: 2.5in;
            background-color: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 15px;
            color: #64748b;
          }
          
          .panel-back {
            height: 6.0in;
            transform: rotate(180deg);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 30px 20px;
            background: linear-gradient(rgba(186, 24, 27, 0.75), rgba(120, 10, 15, 0.9)), url('/qr_bg.png') center/cover no-repeat;
            color: #ffffff;
            text-align: center;
            position: relative;
            box-sizing: border-box;
          }

          .panel-front {
            height: 6.0in;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 30px 20px;
            background: linear-gradient(rgba(186, 24, 27, 0.75), rgba(120, 10, 15, 0.9)), url('/qr_bg.png') center/cover no-repeat;
            color: #ffffff;
            text-align: center;
            position: relative;
            box-sizing: border-box;
          }

          .panel-flap-bottom {
            height: 2.5in;
            background-color: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 15px;
            color: #64748b;
          }

          /* Logo & Name elements */
          .logo-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
          .cafe-logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            object-fit: cover;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          }
          .logo-fallback {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.15);
            border: 2px dashed rgba(255, 255, 255, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-fallback svg {
            color: #ffffff;
          }
          .restaurant-name {
            font-size: 22px;
            font-weight: 800;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff;
          }
          .restaurant-tagline {
            font-size: 10px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.85);
            margin: 1px 0 0 0;
            letter-spacing: 1.5px;
            text-transform: uppercase;
          }

          /* Table Badge */
          .table-badge {
            background-color: #ffffff;
            color: #ba181b;
            font-weight: 800;
            font-size: 13px;
            padding: 6px 18px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            text-align: center;
            display: inline-block;
            margin: 8px 0;
          }

          /* QR Code Elements */
          .qr-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 8px 0;
          }
          .qr-frame {
            background-color: #ffffff;
            padding: 12px;
            border-radius: 16px;
            border: 4px solid #ba181b;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            display: inline-block;
          }
          .qr-frame img {
            display: block;
          }

          /* Brand Footer */
          .brand-footer {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: auto;
            background-color: #ffffff;
            padding: 6px 18px;
            border-radius: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .dinedash-logo {
            height: 20px;
            width: auto;
            object-fit: contain;
          }
          .footer-tagline {
            font-size: 9px;
            font-weight: 800;
            color: #ba181b;
            letter-spacing: 1px;
            text-transform: uppercase;
            border-left: 1px solid #cbd5e1;
            padding-left: 8px;
          }

          /* Assembly Indicators */
          .assembly-text {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .glue-guide {
            font-size: 8px;
            color: #64748b;
            border: 1px dashed #cbd5e1;
            padding: 4px 10px;
            border-radius: 4px;
            background-color: #ffffff;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          @media print {
            @page {
              size: 5.0in 17.0in;
              margin: 0;
            }
            body {
              background-color: #ffffff !important;
              padding: 0;
              margin: 0;
            }
            .page-container {
              padding: 0;
              gap: 0;
            }
            .tent-container {
              box-shadow: none !important;
              border: none !important;
              width: 5.0in !important;
              height: 17.0in !important;
              page-break-after: always;
              break-after: always;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .panel-back, .panel-front {
              background: linear-gradient(rgba(186, 24, 27, 0.75), rgba(120, 10, 15, 0.9)), url('/qr_bg.png') center/cover no-repeat !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .panel-flap-top, .panel-flap-bottom {
              background-color: #f8fafc !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
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
