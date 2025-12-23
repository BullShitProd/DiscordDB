import type { Options } from '../../src/types'
import { ChannelType, Events } from 'discord.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiscordClient } from '../../src/core/DiscordClient'

// Mock Discord.js module
vi.mock('discord.js', () => {
  const mockClient = {
    once: vi.fn(),
    login: vi.fn().mockResolvedValue('test-token'),
    isReady: vi.fn().mockReturnValue(false),
    guilds: {
      cache: new Map(),
    },
  }

  // Create a Map with find method
  class MockCollection extends Map {
    find(fn: (value: any) => boolean) {
      for (const value of this.values()) {
        if (fn(value)) {
          return value
        }
      }
      return undefined
    }
  }

  return {
    Client: class {
      once = mockClient.once
      login = mockClient.login
      isReady = mockClient.isReady
      guilds = mockClient.guilds

      constructor() {
        // Execute ready callback immediately
        mockClient.once.mockImplementation((event: string, callback: () => void) => {
          if (event === Events.ClientReady) {
            callback()
          }
          return this
        })
      }
    },
    Events: {
      ClientReady: 'ready',
    },
    GatewayIntentBits: {
      Guilds: 1,
      GuildMessages: 2,
      MessageContent: 4,
    },
    ChannelType: {
      GuildText: 0,
      GuildVoice: 2,
    },
    Collection: MockCollection,
  }
})

