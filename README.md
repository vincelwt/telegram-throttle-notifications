# Telegram Throttle notifications

Got notification anxiety? Hate it when people send you bursts of messages making your phone buzz like crazy? This is for you. This script automatically throttles notifications from Telegram chats, effectively grouping notifications. Default cool-down period is 3 minutes.

You will receive only 1 notification / contact / period.

How it works:

- When a (private) chat is received (notification received), it is muted for 3 minutes
- If you reply to the chat before that, it unmutes it

## Configuration

Create a Telegram API App, then set the following environment variables:

```bash
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_ME_SENDER_ID=
TELEGRAM_MY_NUMBER=
```

To start it:

```bash
npm install
npm start
```

At the first run, it will ask you for an Auth code you will receive via telegram. Enter it, then set the token as `TELEGRAM_AUTH_TOKEN=` in the configuration file so it doesn't ask you again.

You can host this in Dokku or something similar.
