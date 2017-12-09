const constants = require('./constants');

module.exports = {
  defaultStep: constants.steps.BUY_FILLED,
  market: 'BTC-BLK',
  buyStopPrice:               10478, // when market price is below this price, buying is triggered
  buyLimitPrice:              11091, // buy at this price, when buying is triggered
  amount: 40,

  stopLossPrice:              0.000028, // OPTIONAL, stop loss is triggered at this price
  stopLossLimitPrice:         0.0000275, // OPTIONAL, sell at this price when stop loss is triggered

  trailingStopStrategy:       constants.trailingStopStrategies.BY_PERCENTAGE_PERCENTAGE_DISTANCE,
  trailingStopPrice:          18770, // trailing stop is triggered at this price

  // BY_PERCENTAGE_PERCENTAGE_DISTANCE
  trailingStopPercentageDistance: 0.05, // 5%
  trailingStopPercentageLimit:    0.01, // 5%

  // BY_AMOUNT_DISTANCE
  trailingStopDistance:       0.0000005, // distance of trailing stop
  trailingStopLimitDistance:  0.0000002, // when trailing stop is hit, sell at this distance price from the hit point

  sellAllPrice:               0.0000337 // sell all when hit this price
}