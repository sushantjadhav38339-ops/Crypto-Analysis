const coins = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"];
let ws, prevVol = {}, trends = {}, prices = {};
const MAX_DATA = 80;

// ================= UI =================
function buildUI() {
  const dash = document.getElementById("dashboard");
  dash.innerHTML = "";

  coins.forEach(c => {
    trends[c] = [];

    dash.innerHTML += `
      <div class="coin" id="${c}">
        <h2>${c.replace("USDT","")}</h2>

        <div class="metric">Price: <span class="price">$0</span></div>
        <div class="metric">Volume: <span class="volume">0</span></div>
        <div class="metric">24h %: <span class="pct">0%</span></div>

        <div class="metric">Signal: <span class="signal">Waiting...</span></div>
        <div class="metric">Trend: <span class="trendPred"></span></div>

        <div class="metric">RSI: <span class="rsi">0</span></div>
        <div class="metric">MACD: <span class="macd">0</span></div>
        <div class="metric">EMA20: <span class="ema">0</span></div>

        <span class="alertSpike">🔔 Spike!</span><br><br>

        <canvas id="chart-${c}" width="200" height="60"></canvas>
        <div id="tv-${c}" style="height:200px;width:100%;margin-top:10px;"></div>

        <div class="metric">Buy Pressure: <span class="bp">0%</span></div>
        <div class="metric">Sell Pressure: <span class="sp">0%</span></div>
      </div>
    `;

    initTV(c);
  });
}

// ================= TradingView =================
function initTV(symbol) {
  new TradingView.widget({
    container_id: `tv-${symbol}`,
    width: "100%",
    height: 200,
    symbol: "BINANCE:" + symbol,
    interval: "15",
    theme: "dark",
    style: "1",
    hide_side_toolbar: true,
  });
}

// ================= Indicators =================
function calcEMA(data, length = 20) {
  if (data.length < length) return 0;
  let k = 2 / (length + 1);
  let ema = data[0];
  for (let i=1;i<data.length;i++) ema = data[i] * k + ema * (1 - k);
  return ema.toFixed(2);
}

