import type { Document } from '../types'
import type { DiscordClient } from './DiscordClient'

/**
 * Repository layer for CRUD operations on Discord messages
 * Responsibilities:
 * - Insert, find, update, delete operations
 * - Data serialization/deserialization
 * - Message fetching and pagination logic
 */
export class DiscordRepository {
  constructor(private discordClient: DiscordClient) {}

  /**
   * Insert a document into a collection (send as Discord message)
   * @param collection - The name of the collection (Discord channel)
   * @param data - The data to insert
   * @returns The ID of the inserted document (message ID)
   */
  public async insert<T>(collection: string, data: T): Promise<string> {
    const channel = await this.discordClient.resolveCollectionChannel(collection)
    const messageId = await this.discordClient.sendMessage(channel, JSON.stringify(data))
    return messageId
  }

  /**
   * Find all documents in a collection
   * @param collection - The name of the collection (Discord channel)
   * @returns An array of documents with their IDs
   */
  public async findAll<T>(collection: string): Promise<Document<T>[]> {
    const channel = await this.discordClient.resolveCollectionChannel(collection)
    const results: Document<T>[] = []

    let lastMessageId: string | undefined

    while (true) {
      const fetchedMessages = await this.discordClient.fetchMessages(channel, lastMessageId)
      if (fetchedMessages.size === 0) {
        break
      }

      for (const message of fetchedMessages.values()) {
        try {
          const data = JSON.parse(message.content) as T
          const document: Document<T> = { id: message.id, ...data }
          results.push(document)
        }
        catch {
          // Skip invalid JSON messages
          continue
        }
      }

      lastMessageId = fetchedMessages.last()?.id

      if (fetchedMessages.size < 100) {
        break
      }
    }

    return results
  }

  /**
   * Find a document by its ID in a collection
   * @param collection - The name of the collection (Discord channel)
   * @param id - The ID of the document (message ID)
   * @returns The document with its ID, or null if not found
   */
  public async findById<T>(collection: string, id: string): Promise<Document<T> | null> {
    const channel = await this.discordClient.resolveCollectionChannel(collection)
    const message = await this.discordClient.fetchMessageById(channel, id)

    if (!message) {
      return null
    }

    try {
      const data = JSON.parse(message.content) as T
      const document: Document<T> = { id: message.id, ...data }
      return document
    }
    catch {
      return null
    }
  }

  /**
   * Update a document by its ID in a collection
   * @param collection - The name of the collection (Discord channel)
   * @param id - The ID of the document (message ID)
   * @param data - The partial data to update
   * @returns True if the update was successful, false otherwise
   */
  public async update<T>(collection: string, id: string, data: Partial<T>): Promise<boolean> {
    const channel = await this.discordClient.resolveCollectionChannel(collection)
    const message = await this.discordClient.fetchMessageById(channel, id)

    if (!message) {
      return false
    }

    try {
      const existingData = JSON.parse(message.content) as T
      const updatedData = { ...existingData, ...data }
      await this.discordClient.editMessage(message, JSON.stringify(updatedData))
      return true
    }
    catch {
      return false
    }
  }

  /**
   * Delete a document by its ID in a collection
   * @param collection - The name of the collection (Discord channel)
   * @param id - The ID of the document (message ID)
   * @returns True if the deletion was successful, false otherwise
   */
  public async delete(collection: string, id: string): Promise<boolean> {
    const channel = await this.discordClient.resolveCollectionChannel(collection)
    const message = await this.discordClient.fetchMessageById(channel, id)

    if (!message) {
      return false
    }

    await this.discordClient.deleteMessage(message)
    return true
  }
}
