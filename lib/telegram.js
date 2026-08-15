function getBotToken() { return process.env.TELEGRAM_BOT_TOKEN; }
function getWebhookSecret() { return process.env.TELEGRAM_WEBHOOK_SECRET; }
function getChatId() { return process.env.TELEGRAM_CHAT_ID; }

export function verifyWebhook(req) {
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  return secret === getWebhookSecret();
}

export function parseMessage(body) {
  const msg = body.message;
  if (!msg || !msg.text) return null;
  return {
    chatId: String(msg.chat.id),
    text: msg.text,
    messageId: msg.message_id,
    from: msg.from?.first_name || 'Unknown',
  };
}

export async function sendMessage(chatId, text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) {
    chunks.push(text.slice(i, i + 4000));
  }
  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${getBotToken()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });
  }
}

export async function sendTyping(chatId) {
  await fetch(`https://api.telegram.org/bot${getBotToken()}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  }).catch(() => {});
}

export function isAllowedChat(chatId) {
  return chatId === getChatId();
}
