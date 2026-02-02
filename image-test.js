import ws from 'k6/ws';
import { check } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { Counter, Trend, Gauge } from 'k6/metrics';


export const ws_messages_total = new Counter('ws_messages_total');
export const ws_success_total = new Counter('ws_success_total');
export const ws_error_total = new Counter('ws_error_total');
export const ws_response_time_success = new Trend('ws_response_time_success');
export const ws_response_time_error = new Trend('ws_response_time_error');
export const ws_active_connections = new Gauge('ws_active_connections');


export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '1m', target: 10 },
    { duration: '1m', target: 15 },
    { duration: '1m', target: 10 },
    { duration: '1m', target : 5 },
  ],
};

const WS_ENDPOINT = 'ENDPOINT-WEBSOCKET';
const TOKEN = 'TOKEN-JWT';

export default function () {
  const userId = uuidv4();

  const payload = JSON.stringify({
    message: 'halo, saya sedang banyak pikiran saat ini.. seperti semua terjadi secara bersamaan',
    user_id: userId,
    // Payload message template
  });

  const url = `${WS_ENDPOINT}?token=${TOKEN}`;

  let startTime;

  const res = ws.connect(url, {}, function (socket) {

    socket.on('open', () => {
      ws_active_connections.add(1);
      startTime = Date.now();
      socket.send(payload);
      ws_messages_total.add(1);
    });

    socket.on('message', (data) => {
      const duration = Date.now() - startTime;

      console.log(`Received: ${data}`);


      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        ws_error_total.add(1);
        ws_response_time_error.add(duration);
        socket.close();
        return;
      }

      if (parsed.status === 'error') {
        ws_error_total.add(1);
        ws_response_time_error.add(duration);
      } else {
        ws_success_total.add(1);
        ws_response_time_success.add(duration);
      }

      socket.close();
    });

    socket.on('error', (e) => {

      console.log(`WebSocket error: ${e.error()}`);

      ws_error_total.add(1);
      socket.close();
    });

    socket.on('close', () => {
      ws_active_connections.add(-1);
    });

    socket.setTimeout(() => {
      console.log('WebSocket timed out');
      ws_error_total.add(1);
      socket.close();
    }, 60000);
  });

  check(res, {
    'WS handshake OK (101)': (r) => r && r.status === 101,
  });
}

