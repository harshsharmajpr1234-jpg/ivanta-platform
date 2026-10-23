const ngrok = require('@ngrok/ngrok');

const AUTHTOKEN = process.env.NGROK_AUTHTOKEN || '3KzYR5dEpBG1SwoCgGSQnCy9YFg_3Py3Ab8oLhEEcciAe67B4';
const DOMAIN = 'straw-outpost-tipper.ngrok-free.dev';

async function run() {
  console.log(`[${new Date().toLocaleTimeString()}] Connecting ngrok tunnel to localhost:3000...`);
  try {
    const listener = await ngrok.forward({
      addr: 3000,
      authtoken: AUTHTOKEN,
      domain: DOMAIN,
    });

    console.log('\n======================================================');
    console.log('🎉 YOUR LIVE WEBSITE DEMO URL IS ACTIVE & READY:');
    console.log(`👉 ${listener.url()}`);
    console.log('======================================================');
    console.log('(Keep this process running while testing)\n');

    // Keep-alive timer to keep the Node event loop permanently alive
    const keepAlive = setInterval(() => {}, 30000);

    const shutdown = async () => {
      clearInterval(keepAlive);
      try { await listener.close(); } catch {}
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Tunnel error:`, err.message || err);
    process.exit(1);
  }
}

run();
