// ================= ADVANCED TRADER FEATURES =================

// Real-time order management
class TraderBot {
  constructor() {
    this.positions = JSON.parse(localStorage.getItem('traderPositions')) || [];
    this.orders = JSON.parse(localStorage.getItem('traderOrders')) || [];
    this.watchlist = JSON.parse(localStorage.getItem('traderWatchlist')) || [];
  }

  // Add market order
  addMarketOrder(symbol, side, quantity, price) {
    const order = {
      id: Date.now(),
      symbol,
      side, // 'BUY' or 'SELL'
      quantity,
      price,
      type: 'MARKET',
      status: 'FILLED',
      timestamp: new Date().toISOString(),
      commission: price * quantity * 0.001 // 0.1% fee
    };
    this.orders.push(order);
    this.saveOrders();
    return order;
  }

  // Add limit order
  addLimitOrder(symbol, side, quantity, limitPrice) {
    const order = {
      id: Date.now(),
      symbol,
      side,
      quantity,
      limitPrice,
      type: 'LIMIT',
      status: 'OPEN',
      timestamp: new Date().toISOString(),
      filledQuantity: 0
    };
    this.orders.push(order);
    this.saveOrders();
    return order;
  }

  // Open position
  openPosition(symbol, side, quantity, entryPrice, stopLoss, takeProfit) {
    const position = {
      id: Date.now(),
      symbol,
      side, // 'LONG' or 'SHORT'
      quantity,
      entryPrice,
      stopLoss,
      takeProfit,
      status: 'OPEN',
      openTime: new Date().toISOString(),
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0
    };
    this.positions.push(position);
    this.savePositions();
    return position;
  }

  // Close position
  closePosition(positionId, exitPrice) {
    const pos = this.positions.find(p => p.id === positionId);
    if (!pos) return null;

    const pnl = pos.side === 'LONG' 
      ? (exitPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - exitPrice) * pos.quantity;

    pos.exitPrice = exitPrice;
    pos.status = 'CLOSED';
    pos.closeTime = new Date().toISOString();
    pos.realizedPnl = pnl;
    pos.realizedPnlPercent = ((pnl / (pos.entryPrice * pos.quantity)) * 100);

    this.savePositions();
    return pos;
  }

  // Update position
  updatePosition(positionId, currentPrice) {
    const pos = this.positions.find(p => p.id === positionId && p.status === 'OPEN');
    if (!pos) return null;

    const pnl = pos.side === 'LONG'
      ? (currentPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - currentPrice) * pos.quantity;

    pos.unrealizedPnl = pnl;
    pos.unrealizedPnlPercent = ((pnl / (pos.entryPrice * pos.quantity)) * 100);
    return pos;
  }

  savePositions() {
    localStorage.setItem('traderPositions', JSON.stringify(this.positions));
  }

  saveOrders() {
    localStorage.setItem('traderOrders', JSON.stringify(this.orders));
  }

  addToWatchlist(symbol) {
    if (!this.watchlist.includes(symbol)) {
      this.watchlist.push(symbol);
      localStorage.setItem('traderWatchlist', JSON.stringify(this.watchlist));
    }
  }
}

// ================= ADVANCED SIGNAL GENERATION =================

class AdvancedSignalGenerator {
  static generateSignal(symbol, data) {
    const signals = {
      trend: this.analyzeTrend(data),
      momentum: this.analyzeMomentum(data),
      volatility: this.analyzeVolatility(data),
      support_resistance: this.findSupportResistance(data),
      breakout_potential: this.detectBreakout(data),
      pullback_potential: this.detectPullback(data)
    };

    return {
      ...signals,
      composite_score: this.calculateCompositeScore(signals),
      recommendation: this.generateRecommendation(signals)
    };
  }

  static analyzeTrend(data) {
    // Simple trend analysis using moving averages
    const prices = data.prices || [];
    if (prices.length < 20) return 'INSUFFICIENT_DATA';

    const ma20 = prices.slice(-20).reduce((a, b) => a + b) / 20;
    const ma50 = prices.length >= 50 ? prices.slice(-50).reduce((a, b) => a + b) / 50 : ma20;

    const currentPrice = prices[prices.length - 1];
    
    if (currentPrice > ma20 && ma20 > ma50) return 'STRONG_UPTREND';
    if (currentPrice > ma20) return 'UPTREND';
    if (currentPrice < ma20 && ma20 < ma50) return 'STRONG_DOWNTREND';
    if (currentPrice < ma20) return 'DOWNTREND';
    return 'SIDEWAYS';
  }

