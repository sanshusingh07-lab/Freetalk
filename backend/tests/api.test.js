import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../src/server.js';
import { getDispatchedEmails } from '../src/services/emailService.js';
import { validateImageMagicBytes } from '../src/middleware/upload.js';
import { recordAuthFailure, recordAuthSuccess } from '../src/middleware/rateLimiter.js';
import { getJwtSecret } from '../src/utils/tokenUtils.js';

describe('FreeTalk Backend API Tests', () => {
  let authCookie = null;

  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/auth/login authenticates active user and returns safe public identity', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.morgan92@gmail.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    // Verify password hash and internal secrets are NEVER returned
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.activeIdentity).toBeDefined();
    expect(res.body.user.activeIdentity.displayName).toBe('Anonymous Fox');

    // Extract cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    authCookie = cookies[0];
  });

  it('POST /api/auth/login authenticates sanshusinghadmin@gmail.internal with ADMIN role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sanshusinghadmin@gmail.internal',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.user.activeIdentity.displayName).toBe('Anonymous Oracle');
  });

  it('POST /api/auth/send-otp dispatches OTP for login with valid user credentials', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({
        email: 'alex.morgan92@gmail.com',
        password: 'Password123!',
        purpose: 'LOGIN'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.otpRequired).toBe(true);
  });

  it('POST /api/auth/send-otp skips OTP for admin account', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({
        email: 'sanshusinghadmin@gmail.internal',
        password: 'Password123!',
        purpose: 'LOGIN'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.otpRequired).toBe(false);
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/send-otp dispatches OTP for registration', async () => {
    const uniqueEmail = `test.otp.${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({
        email: uniqueEmail,
        purpose: 'REGISTER'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.otpRequired).toBe(true);
  });

  it('GET /api/posts returns discussions with public anonymous author', async () => {
    const res = await request(app).get('/api/posts?feed=explore');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const firstPost = res.body.data[0];
    expect(firstPost.title).toBeDefined();
    expect(firstPost.identity).toBeDefined();
    expect(firstPost.identity.displayName).toContain('Anonymous');
    // Ensure no email or user credentials leaked in post object
    expect(firstPost.email).toBeUndefined();
    expect(firstPost.userId).toBeUndefined();
  });

  it('GET /api/topics returns seeded topics', async () => {
    const res = await request(app).get('/api/topics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.topics.length).toBe(15);
  });

  it('POST /api/posts creates an anonymous discussion when authenticated', async () => {
    // Get topic ID
    const topicsRes = await request(app).get('/api/topics');
    const topicId = topicsRes.body.topics[0].id;

    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', authCookie)
      .send({
        title: 'Is quantum encryption viable for decentralized nodes?',
        content: 'Investigating post-quantum lattice cryptography algorithms for anonymous mesh communication protocols.',
        topicId: topicId,
        hashtags: ['cryptography', 'privacy']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.post.identity.displayName).toBe('Anonymous Fox');
  });

  it('GET /api/features/thought-of-day returns active prompt', async () => {
    const res = await request(app).get('/api/features/thought-of-day');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.thought).toBeDefined();
    expect(res.body.thought.prompt).toContain('mind');
  });

  it('GET /api/features/debates returns blind debate topics', async () => {
    const res = await request(app).get('/api/features/debates');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.debates.length).toBeGreaterThan(0);
  });

  /* ==========================================================================
     IN-BUILT AI TESTS: CONTENT PREDICTOR, BADWORD BLOCKING, TRENDS & ASSISTANT
     ========================================================================== */

  it('POST /api/ai/predict-content predicts clean content as safe', async () => {
    const res = await request(app)
      .post('/api/ai/predict-content')
      .send({
        title: 'Constructive Ideas for Distributed Systems',
        content: 'I believe event-driven architectures offer superior decoupling compared to traditional monoliths.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isSafe).toBe(true);
    expect(res.body.data.detectedBadwords.length).toBe(0);
  });

  it('POST /api/ai/predict-content flags badwords and generates cleaned text', async () => {
    const res = await request(app)
      .post('/api/ai/predict-content')
      .send({
        title: 'Hostile attack',
        content: 'You are a complete idiot and moron, shut the fuck up'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isSafe).toBe(false);
    expect(res.body.data.instantAction).toBe('BLOCKED');
    expect(res.body.data.detectedBadwords.length).toBeGreaterThan(0);
    expect(res.body.data.cleanedContent).toContain('*');
  });

  it('POST /api/posts rejects posts containing prohibited badwords immediately', async () => {
    const topicsRes = await request(app).get('/api/topics');
    const topicId = topicsRes.body.topics[0].id;

    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', authCookie)
      .send({
        title: 'Abusive title',
        content: 'You are an asshole and dipshit get lost',
        topicId: topicId,
        hashtags: ['test']
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('PROHIBITED_CONTENT');
    expect(res.body.detectedBadwords).toBeDefined();
    expect(res.body.detectedBadwords.length).toBeGreaterThan(0);
  });

  it('POST /api/ai/assistant/chat audits user drafts in conversational mode', async () => {
    const res = await request(app)
      .post('/api/ai/assistant/chat')
      .send({
        message: 'draft: You are an idiot and this project is worthless trash'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.response.actionType).toBe('DRAFT_AUDIT');
    expect(res.body.response.reply).toContain('Flagged Prohibited Language');
    expect(res.body.response.data.isSafe).toBe(false);
  });

  it('POST /api/ai/assistant/chat answers privacy inquiries', async () => {
    const res = await request(app)
      .post('/api/ai/assistant/chat')
      .send({
        message: 'How is my privacy protected on this platform?'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.response.actionType).toBe('PRIVACY_GUIDE');
    expect(res.body.response.reply).toContain('Zero Credential Exposure');
  });

  it('GET /api/ai/trending-insights returns ranked topics with velocity calculations', async () => {
    const res = await request(app).get('/api/ai/trending-insights');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.trending.length).toBeGreaterThan(0);
    const top = res.body.trending[0];
    expect(top.trendingRank).toBe(1);
    expect(top.velocityScore).toBeDefined();
    expect(top.surgePercentage).toBeDefined();
    expect(top.aiSummary).toBeDefined();
  });

  // === 15 INNOVATIONS TESTS ===
  it('GET /api/features/debates returns blind debates with randomized anonymous aliases', async () => {
    const res = await request(app).get('/api/features/debates');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.debates).toBeDefined();
    if (res.body.debates.length > 0) {
      const debate = res.body.debates[0];
      expect(debate.sideAAuthorAlias).toBeDefined();
      expect(debate.sideBAuthorAlias).toBeDefined();
      expect(debate.mindChangeStats).toBeDefined();
    }
  });

  it('GET /api/features/random-prompt returns roulette philosophical topic', async () => {
    const res = await request(app).get('/api/features/random-prompt');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.prompt.question).toBeDefined();
    expect(res.body.prompt.category).toBeDefined();
  });

  it('GET /api/user/insights returns private discussion metrics without vanity follower scores', async () => {
    const res = await request(app)
      .get('/api/user/insights')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.insights).toBeDefined();
    expect(res.body.insights.discussionsCount).toBeDefined();
    expect(res.body.insights.repliesCount).toBeDefined();
    expect(res.body.insights.constructiveToneAverage).toBeDefined();
    // Verify strictly NO follower counts exist
    expect(res.body.insights.followersCount).toBeUndefined();
  });

  it('POST /api/user/ghost-mode toggles invisible browsing mode', async () => {
    const res = await request(app)
      .post('/api/user/ghost-mode')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.isGhostMode).toBe('boolean');
  });

  it('POST /api/features/mind-change records anonymous opinion shift on post', async () => {
    const postsRes = await request(app).get('/api/posts');
    const postId = postsRes.body.data[0].id;

    const res = await request(app)
      .post('/api/features/mind-change')
      .set('Cookie', authCookie)
      .send({
        targetType: 'POST',
        targetId: postId,
        opinionChange: 'YES'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.YES).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/quality/vote awards argument quality tag', async () => {
    const postsRes = await request(app).get('/api/posts');
    const postId = postsRes.body.data[0].id;

    const res = await request(app)
      .post('/api/quality/vote')
      .set('Cookie', authCookie)
      .send({
        targetType: 'POST',
        targetId: postId,
        qualityTag: 'WELL_EXPLAINED'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.quality).toBeDefined();
  });

  it('GET /api/posts/:id/perspectives synthesizes contrasting perspectives', async () => {
    const postsRes = await request(app).get('/api/posts');
    const postId = postsRes.body.data[0].id;

    const res = await request(app).get(`/api/posts/${postId}/perspectives`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.perspectives).toBeDefined();
    expect(res.body.perspectives.sideA).toBeDefined();
    expect(res.body.perspectives.sideB).toBeDefined();
    expect(res.body.perspectives.synthesis).toBeDefined();
  });

  it('POST /api/auth/change-password rejects incorrect current password', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', authCookie)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'BrandNewPassword123!'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
  });

  it('POST /api/auth/change-password successfully changes password and validates new login', async () => {
    // 1. Change to new password
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', authCookie)
      .send({
        currentPassword: 'Password123!',
        newPassword: 'BrandNewPassword123!'
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.success).toBe(true);

    // 2. Old password fails
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.morgan92@gmail.com',
        password: 'Password123!'
      });
    expect(oldLoginRes.status).toBe(401);

    // 3. New password succeeds
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.morgan92@gmail.com',
        password: 'BrandNewPassword123!'
      });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.success).toBe(true);

    // 4. Revert back to Password123! for idempotency
    const revertCookie = newLoginRes.headers['set-cookie'][0];
    await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', revertCookie)
      .send({
        currentPassword: 'BrandNewPassword123!',
        newPassword: 'Password123!'
      });
  });

  it('GET /api/topics/:slug returns topic details', async () => {
    const res = await request(app).get('/api/topics/programming');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.topic).toBeDefined();
    expect(res.body.topic.slug).toBe('programming');
  });

  it('GET /api/messages/recipients returns available anonymous recipients for personal chat', async () => {
    const res = await request(app)
      .get('/api/messages/recipients')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.recipients)).toBe(true);
    expect(res.body.recipients.length).toBeGreaterThan(0);
    expect(res.body.recipients[0].displayName).toBeDefined();
    expect(res.body.recipients[0].avatarSeed).toBeDefined();
  });

  it('dispatches security alert email on successful login', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.morgan92@gmail.com',
        password: 'Password123!'
      });

    await new Promise(r => setTimeout(r, 100));

    const emails = getDispatchedEmails();
    const loginEmail = emails.find(e => e.type === 'LOGIN' && e.to === 'alex.morgan92@gmail.com');
    expect(loginEmail).toBeDefined();
    expect(loginEmail.subject).toContain('Successful Login');
  });

  it('dispatches welcome email on new user registration', async () => {
    const testEmail = `test.user.${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'SecurePassword123!',
        interests: ['technology']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    await new Promise(r => setTimeout(r, 100));

    const emails = getDispatchedEmails();
    const signupEmail = emails.find(e => e.type === 'SIGNUP' && e.to === testEmail);
    expect(signupEmail).toBeDefined();
    expect(signupEmail.subject).toContain('Account Created Successfully');
  });

  describe('Security Hardening Suite', () => {
    it('rejects invalid email format on registration with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-a-valid-email',
          password: 'Password123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].field).toBe('email');
    });

    it('rejects short password on registration with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid.user@example.com',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors[0].field).toBe('password');
    });

    it('rejects malformed non-UUID parameters with 400 VALIDATION_ERROR', async () => {
      const res = await request(app).get('/api/posts/not-a-uuid-1234');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors[0].field).toBe('id');
    });

    it('rejects invalid quality vote payloads strictly with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/quality/vote')
        .set('Cookie', authCookie)
        .send({
          targetType: 'INVALID_TYPE',
          targetId: '47d9bdf2-f8ab-4ec6-89ba-08b5f3ee6f63',
          qualityTag: 'NOT_A_TAG'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('enforces account-keyed exponential backoff on repeated failed logins', async () => {
      const targetEmail = `backoff.target.${Date.now()}@example.com`;

      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordAuthFailure(targetEmail);
      }

      // Next attempt should trigger 429 with AUTH_BACKOFF_ACTIVE
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: targetEmail,
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('AUTH_BACKOFF_ACTIVE');
      expect(res.headers['retry-after']).toBeDefined();

      // Reset upon success
      recordAuthSuccess(targetEmail);
    });

    it('attaches X-Request-Id correlation header and never leaks stack traces', async () => {
      const res = await request(app).get('/api/posts/00000000-0000-0000-0000-000000000000');
      
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.body.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('\\backend\\');
      expect(JSON.stringify(res.body)).not.toContain('node_modules');
    });

    it('inspects magic bytes correctly and rejects spoofed files', () => {
      const tempDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const fakeImagePath = path.join(tempDir, `test-spoofed-${Date.now()}.png`);
      const validImagePath = path.join(tempDir, `test-valid-${Date.now()}.png`);

      try {
        // Fake image: text/script masquerading as PNG
        fs.writeFileSync(fakeImagePath, '<html><script>alert("xss")</script></html>');
        expect(validateImageMagicBytes(fakeImagePath)).toBe(false);

        // Valid image: genuine PNG magic header [89 50 4E 47 0D 0A 1A 0A]
        const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]);
        fs.writeFileSync(validImagePath, pngHeader);
        expect(validateImageMagicBytes(validImagePath)).toBe(true);
      } finally {
        if (fs.existsSync(fakeImagePath)) fs.unlinkSync(fakeImagePath);
        if (fs.existsSync(validImagePath)) fs.unlinkSync(validImagePath);
      }
    });

    it('rejects spoofed file upload on /api/posts with 400 INVALID_FILE_CONTENT', async () => {
      const topicsRes = await request(app).get('/api/topics');
      const topicId = topicsRes.body.topics[0]?.id;

      const res = await request(app)
        .post('/api/posts')
        .set('Cookie', authCookie)
        .field('title', 'Security Validation Post')
        .field('content', 'Testing upload magic bytes verification logic.')
        .field('topicId', topicId)
        .attach('media', Buffer.from('console.log("malicious code");'), {
          filename: 'spoofed.png',
          contentType: 'image/png'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_FILE_CONTENT');
    });

    it('serves static /uploads with strict sandboxing security headers', async () => {
      const res = await request(app).get('/uploads/nonexistent-file.png');
      expect(res.headers['content-security-policy']).toContain("default-src 'none'");
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('validates JWT_SECRET handling in tokenUtils', () => {
      const secret = getJwtSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(10);
    });
  });
});

