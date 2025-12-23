/**
 * Example: Find documents in a collection
 *
 * This example demonstrates how to query documents using
 * findAll() and findById() methods.
 */

/* eslint-disable no-console */
import type { User } from './utils'
import process from 'node:process'
import { COLLECTION_NAME, initDB } from './utils'

async function main(): Promise<void> {
  console.log('🚀 Starting find example...\n')

  const db = await initDB()
  console.log('✅ DiscordDB is ready!\n')

  // Find all documents in the collection
  console.log('Finding all users...')
  const users = await db.findAll<User>(COLLECTION_NAME)

  console.log(`✓ Found ${users.length} user(s):\n`)
  for (const user of users) {
    console.log(`  • ID: ${user.id}`)
    console.log(`    Name: ${user.name}`)
    console.log(`    Age: ${user.age}`)
    console.log(`    Email: ${user.email}\n`)
  }

  // Find by ID example
  console.log('Finding user by ID...')
  const userId = users.length > 0 ? users[0].id : null

  if (userId) {
    const user = await db.findById<User>(COLLECTION_NAME, userId)
    if (user) {
      console.log(`✓ Found user by ID: ${userId}`)
      console.log(`  Name: ${user.name}`)
      console.log(`  Age: ${user.age}`)
      console.log(`  Email: ${user.email}`)
    }
    else {
      console.log('⚠️  User not found by ID')
    }
  }
  else {
    console.log('⚠️  No users found. Run the insert example first.')
  }
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
