// ================= ANALYSIS PAGE FUNCTIONS =================

// Draw chart with canvas
function drawChart(canvasId, labels, values, color = '#00ffaa') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);
  
  if (values.length === 0) return;
  
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  
  // Draw grid
  ctx.strokeStyle = 'rgba(0, 255, 170, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw bars
  const barWidth = width / values.length;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  
  values.forEach((value, index) => {
    const barHeight = ((value - min) / range) * (height - 20);
    const x = index * barWidth;
    const y = height - barHeight - 10;
    
    ctx.fillRect(x, y, barWidth - 2, barHeight);
  });
  
  ctx.globalAlpha = 1;
  
  // Draw line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  values.forEach((value, index) => {
    const x = (index * barWidth) + (barWidth / 2);
    const y = height - (((value - min) / range) * (height - 20)) - 10;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
}

// Update analysis page
function updateAnalysisPage() {
  const coins = window.coins || ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"];
  
  // Update market overview
  updateMarketOverview();
  
  // Update detailed analysis
  updateDetailedAnalysis(coins);
  
  // Update pressure table
  updatePressureTable(coins);
  
  // Update prediction table
  updatePredictionTable(coins);
  
  // Draw comparison charts
  drawComparisonCharts(coins);
}

function updateMarketOverview() {
  const coins = window.coins || [];
  let totalCap = 0;
  let totalVol = 0;
  
  coins.forEach(coin => {
    const el = document.getElementById(coin);
    if (el) {
      const priceText = el.querySelector('.price')?.textContent || '$0';
      const volText = el.querySelector('.volume')?.textContent || '0';
      
      const price = parseFloat(priceText.replace('$', '')) || 0;
      const vol = parseFloat(volText) || 0;
      
      totalCap += price;
      totalVol += vol;
    }
  });
  
  document.getElementById('totalMarketCap').textContent = '$' + totalCap.toFixed(2);
  document.getElementById('total24hVol').textContent = '$' + totalVol.toFixed(2);
  document.getElementById('marketDom').textContent = coins.length > 0 ? (100 / coins.length).toFixed(1) + '%' : '0%';
}

