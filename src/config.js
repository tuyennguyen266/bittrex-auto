const constants = require('./constants');

module.exports = {
  defaultStep: constants.steps.BUY_FILLED,
  market: 'BTC-BLK',
  buyPrice: 11091,
  amount: 40,
  stopLossPrice:              0.000028, // OPTIONAL, stop loss is triggered at this price
  stopLossLimitPrice:         0.0000275, // OPTIONAL, sell at this price when stop loss is triggered
  trailingStopPrice:          0.0000327, // trailing stop is triggered at this price
  trailingStopDistance:       0.0000005, // distance of trailing stop
  trailingStopLimitDistance:  0.0000002, // when trailing stop is hit, sell at this distance price from the hit point
  sellAllPrice:               0.0000337 // sell all when hit this price
}