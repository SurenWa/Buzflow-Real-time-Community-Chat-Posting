// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { getModelToken } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { UserDocument } from './models/schemas/user.schema';
// import { SubscriptionDocument } from './models/schemas/subscription.schema';
// import { PostDocument } from './models/schemas/post.schema';
// import { NotificationDocument } from './models/schemas/notification.schema';
// import { MessageDocument } from './models/schemas/message.schema';
// import * as bcrypt from 'bcrypt';
// import { faker } from '@faker-js/faker';

// // ============ CONFIGURATION ============
// const TOTAL_USERS = 50;
// const DEFAULT_PASSWORD = 'password123'; // All seeded users share this password
// const SUBSCRIPTIONS_PER_USER = { min: 3, max: 8 }; // Each user subscribes to 3–8 others
// const POSTS_PER_USER = { min: 0, max: 4 }; // Each user creates 0–4 posts
// const MESSAGES_PER_CONVERSATION = { min: 2, max: 6 }; // Messages between some subscribed pairs
// const CONVERSATION_PROBABILITY = 0.3; // 30% chance two subscribed users have messages
// // ========================================

// async function seed() {
//   const app = await NestFactory.createApplicationContext(AppModule);

//   const userModel = app.get<Model<UserDocument>>(getModelToken('User'));
//   const subscriptionModel = app.get<Model<SubscriptionDocument>>(
//     getModelToken('Subscription'),
//   );
//   const postModel = app.get<Model<PostDocument>>(getModelToken('Post'));
//   const notificationModel = app.get<Model<NotificationDocument>>(
//     getModelToken('Notification'),
//   );
//   const messageModel = app.get<Model<MessageDocument>>(
//     getModelToken('Message'),
//   );

//   // 1) Clear all collections
//   console.log('🗑️  Clearing existing data...');
//   await Promise.all([
//     userModel.deleteMany({}),
//     subscriptionModel.deleteMany({}),
//     postModel.deleteMany({}),
//     notificationModel.deleteMany({}),
//     messageModel.deleteMany({}),
//   ]);

//   // 2) Create users
//   console.log(`👤 Creating ${TOTAL_USERS} users...`);
//   const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

//   const usersData = Array.from({ length: TOTAL_USERS }, (_, i) => {
//     const firstName = faker.person.firstName();
//     const lastName = faker.person.lastName();
//     return {
//       name: `${firstName} ${lastName}`,
//       email: faker.internet.email({ firstName, lastName }).toLowerCase(),
//       password: hashedPassword,
//       isOnline: false,
//       lastSeen: faker.date.recent({ days: 7 }),
//       refreshToken: null,
//     };
//   });

//   // Add a known test user at index 0 for easy login
//   usersData[0] = {
//     name: 'Alice Johnson',
//     email: 'alice@test.com',
//     password: hashedPassword,
//     isOnline: false,
//     lastSeen: new Date(),
//     refreshToken: null,
//   };

//   const users = await userModel.insertMany(usersData);
//   console.log(
//     `✅ Created ${users.length} users. Test user: alice@test.com / ${DEFAULT_PASSWORD}`,
//   );

//   // 3) Create subscriptions
//   console.log('🔗 Creating subscriptions...');
//   const subscriptions: { subscriberId: any; subscribedToId: any }[] = [];

//   for (const user of users) {
//     // Pick random users to subscribe to (excluding self)
//     const otherUsers = users.filter(
//       (u) => u._id.toString() !== user._id.toString(),
//     );
//     const count = faker.number.int(SUBSCRIPTIONS_PER_USER);
//     const targets = faker.helpers.arrayElements(otherUsers, count);

//     for (const target of targets) {
//       // Avoid duplicates
//       const exists = subscriptions.some(
//         (s) =>
//           s.subscriberId.toString() === user._id.toString() &&
//           s.subscribedToId.toString() === target._id.toString(),
//       );
//       if (!exists) {
//         subscriptions.push({
//           subscriberId: user._id,
//           subscribedToId: target._id,
//         });
//       }
//     }
//   }

//   // Make sure Alice (index 0) has some specific subscriptions for testing
//   const alice = users[0];
//   const aliceTargets = users.slice(1, 8); // Subscribe Alice to users 1–7
//   for (const target of aliceTargets) {
//     const exists = subscriptions.some(
//       (s) =>
//         s.subscriberId.toString() === alice._id.toString() &&
//         s.subscribedToId.toString() === target._id.toString(),
//     );
//     if (!exists) {
//       subscriptions.push({
//         subscriberId: alice._id,
//         subscribedToId: target._id,
//       });
//     }
//   }

//   await subscriptionModel.insertMany(subscriptions);
//   console.log(`✅ Created ${subscriptions.length} subscriptions`);

