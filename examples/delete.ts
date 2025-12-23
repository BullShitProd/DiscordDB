/**
 * Example: Delete documents from a collection
 *
 * This example demonstrates how to delete documents
 * using the delete() method.
 */

/* eslint-disable no-console */
import type { User } from './utils'
import process from 'node:process'
import { COLLECTION_NAME, initDB } from './utils'

async function main(): Promise<void> {
  console.log('🚀 Starting delete example...\n')

  const db = await initDB()
  console.log('✅ DiscordDB is ready!\n')

  // Find all users to get an ID to delete
  console.log('Finding users...')
  const users = await db.findAll<User>(COLLECTION_NAME)

  if (users.length === 0) {
    console.log('⚠️  No users found. Please run the insert example first.')
    return
  }

  // Get the first user
  const userToDelete = users[0]
  console.log(`✓ Found user to delete:`)
  console.log(`  ID: ${userToDelete.id}`)
  console.log(`  Name: ${userToDelete.name}`)
  console.log(`  Age: ${userToDelete.age}`)
  console.log(`  Email: ${userToDelete.email}\n`)

  // Delete the user
  console.log('Deleting user...')
  const deleteSuccess = await db.delete(COLLECTION_NAME, userToDelete.id)

  if (deleteSuccess) {
    console.log('✓ User deleted successfully!\n')

    // Verify the user is deleted
    const deletedUser = await db.findById<User>(COLLECTION_NAME, userToDelete.id)
    if (deletedUser === null) {
      console.log('✓ Confirmed: User no longer exists in the collection')
    }
    else {
      console.log('⚠️  Warning: User still exists in the collection')
    }
  }
  else {
    console.log('❌ Failed to delete user')
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
