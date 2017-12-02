const bittrex = require('node-bittrex-api');
const Config = require('./config');
const logger = require('./logger');

const API_KEY = process.argv[2];
const API_SECRET = process.argv[3];

bittrex.options({
  'apikey' : API_KEY,
  'apisecret' : API_SECRET
});


const Steps = {
  START: 0,
  BOUGHT: 1,
  BUY_FILLED: 2,
  TRAILING_STOP: 3,
  END: 100
}

var step = Steps.START;
var stopPrice = Config.trailingStopPrice;


setInterval(() => {
  bittrex.getticker( { market : Config.market }, function( data, err ) {
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
  logger.info('PRICE: ', lastPrice);
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
  return price < Config.buyPrice;
}

const shouldStopLoss = (price) => {
  if (step !== Steps.BUY_FILLED) {
    return false;
  }
  if (!Config.stopLossPrice) {
    return false;
  }
  return price <= Config.stopLossPrice;
}

const shouldTriggerTrailingStop = (price) => {
  if (step !== Steps.BUY_FILLED) {
    return false;
  }
  return price >= Config.trailingStopPrice;
}

const shouldSetNewTrailingStop = (price) => {
  if (step !== Steps.TRAILING_STOP) {
    return false;
  }
  return price > stopPrice + Config.trailingStopDistance;
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
  return price >= Config.sellAllPrice;
}

// ---------------------------------------------------------------------------------------------------------------------

const buy = () => {
  const options = {
    market: Config.market,
    quantity: Config.amount,
    rate: Config.buyPrice
  };
  logger.info('BUY: ', options);
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
    market: Config.market,
    quantity: Config.amount,
    rate: Config.stopLossLimitPrice
  }
  logger.info('STOP LOSS: ', options);
  bittrex.selllimit(options, (data, err) => {
    if (err) {
      logger.error(err);
      return;
    }
    step = Steps.END;
  })
}

const triggerTrailingStop = (price) => {
  stopPrice = price - Config.trailingStopDistance;
  step = Steps.TRAILING_STOP;
  logger.info('TRIGGER TRAILING STOP');
}

const setNewTrailingStop = (price) => {
  stopPrice = price - Config.trailingStopDistance;
  logger.info('SET NEW TRAILING STOP');
}

const trailingStop = (price) => {
  const options = {
    market: Config.market,
    quantity: Config.amount,
    rate: (stopPrice - Config.trailingStopLimitDistance)
  }
  logger.info('TRAILING STOP: ', options);
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
    market: Config.market,
    quantity: Config.amount,
    rate: Config.sellAllPrice
  }
  logger.info('SELL ALL: ', options);
  bittrex.selllimit(options, (data, err) => {
    if (err) {
      logger.error(err);
      return;
    }
    step = Steps.END;
  })
}