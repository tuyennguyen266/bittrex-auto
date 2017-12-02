module.exports = {
  market: 'USDT-BTC',
  buyPrice: 11091,
  amount: 0.0005,
  stopLossPrice: 9449, // OPTIONAL, stop loss is triggered at this price
  stopLossLimitPrice: 9427, // OPTIONAL, sell at this price when stop loss is triggered
  trailingStopPrice: 12000, // trailing stop is triggered at this price
  trailingStopDistance: 50, // distance of trailing stop
  trailingStopLimitDistance: 20, // when trailing stop is hit, sell at this distance price from the hit point
  sellAllPrice: 13000 // sell all when hit this price
}