  static analyzeMomentum(data) {
    const rsi = data.rsi || 50;
    const macd = data.macd || 0;

    if (rsi > 70 && macd > 0) return 'STRONG_BULLISH';
    if (rsi > 60) return 'BULLISH';
    if (rsi < 30 && macd < 0) return 'STRONG_BEARISH';
    if (rsi < 40) return 'BEARISH';
    return 'NEUTRAL';
  }

  static analyzeVolatility(data) {
    const volatility = data.volatility || 0;
    if (volatility > 50) return 'HIGH_VOLATILITY';
    if (volatility > 30) return 'MEDIUM_VOLATILITY';
    return 'LOW_VOLATILITY';
  }

  static findSupportResistance(data) {
    const prices = data.prices || [];
    if (prices.length < 10) return { support: 0, resistance: 0 };

    const recent = prices.slice(-20);
    const high = Math.max(...recent);
    const low = Math.min(...recent);

    return {
      resistance: high,
      support: low,
      level_distance: ((high - low) / low * 100).toFixed(2)
    };
  }

  static detectBreakout(data) {
    const prices = data.prices || [];
    if (prices.length < 5) return { potential: false, direction: null, strength: 0 };

    const lastPrice = prices[prices.length - 1];
    const resistance = Math.max(...prices.slice(-20));
    const support = Math.min(...prices.slice(-20));

    const aboveResistance = lastPrice > resistance * 1.02;
    const belowSupport = lastPrice < support * 0.98;

    return {
      potential: aboveResistance || belowSupport,
      direction: aboveResistance ? 'UPSIDE' : 'DOWNSIDE',
      strength: aboveResistance ? 8 : 6
    };
  }

  static detectPullback(data) {
    const prices = data.prices || [];
    if (prices.length < 5) return { potential: false };

    const recent = prices.slice(-5);
    const trend = recent[recent.length - 1] > recent[0] ? 'UP' : 'DOWN';
    const pullback = trend === 'UP' ? recent.some((p, i) => i > 0 && p < recent[i-1]) : 
                     recent.some((p, i) => i > 0 && p > recent[i-1]);

    return { potential: pullback, trend };
  }

  static calculateCompositeScore(signals) {
    let score = 50; // Neutral starting point

    // Trend contribution
    const trendScores = {
      'STRONG_UPTREND': 20,
      'UPTREND': 15,
      'STRONG_DOWNTREND': -20,
      'DOWNTREND': -15,
      'SIDEWAYS': 0
    };
    score += trendScores[signals.trend] || 0;

    // Momentum contribution
    const momentumScores = {
      'STRONG_BULLISH': 25,
      'BULLISH': 15,
      'STRONG_BEARISH': -25,
      'BEARISH': -15,
      'NEUTRAL': 0
    };
    score += momentumScores[signals.momentum] || 0;

    return Math.max(0, Math.min(100, score));
  }

  static generateRecommendation(signals) {
    const score = signals.composite_score;

    if (score >= 80) return 'STRONG_BUY';
    if (score >= 65) return 'BUY';
    if (score >= 55) return 'WEAK_BUY';
    if (score >= 45) return 'NEUTRAL';
    if (score >= 35) return 'WEAK_SELL';
    if (score >= 20) return 'SELL';
    return 'STRONG_SELL';
  }
}

// ================= BACKTESTING ENGINE =================

