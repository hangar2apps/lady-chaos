import 'dotenv/config';
import express from 'express';
import { chat } from './lib/agent.js';
import { verifyWebhook, parseMessage, sendMessage, sendTyping, isAllowedChat } from './lib/telegram.js';
import { loadCrons } from './lib/cron-loader.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', name: 'lady-chaos' });
});

app.post('/api/telegram/webhook', async (req, res) => {
  if (!verifyWebhook(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const msg = parseMessage(req.body);
  if (!msg) return res.json({ ok: true });

  if (!isAllowedChat(msg.chatId)) {
    return res.json({ ok: true });
  }

  res.json({ ok: true });

  try {
    await sendTyping(msg.chatId);
    const response = await chat(msg.chatId, msg.text);
    await sendMessage(msg.chatId, response);
  } catch (err) {
    console.error('Error:', err);
    await sendMessage(msg.chatId, 'Shit, something broke. Try again in a sec.').catch(() => {});
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nLady Chaos running on port ${PORT}`);
  loadCrons();
  console.log('Ready to cause trouble!\n');
});
