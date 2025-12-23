import type { Collection, Guild, Message, TextChannel } from 'discord.js'
import type { Options } from '../types'
import { ChannelType, Client, Events, GatewayIntentBits } from 'discord.js'

/**
 * Internal class that manages the Discord.js client connection and low-level operations
 * Responsibilities:
 * - Discord connection management
 * - Event handling
 * - Channel resolution
 * - Message operations (send, fetch, edit, delete)
 */
export class DiscordClient {
  private client: Client
  private guildId: string

  constructor(options: Options) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    })
    this.guildId = options.guildId

    this.client.login(options.token)
  }

  /**
   * Wait for the Discord client to be ready
   */
  public async waitUntilReady(): Promise<void> {
    if (this.client.isReady()) {
      return
    }

    await new Promise<void>((resolve) => {
      this.client.once(Events.ClientReady, () => {
        resolve()
      })
    })
  }

  /**
   * Check if the client is ready
   */
  public isReady(): boolean {
    return this.client.isReady()
  }

  /**
   * Get the guild from cache
   */
  private getGuild(): Guild {
    const guild = this.client.guilds.cache.get(this.guildId)
    if (!guild) {
      throw new Error('Guild not found in cache')
    }
    return guild
  }

  /**
   * Resolve or create a text channel for a collection
   */
  public async resolveCollectionChannel(collection: string): Promise<TextChannel> {
    const guild = this.getGuild()
    let channel = guild.channels.cache.find(
      channel => channel.type === ChannelType.GuildText && channel.name === collection,
    ) as TextChannel | undefined

    if (!channel) {
      channel = await guild.channels.create({
        name: collection,
        type: ChannelType.GuildText,
      }) as TextChannel
    }

    return channel
  }

  /**
   * Send a message to a channel
   */
  public async sendMessage(channel: TextChannel, content: string): Promise<string> {
    const message = await channel.send(content)
    return message.id
  }

  /**
   * Fetch multiple messages from a channel
   */
  public async fetchMessages(channel: TextChannel, lastMessageId?: string): Promise<Collection<string, Message>> {
    return channel.messages.fetch({ limit: 100, before: lastMessageId })
  }

  /**
   * Fetch a specific message by ID
   */
  public async fetchMessageById(channel: TextChannel, messageId: string): Promise<Message | null> {
    try {
      const message = await channel.messages.fetch(messageId)
      return message
    }
    catch {
      return null
    }
  }

  /**
   * Edit a message content
   */
  public async editMessage(message: Message, content: string): Promise<void> {
    await message.edit(content)
  }

  /**
   * Delete a message
   */
  public async deleteMessage(message: Message): Promise<void> {
    await message.delete()
  }
}
