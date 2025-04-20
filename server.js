const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
const binanceWs = new WebSocket('wss://stream.binance.com:9443/stream');

const currencies = ['btcusdt', 'ethusdt', 'bnbusdt', 'xrpusdt', 'adausdt', 'solusdt', 'dogeusdt', 'trxusdt', 'avaxusdt', 'shibusdt', 'linkusdt', 'maticusdt', 'dotusdt', 'nearusdt', 'ltcusdt', 'uniusdt', 'pepeusdt', 'bchusdt', 'icpusdt', 'aptusdt', 'xlmusdt', 'etcusdt', 'filusdt', 'arbusdt', 'aaveusdt', 'cakeusdt', 'sandusdt', 'galausdt', 'thetausdt', 'algousdt', 'axsusdt', 'vetusdt', 'eousdt', 'neousdt', 'iotausdt', 'ftmusdt', 'kavausdt', 'zilusdt', 'batusdt', 'enjusdt', 'ondousdt', 'bigtimeusdt', 'virtualusdt', '1inchusdt', 'aceusdt', 'achusdt', 'acmusdt', 'aergousdt', 'agldusdt', 'aliceusdt', 'ampusdt', 'ankrusdt', 'apeusdt', 'api3usdt', 'arusdt', 'arkusdt', 'arkmusdt', 'astusdt', 'astrusdt', 'atomusdt', 'auctionusdt', 'audiousdt', 'balusdt', 'bandusdt', 'barusdt', 'belusdt', 'bico usdt', 'bifiusdt', 'blurusdt', 'bonkusdt', 'burgerusdt', 'c98usdt', 'celousdt', 'celrusdt', 'cfxusdt', 'chessusdt', 'chrusdt', 'chzusdt', 'cityusdt', 'ckbusdt', 'compusdt', 'cotiusdt', 'crvusdt', 'ctkusdt', 'ctsiusdt', 'cvxusdt', 'cyberusdt', 'dashusdt', 'dcrusdt', 'dentusdt', 'dfusdt', 'dgbusdt', 'diausdt', 'dodousdt', 'dydxusdt', 'egldusdt', 'elfusdt', 'enausdt', 'ensusdt'];

binanceWs.on('open', () => {
  binanceWs.send(JSON.stringify({
    method: 'SUBSCRIBE',
    params: currencies.map(c => `${c}@aggTrade`),
    id: 1
  }));
});

binanceWs.on('message', async (data) => {
  const msg = JSON.parse(data);
  if (msg.stream && msg.data.e === 'aggTrade') {
    const order = {
      symbol: msg.data.s.toLowerCase(),
      price: parseFloat(msg.data.p),
      volume: parseFloat(msg.data.q),
      type: msg.data.m ? 'sell' : 'buy',
      timestamp: msg.data.E
    };
    await supabase.from('orders').insert([order]);
    wss.clients.forEach(client => client.send(JSON.stringify(order)));
  }
});

wss.on('connection', (ws) => {
  ws.send('Connected to server');
});
