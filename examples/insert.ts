/**
 * Example: Insert documents into a collection
 *
 * This example demonstrates how to insert multiple documents
 * into a DiscordDB collection.
 */

/* eslint-disable no-console */
import type { User } from './utils'
import process from 'node:process'
import { COLLECTION_NAME, initDB } from './utils'

async function main(): Promise<void> {
  console.log('🚀 Starting insert example...\n')

  const db = await initDB()
  console.log('✅ DiscordDB is ready!\n')

  // Insert multiple users
  const users: User[] = [
    { name: 'Alice', age: 25, email: 'alice@example.com' },
    { name: 'Bob', age: 30, email: 'bob@example.com' },
    { name: 'Charlie', age: 35, email: 'charlie@example.com' },
  ]

  console.log('Inserting users...')
  for (const user of users) {
    const messageId = await db.insert<User>(COLLECTION_NAME, user)
    console.log(`  ✓ Inserted ${user.name} with ID: ${messageId}`)
  }

  console.log(`\n✅ Successfully inserted ${users.length} users!`)
}

main()
  .then(() => {
    console.log('\n🎉 Example finished successfully.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
