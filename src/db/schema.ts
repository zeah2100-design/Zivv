import { pgTable, serial, text, varchar, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const postTypeEnum = pgEnum('post_type', ['text', 'image', 'video', 'short_video', 'music']);
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'rejected']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['pending', 'approved', 'rejected']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password'),
  phone: varchar('phone', { length: 20 }),
  googleId: varchar('google_id', { length: 255 }),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  coverUrl: text('cover_url'),
  birthDate: timestamp('birth_date'),
  isAdmin: boolean('is_admin').default(false),
  isGoldMember: boolean('is_gold_member').default(false),
  isBanned: boolean('is_banned').default(false),
  chatPassword: text('chat_password'),
  authProvider: varchar('auth_provider', { length: 20 }).default('email'),
  isVerified: boolean('is_verified').default(false),
  verificationCode: varchar('verification_code', { length: 6 }),
  verificationExpires: timestamp('verification_expires'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Posts table
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: postTypeEnum('type').notNull(),
  content: text('content'),
  mediaUrl: text('media_url'),
  thumbnailUrl: text('thumbnail_url'),
  views: integer('views').default(0),
  isApproved: boolean('is_approved').default(true),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Likes table
export const likes = pgTable('likes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  postId: integer('post_id').references(() => posts.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Comments table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  postId: integer('post_id').references(() => posts.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Friendships table
export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id).notNull(),
  receiverId: integer('receiver_id').references(() => users.id).notNull(),
  status: friendshipStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Followers table
export const followers = pgTable('followers', {
  id: serial('id').primaryKey(),
  followerId: integer('follower_id').references(() => users.id).notNull(),
  followingId: integer('following_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Messages table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id).notNull(),
  receiverId: integer('receiver_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  isProtected: boolean('is_protected').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Gold subscription requests
export const goldRequests = pgTable('gold_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: subscriptionStatusEnum('status').default('pending'),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
});

// AI Chat history
export const aiChats = pgTable('ai_chats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  response: text('response').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Music table
export const music = pgTable('music', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  artist: varchar('artist', { length: 255 }),
  audioUrl: text('audio_url').notNull(),
  coverUrl: text('cover_url'),
  duration: integer('duration'),
  plays: integer('plays').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Stories table
export const stories = pgTable('stories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  mediaUrl: text('media_url').notNull(),
  mediaType: varchar('media_type', { length: 20 }).notNull(), // 'image' or 'video'
  caption: text('caption'),
  views: integer('views').default(0),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Story views table
export const storyViews = pgTable('story_views', {
  id: serial('id').primaryKey(),
  storyId: integer('story_id').references(() => stories.id).notNull(),
  viewerId: integer('viewer_id').references(() => users.id).notNull(),
  viewedAt: timestamp('viewed_at').defaultNow(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Like = typeof likes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type GoldRequest = typeof goldRequests.$inferSelect;
export type Music = typeof music.$inferSelect;
