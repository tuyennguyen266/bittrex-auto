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
var curTrailingStopOrderId = null;


setInterval(() => {
  if (step === Steps.END) {
    return;
  }
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
  if (shouldBuy(lastPrice)) {
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

const shouldBuy = (price) => {
  if (step !== Steps.START) {
    return false;
  }
  if (!config.buyStopPrice) {
    return true;
  }
  return price <= config.buyStopPrice;
}

const shouldMarkBuyFilled = (price) => {
  // TODO: should check if order filled to mark it bought. Now use this temporarily.
  if (step !== Steps.BOUGHT) {
    return false;
  }
  return price < config.buyLimitPrice;
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
  if (config.trailingStopStrategy === constants.trailingStopStrategies.BY_AMOUNT_DISTANCE) {
    return price > stopPrice + config.trailingStopDistance;
  }
  if (config.trailingStopStrategy === constants.trailingStopStrategies.BY_PERCENTAGE_PERCENTAGE_DISTANCE) {
    return price * (1 - config.trailingStopPercentageDistance) > stopPrice;
  }
  return false;
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
    rate: config.buyLimitPrice
  };
  logger.info(`BUY: ${JSON.stringify(options)}`);
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
  logger.info(`STOP LOSS: ${JSON.stringify(options)}`);
  bittrex.selllimit(options, (data, err) => {
    if (err) {
      logger.error(err);
      return;
    }
    step = Steps.END;
  })
}

const triggerTrailingStop = (price) => {
  stopPrice = getStopPrice(price);
  if (!stopPrice) return;

  step = Steps.TRAILING_STOP;
  bookOrderTrailingStop();
  logger.info(`TRIGGER TRAILING STOP AT PRICE: ${stopPrice}`);
}

const setNewTrailingStop = (price) => {
  stopPrice = getStopPrice(price);
  if (!stopPrice) return;

  cancelOrderTrailingStop(() => {
    bookOrderTrailingStop();
  });
  logger.info(`SET NEW TRAILING STOP AT PRICE: ${stopPrice}`);
}

const getStopPrice = (price) => {
  if (config.trailingStopStrategy === constants.trailingStopStrategies.BY_AMOUNT_DISTANCE) {
    return price - config.trailingStopDistance;
  }
  if (config.trailingStopStrategy === constants.trailingStopStrategies.BY_PERCENTAGE_PERCENTAGE_DISTANCE) {
    return price * (1 - config.trailingStopPercentageDistance);
  }
  return null;
}

const trailingStop = (price) => {
  step = Steps.END;
}

const sellAll = () => {
  cancelOrderTrailingStop(() => {
    const options = {
      market: config.market,
      quantity: config.amount,
      rate: config.sellAllPrice
    }
    logger.info(`SELL ALL: ${JSON.stringify(options)}`);
    bittrex.selllimit(options, (data, err) => {
      if (err) {
        logger.error(err);
        return;
      }
      step = Steps.END;
    })
  })
}

// ---------------------------------------------------------------------------------------------------------------------

const bookOrderTrailingStop = () => {
  const trailingStopLimitPrice = getTrailingStopLimitPrice();
  if (!trailingStopLimitPrice) return;

  const options = {
    MarketName: config.market,
    OrderType: 'LIMIT',
    Quantity: config.amount,
    Rate: trailingStopLimitPrice,
    TimeInEffect: 'GOOD_TIL_CANCELLED', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
    ConditionType: 'LESS_THAN', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
    Target: stopPrice, // used in conjunction with ConditionType
  };
  logger.info(`BOOK ORDER TRAILING STOP: ${JSON.stringify(options)}`);
  bittrex.tradesell(options, (data, err) => {
    if (err) {
      logger.error(err);
      return;
    }
    curTrailingStopOrderId = data.result.OrderId;
    logger.info(`BOOK ORDER TRAILING STOP SUCCESSFUL WITH ID: ${data.result.OrderId}`);
  });
}

const getTrailingStopLimitPrice = () => {
  if (config.trailingStopStrategy === constants.trailingStopStrategies.BY_AMOUNT_DISTANCE) {
    return stopPrice - config.trailingStopLimitDistance;
  }
  if (config.trailingStopStrategy === constants.trailingStopStrategies.BY_PERCENTAGE_PERCENTAGE_DISTANCE) {
    return stopPrice * (1 - config.trailingStopPercentageLimit);
  }
  return null;
}

const cancelOrderTrailingStop = (done) => {
  if (!curTrailingStopOrderId) {
    done();
    return;
  }
  const options = {
    uuid: curTrailingStopOrderId
  };
  logger.info(`CANCEL ORDER TRAILING STOP: ${JSON.stringify(options)}`);
  bittrex.cancel(options, (data, err) => {
    if (err) {
      logger.error(err);
      return;
    }
    if (!data.success) {
      return;
    }
    curTrailingStopOrderId = null;
    done();
  });
}