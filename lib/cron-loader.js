import cron from 'node-cron';
import { exec } from 'child_process';
import fs from 'fs';

const CRONS_PATH = '/home/pollen/lady-chaos/config/CRONS.json';

export function loadCrons() {
  console.log('\n--- Cron Jobs ---');

  if (!fs.existsSync(CRONS_PATH)) {
    console.log('No CRONS.json found');
    console.log('-----------------\n');
    return [];
  }

  const crons = JSON.parse(fs.readFileSync(CRONS_PATH, 'utf8'));
  const tasks = [];

  for (const entry of crons) {
    if (entry.enabled === false) continue;

    if (!cron.validate(entry.schedule)) {
      console.error(`Invalid schedule for "${entry.name}": ${entry.schedule}`);
      continue;
    }

    const task = cron.schedule(entry.schedule, () => {
      exec(entry.command, { cwd: '/home/pollen/lady-chaos' }, (err, stdout, stderr) => {
        if (err) {
          console.error(`[CRON] ${entry.name}: error - ${err.message}`);
        } else {
          console.log(`[CRON] ${entry.name}: ${stdout.trim() || 'ran'}`);
        }
      });
    });

    tasks.push(task);
    console.log(`  ${entry.name}: ${entry.schedule}`);
  }

  if (tasks.length === 0) console.log('No active cron jobs');
  console.log('-----------------\n');

  return tasks;
}
