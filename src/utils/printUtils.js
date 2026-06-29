export const handlePrintCard = (table, restaurant) => {
  const printWindow = window.open('', '_blank')
  
  const addressObj = restaurant?.Address || {};
  const addressParts = [
    addressObj.street_address,
    addressObj.area_locality,
    addressObj.city,
    addressObj.state,
    addressObj.pincode
  ].filter(Boolean);
  const formattedAddress = addressParts.join(', ');
  
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
            width: 4.25in;
            height: 17.0in;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
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
            background-color: #f8fafc;
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
            border-top: 2px dashed #ba181b;
          }
          .center-score .score-label {
            color: #ba181b;
            border: 1px solid #fecaca;
            background-color: #fef2f2;
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
            padding: 25px 30px;
            background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.85)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop') center/cover no-repeat;
            color: #ffffff;
            text-align: center;
            position: relative;
          }

          .panel-front {
            height: 6.0in;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            position: relative;
            background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.85)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop') center/cover no-repeat;
            color: #ffffff;
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

          /* Front Panel Elements */
          .front-header {
            width: 100%;
            height: 1.8in;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px 16px 8px 16px;
            color: #ffffff;
            text-align: center;
          }
          
          .cafe-logo {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.85);
            object-fit: cover;
            margin-bottom: 6px;
          }
          
          .logo-fallback {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.15);
            border: 1px dashed rgba(255, 255, 255, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 6px;
          }

          .restaurant-name {
            font-size: 18px;
            font-weight: 800;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff;
          }

          .restaurant-tagline {
            font-size: 9px;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.7);
            margin: 2px 0 0 0;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .table-badge {
            display: inline-block;
            background-color: #ba181b;
            color: #ffffff;
            font-weight: 800;
            font-size: 12px;
            padding: 5px 14px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: -12px;
            z-index: 10;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            text-align: center;
          }

          .front-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px 20px;
            width: 100%;
          }

          .cta-title {
            font-weight: 900;
            font-size: 14px;
            color: #ffffff;
            margin: 6px 0 8px 0;
            letter-spacing: 1.5px;
            text-align: center;
          }

          .qr-frame {
            background-color: #ffffff;
            padding: 10px;
            border-radius: 12px;
            border: 3.5px solid #ba181b;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            margin-bottom: 12px;
            display: inline-block;
          }

          .qr-frame img {
            display: block;
          }

          .step-guide {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
          }

          .step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          }

          .step-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .step-text {
            font-size: 8px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.9);
            text-transform: uppercase;
          }

          .step-arrow {
            color: rgba(255, 255, 255, 0.4);
            margin-top: -10px;
          }

          /* Back Panel Elements */
          .back-top {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
          
          .back-logo-fallback {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.1);
            border: 1px dashed rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .back-cafe-logo {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.85);
            object-fit: cover;
          }

          .back-restaurant-name {
            font-size: 20px;
            font-weight: 800;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff;
          }

          .back-restaurant-tagline {
            font-size: 9px;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.7);
            margin: 2px 0 0 0;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .back-divider {
            width: 40px;
            height: 2px;
            background-color: #ba181b;
            margin: 10px auto;
          }
          
          .back-qr-wrapper {
            margin: 5px 0 10px 0;
          }
          
          .back-qr-wrapper .qr-frame {
            border-width: 2.5px;
            padding: 8px;
            margin-bottom: 0;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          }

          .back-middle {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }

          .back-info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 9px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.95);
            max-width: 280px;
          }

          .back-info-item svg {
            color: #ba181b;
            flex-shrink: 0;
          }

          .back-bottom {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            padding-top: 10px;
            width: 100%;
          }

          .powered-by {
            font-size: 8px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.5);
          }

          .dinedash-brand {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: 0.5px;
          }

          .dinedash-brand span {
            color: #ba181b;
          }

          .website-link {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.85);
            text-decoration: none;
            font-weight: 600;
            letter-spacing: 0.5px;
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
              size: 4.25in 17.0in;
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
              width: 4.25in !important;
              height: 17.0in !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .panel-back, .panel-front {
              background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.85)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop') center/cover no-repeat !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .table-badge {
              background-color: #ba181b !important;
              color: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .step-icon {
              background-color: rgba(255, 255, 255, 0.15) !important;
              color: #ffffff !important;
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
            <div class="back-top">
              ${restaurant?.logo_url ? `
                <img class="back-cafe-logo" src="${restaurant.logo_url}" />
              ` : `
                <div class="back-logo-fallback">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2v6c0 2.2 1.8 4 4 4v10h4V12c2.2 0 4-1.8 4-4V2"></path>
                    <path d="M9 2v4M15 2v4M12 2v4"></path>
                  </svg>
                </div>
              `}
              <h1 class="back-restaurant-name">${restaurant?.name || 'Dine Dash Bistro'}</h1>
              <p class="back-restaurant-tagline">Thank You For Dining With Us</p>
              <div class="back-divider"></div>
            </div>

            <!-- Centered QR Code on Back Side -->
            <div class="back-qr-wrapper">
              <div class="qr-frame">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="120" height="120" />
              </div>
            </div>

            <div class="back-middle">
              ${restaurant?.phone ? `
                <div class="back-info-item">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>${restaurant.phone}</span>
                </div>
              ` : ''}
              ${formattedAddress ? `
                <div class="back-info-item">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>${formattedAddress}</span>
                </div>
              ` : ''}
            </div>

            <div class="back-bottom">
              <span class="powered-by">Powered by</span>
              <div class="dinedash-brand">Dine<span>Dash</span></div>
              <a href="https://www.dinedash.com" class="website-link" target="_blank">www.dinedash.com</a>
            </div>
          </div>

          <!-- CENTER SCORE LINE (Top of the tent) -->
          <div class="score-line center-score">
            <span class="score-label">Top Fold</span>
          </div>

          <!-- FRONT PANEL (6.0in) -->
          <div class="panel-front">
            <div class="front-header">
              ${restaurant?.logo_url ? `
                <img class="cafe-logo" src="${restaurant.logo_url}" />
              ` : `
                <div class="logo-fallback">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

            <div class="front-body">
              <h2 class="cta-title">SCAN TO ORDER</h2>
              
              <div class="qr-frame">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="150" height="150" />
              </div>

              <div class="step-guide">
                <div class="step">
                  <div class="step-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                  </div>
                  <span class="step-text">1. Scan</span>
                </div>
                
                <div class="step-arrow">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>

                <div class="step">
                  <div class="step-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <span class="step-text">2. Choose</span>
                </div>

                <div class="step-arrow">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>

                <div class="step">
                  <div class="step-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </div>
                  <span class="step-text">3. Enjoy</span>
                </div>
              </div>
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
  
  const addressObj = restaurant?.Address || {};
  const addressParts = [
    addressObj.street_address,
    addressObj.area_locality,
    addressObj.city,
    addressObj.state,
    addressObj.pincode
  ].filter(Boolean);
  const formattedAddress = addressParts.join(', ');

  let cardsHtml = ''
  tables.forEach(table => {
    const tableNumber = String(table.table_number).toLowerCase().startsWith('table')
      ? String(table.table_number).substring(5).trim()
      : table.table_number;

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
          <div class="back-top">
            ${restaurant?.logo_url ? `
              <img class="back-cafe-logo" src="${restaurant.logo_url}" />
            ` : `
              <div class="back-logo-fallback">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2v6c0 2.2 1.8 4 4 4v10h4V12c2.2 0 4-1.8 4-4V2"></path>
                  <path d="M9 2v4M15 2v4M12 2v4"></path>
                </svg>
              </div>
            `}
            <h1 class="back-restaurant-name">${restaurant?.name || 'Dine Dash Bistro'}</h1>
            <p class="back-restaurant-tagline">Thank You For Dining With Us</p>
            <div class="back-divider"></div>
          </div>

          <!-- Centered QR Code on Back Side -->
          <div class="back-qr-wrapper">
            <div class="qr-frame">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="120" height="120" />
            </div>
          </div>

          <div class="back-middle">
            ${restaurant?.phone ? `
              <div class="back-info-item">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>${restaurant.phone}</span>
              </div>
            ` : ''}
            ${formattedAddress ? `
              <div class="back-info-item">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>${formattedAddress}</span>
              </div>
            ` : ''}
          </div>

          <div class="back-bottom">
            <span class="powered-by">Powered by</span>
            <div class="dinedash-brand">Dine<span>Dash</span></div>
            <a href="https://www.dinedash.com" class="website-link" target="_blank">www.dinedash.com</a>
          </div>
        </div>

        <!-- CENTER SCORE LINE (Top of the tent) -->
        <div class="score-line center-score">
          <span class="score-label">Top Fold</span>
        </div>

        <!-- FRONT PANEL (6.0in) -->
        <div class="panel-front">
          <div class="front-header">
            ${restaurant?.logo_url ? `
              <img class="cafe-logo" src="${restaurant.logo_url}" />
            ` : `
              <div class="logo-fallback">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

          <div class="front-body">
            <h2 class="cta-title">SCAN TO ORDER</h2>
            
            <div class="qr-frame">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="150" height="150" />
            </div>

            <div class="step-guide">
              <div class="step">
                <div class="step-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                </div>
                <span class="step-text">1. Scan</span>
              </div>
              
              <div class="step-arrow">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>

              <div class="step">
                <div class="step-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <span class="step-text">2. Choose</span>
              </div>

              <div class="step-arrow">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>

              <div class="step">
                <div class="step-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <span class="step-text">3. Enjoy</span>
              </div>
            </div>
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
            width: 4.25in;
            height: 17.0in;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
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
            background-color: #f8fafc;
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
            border-top: 2px dashed #ba181b;
          }
          .center-score .score-label {
            color: #ba181b;
            border: 1px solid #fecaca;
            background-color: #fef2f2;
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
            padding: 25px 30px;
            background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.85)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop') center/cover no-repeat;
            color: #ffffff;
            text-align: center;
            position: relative;
          }

          .panel-front {
            height: 6.0in;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            position: relative;
            background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.85)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop') center/cover no-repeat;
            color: #ffffff;
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

          /* Front Panel Elements */
          .front-header {
            width: 100%;
            height: 1.8in;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px 16px 8px 16px;
            color: #ffffff;
            text-align: center;
          }
          
          .cafe-logo {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.85);
            object-fit: cover;
            margin-bottom: 6px;
          }
          
          .logo-fallback {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.15);
            border: 1px dashed rgba(255, 255, 255, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 6px;
          }

          .restaurant-name {
            font-size: 18px;
            font-weight: 800;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff;
          }

          .restaurant-tagline {
            font-size: 9px;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.7);
            margin: 2px 0 0 0;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .table-badge {
            display: inline-block;
            background-color: #ba181b;
            color: #ffffff;
            font-weight: 800;
            font-size: 12px;
            padding: 5px 14px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: -12px;
            z-index: 10;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            text-align: center;
          }

          .front-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px 20px;
            width: 100%;
          }

          .cta-title {
            font-weight: 900;
            font-size: 14px;
            color: #ffffff;
            margin: 6px 0 8px 0;
            letter-spacing: 1.5px;
            text-align: center;
          }

          .qr-frame {
            background-color: #ffffff;
            padding: 10px;
            border-radius: 12px;
            border: 3.5px solid #ba181b;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            margin-bottom: 12px;
            display: inline-block;
          }

          .qr-frame img {
            display: block;
          }

          .step-guide {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
          }

          .step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          }

          .step-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .step-text {
            font-size: 8px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.9);
            text-transform: uppercase;
          }

          .step-arrow {
            color: rgba(255, 255, 255, 0.4);
            margin-top: -10px;
          }

          /* Back Panel Elements */
          .back-top {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
          
          .back-logo-fallback {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.1);
            border: 1px dashed rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .back-cafe-logo {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.85);
            object-fit: cover;
          }

          .back-restaurant-name {
            font-size: 20px;
            font-weight: 800;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff;
          }

          .back-restaurant-tagline {
            font-size: 9px;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.7);
            margin: 2px 0 0 0;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .back-divider {
            width: 40px;
            height: 2px;
            background-color: #ba181b;
            margin: 10px auto;
          }
          
          .back-qr-wrapper {
            margin: 5px 0 10px 0;
          }
          
          .back-qr-wrapper .qr-frame {
            border-width: 2.5px;
            padding: 8px;
            margin-bottom: 0;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          }

          .back-middle {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          .back-info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 10px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.95);
            max-width: 280px;
          }

          .back-info-item svg {
            color: #ba181b;
            flex-shrink: 0;
          }

          .back-bottom {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            padding-top: 15px;
            width: 100%;
          }

          .powered-by {
            font-size: 8px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.5);
          }

          .dinedash-brand {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: 0.5px;
          }

          .dinedash-brand span {
            color: #ba181b;
          }

          .website-link {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.85);
            text-decoration: none;
            font-weight: 600;
            letter-spacing: 0.5px;
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
              size: 4.25in 17.0in;
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
              width: 4.25in !important;
              height: 17.0in !important;
              page-break-after: always;
              break-after: always;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .panel-back, .panel-front {
              background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.85)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop') center/cover no-repeat !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .table-badge {
              background-color: #ba181b !important;
              color: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .step-icon {
              background-color: rgba(255, 255, 255, 0.15) !important;
              color: #ffffff !important;
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
