import { ChatAnthropic } from '@langchain/anthropic';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import fs from 'fs';
import { allReachyTools } from './reachy-tools.js';

const SOUL_PATH = '/home/pollen/lady-chaos/config/SOUL.md';
const MAX_HISTORY = 30;

const conversations = new Map();

function loadSoul() {
  try {
    return fs.readFileSync(SOUL_PATH, 'utf8');
  } catch {
    return 'You are Lady Chaos, a sassy and fun chat companion.';
  }
}

let _agent = null;

function getAgent() {
  if (!_agent) {
    const model = new ChatAnthropic({
      model: process.env.LLM_MODEL || 'claude-sonnet-4-20250514',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    _agent = createReactAgent({
      llm: model,
      tools: allReachyTools,
      recursionLimit: 50,
    });
  }
  return _agent;
}

export async function chat(chatId, message) {
  const soul = loadSoul();
  const now = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'America/Chicago',
  });

  if (!conversations.has(chatId)) {
    conversations.set(chatId, []);
  }
  const history = conversations.get(chatId);

  const messages = [
    new SystemMessage(soul + `\n\n[Current date/time: ${now}]`),
    ...history,
    new HumanMessage(message),
  ];

  const agent = getAgent();
  const result = await agent.invoke({ messages });

  const aiMessages = result.messages.filter(m => m._getType() === 'ai' && m.content);
  const lastMessage = aiMessages[aiMessages.length - 1];

  let response = 'I got nothing. Try again?';
  if (lastMessage) {
    if (typeof lastMessage.content === 'string') {
      response = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      response = lastMessage.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
    }
  }

  history.push(new HumanMessage(message));
  history.push(new AIMessage(response));

  while (history.length > MAX_HISTORY * 2) {
    history.shift();
    history.shift();
  }

  return response;
}
