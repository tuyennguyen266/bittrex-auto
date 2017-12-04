This is an auto tool to set buying order and trigger trailing stop order in bittrex.com

### How to use

#### Setup
Note: This setup guide is for MacOS. In other platforms, they may be different.

Run these commands in terminal
```
git clone https://github.com/tuyennguyen266/bittrex-auto.git
cd bittrex-auto
npm install
```

#### Tuning
Change fields in src/config.js to your trading expected pair.

##### src/config.js
```javascript
{
  defaultStep: constants.steps.BUY_FILLED,
  // constants.steps.START: start from beginning, tool will buy and set trailing stop automatically
  // constants.steps.BUY_FILLED: tool doesn't auto buy, it only auto-triggers trailing stop
  
  market: 'BTC-BLK',
  // The code of the trading pair. 
  // You can cet it manually from https://bittrex.com/api/v1.1/public/getmarkets 
  
  buyStopPrice:               0.0000309, 
  // When market price is below this price, buying is triggered.
  // It isn't used when defaultStep = constants.steps.BUY_FILLED.
  
  buyLimitPrice:              0.0000310, 
  // Buy at this price, when buying is triggered.
  // It isn't used when defaultStep = constants.steps.BUY_FILLED.
  
  amount: 40,
  // The amount will be put in all orders
  // In this config, this amount is 40 BLK.
  
  stopLossPrice:              0.000028, 
  // OPTIONAL, stop loss is triggered at this price.
  // Set 'null' will disable stop loss.
  // In this config, when price from 0.000029 down to 000028,
  // a selling order will be created with limit price = 0.0000275.
  
  stopLossLimitPrice:         0.0000275, 
  // OPTIONAL, sell at this price when stop loss is triggered.
  // In this config, when market price goes from 0.000029 down to 000028,
  // a selling order will be booked with limit price = 0.0000275.
  
  trailingStopPrice:          0.0000327, 
  // Trailing stop is triggered at this price.
  // When market price reaches this price, tool will create a conditional selling order.
  
  trailingStopDistance:       0.0000005, 
  // Distance of trailing stop
  
  trailingStopLimitDistance:  0.0000002, 
  // When trailing stop is hit, sell at this distance price from the hit point
  
  // In this config, when market price goes from 0.000032 up to 0.0000327,
  // a selling order will be created with condition 'PRICE' < 0.0000322 (0.0000327-0.0000005) and limit price = 000032 (0.0000327-0.0000005-0.0000002).
  // When market price continue go higher from 0.0000327 to 0.0000337, the old selling order will be canceled,
  // and new selling order will be created with condition 'PRICE' < 0.0000332 (0.0000337-0.0000005) and limit price = 000033 (0.0000337-0.0000005-0.0000002).
    
  
  sellAllPrice:               0.0000337 
  // Sell all when hit this price
}
```

#### Running
Get your API_KEY and API_SECRET from bittrex and run this script.
```javascript
npm start API_KEY API_SECRET
```

#### Running in background mode when ssh to a remote server
```
npm start API_KEY API_SECRET &
disown %1
```