const bittrex = require('node-bittrex-api');
const config = require('./config');
const logger = require('./logger');
const constants = require('./constants');

const API_KEY = process.argv[2];
const API_SECRET = process.argv[3];

bittrex.options({
  'apikey' : API_KEY,
  'apisecret' : API_SECRET
});


const Steps = constants.steps;
var step = config.defaultStep;
var stopPrice = config.trailingStopPrice;


setInterval(() => {
  bittrex.getticker( { market : config.market }, function( data, err ) {
    if (err) {
      logger.error(err);
      return;
    }

    if (!data.success) {
      return;
    }
    const lastPrice = data.result.Last;
    handleTicker(lastPrice);
  });
}, 5000);

// ---------------------------------------------------------------------------------------------------------------------

const handleTicker = (lastPrice) => {
  logger.info(`PRICE: ${lastPrice}`);
  if (shouldBuy()) {
    buy();
    return;
  }
  if (shouldMarkBuyFilled(lastPrice)) {
    markBuyFilled();
    return;
  }
  if (shouldStopLoss(lastPrice)) {
    stopLoss();
    return;
  }
  if (shouldTriggerTrailingStop(lastPrice)) {
    triggerTrailingStop(lastPrice);
    return;
  }
  if (shouldSetNewTrailingStop(lastPrice)) {
    setNewTrailingStop(lastPrice);
  }
  if (shouldTrailingStop(lastPrice)) {
    trailingStop(lastPrice);
    return;
  }
  if (shouldSellAll(lastPrice)) {
    sellAll();
    return;
  }
}

// ---------------------------------------------------------------------------------------------------------------------

const shouldBuy = () => {
  if (step !== Steps.START) {
    return false;
  }
  return true;
}

const shouldMarkBuyFilled = (price) => {
  if (step !== Steps.BOUGHT) {
    return false;
  }
  return price < config.buyPrice;
}

const shouldStopLoss = (price) => {
  if (step !== Steps.BUY_FILLED) {
    return false;
  }
  if (!config.stopLossPrice) {
    return false;
  }
  return price <= config.stopLossPrice;
}

const shouldTriggerTrailingStop = (price) => {
  if (step !== Steps.BUY_FILLED) {
    return false;
  }
  return price >= config.trailingStopPrice;
}

const shouldSetNewTrailingStop = (price) => {
  if (step !== Steps.TRAILING_STOP) {
    return false;
  }
  return price > stopPrice + config.trailingStopDistance;
}

const shouldTrailingStop = (price) => {
  if (step !== Steps.TRAILING_STOP) {
    return;
  }
  return price <= stopPrice;
}

const shouldSellAll = (price) => {
  if (step !== Steps.TRAILING_STOP) {
    return false;
  }
  return price >= config.sellAllPrice;
}

// ---------------------------------------------------------------------------------------------------------------------

const buy = () => {
  const options = {
    market: config.market,
    quantity: config.amount,
    rate: config.buyPrice
  };
  logger.info(`BUY: ${options}`);
  bittrex.buylimit(options, (data, err) => {
    if (err) {
      logger.error(err);
      return;
    }
    step = Steps.BOUGHT;
  });
}

const markBuyFilled = () => {
  logger.info('MARK BUY_FILLED');
  step = Steps.BUY_FILLED;
}

const stopLoss = () => {
  const options = {
    market: config.market,
    quantity: config.amount,
    rate: config.stopLossLimitPrice
  }
  logger.info(`STOP LOSS: ${options}`);
  bittrex.selllimit(options, (data, err) => {
    if (err) {
      logger.error(err);
      return;
    }
    step = Steps.END;
  })
}

const triggerTrailingStop = (price) => {
  stopPrice = price - config.trailingStopDistance;
  step = Steps.TRAILING_STOP;
  logger.info('TRIGGER TRAILING STOP');
}

const setNewTrailingStop = (price) => {
  stopPrice = price - config.trailingStopDistance;
  logger.info('SET NEW TRAILING STOP');
}

const trailingStop = (price) => {
  const options = {
    market: config.market,
    quantity: config.amount,
    rate: (stopPrice - config.trailingStopLimitDistance)
  }
  logger.info(`TRAILING STOP: ${options}`);
  bittrex.selllimit(options, (data, err) => {
    if (err) {
      logger.error(err);
      return;
    }
    step = Steps.END;
  })
}

const sellAll = () => {
  const options = {
    market: config.market,
    quantity: config.amount,
    rate: config.sellAllPrice
  }
  logger.info(`SELL ALL: ${options}`);
  bittrex.selllimit(options, (data, err) => {
    if (err) {
      logger.error(err);
      return;
    }
    step = Steps.END;
  })
}