describe('discordClient', () => {
  let discordClient: DiscordClient
  let mockClient: any
  let mockGuild: any
  let mockChannel: any
  let mockMessage: any
  const options: Options = {
    token: 'test-token',
    guildId: 'test-guild-id',
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup mock message
    mockMessage = {
      id: 'message-123',
      content: 'test content',
      edit: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    }

    // Setup mock channel
    mockChannel = {
      id: 'channel-123',
      name: 'test-collection',
      type: ChannelType.GuildText,
      send: vi.fn().mockResolvedValue(mockMessage),
      messages: {
        fetch: vi.fn(),
      },
    }

    // Create MockCollection for channels
    class MockCollection extends Map {
      find(fn: (value: any) => boolean) {
        for (const value of this.values()) {
          if (fn(value)) {
            return value
          }
        }
        return undefined
      }
    }

    // Setup mock guild
    mockGuild = {
      id: 'test-guild-id',
      channels: {
        cache: new MockCollection(),
        create: vi.fn().mockResolvedValue(mockChannel),
      },
    }

    discordClient = new DiscordClient(options)
    mockClient = (discordClient as any).client
    mockClient.guilds.cache.set('test-guild-id', mockGuild)
    // Simulate client being ready after instantiation
    mockClient.isReady.mockReturnValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should call login with the provided token', () => {
      expect(mockClient.login).toHaveBeenCalledWith('test-token')
    })
  })

  describe('waitUntilReady', () => {
    it('should resolve immediately when client is already ready', async () => {
      mockClient.isReady.mockReturnValue(true)
      await expect(discordClient.waitUntilReady()).resolves.toBeUndefined()
      // Should not set up an event listener if already ready
      expect(mockClient.once).not.toHaveBeenCalled()
    })

    it('should wait for ready event when client is not ready', async () => {
      // Create a new client instance that is not ready
      mockClient.isReady.mockReturnValue(false)
      const newClient = new DiscordClient(options)
      const newMockClient = (newClient as any).client

      newMockClient.once.mockImplementation((event: string, callback: () => void) => {
        if (event === Events.ClientReady) {
          setTimeout(callback, 10)
        }
      })

      await expect(newClient.waitUntilReady()).resolves.toBeUndefined()
    })

    it('should be callable multiple times', async () => {
      mockClient.isReady.mockReturnValue(true)
      await discordClient.waitUntilReady()
      await expect(discordClient.waitUntilReady()).resolves.toBeUndefined()
    })
  })

  describe('isReady', () => {
    it('should return true when client is ready', () => {
      mockClient.isReady.mockReturnValue(true)
      expect(discordClient.isReady()).toBe(true)
    })

    it('should return false when client is not ready', () => {
      mockClient.isReady.mockReturnValue(false)
      expect(discordClient.isReady()).toBe(false)
    })
  })

  describe('resolveCollectionChannel', () => {
    it('should return existing channel if found', async () => {
      // Mark client as ready
      await discordClient.waitUntilReady()
      mockGuild.channels.cache.set('channel-123', mockChannel)

      const channel = await discordClient.resolveCollectionChannel('test-collection')

      expect(channel).toBe(mockChannel)
      expect(mockGuild.channels.create).not.toHaveBeenCalled()
    })

    it('should create new channel if not found', async () => {
      await discordClient.waitUntilReady()
      mockGuild.channels.cache.clear()

      const channel = await discordClient.resolveCollectionChannel('new-collection')

      expect(mockGuild.channels.create).toHaveBeenCalledWith({
        name: 'new-collection',
        type: ChannelType.GuildText,
      })
      expect(channel).toBe(mockChannel)
    })

    it('should throw error if guild not found', async () => {
      await discordClient.waitUntilReady()
      mockClient.guilds.cache.clear()

      await expect(
        discordClient.resolveCollectionChannel('test-collection'),
      ).rejects.toThrow('Guild not found in cache')
    })

    it('should only return text channels', async () => {
      await discordClient.waitUntilReady()
      const voiceChannel = {
        id: 'voice-123',
        name: 'test-collection',
        type: ChannelType.GuildVoice,
      }

      mockGuild.channels.cache.set('voice-123', voiceChannel)

      await discordClient.resolveCollectionChannel('test-collection')

      expect(mockGuild.channels.create).toHaveBeenCalled()
    })
  })

  describe('sendMessage', () => {
    it('should send message and return message ID', async () => {
      const messageId = await discordClient.sendMessage(mockChannel, 'test content')

      expect(mockChannel.send).toHaveBeenCalledWith('test content')
      expect(messageId).toBe('message-123')
    })

    it('should handle JSON content', async () => {
      const jsonContent = JSON.stringify({ foo: 'bar' })
      const messageId = await discordClient.sendMessage(mockChannel, jsonContent)

      expect(mockChannel.send).toHaveBeenCalledWith(jsonContent)
      expect(messageId).toBe('message-123')
    })
  })

  describe('fetchMessages', () => {
    it('should fetch messages without lastMessageId', async () => {
      const mockCollection = new Map([['msg-1', mockMessage]])
      mockChannel.messages.fetch.mockResolvedValue(mockCollection)

      const messages = await discordClient.fetchMessages(mockChannel)

      expect(mockChannel.messages.fetch).toHaveBeenCalledWith({
        limit: 100,
        before: undefined,
      })
      expect(messages).toBe(mockCollection)
    })

    it('should fetch messages with lastMessageId for pagination', async () => {
      const mockCollection = new Map([['msg-1', mockMessage]])
      mockChannel.messages.fetch.mockResolvedValue(mockCollection)

      const messages = await discordClient.fetchMessages(mockChannel, 'last-msg-id')

      expect(mockChannel.messages.fetch).toHaveBeenCalledWith({
        limit: 100,
        before: 'last-msg-id',
      })
      expect(messages).toBe(mockCollection)
    })
  })

  describe('fetchMessageById', () => {
    it('should fetch and return message by ID', async () => {
      mockChannel.messages.fetch.mockResolvedValue(mockMessage)

      const message = await discordClient.fetchMessageById(mockChannel, 'message-123')

      expect(mockChannel.messages.fetch).toHaveBeenCalledWith('message-123')
      expect(message).toBe(mockMessage)
    })

    it('should return null if message not found', async () => {
      mockChannel.messages.fetch.mockRejectedValue(new Error('Message not found'))

      const message = await discordClient.fetchMessageById(mockChannel, 'invalid-id')

      expect(message).toBeNull()
    })

    it('should return null on fetch error', async () => {
      mockChannel.messages.fetch.mockRejectedValue(new Error('Network error'))

      const message = await discordClient.fetchMessageById(mockChannel, 'message-123')

      expect(message).toBeNull()
    })
  })

  describe('editMessage', () => {
    it('should edit message content', async () => {
      await discordClient.editMessage(mockMessage, 'new content')

      expect(mockMessage.edit).toHaveBeenCalledWith('new content')
    })

    it('should handle JSON content', async () => {
      const jsonContent = JSON.stringify({ updated: true })
      await discordClient.editMessage(mockMessage, jsonContent)

      expect(mockMessage.edit).toHaveBeenCalledWith(jsonContent)
    })
  })

  describe('deleteMessage', () => {
    it('should delete message', async () => {
      await discordClient.deleteMessage(mockMessage)

      expect(mockMessage.delete).toHaveBeenCalled()
    })

    it('should propagate delete errors', async () => {
      mockMessage.delete.mockRejectedValue(new Error('Delete failed'))

      await expect(discordClient.deleteMessage(mockMessage)).rejects.toThrow('Delete failed')
    })
  })
})
