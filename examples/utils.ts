/**
 * Shared utilities for DiscordDB examples
 */

import type { Options } from '../src/types'
import process from 'node:process'
import { DiscordDB } from '../src/index'

/**
 * User interface used across all examples
 */
export interface User {
  name: string
  age: number
  email: string
}

/**
 * Initialize and return a ready DiscordDB instance
 */
export async function initDB(): Promise<DiscordDB> {
  const configuration: Options = {
    token: process.env.DISCORD_TOKEN as string,
    guildId: process.env.DISCORD_GUILD_ID as string,
  }

  const db = new DiscordDB(configuration)
  await db.isReady()

  return db
}

/**
 * Collection name used for all examples
 */
export const COLLECTION_NAME = 'users'
