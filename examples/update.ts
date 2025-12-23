/**
 * Example: Update documents in a collection
 *
 * This example demonstrates how to update existing documents
 * using the update() method.
 */

/* eslint-disable no-console */
import type { User } from './utils'
import process from 'node:process'
import { COLLECTION_NAME, initDB } from './utils'

async function main(): Promise<void> {
  console.log('🚀 Starting update example...\n')

  const db = await initDB()
  console.log('✅ DiscordDB is ready!\n')

  // Find all users to get an ID to update
  console.log('Finding users...')
  const users = await db.findAll<User>(COLLECTION_NAME)

  if (users.length === 0) {
    console.log('⚠️  No users found. Please run the insert example first.')
    return
  }

  // Get the first user
  const userToUpdate = users[0]
  console.log(`✓ Found user to update:`)
  console.log(`  ID: ${userToUpdate.id}`)
  console.log(`  Name: ${userToUpdate.name}`)
  console.log(`  Age: ${userToUpdate.age}`)
  console.log(`  Email: ${userToUpdate.email}\n`)

  // Update the user's age and email
  console.log('Updating user...')
  const updateSuccess = await db.update<User>(COLLECTION_NAME, userToUpdate.id, {
    age: 26,
    email: 'newemail@example.com',
  })

  if (updateSuccess) {
    console.log('✓ User updated successfully!\n')

    // Fetch the updated user to verify
    const updatedUser = await db.findById<User>(COLLECTION_NAME, userToUpdate.id)
    if (updatedUser) {
      console.log('Updated user data:')
      console.log(`  ID: ${updatedUser.id}`)
      console.log(`  Name: ${updatedUser.name}`)
      console.log(`  Age: ${updatedUser.age}`)
      console.log(`  Email: ${updatedUser.email}`)
    }
  }
  else {
    console.log('❌ Failed to update user')
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
