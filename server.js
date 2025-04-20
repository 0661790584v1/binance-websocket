const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
const binanceWs = new WebSocket('wss://stream.binance.com:9443/stream');

const currencies = ['btcusdt', 'ethusdt', 'bnbusdt', 'xrpusdt', 'adausdt', 'solusdt', 'dogeusdt', 'trxusdt', 'avaxusdt', 'shibusdt', 'linkusdt', 'maticusdt', 'dotusdt', 'nearusdt', 'ltcusdt', 'uniusdt', 'pepeusdt', 'bchusdt', 'icpusdt', 'aptusdt', 'xlmusdt', 'etcusdt', 'filusdt', 'arbusdt', 'aaveusdt', 'cakeusdt', 'sandusdt', 'galausdt', 'thetausdt', 'algousdt', 'axsusdt', 'vetusdt', 'eousdt', 'neousdt', 'iotausdt', 'ftmusdt', 'kavausdt', 'zilusdt', 'batusdt', 'enjusdt', 'ondousdt', 'bigtimeusdt', 'virtualusdt', '1inchusdt', 'aceusdt', 'achusdt', 'acmusdt', 'aergousdt', 'agldusdt', 'aliceusdt', 'ampusdt', 'ankrusdt', 'apeusdt', 'api3usdt', 'arusdt', 'arkusdt', 'arkmusdt', 'astusdt', 'astrusdt', 'atomusdt', 'auctionusdt', 'audiousdt', 'balusdt', 'bandusdt', 'barusdt', 'belusdt', 'bico usdt', 'bifiusdt', 'blurusdt', 'bonkusdt', 'burgerusdt', 'c98usdt', 'celousdt', 'celrusdt', 'cfxusdt', 'chessusdt', 'chrusdt', 'chzusdt', 'cityusdt', 'ckbusdt', 'compusdt', 'cotiusdt', 'crvusdt', 'ctkusdt', 'ctsiusdt', 'cvxusdt', 'cyberusdt', 'dashusdt', 'dcrusdt', 'dentusdt', 'dfusdt', 'dgbusdt', 'diausdt', 'dodousdt', 'dydxusdt', 'egldusdt', 'elfusdt', 'enausdt', 'ensusdt'];

binanceWs.on('open', () => {
  console.log('Connected to Binance WebSocket');
  binanceWs.send(JSON.stringify({
    method: 'SUBSCRIBE',
    params: currencies.map(c => `${c}@aggTrade`),
    id: 1
  }));
});

binanceWs.on('message', async (data) => {
  try {
    console.log('Received Binance message:', data.toString());
    const msg = JSON.parse(data);
    if (msg.stream && msg.data.e === 'aggTrade') {
      const price = parseFloat(msg.data.p);
      const volume = parseFloat(msg.data.q);
      if (!isNaN(price) && !isNaN(volume) && price > 0 && volume > 0) {
        const order = {
          symbol: msg.data.s.toLowerCase(),
          price: price,
          volume: volume,
          type: msg.data.m ? 'sell' : 'buy',
          timestamp: msg.data.E
        };
        console.log('Valid order:', order);
        const { error } = await supabase.from('orders').insert([order]);
        if (error) {
          console.error('Supabase insert error:', error);
        } else {
          console.log('Inserted order to Supabase:', order);
        }
        wss.clients.forEach(client => {
          client.send(JSON.stringify(order));
          console.log('Sent order to client:', order);
        });
      } else {
        console.error('Invalid price or volume:', { price, volume });
      }
    } else {
      console.log('Non-aggTrade message:', msg);
    }
  } catch (error) {
    console.error('Error processing Binance message:', error);
  }
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send('Connected to server');
});

binanceWs.on('error', (error) => {
  console.error('Binance WebSocket error:', error);
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});
