import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Scenario of load testing, target in here is virtual user
export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '1m', target: 30 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 80 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 40 },
    { duration: '2m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    ws_connecting: ['p(95)<8000'],
    ws_session_duration: ['p(95)<30000'],
  },
};

const WS_ENDPOINT = 'WEBSOCKET-ENDPOINT';
const TOKEN = 'JWT-TOKEN';

export default function () {
  const userId = uuidv4();

  const basePayload = {
    user_id: userId,
    user_name: 'Alfarizy',
    // Input, different each application.
  };

  const url = `${WS_ENDPOINT}?token=${TOKEN}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // Looping for chatting
      for (let i = 0; i < 5; i++) {
        const payload = JSON.stringify({
          ...basePayload,
          message: `hai ${i}, saya sedang pusing saat ini.. banyak yang saya pikirkan`
        });

        socket.send(payload);
        sleep(1); // delay in every chat
      }
    });

    socket.on('message', (data) => {
      console.log(`Received: ${data}`);
    });

    socket.on('close', () => {
      // disconnected
    });

    socket.on('error', (e) => {
      console.log(`WebSocket error: ${e.error()}`);
    });

    // hold connection
    sleep(10);
    socket.close();
  });

  check(res, {
    'status is 101': (r) => r && r.status === 101,
  });

  sleep(1);
}