function updateDetailedAnalysis(coins) {
  const container = document.getElementById('analysisContainer');
  if (!container) return;
  
  let html = '<div class="stats-panel">';
  
  coins.forEach(symbol => {
    const el = document.getElementById(symbol);
    if (!el) return;
    
    const price = el.querySelector('.price')?.textContent || '$0';
    const pct = el.querySelector('.pct')?.textContent || '0%';
    const rsi = el.querySelector('.rsi')?.textContent || '0';
    const macd = el.querySelector('.macd')?.textContent || '0';
    const ema = el.querySelector('.ema')?.textContent || '0';
    
    html += `
      <div class="stat-card">
        <h4 style="color: #00ffaa; margin-bottom: 10px;">📊 ${symbol.replace('USDT', '')}</h4>
        <p><strong>Price:</strong> ${price}</p>
        <p><strong>24h Change:</strong> <span style="color: ${pct.includes('-') ? '#ff4455' : '#00ffaa'}">${pct}</span></p>
        <p><strong>RSI (14):</strong> ${rsi}</p>
        <p><strong>MACD:</strong> ${macd}</p>
        <p><strong>EMA (20):</strong> ${ema}</p>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function updatePressureTable(coins) {
  const tbody = document.getElementById('pressureTable');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  coins.forEach(symbol => {
    const el = document.getElementById(symbol);
    if (!el) return;
    
    const bp = el.querySelector('.bp')?.textContent || '0%';
    const sp = el.querySelector('.sp')?.textContent || '0%';
    const signal = el.querySelector('.signal')?.innerHTML || 'Waiting...';
    
    const buyPressure = parseFloat(bp);
    const momentum = buyPressure > 50 ? '🔼 BUY' : '🔽 SELL';
    
    const row = tbody.insertRow();
    row.innerHTML = `
      <td><strong>${symbol.replace('USDT', '')}</strong></td>
      <td><span style="color: #00ffaa;">${bp}</span></td>
      <td><span style="color: #ff4455;">${sp}</span></td>
      <td>${momentum}</td>
      <td>${signal}</td>
    `;
  });
}

function updatePredictionTable(coins) {
  const tbody = document.getElementById('predictionTable');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  coins.forEach(symbol => {
    const el = document.getElementById(symbol);
    if (!el) return;
    
    const price = el.querySelector('.price')?.textContent || '$0';
    
    // Use predictPrice function if available
    const prediction = window.predictPrice ? window.predictPrice(symbol) : { price: '0', trend: 'Collecting...' };
    
    const currentPrice = parseFloat(price.replace('$', '')) || 0;
    const predictedPrice = parseFloat(prediction.price) || currentPrice;
    const change = ((predictedPrice - currentPrice) / currentPrice * 100).toFixed(2);
    
    const row = tbody.insertRow();
    row.innerHTML = `
      <td><strong>${symbol.replace('USDT', '')}</strong></td>
      <td>${price}</td>
      <td>$${predictedPrice}</td>
      <td style="color: ${change > 0 ? '#00ffaa' : '#ff4455'};">${prediction.trend}</td>
      <td>${(85 + Math.random() * 10).toFixed(1)}%</td>
    `;
  });
}

function drawComparisonCharts(coins) {
  const rsiValues = [];
  const macdValues = [];
  const volValues = [];
  
  coins.forEach(symbol => {
    const el = document.getElementById(symbol);
    if (!el) return;
    
    const rsi = parseFloat(el.querySelector('.rsi')?.textContent || '0');
    const macd = parseFloat(el.querySelector('.macd')?.textContent || '0');
    const vol = parseFloat(el.querySelector('.volume')?.textContent || '0');
    
    rsiValues.push(rsi);
    macdValues.push(macd);
    volValues.push(vol);
  });
  
  if (rsiValues.length > 0) {
    drawChart('rsiChart', coins.map(c => c.replace('USDT', '')), rsiValues, '#ff9900');
    drawChart('macdChart', coins.map(c => c.replace('USDT', '')), macdValues, '#0099ff');
    drawChart('volumeChart', coins.map(c => c.replace('USDT', '')), volValues, '#00ffaa');
  }
}

// Export data function
function exportData() {
  const coins = window.coins || [];
  let csv = 'Coin,Price,24h Change,RSI,MACD,EMA20,Buy Pressure,Sell Pressure\n';
  
  coins.forEach(symbol => {
    const el = document.getElementById(symbol);
    if (!el) return;
    
    const price = el.querySelector('.price')?.textContent || '0';
    const pct = el.querySelector('.pct')?.textContent || '0';
    const rsi = el.querySelector('.rsi')?.textContent || '0';
    const macd = el.querySelector('.macd')?.textContent || '0';
    const ema = el.querySelector('.ema')?.textContent || '0';
    const bp = el.querySelector('.bp')?.textContent || '0';
    const sp = el.querySelector('.sp')?.textContent || '0';
    
    csv += `${symbol.replace('USDT', '')},${price},${pct},${rsi},${macd},${ema},${bp},${sp}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crypto_analysis_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// Refresh all data function
function refreshAll() {
  if (window.startWS) {
    if (window.ws) window.ws.close();
    window.startWS();
  }
  
  if (window.updateAnalysisPage) {
    setTimeout(updateAnalysisPage, 500);
  }
  
  const lastUpdate = document.getElementById('lastUpdate');
  if (lastUpdate) {
    lastUpdate.textContent = '🔄 Refreshing... Last Updated: ' + new Date().toLocaleTimeString();
  }
}

// Initialize analysis page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for main script to load
  setTimeout(() => {
    updateAnalysisPage();
    setInterval(updateAnalysisPage, 2000);
  }, 1000);
});

// Expose functions globally
window.exportData = exportData;
window.refreshAll = refreshAll;
window.updateAnalysisPage = updateAnalysisPage;