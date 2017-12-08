const steps = {
  START: 0,
  BOUGHT: 1,
  BUY_FILLED: 2,
  TRAILING_STOP: 3,
  END: 100
}

const trailingStopStrategies = {
  BY_AMOUNT_DISTANCE: 0,
  BY_PERCENTAGE_PERCENTAGE_DISTANCE: 0
}

module.exports = {
  steps,
  trailingStopStrategies
}