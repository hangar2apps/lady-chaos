#!/bin/bash
DATA_DIR="/home/pollen/lady-chaos/data"
SCRIPT_DIR="/home/pollen/lady-chaos/lib"
DATETIME=$(date "+%A, %B %d, %Y at %I:%M %p %Z")

if [ -f "$DATA_DIR/reminders.json" ]; then
  NOW_EPOCH=$(date +%s)
  DUE=$(python3 -c "
import json
now = $NOW_EPOCH
reminders = json.load(open('$DATA_DIR/reminders.json'))
due = [r['text'] for r in reminders if r['epoch'] <= now]
remaining = [r for r in reminders if r['epoch'] > now]
if due: print('DUE:' + '|'.join(due))
json.dump(remaining, open('$DATA_DIR/reminders.json', 'w'))
")

  if [[ "$DUE" == DUE:* ]]; then
    REMINDERS="${DUE#DUE:}"
    $SCRIPT_DIR/cron-prompt.sh "[Current date/time: ${DATETIME}] REMINDER: ${REMINDERS}. Let her know! Be brief and in character."
  fi
fi
