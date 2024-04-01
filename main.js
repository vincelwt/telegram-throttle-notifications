import { Api, TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions/index.js"
import input from "input"
import { NewMessage } from "telegram/events/index.js"
import dotenv from "dotenv"
dotenv.config()

const me = BigInt(process.env.TELEGRAM_ME_SENDER_ID)

const MUTE_FOR = process.env.TELEGRAM_THROTTLE_DURATION
  ? parseInt(process.env.TELEGRAM_THROTTLE_DURATION)
  : 3 * 60 // 3 minutes

const session = new StringSession(process.env.TELEGRAM_AUTH_TOKEN)
const client = new TelegramClient(
  session,
  parseInt(process.env.TELEGRAM_API_ID),
  process.env.TELEGRAM_API_HASH,
  {}
)

async function checkNotifStatus(client, userId) {
  const notifySettings = await client.invoke(
    new Api.account.GetNotifySettings({
      peer: new Api.InputNotifyPeer({ peer: userId }),
    })
  )

  return notifySettings
}

;(async function run() {
  await client.start({
    phoneNumber: async () => process.env.TELEGRAM_MY_NUMBER,
    phoneCode: async () => await input.text("Code ?"),
    onError: (err) => console.log(err),
  })

  const token = client.session.save()

  if (!process.env.TELEGRAM_AUTH_TOKEN)
    console.log("=> Save this token in TELEGRAM_AUTH_TOKEN", token)

  async function eventPrint(event) {
    const message = event.message

    const { senderId, chatId } = message

    // Only do this w/ private message (from user or bot)
    if (!event.isPrivate) return

    const { silent, muteUntil } = await checkNotifStatus(
      client,
      message.chatId.value
    )

    console.log(`Muted: ${silent}, until: ${muteUntil}`)

    // Check if the chat is muted
    const isMuted = silent || muteUntil > 0

    // Check if the chat is muted by the script (expire time matches the MUTE_FOR)
    const isMutedViaScript =
      muteUntil > 0 && muteUntil < Math.round(Date.now() / 1000) + MUTE_FOR

    // Received a message from someone else that's not muted => mute it
    if (senderId.value !== me && !isMuted) {
      console.log(`Muting ${senderId.value} with silent`)

      const muteUntil = Math.round(Date.now() / 1000) + MUTE_FOR

      const result = await client.invoke(
        new Api.account.UpdateNotifySettings({
          peer: new Api.InputNotifyPeer({ peer: senderId }),
          settings: new Api.InputPeerNotifySettings({
            muteUntil,
          }),
        })
      )

      console.log("result", result)
    } else if (senderId.value === me && isMutedViaScript) {
      // I sent a message to a muted chat => unmute it
      console.log(`Unmuting chat ${chatId.value}`)

      const result = await client.invoke(
        new Api.account.UpdateNotifySettings({
          peer: new Api.InputNotifyPeer({ peer: chatId }),
          settings: new Api.InputPeerNotifySettings({
            silent: false,
            muteUntil: 0,
          }),
        })
      )

      console.log("result", result)
    }
  }
  // adds an event handler for new messages
  client.addEventHandler(eventPrint, new NewMessage({}))
})()