//   // 4) Create posts
//   console.log('📝 Creating posts...');
//   const posts: { authorId: any; content: string; createdAt: Date }[] = [];

//   for (const user of users) {
//     const count = faker.number.int(POSTS_PER_USER);
//     for (let i = 0; i < count; i++) {
//       posts.push({
//         authorId: user._id,
//         content: faker.lorem.sentences({ min: 1, max: 3 }),
//         createdAt: faker.date.recent({ days: 14 }),
//       });
//     }
//   }

//   const createdPosts = await postModel.insertMany(posts);
//   console.log(`✅ Created ${createdPosts.length} posts`);

//   // 5) Create notifications (for each post, notify the author's subscribers)
//   console.log('🔔 Creating notifications...');
//   const notifications: any[] = [];

//   for (const post of createdPosts) {
//     // Find users who are subscribed to this post's author
//     const subs = subscriptions.filter(
//       (s) => s.subscribedToId.toString() === post.authorId.toString(),
//     );

//     const author = users.find(
//       (u) => u._id.toString() === post.authorId.toString(),
//     );

//     for (const sub of subs) {
//       notifications.push({
//         recipientId: sub.subscriberId,
//         fromUserId: post.authorId,
//         postId: post._id,
//         type: 'new_post',
//         message: `${author?.name} made a new post.`,
//         read: faker.datatype.boolean(0.4), // 40% chance already read
//         createdAt: post.createdAt,
//       });
//     }
//   }

//   // Limit to avoid massive insert (cap at 2000)
//   const cappedNotifications = notifications.slice(0, 2000);
//   await notificationModel.insertMany(cappedNotifications);
//   console.log(`✅ Created ${cappedNotifications.length} notifications`);

//   // 6) Create messages between some subscribed pairs
//   console.log('💬 Creating messages...');
//   const messages: any[] = [];

//   // Get Alice's subscriptions for guaranteed test messages
//   const aliceSubscriptions = subscriptions.filter(
//     (s) => s.subscriberId.toString() === alice._id.toString(),
//   );

//   for (const sub of aliceSubscriptions.slice(0, 3)) {
//     // Create a short conversation between Alice and her first 3 subscriptions
//     const partner = users.find(
//       (u) => u._id.toString() === sub.subscribedToId.toString(),
//     );
//     const msgCount = faker.number.int(MESSAGES_PER_CONVERSATION);
//     const baseTime = faker.date.recent({ days: 3 });

//     for (let i = 0; i < msgCount; i++) {
//       const isAliceSending = i % 2 === 0;
//       messages.push({
//         senderId: isAliceSending ? alice._id : partner!._id,
//         receiverId: isAliceSending ? partner!._id : alice._id,
//         content: faker.lorem.sentence(),
//         read: true,
//         createdAt: new Date(baseTime.getTime() + i * 60000), // 1 min apart
//       });
//     }
//   }

//   // Random conversations between other subscribed pairs
//   for (const sub of subscriptions) {
//     if (sub?.subscriberId?.toString() === alice._id.toString()) continue;
//     if (Math.random() > CONVERSATION_PROBABILITY) continue;

//     const msgCount = faker.number.int(MESSAGES_PER_CONVERSATION);
//     const baseTime = faker.date.recent({ days: 7 });

//     for (let i = 0; i < msgCount; i++) {
//       const isSubscriberSending = i % 2 === 0;
//       messages.push({
//         senderId: isSubscriberSending ? sub.subscriberId : sub.subscribedToId,
//         receiverId: isSubscriberSending ? sub.subscribedToId : sub.subscriberId,
//         content: faker.lorem.sentence(),
//         read: faker.datatype.boolean(0.7),
//         createdAt: new Date(baseTime.getTime() + i * 60000),
//       });
//     }
//   }

//   // Cap messages
//   const cappedMessages = messages.slice(0, 3000);
//   await messageModel.insertMany(cappedMessages);
//   console.log(`✅ Created ${cappedMessages.length} messages`);

//   // 7) Summary
//   console.log('\n========== SEED COMPLETE ==========');
//   console.log(`Users:         ${users.length}`);
//   console.log(`Subscriptions: ${subscriptions.length}`);
//   console.log(`Posts:         ${createdPosts.length}`);
//   console.log(`Notifications: ${cappedNotifications.length}`);
//   console.log(`Messages:      ${cappedMessages.length}`);
//   console.log('====================================');
//   console.log(`\n🔑 Test login: alice@test.com / ${DEFAULT_PASSWORD}`);
//   console.log(`   Alice is subscribed to ${aliceSubscriptions.length} users`);

//   await app.close();
//   process.exit(0);
// }

// seed().catch((err) => {
//   console.error('❌ Seed failed:', err);
//   process.exit(1);
// });