function calcRSI(data, length = 14) {
  if (data.length < length) return 0;
  let gains = 0, losses = 0;

  for (let i = data.length - length; i < data.length; i++) {
    let diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let RS = gains / (losses || 1);
  return (100 - 100 / (1 + RS)).toFixed(2);
}

function calcMACD(data) {
  if (data.length < 26) return 0;
  let ema12 = calcEMA(data, 12);
  let ema26 = calcEMA(data, 26);
  return (ema12 - ema26).toFixed(2);
}

// ================= Trend =================
function trendPred(arr) {
  if (arr.length < 10) return "Collecting...";
  let slope = arr[arr.length - 1] - arr[arr.length - 10];
  return slope > 0 ? "UP 🔼" : "DOWN 🔽";
}

// ================= Chart =================
function drawTrend(symbol) {
  const canvas = document.getElementById("chart-" + symbol);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0,0,200,60);
  let arr = trends[symbol];
  if (arr.length < 2) return;

  let max = Math.max(...arr);
  let min = Math.min(...arr);

  ctx.beginPath();

  arr.forEach((v,i)=>{
    let x = (i/(arr.length-1))*200;
    let y = 60 - ((v-min)/(max-min))*60;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });

  ctx.strokeStyle = "#00ffaa";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ================= API =================
async function fetchOrderBook(symbol) {
  const r = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=5`);
  const json = await r.json();

  let buy = json.bids.reduce((a,b)=> a + parseFloat(b[1]), 0);
  let sell = json.asks.reduce((a,b)=> a + parseFloat(b[1]), 0);

  return { buy, sell };
}

// ================= Update =================
async function updateCoin(symbol, data) {
  let coin = document.getElementById(symbol);

  let price = parseFloat(data.c);
  let vol = parseFloat(data.v);

  trends[symbol].push(price);
  if (trends[symbol].length > MAX_DATA) trends[symbol].shift();

  coin.querySelector(".price").textContent = "$" + price;
  coin.querySelector(".volume").textContent = vol;
  coin.querySelector(".pct").textContent = data.P + "%";

  let momentum = vol > (prevVol[symbol] || 1) ? "BUY" : "SELL";

  coin.querySelector(".signal").innerHTML =
    momentum === "BUY"
      ? "<span class='buy'>BUY 📈</span>"
      : "<span class='sell'>SELL 📉</span>";

  prevVol[symbol] = vol;

  coin.querySelector(".ema").textContent = calcEMA(trends[symbol]);
  coin.querySelector(".rsi").textContent = calcRSI(trends[symbol]);
  coin.querySelector(".macd").textContent = calcMACD(trends[symbol]);
  coin.querySelector(".trendPred").textContent = trendPred(trends[symbol]);

  drawTrend(symbol);

  const depth = await fetchOrderBook(symbol);
  let buyP = ((depth.buy / (depth.buy + depth.sell)) * 100).toFixed(1);

  coin.querySelector(".bp").textContent = buyP + "%";
  coin.querySelector(".sp").textContent = (100 - buyP).toFixed(1) + "%";
}

// ================= WebSocket =================
function startWS() {
  if (ws) ws.close();

  const streams = coins.map(c => c.toLowerCase() + "@ticker").join("/");
  ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=" + streams);

  ws.onmessage = e => {
    let msg = JSON.parse(e.data);
    const symbol = msg.stream.split("@")[0].toUpperCase();

    updateCoin(symbol, msg.data);
    detectVolumeSpikes();

    document.getElementById("lastUpdate").textContent =
      "Last Updated: " + new Date().toLocaleTimeString();
  };
}

function toggleWS() {
  if (ws) ws.close();
  else startWS();
}

// ================= Theme =================
function toggleTheme() {
  document.body.classList.toggle("light");
}

// ================= INIT =================
buildUI();
startWS();
// ================= AI PREDICTION =================
function predictPrice(symbol) {
  let data = trends[symbol];
  if (data.length < 20) return { price: "0", trend: "Collecting..." };

  let last = data[data.length - 1];
  let prev = data[data.length - 5];

  let rsi = parseFloat(calcRSI(data));
  let ema = parseFloat(calcEMA(data));

  // Trend strength
  let momentum = last - prev;

  // Simple AI logic
  let predicted;

  if (momentum > 0 && rsi < 70 && last > ema) {
    predicted = last + (momentum * 0.5);
    return { price: predicted.toFixed(2), trend: "Bullish 🚀" };
  }
  else if (momentum < 0 && rsi > 30 && last < ema) {
    predicted = last - (Math.abs(momentum) * 0.5);
    return { price: predicted.toFixed(2), trend: "Bearish 🔻" };
  }
  else {
    return { price: last.toFixed(2), trend: "Sideways ⚖️" };
  }
}

// ================= EXPORT DATA =================
function exportData() {
  let csv = "Coin,Price,24h Change,Volume,RSI,MACD,EMA20,Buy Pressure,Sell Pressure,Trend\n";
  
  coins.forEach(symbol => {
    const coin = document.getElementById(symbol);
    if (!coin) return;
    
    const price = coin.querySelector(".price")?.textContent || "$0";
    const pct = coin.querySelector(".pct")?.textContent || "0%";
    const volume = coin.querySelector(".volume")?.textContent || "0";
    const rsi = coin.querySelector(".rsi")?.textContent || "0";
    const macd = coin.querySelector(".macd")?.textContent || "0";
    const ema = coin.querySelector(".ema")?.textContent || "0";
    const bp = coin.querySelector(".bp")?.textContent || "0%";
    const sp = coin.querySelector(".sp")?.textContent || "0%";
    const trend = coin.querySelector(".trendPred")?.textContent || "Collecting...";
    
    csv += `${symbol},${price},${pct},${volume},${rsi},${macd},${ema},${bp},${sp},"${trend}"\n`;
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `crypto_analysis_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ================= REFRESH ALL =================
function refreshAll() {
  if (ws) ws.close();
  startWS();
  
  document.getElementById("lastUpdate").textContent = "🔄 Refreshing... Last Updated: " + new Date().toLocaleTimeString();
  
  setTimeout(() => {
    coins.forEach(symbol => {
      fetchOrderBook(symbol);
    });
  }, 500);
}

// ================= STATISTICS =================
function getMarketStats() {
  let stats = {
    totalVolume: 0,
    averagePrice: 0,
    highestPrice: 0,
    lowestPrice: Infinity,
    bullishCoins: 0,
    bearishCoins: 0
  };
  
  coins.forEach(symbol => {
    const coin = document.getElementById(symbol);
    if (!coin) return;
    
    const price = parseFloat(coin.querySelector(".price")?.textContent.replace("$", "") || 0);
    const volume = parseFloat(coin.querySelector(".volume")?.textContent || 0);
    const trend = coin.querySelector(".trendPred")?.textContent || "";
    
    stats.totalVolume += volume;
    stats.averagePrice += price;
    stats.highestPrice = Math.max(stats.highestPrice, price);
    stats.lowestPrice = Math.min(stats.lowestPrice, price);
    
    if (trend.includes("UP")) stats.bullishCoins++;
    if (trend.includes("DOWN")) stats.bearishCoins++;
  });
  
  stats.averagePrice /= coins.length || 1;
  return stats;
}

// ================= VOLUME SPIKE DETECTOR =================
let previousVolumes = {};

function detectVolumeSpikes() {
  coins.forEach(symbol => {
    const coin = document.getElementById(symbol);
    if (!coin) return;
    
    const currentVol = parseFloat(coin.querySelector(".volume")?.textContent || 0);
    const previousVol = previousVolumes[symbol] || currentVol;
    
    if (previousVol > 0) {
      const spikePercent = ((currentVol - previousVol) / previousVol) * 100;
      
      if (spikePercent > 50) {
        const spike = coin.querySelector(".alertSpike");
        if (spike) {
          spike.classList.add("show");
          spike.style.opacity = "1";
          setTimeout(() => {
            spike.style.opacity = "0";
            setTimeout(() => spike.classList.remove("show"), 300);
          }, 2000);
        }
      }
    }
    
    previousVolumes[symbol] = currentVol;
  });
}