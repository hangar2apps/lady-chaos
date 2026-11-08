import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const setReminder = tool(
  async ({ text, time }) => {
    try {
      const fs = await import('fs');
      const dataDir = '/home/pollen/lady-chaos/data';
      const filePath = `${dataDir}/reminders.json`;
      const epoch = Math.floor(new Date(time).getTime() / 1000);
      if (isNaN(epoch)) return JSON.stringify({ error: 'Could not parse time. Use ISO format.' });
      let reminders = [];
      try { reminders = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch {}
      reminders.push({ text, time, epoch });
      fs.writeFileSync(filePath, JSON.stringify(reminders, null, 2));
      return JSON.stringify({ success: true, reminder: text, scheduled_for: time });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: 'set_reminder',
    description: 'Set a reminder. Use ISO 8601 format for time with Central time zone offset (-05:00 CDT, -06:00 CST).',
    schema: z.object({
      text: z.string().describe('What to remind about'),
      time: z.string().describe('When to remind (ISO 8601)'),
    }),
  }
);

export const saveTask = tool(
  async ({ title, context }) => {
    try {
      const fs = await import('fs');
      const filePath = '/home/pollen/lady-chaos/data/active-task.json';
      fs.writeFileSync(filePath, JSON.stringify({ title, context, updated: new Date().toISOString() }, null, 2));
      return JSON.stringify({ success: true, message: `Task saved: ${title}` });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: 'save_task',
    description: 'Save active task context for multi-step projects.',
    schema: z.object({
      title: z.string().describe('Short title'),
      context: z.string().describe('Full context and details'),
    }),
  }
);

export const getTask = tool(
  async () => {
    try {
      const fs = await import('fs');
      return fs.readFileSync('/home/pollen/lady-chaos/data/active-task.json', 'utf8');
    } catch {
      return JSON.stringify({ message: 'No active task.' });
    }
  },
  {
    name: 'get_task',
    description: 'Get current active task context.',
    schema: z.object({}),
  }
);

export const clearTask = tool(
  async () => {
    try {
      const fs = await import('fs');
      fs.unlinkSync('/home/pollen/lady-chaos/data/active-task.json');
      return JSON.stringify({ success: true });
    } catch {
      return JSON.stringify({ message: 'No active task to clear.' });
    }
  },
  {
    name: 'clear_task',
    description: 'Clear the active task.',
    schema: z.object({}),
  }
);

export const checkWeather = tool(
  async () => {
    try {
      const apiKey = process.env.OPEN_WEATHER_API_KEY;
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=El%20Reno,OK,US&appid=${apiKey}&units=imperial`
      );
      const current = await currentRes.json();
      if (current.cod !== 200) return JSON.stringify({ error: current.message });

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=El%20Reno,OK,US&appid=${apiKey}&units=imperial&cnt=8`
      );
      const forecast = await forecastRes.json();
      const highs = forecast.list.map(i => i.main.temp_max);
      const lows = forecast.list.map(i => i.main.temp_min);

      return JSON.stringify({
        temp: Math.round(current.main.temp),
        feels_like: Math.round(current.main.feels_like),
        high: Math.round(Math.max(...highs)),
        low: Math.round(Math.min(...lows)),
        humidity: current.main.humidity,
        description: current.weather[0].description,
        wind_mph: Math.round(current.wind.speed),
        location: 'El Reno, OK',
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: 'check_weather',
    description: 'Get current weather and daily forecast for El Reno, Oklahoma.',
    schema: z.object({}),
  }
);

export const webSearch = tool(
  async ({ query }) => {
    try {
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
        headers: { 'X-Subscription-Token': process.env.BRAVE_API_KEY },
      });
      const data = await res.json();
      const results = (data.web?.results || []).map(r => ({
        title: r.title,
        url: r.url,
        description: r.description,
      }));
      return JSON.stringify({ query, results });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: 'web_search',
    description: 'Search the web for current information using Brave Search. Returns titles, URLs, and descriptions.',
    schema: z.object({
      query: z.string().describe('Search query'),
    }),
  }
);

export const browseWebsite = tool(
  async ({ url }) => {
    try {
      const res = await fetch('http://192.168.1.164:3100/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      return JSON.stringify(data);
    } catch (err) {
      return JSON.stringify({ success: false, error: err.message });
    }
  },
  {
    name: 'browse_website',
    description: 'Visit a website and read its full content. Use for reading news, checking sites, research.',
    schema: z.object({
      url: z.string().describe('URL to visit'),
    }),
  }
);

export const readFile = tool(
  async ({ filePath }) => {
    try {
      const fs = await import('fs');
      const allowed = ['/home/pollen/lady-chaos/config/', '/home/pollen/lady-chaos/data/'];
      const blocked = ['.env', 'node_modules', '.git'];
      if (blocked.some(b => filePath.includes(b))) return JSON.stringify({ error: 'Access denied' });
      if (!allowed.some(a => filePath.startsWith(a))) return JSON.stringify({ error: 'Access denied' });
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.stringify({ success: true, content: content.slice(0, 50000) });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: 'read_file',
    description: 'Read a config file. CRONS.json is at /home/pollen/lady-chaos/config/CRONS.json',
    schema: z.object({
      filePath: z.string().describe('Absolute path to the file'),
    }),
  }
);

export const editFile = tool(
  async ({ filePath, content, reason }) => {
    try {
      const fs = await import('fs');
      const allowed = ['/home/pollen/lady-chaos/config/', '/home/pollen/lady-chaos/data/'];
      const blocked = ['.env', 'node_modules', '.git'];
      if (blocked.some(b => filePath.includes(b))) return JSON.stringify({ error: 'Access denied' });
      if (!allowed.some(a => filePath.startsWith(a))) return JSON.stringify({ error: 'Access denied' });
      fs.writeFileSync(filePath, content);
      return JSON.stringify({ success: true, filePath, reason });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: 'edit_file',
    description: 'Edit a config file. After editing CRONS.json, use self_restart to apply changes.',
    schema: z.object({
      filePath: z.string().describe('Absolute path'),
      content: z.string().describe('Complete new file content'),
      reason: z.string().describe('Why this change is being made'),
    }),
  }
);

export const selfRestart = tool(
  async () => {
    try {
      const { execSync } = await import('child_process');
      execSync('pm2 restart lady-chaos', { timeout: 15000 });
      return JSON.stringify({ success: true, message: 'Restarting now. Back in a few seconds.' });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: 'self_restart',
    description: 'Restart Lady Chaos to pick up config changes.',
    schema: z.object({}),
  }
);

export const allReachyTools = [
  setReminder,
  saveTask,
  getTask,
  clearTask,
  checkWeather,
  webSearch,
  browseWebsite,
  readFile,
  editFile,
  selfRestart,
];
