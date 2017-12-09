const constants = require('./constants');

module.exports = {
  defaultStep: constants.steps.BUY_FILLED,
  market: 'BTC-BLK',

  buyStopPrice:               0.00000904, // when market price is below this price, buying is triggered
  buyLimitPrice:              0.00000904, // buy at this price, when buying is triggered
  amount:                     9651.6215221,

  stopLossPrice:              0.000008218, // OPTIONAL, stop loss is triggered at this price
  stopLossLimitPrice:         0.000008136, // OPTIONAL, sell at this price when stop loss is triggered

  trailingStopStrategy:       constants.trailingStopStrategies.BY_PERCENTAGE_PERCENTAGE_DISTANCE,
  trailingStopPrice:          0.00000994, // trailing stop is triggered at this price


  // BY_AMOUNT_DISTANCE
  trailingStopDistance:       0.0000002, // distance of trailing stop
  trailingStopLimitDistance:  0.0000002, // when trailing stop is hit, sell at this distance price from the hit point

  // BY_PERCENTAGE_PERCENTAGE_DISTANCE
  trailingStopPercentageDistance: 0.01, // 1%: distance of trailing stop by percentage
  trailingStopPercentageLimit:    0.01, // 1%: percentage from hit point

  sellAllPrice:               0.00001175 // sell all when hit this price
}