class BacktestEngine {
  static backtest(strategy, historicalData, initialCapital = 10000) {
    let portfolio = {
      cash: initialCapital,
      positions: {},
      trades: [],
      equity: initialCapital,
      dailyEquity: [initialCapital]
    };

    for (let i = 0; i < historicalData.length; i++) {
      const candle = historicalData[i];
      
      // Apply strategy
      const signal = strategy(historicalData.slice(0, i + 1), candle);
      
      if (signal === 'BUY' && portfolio.cash > 0) {
        // Buy logic
        const quantity = Math.floor(portfolio.cash / candle.close * 0.9); // 90% of cash
        portfolio.positions[candle.symbol] = {
          quantity,
          entryPrice: candle.close,
          entryTime: candle.time
        };
        portfolio.cash -= quantity * candle.close;
        
      } else if (signal === 'SELL' && portfolio.positions[candle.symbol]) {
        // Sell logic
        const pos = portfolio.positions[candle.symbol];
        const pnl = (candle.close - pos.entryPrice) * pos.quantity;
        portfolio.cash += candle.close * pos.quantity;
        portfolio.trades.push({
          symbol: candle.symbol,
          entry: pos.entryPrice,
          exit: candle.close,
          quantity: pos.quantity,
          pnl,
          pnlPercent: ((pnl / (pos.entryPrice * pos.quantity)) * 100).toFixed(2)
        });
        delete portfolio.positions[candle.symbol];
      }

      // Update portfolio equity
      let positionValue = 0;
      for (let symbol in portfolio.positions) {
        const pos = portfolio.positions[symbol];
        positionValue += pos.quantity * candle.close;
      }
      portfolio.equity = portfolio.cash + positionValue;
      portfolio.dailyEquity.push(portfolio.equity);
    }

    return this.calculateMetrics(portfolio);
  }

  static calculateMetrics(portfolio) {
    const returns = portfolio.trades.map(t => parseFloat(t.pnlPercent));
    const totalReturn = ((portfolio.equity - portfolio.dailyEquity[0]) / portfolio.dailyEquity[0] * 100).toFixed(2);
    const winRate = portfolio.trades.filter(t => t.pnl > 0).length / portfolio.trades.length * 100 || 0;
    const maxDrawdown = this.calculateMaxDrawdown(portfolio.dailyEquity);

    return {
      totalReturn,
      winRate: winRate.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      tradeCount: portfolio.trades.length,
      avgWin: returns.filter(r => r > 0).reduce((a, b) => a + b, 0) / returns.filter(r => r > 0).length || 0,
      avgLoss: returns.filter(r => r < 0).reduce((a, b) => a + b, 0) / returns.filter(r => r < 0).length || 0
    };
  }

  static calculateMaxDrawdown(equity) {
    let maxDrawdown = 0;
    let peak = equity[0];

    for (let i = 1; i < equity.length; i++) {
      if (equity[i] > peak) peak = equity[i];
      const drawdown = ((peak - equity[i]) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return maxDrawdown;
  }
}

// ================= RISK MANAGEMENT =================

class RiskManager {
  static calculateOptimalPositionSize(accountSize, riskPercent, stopLossPercent) {
    const riskAmount = accountSize * (riskPercent / 100);
    const positionSize = riskAmount / (stopLossPercent / 100);
    return positionSize;
  }

  static calculateKellyFraction(winRate, avgWin, avgLoss) {
    // Kelly Criterion: f* = (bp - q) / b
    // where b = odds ratio, p = win probability, q = loss probability
    
    if (avgLoss === 0 || winRate === 0) return 0;
    
    const p = winRate / 100;
    const q = 1 - p;
    const b = avgWin / Math.abs(avgLoss);

    const kelly = (b * p - q) / b;
    return Math.max(0, Math.min(0.25, kelly)); // Cap at 25% for safety
  }

  static calculateTradeRisk(entryPrice, stopLoss, quantity) {
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const totalRisk = riskPerShare * quantity;
    const riskPercent = ((riskPerShare / entryPrice) * 100).toFixed(2);

    return { totalRisk, riskPercent };
  }

  static checkRiskLimits(portfolio, newTrade, maxRiskPercent = 2) {
    const tradeRisk = (newTrade.quantity * Math.abs(newTrade.entryPrice - newTrade.stopLoss));
    const accountRisk = (tradeRisk / portfolio.totalBalance) * 100;

    return {
      withinLimits: accountRisk <= maxRiskPercent,
      riskPercent: accountRisk.toFixed(2),
      recommendation: accountRisk > maxRiskPercent ? 'REDUCE_POSITION_SIZE' : 'OK'
    };
  }
}

// Export for use in other scripts
window.TraderBot = TraderBot;
window.AdvancedSignalGenerator = AdvancedSignalGenerator;
window.BacktestEngine = BacktestEngine;
window.RiskManager = RiskManager;