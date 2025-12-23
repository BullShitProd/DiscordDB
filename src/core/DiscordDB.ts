import type { Document, Options } from '../types'
import { DiscordClient } from './DiscordClient'
import { DiscordRepository } from './DiscordRepository'

/**
 * Main class exposing the public API for DiscordDB
 * Responsibilities:
 * - Public API surface
 * - Business logic orchestration
 * - Client initialization and ready state management
 */
export class DiscordDB {
  private discordClient: DiscordClient
  private repository: DiscordRepository

  constructor(options: Options) {
    this.discordClient = new DiscordClient(options)
    this.repository = new DiscordRepository(this.discordClient)
  }

  /**
   * Wait for the Discord client to be ready and return true when ready
   */
  public async isReady(): Promise<boolean> {
    await this.discordClient.waitUntilReady()
    return this.discordClient.isReady()
  }

  /**
   * Insert a document into a collection
   * @param collection - The name of the collection (Discord channel)
   * @param data - The data to insert
   * @returns The ID of the inserted document (message ID)
   */
  public async insert<T>(collection: string, data: T): Promise<string> {
    return this.repository.insert(collection, data)
  }

  /**
   * Find all documents in a collection
   * @param collection - The name of the collection (Discord channel)
   * @returns An array of documents with their IDs
   */
  public async findAll<T>(collection: string): Promise<Document<T>[]> {
    return this.repository.findAll(collection)
  }

  /**
   * Find a document by its ID in a collection
   * @param collection - The name of the collection (Discord channel)
   * @param id - The ID of the document (message ID)
   * @returns The document with its ID, or null if not found
   */
  public async findById<T>(collection: string, id: string): Promise<Document<T> | null> {
    return this.repository.findById(collection, id)
  }

  /**
   * Update a document by its ID in a collection
   * @param collection - The name of the collection (Discord channel)
   * @param id - The ID of the document (message ID)
   * @param data - The partial data to update
   * @returns True if the update was successful, false otherwise
   */
  public async update<T>(collection: string, id: string, data: Partial<T>): Promise<boolean> {
    return this.repository.update(collection, id, data)
  }

  /**
   * Delete a document by its ID in a collection
   * @param collection - The name of the collection (Discord channel)
   * @param id - The ID of the document (message ID)
   * @returns True if the deletion was successful, false otherwise
   */
  public async delete(collection: string, id: string): Promise<boolean> {
    return this.repository.delete(collection, id)
  }
}
