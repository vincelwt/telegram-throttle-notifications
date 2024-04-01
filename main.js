import { Api, TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions/index.js"
import input from "input"
import { NewMessage } from "telegram/events/index.js"
import dotenv from "dotenv"
dotenv.config()

const me = process.env.TELEGRAM_ME_SENDER_ID

const MUTE_FOR = 5 * 60 // 10 minutes

const session = new StringSession(process.env.TELEGRAM_AUTH_TOKEN)
const client = new TelegramClient(
  session,
  process.env.TELEGRAM_API_ID,
  process.env.TELEGRAM_API_HASH,
  {}
)

;(async function run() {
  await client.start({
    phoneNumber: async () => process.env.TELEGRAM_MY_NUMBER,
    phoneCode: async () => await input.text("Code ?"),
    onError: (err) => console.log(err),
  })

  const token = client.session.save()

  console.log("Save this token in TELEGRAM_AUTH_TOKEN:", token)

  async function eventPrint(event) {
    const message = event.message

    // Checks if it's a private message (from user or bot)
    if (!event.isPrivate || message.senderId === me) return
    // prints sender id
    // console.log(message.senderId)

    const notifySettings = await client.invoke(
      new Api.account.GetNotifySettings({
        peer: new Api.InputNotifyPeer({ peer: message.senderId }),
      })
    )

    console.log(
      `Received message from ${message.senderId} with silent: ${notifySettings.silent}`
    )

    // When receiving 2 messages from the same sender, mute him for 10 minutes
    if (!notifySettings.silent) {
      const inTenMinutes = parseInt(Date.now() / 1000) + MUTE_FOR

      const result = await client.invoke(
        new Api.account.UpdateNotifySettings({
          peer: new Api.InputNotifyPeer({ peer: message.senderId }),
          settings: new Api.InputPeerNotifySettings({
            muteUntil: inTenMinutes,
          }),
        })
      )

      lastSenderId = null

      console.log("result", result)
    } else if (!notifySettings.silent) {
      lastSenderId = message.senderId.value
    }
  }
  // adds an event handler for new messages
  client.addEventHandler(eventPrint, new NewMessage({}))
})()
