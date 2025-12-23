/**
 * Represents a document stored in DiscordDB with its unique ID
 * @template T - The type of the document data
 */
export type Document<T> = T & { id: string }
