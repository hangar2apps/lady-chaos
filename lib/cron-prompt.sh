#!/bin/bash
# Send a prompt to Lady Chaos through the Telegram webhook

DATETIME=$(date "+%A, %B %d, %Y at %I:%M %p %Z")
PROMPT="[Current date/time: ${DATETIME}] $1"

source /home/pollen/lady-chaos/.env

BODY="{
  \"update_id\": $(date +%s),
  \"message\": {
    \"message_id\": $(date +%s),
    \"from\": {\"id\": ${TELEGRAM_CHAT_ID}, \"is_bot\": false, \"first_name\": \"Cron\"},
    \"chat\": {\"id\": ${TELEGRAM_CHAT_ID}, \"type\": \"private\"},
    \"date\": $(date +%s),
    \"text\": \"${PROMPT}\"
  }
}"

curl -s -X POST "http://127.0.0.1:3001/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: ${TELEGRAM_WEBHOOK_SECRET}" \
  -d "${BODY}"
