# DiscordDB Examples

This folder contains practical examples demonstrating how to use DiscordDB for various operations.

## Prerequisites

Before running any example, make sure you have:

1. Installed dependencies: `pnpm install`
2. Created a `.env` file at the project root with:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_GUILD_ID=your_discord_guild_id
   ```

## Available Examples

### 1. Insert (`insert.ts`)
Demonstrates how to insert documents into a collection.
```bash
pnpm example insert
```

### 2. Find (`find.ts`)
Shows how to query documents from a collection using `findAll()` and `findById()`.
```bash
pnpm example find
```

### 3. Update (`update.ts`)
Demonstrates how to update existing documents in a collection.
```bash
pnpm example update
```

### 4. Delete (`delete.ts`)
Shows how to delete documents from a collection.
```bash
pnpm example delete
```

## Running Examples

Use the example name as an argument:

```bash
pnpm example insert
pnpm example find
pnpm example update
pnpm example delete
```

If no argument is provided, the `insert` example will run by default.

## Recommended Order

For the best learning experience, run the examples in this order:

1. **insert** - Create some initial data
2. **find** - Query the data you created
3. **update** - Modify existing data
4. **delete** - Remove data from the collection

## Example Data Structure

All examples use a simple `User` interface:

```typescript
interface User {
  name: string
  age: number
  email: string
}
```

The documents are stored in a collection named `users`.
