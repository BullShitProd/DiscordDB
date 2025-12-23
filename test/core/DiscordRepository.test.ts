import type { TextChannel } from 'discord.js'
import type { DiscordClient } from '../../src/core/DiscordClient'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiscordRepository } from '../../src/core/DiscordRepository'

describe('discordRepository', () => {
  let repository: DiscordRepository
  let mockDiscordClient: DiscordClient
  let mockChannel: TextChannel
  let mockMessage: any

  beforeEach(() => {
    // Setup mock message
    mockMessage = {
      id: 'message-123',
      content: JSON.stringify({ name: 'Test', age: 30 }),
      edit: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    }

    // Setup mock channel
    mockChannel = {
      id: 'channel-123',
      name: 'test-collection',
    } as TextChannel

    // Setup mock Discord client
    mockDiscordClient = {
      resolveCollectionChannel: vi.fn().mockResolvedValue(mockChannel),
      sendMessage: vi.fn().mockResolvedValue('message-123'),
      fetchMessages: vi.fn(),
      fetchMessageById: vi.fn(),
      editMessage: vi.fn().mockResolvedValue(undefined),
      deleteMessage: vi.fn().mockResolvedValue(undefined),
    } as any

    repository = new DiscordRepository(mockDiscordClient)
  })

  describe('insert', () => {
    it('should insert a document and return message ID', async () => {
      const data = { name: 'John', age: 25 }

      const messageId = await repository.insert('users', data)

      expect(mockDiscordClient.resolveCollectionChannel).toHaveBeenCalledWith('users')
      expect(mockDiscordClient.sendMessage).toHaveBeenCalledWith(
        mockChannel,
        JSON.stringify(data),
      )
      expect(messageId).toBe('message-123')
    })

    it('should serialize complex objects', async () => {
      const data = {
        user: { name: 'Jane', email: 'jane@example.com' },
        tags: ['admin', 'user'],
        active: true,
      }

      await repository.insert('users', data)

      expect(mockDiscordClient.sendMessage).toHaveBeenCalledWith(
        mockChannel,
        JSON.stringify(data),
      )
    })

    it('should handle nested objects', async () => {
      const data = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      }

      const messageId = await repository.insert('nested', data)

      expect(messageId).toBe('message-123')
      expect(mockDiscordClient.sendMessage).toHaveBeenCalledWith(
        mockChannel,
        JSON.stringify(data),
      )
    })
  })

  describe('findAll', () => {
    it('should return all documents from a collection', async () => {
      const msg1 = { id: 'msg-1', content: JSON.stringify({ name: 'Alice', age: 20 }) }
      const msg2 = { id: 'msg-2', content: JSON.stringify({ name: 'Bob', age: 30 }) }
      const messages = new Map([
        ['msg-1', msg1],
        ['msg-2', msg2],
      ])
      // Add last() method to Map
      Object.assign(messages, {
        last: () => msg2,
      })

      vi.mocked(mockDiscordClient.fetchMessages)
        .mockResolvedValueOnce(messages as any)
        .mockResolvedValueOnce(new Map() as any)

      const results = await repository.findAll('users')

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ id: 'msg-1', name: 'Alice', age: 20 })
      expect(results[1]).toEqual({ id: 'msg-2', name: 'Bob', age: 30 })
    })

    it('should handle pagination', async () => {
      const firstBatch = new Map()
      const firstMessages: any[] = []
      for (let i = 0; i < 100; i++) {
        const msg = {
          id: `msg-${i}`,
          content: JSON.stringify({ index: i }),
        }
        firstBatch.set(`msg-${i}`, msg)
        firstMessages.push(msg)
      }
      Object.assign(firstBatch, {
        last: () => firstMessages[99],
      })

      const secondMsg = { id: 'msg-100', content: JSON.stringify({ index: 100 }) }
      const secondBatch = new Map([
        ['msg-100', secondMsg],
      ])
      Object.assign(secondBatch, {
        last: () => secondMsg,
      })

      vi.mocked(mockDiscordClient.fetchMessages)
        .mockResolvedValueOnce(firstBatch as any)
        .mockResolvedValueOnce(secondBatch as any)

      const results = await repository.findAll('users')

      expect(results).toHaveLength(101)
      expect(mockDiscordClient.fetchMessages).toHaveBeenCalledTimes(2)
    })

    it('should skip invalid JSON messages', async () => {
      const msg3 = { id: 'msg-3', content: JSON.stringify({ name: 'Charlie' }) }
      const messages = new Map([
        ['msg-1', { id: 'msg-1', content: JSON.stringify({ name: 'Alice' }) }],
        ['msg-2', { id: 'msg-2', content: 'invalid json' }],
        ['msg-3', msg3],
      ])
      Object.assign(messages, {
        last: () => msg3,
      })

      vi.mocked(mockDiscordClient.fetchMessages)
        .mockResolvedValueOnce(messages as any)
        .mockResolvedValueOnce(new Map() as any)

      const results = await repository.findAll('users')

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ id: 'msg-1', name: 'Alice' })
      expect(results[1]).toEqual({ id: 'msg-3', name: 'Charlie' })
    })

    it('should return empty array for empty collection', async () => {
      vi.mocked(mockDiscordClient.fetchMessages).mockResolvedValue(new Map() as any)

      const results = await repository.findAll('empty-collection')

      expect(results).toEqual([])
    })

    it('should pass lastMessageId for pagination', async () => {
      const firstBatch = new Map()
      for (let i = 0; i < 100; i++) {
        firstBatch.set(`msg-${i}`, {
          id: `msg-${i}`,
          content: JSON.stringify({ index: i }),
        })
      }
      // Mock the last() method
      const mockLast = { id: 'msg-99', content: JSON.stringify({ index: 99 }) }
      const messagesWithLast = Object.assign(firstBatch, {
        last: () => mockLast,
      })

      vi.mocked(mockDiscordClient.fetchMessages)
        .mockResolvedValueOnce(messagesWithLast as any)
        .mockResolvedValueOnce(new Map() as any)

      await repository.findAll('users')

      expect(mockDiscordClient.fetchMessages).toHaveBeenNthCalledWith(1, mockChannel, undefined)
      expect(mockDiscordClient.fetchMessages).toHaveBeenNthCalledWith(2, mockChannel, 'msg-99')
    })
  })

  describe('findById', () => {
    it('should return document by ID', async () => {
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(mockMessage)

      const result = await repository.findById<{ name: string, age: number }>('users', 'message-123')

      expect(mockDiscordClient.fetchMessageById).toHaveBeenCalledWith(mockChannel, 'message-123')
      expect(result).toEqual({ id: 'message-123', name: 'Test', age: 30 })
    })

    it('should return null if message not found', async () => {
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(null)

      const result = await repository.findById('users', 'non-existent')

      expect(result).toBeNull()
    })

    it('should return null if message content is invalid JSON', async () => {
      const invalidMessage = { ...mockMessage, content: 'invalid json' }
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(invalidMessage)

      const result = await repository.findById('users', 'message-123')

      expect(result).toBeNull()
    })

    it('should handle complex document structures', async () => {
      const complexData = {
        user: { name: 'Jane', roles: ['admin', 'user'] },
        metadata: { created: '2024-01-01', updated: '2024-01-02' },
      }
      const complexMessage = { id: 'msg-complex', content: JSON.stringify(complexData) }
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(complexMessage as any)

      const result = await repository.findById('users', 'msg-complex')

      expect(result).toEqual({ id: 'msg-complex', ...complexData })
    })
  })

  describe('update', () => {
    it('should update a document and return true', async () => {
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(mockMessage)

      const updates = { age: 31 }
      const result = await repository.update('users', 'message-123', updates)

      expect(result).toBe(true)
      expect(mockDiscordClient.editMessage).toHaveBeenCalledWith(
        mockMessage,
        JSON.stringify({ name: 'Test', age: 31 }),
      )
    })

    it('should return false if message not found', async () => {
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(null)

      const result = await repository.update('users', 'non-existent', { age: 31 })

      expect(result).toBe(false)
      expect(mockDiscordClient.editMessage).not.toHaveBeenCalled()
    })

    it('should return false if message content is invalid JSON', async () => {
      const invalidMessage = { ...mockMessage, content: 'invalid json' }
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(invalidMessage)

      const result = await repository.update('users', 'message-123', { age: 31 })

      expect(result).toBe(false)
      expect(mockDiscordClient.editMessage).not.toHaveBeenCalled()
    })

    it('should merge partial updates with existing data', async () => {
      const existingData = { name: 'John', age: 25, email: 'john@example.com' }
      const existingMessage = { id: 'msg-1', content: JSON.stringify(existingData) }
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(existingMessage as any)

      await repository.update('users', 'msg-1', { age: 26 })

      expect(mockDiscordClient.editMessage).toHaveBeenCalledWith(
        existingMessage,
        JSON.stringify({ name: 'John', age: 26, email: 'john@example.com' }),
      )
    })

    it('should handle updating nested objects', async () => {
      const existingData = { user: { name: 'Jane', age: 30 }, active: true }
      const existingMessage = { id: 'msg-1', content: JSON.stringify(existingData) }
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(existingMessage as any)

      await repository.update('users', 'msg-1', { user: { name: 'Jane', age: 31 } })

      expect(mockDiscordClient.editMessage).toHaveBeenCalledWith(
        existingMessage,
        JSON.stringify({ user: { name: 'Jane', age: 31 }, active: true }),
      )
    })

    it('should return false on edit error', async () => {
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(mockMessage)
      vi.mocked(mockDiscordClient.editMessage).mockRejectedValue(new Error('Edit failed'))

      const result = await repository.update('users', 'message-123', { age: 31 })

      expect(result).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete a document and return true', async () => {
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(mockMessage)

      const result = await repository.delete('users', 'message-123')

      expect(result).toBe(true)
      expect(mockDiscordClient.deleteMessage).toHaveBeenCalledWith(mockMessage)
    })

    it('should return false if message not found', async () => {
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(null)

      const result = await repository.delete('users', 'non-existent')

      expect(result).toBe(false)
      expect(mockDiscordClient.deleteMessage).not.toHaveBeenCalled()
    })

    it('should call deleteMessage with correct message', async () => {
      const specificMessage = { id: 'specific-msg', content: JSON.stringify({ data: 'test' }) }
      vi.mocked(mockDiscordClient.fetchMessageById).mockResolvedValue(specificMessage as any)

      await repository.delete('collection', 'specific-msg')

      expect(mockDiscordClient.deleteMessage).toHaveBeenCalledWith(specificMessage)
    })
  })
})
