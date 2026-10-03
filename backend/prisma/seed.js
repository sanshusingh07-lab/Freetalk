import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_TOPICS } from '../src/config/constants.js';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seed...');

  const userCount = await prisma.user.count();
  const forceReset = process.env.FORCE_RESET === 'true';

  if (userCount > 0 && !forceReset) {
    console.log(`[Seed] Safe mode: ${userCount} existing users found. Preserving all user data and posts.`);
    console.log('[Seed] Ensuring default topics exist via non-destructive upsert...');
    for (const t of DEFAULT_TOPICS) {
      await prisma.topic.upsert({
        where: { slug: t.slug },
        update: {},
        create: {
          slug: t.slug,
          name: t.name,
          description: t.description,
          icon: t.icon,
          color: t.color,
          postCount: 0,
          followerCount: 15
        }
      });
    }
    console.log('[Seed] Done. All user accounts, posts, and data are 100% preserved.');
    return;
  }

  // Only if brand new database or explicit FORCE_RESET=true:
  console.log('[Seed] Initializing clean database setup...');
  // Clean existing tables in reverse dependency order
  await prisma.argumentQualityVote.deleteMany();
  await prisma.mindChangeVote.deleteMany();
  await prisma.thoughtResponse.deleteMany();
  await prisma.thoughtOfDay.deleteMany();
  await prisma.debateVote.deleteMany();
  await prisma.blindDebate.deleteMany();
  await prisma.ideaVote.deleteMany();
  await prisma.ideaVsIdea.deleteMany();
  await prisma.moderationAction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.moderationResult.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.topicFollow.deleteMany();
  await prisma.anonymousIdentity.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] Cleared existing data.');

  // 1. Seed Topics
  const topicMap = {};
  for (const t of DEFAULT_TOPICS) {
    const createdTopic = await prisma.topic.create({
      data: {
        slug: t.slug,
        name: t.name,
        description: t.description,
        icon: t.icon,
        color: t.color,
        postCount: 0,
        followerCount: 15
      }
    });
    topicMap[t.slug] = createdTopic;
  }
  console.log(`[Seed] Seeded ${DEFAULT_TOPICS.length} topics.`);

  // 2. Hash default password
  const seedPassword = process.env.SEED_ADMIN_PASSWORD || 'Password123!';
  const defaultPasswordHash = await argon2.hash(seedPassword);

  // 3. Create Admin Users & Identities
  const adminEmails = [
    'sanshusinghadmin@gmail.internal',
    'officialfreetalk@gmail.com',
    'admin@freetalk.com'
  ];

  let adminUser = null;
  for (const email of adminEmails) {
    const createdAdmin = await prisma.user.create({
      data: {
        email,
        passwordHash: defaultPasswordHash,
        role: 'ADMIN',
        reputationScore: 500,
        contributionBadge: '🌟 System Guardian',
        interests: ['technology', 'cybersecurity', 'ai']
      }
    });
    if (!adminUser) adminUser = createdAdmin;

    await prisma.anonymousIdentity.create({
      data: {
        displayName: email.includes('sanshu') ? 'Anonymous Oracle' : 'Master Overseer',
        avatarShape: 'celestial',
        avatarColor: '#8B5CF6',
        avatarSeed: `admin-${email}-seed`,
        userId: createdAdmin.id
      }
    });
  }

  // 4. Create Moderator User & Identity
  const modUser = await prisma.user.create({
    data: {
      email: 'moderator.safety@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'MODERATOR',
      reputationScore: 350,
      contributionBadge: '🛡️ Safety Steward',
      interests: ['opinions', 'life', 'technology']
    }
  });

  const modIdentity = await prisma.anonymousIdentity.create({
    data: {
      displayName: 'Anonymous Guardian',
      avatarShape: 'geometric',
      avatarColor: '#06B6D4',
      avatarSeed: 'mod-guardian-seed',
      userId: modUser.id
    }
  });

  // 5. Create Active Users & Identities (Real email addresses)
  const user1 = await prisma.user.create({
    data: {
      email: 'alex.morgan92@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'USER',
      reputationScore: 240,
      contributionBadge: '🌿 Positive Contributor',
      interests: ['ai', 'programming', 'technology', 'career']
    }
  });
  const id1 = await prisma.anonymousIdentity.create({
    data: {
      displayName: 'Anonymous Fox',
      avatarShape: 'organic',
      avatarColor: '#F97316',
      avatarSeed: 'anon-fox-2026',
      userId: user1.id
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'priya.sharma.tech@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'USER',
      reputationScore: 180,
      contributionBadge: '🌱 Thoughtful Voice',
      interests: ['programming', 'cybersecurity', 'science']
    }
  });
  const id2 = await prisma.anonymousIdentity.create({
    data: {
      displayName: 'Anonymous Raven',
      avatarShape: 'elemental',
      avatarColor: '#6366F1',
      avatarSeed: 'anon-raven-2026',
      userId: user2.id
    }
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'david.kim.design@outlook.com',
      passwordHash: defaultPasswordHash,
      role: 'USER',
      reputationScore: 140,
      contributionBadge: '🌱 Curious Mind',
      interests: ['career', 'life', 'opinions']
    }
  });
  const id3 = await prisma.anonymousIdentity.create({
    data: {
      displayName: 'Anonymous Pixel',
      avatarShape: 'geometric',
      avatarColor: '#10B981',
      avatarSeed: 'anon-pixel-2026',
      userId: user3.id
    }
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'elena.rostova@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'USER',
      reputationScore: 160,
      contributionBadge: '🌱 Curious Mind',
      interests: ['gaming', 'movies', 'music']
    }
  });
  const id4 = await prisma.anonymousIdentity.create({
    data: {
      displayName: 'Anonymous Moon',
      avatarShape: 'celestial',
      avatarColor: '#EC4899',
      avatarSeed: 'anon-moon-2026',
      userId: user4.id
    }
  });

  console.log('[Seed] Created active users (Admin: sanshusinghadmin@gmail.internal, Mod, Alex, Priya, David, Elena).');

  // Follow topics
  for (const topicId of [topicMap['ai'].id, topicMap['programming'].id, topicMap['technology'].id]) {
    await prisma.topicFollow.create({ data: { userId: user1.id, topicId } });
    await prisma.topicFollow.create({ data: { userId: user2.id, topicId } });
  }

  // 6. Discussion 1: AI & Programmers (Section 14 & 15)
  const post1 = await prisma.post.create({
    data: {
      title: 'Will AI make programmers more productive or eventually replace them?',
      content: 'As LLMs and autonomous coding agents advance rapidly, software engineering is undergoing an existential shift. Will we simply become system architects directing high-level intent, or will the barrier to entry drop so low that traditional software jobs fundamentally diminish? What does this mean for students and early-career engineers?',
      postType: 'DISCUSSION',
      status: 'PUBLISHED',
      hashtags: ['ai', 'programming', 'futureofwork'],
      views: 342,
      score: 48,
      trendingScore: 18.5,
      userId: user1.id,
      identityId: id1.id,
      topicId: topicMap['ai'].id
    }
  });

  // Threaded replies on Post 1
  const comment1 = await prisma.comment.create({
    data: {
      postId: post1.id,
      userId: user2.id,
      identityId: id2.id,
      content: 'I see it as the evolution from Assembly to C, and from C to Python. Abstraction increases, but understanding architectural tradeoffs, concurrency, and security boundaries will remain indispensable.',
      status: 'PUBLISHED'
    }
  });

  const comment2 = await prisma.comment.create({
    data: {
      postId: post1.id,
      parentId: comment1.id,
      userId: user3.id,
      identityId: id3.id,
      content: 'Agreed with Raven. The biggest bottleneck in software has never been typing syntax; it is clarifying ambiguous product requirements and edge cases.',
      status: 'PUBLISHED'
    }
  });

  await prisma.comment.create({
    data: {
      postId: post1.id,
      parentId: comment2.id,
      userId: user4.id,
      identityId: id4.id,
      content: 'Exactly. Code is liability, not an asset. Having an AI write 5,000 lines in seconds means someone still needs to debug the obscure race condition at 3 AM.',
      status: 'PUBLISHED'
    }
  });

  // Reactions on Post 1
  await prisma.reaction.create({ data: { userId: user2.id, postId: post1.id, reactionType: 'AGREE' } });
  await prisma.reaction.create({ data: { userId: user3.id, postId: post1.id, reactionType: 'INSIGHTFUL' } });
  await prisma.reaction.create({ data: { userId: user4.id, postId: post1.id, reactionType: 'THOUGHT_PROVOKING' } });
  await prisma.reaction.create({ data: { userId: adminUser.id, postId: post1.id, reactionType: 'STRONG_POINT' } });

  // 7. Discussion 2: Privacy Philosophy
  const post2 = await prisma.post.create({
    data: {
      title: 'Privacy is not about having something to hide. It is about the dignity of thought.',
      content: 'When people say "I have nothing to hide, so why should I care about privacy?", they misunderstand the premise. Surveillance chills unorthodox curiosity and forces conformity before ideas can mature. Without anonymous spaces to challenge assumptions without reputational ruin, culture stagnates.',
      postType: 'DISCUSSION',
      status: 'PUBLISHED',
      hashtags: ['cybersecurity', 'privacy', 'philosophy'],
      views: 289,
      score: 35,
      trendingScore: 14.2,
      userId: user2.id,
      identityId: id2.id,
      topicId: topicMap['cybersecurity'].id
    }
  });

  await prisma.reaction.create({ data: { userId: user1.id, postId: post2.id, reactionType: 'INSIGHTFUL' } });
  await prisma.reaction.create({ data: { userId: user3.id, postId: post2.id, reactionType: 'AGREE' } });

  // 8. Discussion 3: Poll on AI Regulation (Section 18)
  const pollPost = await prisma.post.create({
    data: {
      title: 'What should AI regulation focus on first?',
      content: 'Governments and standards bodies worldwide are proposing safety pacts, copyright rules, and privacy frameworks. Where should the primary regulatory focus be right now?',
      postType: 'POLL',
      status: 'PUBLISHED',
      hashtags: ['ai', 'policy', 'ethics'],
      views: 412,
      score: 52,
      trendingScore: 22.0,
      userId: user3.id,
      identityId: id3.id,
      topicId: topicMap['ai'].id
    }
  });

  const poll = await prisma.poll.create({
    data: {
      postId: pollPost.id,
      question: 'What should AI regulation focus on first?',
      totalVotes: 4,
      options: {
        create: [
          { text: 'Model Safety & Catastrophic Risk Prevention', voteCount: 2 },
          { text: 'User Privacy & Data Protection Rights', voteCount: 1 },
          { text: 'Copyright & Training Data Compensation', voteCount: 0 },
          { text: 'Workforce Transition & Economic Impact', voteCount: 1 }
        ]
      }
    },
    include: { options: true }
  });

  // Seed sample votes
  await prisma.pollVote.create({ data: { pollId: poll.id, pollOptionId: poll.options[0].id, userId: user1.id } });
  await prisma.pollVote.create({ data: { pollId: poll.id, pollOptionId: poll.options[0].id, userId: user2.id } });
  await prisma.pollVote.create({ data: { pollId: poll.id, pollOptionId: poll.options[1].id, userId: user4.id } });
  await prisma.pollVote.create({ data: { pollId: poll.id, pollOptionId: poll.options[3].id, userId: adminUser.id } });

  // 9. Flagged Post for Moderation Queue Demo (Section 34)
  const flaggedPost = await prisma.post.create({
    data: {
      title: 'This idiot project is pure garbage and should be deleted immediately',
      content: 'Anyone working on this should quit their job right now, you morons have no idea what you are doing.',
      postType: 'DISCUSSION',
      status: 'PENDING_REVIEW',
      hashtags: ['complaint'],
      userId: user4.id,
      identityId: id4.id,
      topicId: topicMap['opinions'].id
    }
  });

  await prisma.moderationResult.create({
    data: {
      postId: flaggedPost.id,
      targetType: 'POST',
      toxicityScore: 0.84,
      harassmentScore: 0.65,
      spamScore: 0.1,
      threatScore: 0.2,
      riskLevel: 'HIGH',
      recommendedAction: 'review',
      flaggedKeywords: ['idiot', 'garbage', 'morons']
    }
  });

  await prisma.report.create({
    data: {
      reporterUserId: user1.id,
      targetType: 'POST',
      postId: flaggedPost.id,
      reason: 'HARASSMENT',
      explanation: 'Unconstructive aggressive personal insults against community members.',
      status: 'PENDING'
    }
  });

  // 10. Unique Feature: Thought of the Day (Section 52)
  const thought = await prisma.thoughtOfDay.create({
    data: {
      prompt: 'What opinion or belief did you hold strongly that you changed your mind on recently?',
      category: 'Introspection',
      isActive: true
    }
  });

  await prisma.thoughtResponse.create({
    data: {
      thoughtId: thought.id,
      userId: user1.id,
      identityId: id1.id,
      content: 'I used to believe extreme specialization was the only way to excel in tech. Now I realize generalists who can synthesize across disciplines produce far more innovative solutions.',
      upvotes: 14
    }
  });

  await prisma.thoughtResponse.create({
    data: {
      thoughtId: thought.id,
      userId: user2.id,
      identityId: id2.id,
      content: 'I thought working 70 hours a week was the only badge of passion. After burning out, I discovered that rest and boundaries actually generate higher quality architectural insights.',
      upvotes: 21
    }
  });

  // 11. Unique Feature: Blind Debate (Section 53)
  await prisma.blindDebate.create({
    data: {
      topic: 'Should anonymous speech remain an unconditional constitutional protection on the internet?',
      category: 'Digital Civil Liberties',
      sideATitle: 'Unconditional Anonymity is Fundamental',
      sideAContent: 'Without anonymity, state actors and corporate monopolies can target whistleblowers, dissidents, and minorities with devastating precision. Chilling speech destroys democracy.',
      sideBTitle: 'Identity Verification with Privacy Preserving Proofs',
      sideBContent: 'Unchecked anonymity enables industrial-scale bot campaigns, defamation, and untraceable criminal fraud. Cryptographic proof of humanhood (zero-knowledge) preserves privacy without enabling lawless bots.',
      votesA: 38,
      votesB: 29
    }
  });

  // 12. Unique Feature: Idea vs Idea (Section 54)
  await prisma.ideaVsIdea.create({
    data: {
      title: 'Remote-First Engineering vs Co-Located Hubs',
      description: 'Which organizational model generates higher long-term software quality and team resilience?',
      optionATitle: 'Remote-First Architecture',
      optionADesc: 'Deep asynchronous work, written RFC culture, global talent pool, and zero commute exhaustion.',
      optionBTitle: 'Co-Located Hubs',
      optionBDesc: 'High-bandwidth whiteboarding, spontaneous serendipity, rapid mentorship, and organic emotional trust.',
      votesA: 64,
      votesB: 37
    }
  });

  console.log('[Seed] Database seeded successfully with full test suite data!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
