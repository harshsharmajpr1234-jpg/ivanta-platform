const ngrok = require('@ngrok/ngrok');

async function start() {
  console.log('Starting secure tunnel for iVanta platform...');
  try {
    const listener = await ngrok.forward({
      addr: 3000,
      authtoken: process.env.NGROK_AUTHTOKEN || '3KzYR5dEpBG1SwoCgGSQnCy9YFg_3Py3Ab8oLhEEcciAe67B4',
      domain: 'straw-outpost-tipper.ngrok-free.dev',
    });

    console.log('\n======================================================');
    console.log('🎉 YOUR LIVE WEBSITE DEMO URL IS READY:');
    console.log(`👉 ${listener.url()}`);
    console.log('======================================================');
    console.log('(Keep this terminal open while your client is browsing)\n');
  } catch (err) {
    console.error('Tunnel error:', err.message || err);
  }
}

start();
