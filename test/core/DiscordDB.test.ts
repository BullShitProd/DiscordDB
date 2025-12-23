import type { Options } from '../../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiscordDB } from '../../src/core/DiscordDB'

// Mock DiscordClient
const mockWaitUntilReady = vi.fn().mockResolvedValue(undefined)
const mockIsReady = vi.fn().mockReturnValue(true)
vi.mock('../../src/core/DiscordClient', () => ({
  DiscordClient: class {
    waitUntilReady = mockWaitUntilReady
    isReady = mockIsReady
    constructor(_options: Options) {}
  },
}))

// Mock DiscordRepository
const mockInsert = vi.fn().mockResolvedValue('message-123')
const mockFindAll = vi.fn().mockResolvedValue([])
const mockFindById = vi.fn().mockResolvedValue(null)
const mockUpdate = vi.fn().mockResolvedValue(true)
const mockDelete = vi.fn().mockResolvedValue(true)

vi.mock('../../src/core/DiscordRepository', () => ({
  DiscordRepository: class {
    insert = mockInsert
    findAll = mockFindAll
    findById = mockFindById
    update = mockUpdate
    delete = mockDelete
    constructor(_discordClient: any) {}
  },
}))

describe('discordDB', () => {
  let discordDB: DiscordDB
  const options: Options = {
    token: 'test-token',
    guildId: 'test-guild-id',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    discordDB = new DiscordDB(options)
  })

  describe('isReady', () => {
    it('should wait for client and return true', async () => {
      const result = await discordDB.isReady()

      expect(mockWaitUntilReady).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should be callable multiple times', async () => {
      await discordDB.isReady()
      await discordDB.isReady()

      expect(mockWaitUntilReady).toHaveBeenCalledTimes(2)
    })

    it('should propagate errors from waitUntilReady', async () => {
      const error = new Error('Connection failed')
      mockWaitUntilReady.mockRejectedValueOnce(error)

      await expect(discordDB.isReady()).rejects.toThrow('Connection failed')
    })
  })

  describe('insert', () => {
    it('should call repository insert with collection and data', async () => {
      const data = { name: 'John', age: 30 }

      const result = await discordDB.insert('users', data)

      expect(mockInsert).toHaveBeenCalledWith('users', data)
      expect(result).toBe('message-123')
    })

    it('should handle complex data types', async () => {
      const complexData = {
        user: { name: 'Jane', roles: ['admin', 'user'] },
        metadata: { created: new Date('2024-01-01'), active: true },
        tags: ['important', 'verified'],
      }

      await discordDB.insert('users', complexData)

      expect(mockInsert).toHaveBeenCalledWith('users', complexData)
    })

    it('should support generic types', async () => {
      interface User {
        name: string
        email: string
      }

      const user: User = { name: 'Alice', email: 'alice@example.com' }

      const result = await discordDB.insert<User>('users', user)

      expect(mockInsert).toHaveBeenCalledWith('users', user)
      expect(result).toBe('message-123')
    })

    it('should propagate errors from repository', async () => {
      mockInsert.mockRejectedValueOnce(new Error('Insert failed'))

      await expect(discordDB.insert('users', { name: 'Test' })).rejects.toThrow('Insert failed')
    })
  })

  describe('findAll', () => {
    it('should call repository findAll with collection name', async () => {
      const mockDocuments = [
        { id: 'msg-1', name: 'Alice', age: 25 },
        { id: 'msg-2', name: 'Bob', age: 30 },
      ]
      mockFindAll.mockResolvedValueOnce(mockDocuments)

      const result = await discordDB.findAll('users')

      expect(mockFindAll).toHaveBeenCalledWith('users')
      expect(result).toEqual(mockDocuments)
    })

    it('should return empty array for empty collection', async () => {
      mockFindAll.mockResolvedValueOnce([])

      const result = await discordDB.findAll('empty-collection')

      expect(result).toEqual([])
    })

    it('should support generic types', async () => {
      interface Product {
        name: string
        price: number
      }

      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', price: 100 },
        { id: 'prod-2', name: 'Product 2', price: 200 },
      ]
      mockFindAll.mockResolvedValueOnce(mockProducts)

      const result = await discordDB.findAll<Product>('products')

      expect(mockFindAll).toHaveBeenCalledWith('products')
      expect(result).toEqual(mockProducts)
    })

    it('should propagate errors from repository', async () => {
      mockFindAll.mockRejectedValueOnce(new Error('Fetch failed'))

      await expect(discordDB.findAll('users')).rejects.toThrow('Fetch failed')
    })
  })

  describe('findById', () => {
    it('should call repository findById with collection and id', async () => {
      const mockDocument = { id: 'msg-1', name: 'Alice', age: 25 }
      mockFindById.mockResolvedValueOnce(mockDocument)

      const result = await discordDB.findById('users', 'msg-1')

      expect(mockFindById).toHaveBeenCalledWith('users', 'msg-1')
      expect(result).toEqual(mockDocument)
    })

    it('should return null if document not found', async () => {
      mockFindById.mockResolvedValueOnce(null)

      const result = await discordDB.findById('users', 'non-existent')

      expect(result).toBeNull()
    })

    it('should support generic types', async () => {
      interface Order {
        orderId: string
        total: number
      }

      const mockOrder = { id: 'msg-1', orderId: 'order-123', total: 500 }
      mockFindById.mockResolvedValueOnce(mockOrder)

      const result = await discordDB.findById<Order>('orders', 'msg-1')

      expect(mockFindById).toHaveBeenCalledWith('orders', 'msg-1')
      expect(result).toEqual(mockOrder)
    })

    it('should propagate errors from repository', async () => {
      mockFindById.mockRejectedValueOnce(new Error('Fetch failed'))

      await expect(discordDB.findById('users', 'msg-1')).rejects.toThrow('Fetch failed')
    })
  })

  describe('update', () => {
    it('should call repository update with collection, id, and data', async () => {
      const updates = { age: 31 }

      const result = await discordDB.update('users', 'msg-1', updates)

      expect(mockUpdate).toHaveBeenCalledWith('users', 'msg-1', updates)
      expect(result).toBe(true)
    })

    it('should return false if update fails', async () => {
      mockUpdate.mockResolvedValueOnce(false)

      const result = await discordDB.update('users', 'non-existent', { age: 31 })

      expect(result).toBe(false)
    })

    it('should support partial updates', async () => {
      interface User {
        name: string
        email: string
        age: number
      }

      const partialUpdate: Partial<User> = { age: 26 }

      await discordDB.update<User>('users', 'msg-1', partialUpdate)

      expect(mockUpdate).toHaveBeenCalledWith('users', 'msg-1', partialUpdate)
    })

    it('should handle multiple field updates', async () => {
      const updates = { name: 'Updated Name', age: 35, email: 'new@example.com' }

      await discordDB.update('users', 'msg-1', updates)

      expect(mockUpdate).toHaveBeenCalledWith('users', 'msg-1', updates)
    })

    it('should propagate errors from repository', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Update failed'))

      await expect(discordDB.update('users', 'msg-1', { age: 31 })).rejects.toThrow('Update failed')
    })
  })

  describe('delete', () => {
    it('should call repository delete with collection and id', async () => {
      const result = await discordDB.delete('users', 'msg-1')

      expect(mockDelete).toHaveBeenCalledWith('users', 'msg-1')
      expect(result).toBe(true)
    })

    it('should return false if delete fails', async () => {
      mockDelete.mockResolvedValueOnce(false)

      const result = await discordDB.delete('users', 'non-existent')

      expect(result).toBe(false)
    })

    it('should handle deletion from different collections', async () => {
      await discordDB.delete('users', 'user-1')
      await discordDB.delete('posts', 'post-1')

      expect(mockDelete).toHaveBeenCalledWith('users', 'user-1')
      expect(mockDelete).toHaveBeenCalledWith('posts', 'post-1')
    })

    it('should propagate errors from repository', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Delete failed'))

      await expect(discordDB.delete('users', 'msg-1')).rejects.toThrow('Delete failed')
    })
  })
})
