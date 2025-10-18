import { Hono } from "hono";
import { cors } from "hono/cors";
import { 
  getOAuthRedirectUrl, 
  exchangeCodeForSessionToken, 
  authMiddleware, 
  deleteSession, 
  MOCHA_SESSION_TOKEN_COOKIE_NAME 
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { 
  UserSchema, 
  ProjectSchema, 
  CreateProjectSchema,
  CreateUserSchema,
  LoginUserSchema,
  AudioFileSchema,
  MarketplaceItemSchema,
  CreatePaymentIntentSchema,
  SubscriptionUpgradeSchema,
  SuiteSchema,
  SuiteParticipantSchema,
  CreateSuiteSchema,
  UpdateSuiteParticipantSchema,
  ReportUserSchema,
  LiveSessionSchema,
  SessionParticipantSchema,
  SessionSubmissionSchema,
  SessionChatSchema,
  CreateLiveSessionSchema,
  SubmitMusicSchema,
  CreateBeatListingSchema,
  CreateBeatReviewSchema,
  BeatLicenseSchema,
  BeatReviewSchema,
  SellerAnalyticsSchema
} from "@/shared/types";
import Stripe from 'stripe';

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: "*",
  allowHeaders: ["*"],
  allowMethods: ["*"],
}));

// Initialize Stripe
const getStripe = (env: any) => {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  });
};

// Utility functions
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const generateSessionToken = (): string => {
  return crypto.randomUUID() + '-' + crypto.randomUUID();
};

const createSession = async (c: any, userId: string): Promise<string> => {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

  await c.env.DB.prepare(`
    INSERT INTO user_sessions (id, user_id, session_token, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    crypto.randomUUID(),
    userId,
    sessionToken,
    expiresAt.toISOString()
  ).run();

  return sessionToken;
};

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

// Custom auth middleware for manual authentication
const customAuthMiddleware = async (c: any, next: any) => {
  // First try Mocha auth middleware for OAuth users
  try {
    const mochaUser = c.get('user');
    if (mochaUser) {
      return next();
    }
  } catch (error) {
    // Continue to check manual auth if Mocha auth fails
  }

  // Check for manual authentication session
  const sessionToken = getCookie(c, 'cerebral_session_token');
  if (!sessionToken) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // Verify session in database
  const { results } = await c.env.DB.prepare(`
    SELECT u.*, s.session_token 
    FROM users u 
    JOIN user_sessions s ON u.id = s.user_id 
    WHERE s.session_token = ? AND s.expires_at > datetime('now')
  `).bind(sessionToken).all();

  if (results.length === 0) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  const user = results[0] as any;
  // Set user in context for compatibility
  c.set('user', {
    id: user.id as string,
    email: user.email as string,
    google_user_data: {
      email: user.email as string,
      name: user.display_name as string,
      picture: user.avatar_url as string
    }
  });

  return next();
};

// Authentication endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

// Apple OAuth support (placeholder - would need Apple Developer account setup)
app.get('/api/oauth/apple/redirect_url', async (c) => {
  // For now, return an error since Apple OAuth requires additional setup
  return c.json({ 
    error: 'Apple OAuth coming soon! Use Google OAuth or email signup for now.' 
  }, 501);
});

// Manual user registration
app.post('/api/auth/signup', async (c) => {
  try {
    const body = await c.req.json();
    const data = CreateUserSchema.parse(body);

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.message }, 400);
    }

  try {
    // Check if user already exists
      const { results: existingUsers } = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(data.email.toLowerCase()).all();

      if (existingUsers.length > 0) {
        return c.json({ error: 'User with this email already exists' }, 409);
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);
      
      // Create user
      const userId = crypto.randomUUID();
      const verificationToken = crypto.randomUUID();

      await c.env.DB.prepare(`
        INSERT INTO users (
          id, email, display_name, password_hash, auth_provider, 
          email_verified, verification_token, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        userId,
        data.email.toLowerCase(),
        data.displayName || data.email.split('@')[0],
        passwordHash,
        'manual',
        0, // Email not verified initially
        verificationToken
      ).run();

      // Create session
      const sessionToken = await createSession(c, userId);

      // Set session cookie
      setCookie(c, 'cerebral_session_token', sessionToken, {
        httpOnly: true,
        path: '/',
        sameSite: 'none',
        secure: true,
        maxAge: 60 * 24 * 60 * 60, // 60 days
      });

      return c.json({ 
        success: true, 
        message: 'Account created successfully',
        user: {
          id: userId,
          email: data.email.toLowerCase(),
          display_name: data.displayName || data.email.split('@')[0],
          email_verified: false
        }
      }, 201);

    } catch (error) {
      console.error('Signup error:', error);
      return c.json({ error: 'Failed to create account' }, 500);
    }
  } catch (parseError) {
    return c.json({ error: 'Invalid input data' }, 400);
  }
});

// Manual user login
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const data = LoginUserSchema.parse(body);

  try {
      // Find user
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM users WHERE email = ? AND auth_provider = ?'
      ).bind(data.email.toLowerCase(), 'manual').all();

      if (results.length === 0) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }

      const user = results[0] as any;

      // Verify password
      const isPasswordValid = await comparePassword(data.password, user.password_hash);
      if (!isPasswordValid) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }

      // Create session
      const sessionToken = await createSession(c, user.id);

      // Set session cookie
      setCookie(c, 'cerebral_session_token', sessionToken, {
        httpOnly: true,
        path: '/',
        sameSite: 'none',
        secure: true,
        maxAge: 60 * 24 * 60 * 60, // 60 days
      });

      return c.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          email_verified: user.email_verified
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Login failed' }, 500);
    }
  } catch (parseError) {
    return c.json({ error: 'Invalid input data' }, 400);
  }
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", async (c) => {
  // Try OAuth authentication first
  let user = null;
  let mochaUser = null;
  
  try {
    const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
    if (sessionToken) {
      // This will throw if invalid, which is fine
      await authMiddleware(c, async () => {});
      mochaUser = c.get("user");
    }
  } catch (error) {
    // OAuth auth failed, try manual auth
  }

  if (mochaUser) {
    // Handle OAuth user
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(mochaUser.id).all();

    if (results.length === 0) {
      // Create user record for OAuth user
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, display_name, avatar_url, auth_provider, email_verified, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        mochaUser.id, 
        mochaUser.email,
        mochaUser.google_user_data.name || mochaUser.email,
        mochaUser.google_user_data.picture || null,
        'google',
        1
      ).run();

      user = {
        id: mochaUser.id,
        email: mochaUser.email,
        display_name: mochaUser.google_user_data.name || mochaUser.email,
        avatar_url: mochaUser.google_user_data.picture || null,
        subscription_plan: 'basic',
        storage_used_bytes: 0,
        storage_limit_bytes: 536870912000,
        auth_provider: 'google',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      user = results[0];
    }
  } else {
    // Try manual authentication
    const sessionToken = getCookie(c, 'cerebral_session_token');
    if (!sessionToken) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    // Verify manual session
    const { results } = await c.env.DB.prepare(`
      SELECT u.* 
      FROM users u 
      JOIN user_sessions s ON u.id = s.user_id 
      WHERE s.session_token = ? AND s.expires_at > datetime('now')
    `).bind(sessionToken).all();

    if (results.length === 0) {
      return c.json({ error: "Invalid or expired session" }, 401);
    }

    user = results[0];
  }

  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  return c.json(UserSchema.parse({
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    subscription_plan: user.subscription_plan || 'basic',
    storage_used_bytes: user.storage_used_bytes || 0,
    storage_limit_bytes: user.storage_limit_bytes || 536870912000,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }));
});

app.get('/api/logout', async (c) => {
  // Handle OAuth logout
  const oauthSessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (typeof oauthSessionToken === 'string') {
    try {
      await deleteSession(oauthSessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
    } catch (error) {
      // Continue even if OAuth logout fails
    }
  }

  // Handle manual logout
  const manualSessionToken = getCookie(c, 'cerebral_session_token');
  if (typeof manualSessionToken === 'string') {
    try {
      // Delete manual session from database
      await c.env.DB.prepare(
        'DELETE FROM user_sessions WHERE session_token = ?'
      ).bind(manualSessionToken).run();
    } catch (error) {
      // Continue even if manual logout fails
    }
  }

  // Clear both cookies
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  setCookie(c, 'cerebral_session_token', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Project endpoints
app.get('/api/projects', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM projects 
    WHERE user_id = ? OR id IN (
      SELECT project_id FROM collaborations 
      WHERE user_id = ? AND status = 'accepted'
    )
    ORDER BY updated_at DESC
  `).bind(user.id, user.id).all();

  return c.json(results.map(p => ProjectSchema.parse(p)));
});

app.post('/api/projects', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const body = await c.req.json();
  const data = CreateProjectSchema.parse(body);
  
  const projectId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO projects (id, user_id, title, description, bpm, key_signature, time_signature, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    projectId,
    user.id,
    data.title,
    data.description || null,
    data.bpm,
    data.key_signature,
    data.time_signature
  ).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ?"
  ).bind(projectId).all();

  return c.json(ProjectSchema.parse(results[0]), 201);
});

app.get('/api/projects/:projectId', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('projectId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM projects WHERE id = ? AND (
      user_id = ? OR id IN (
        SELECT project_id FROM collaborations 
        WHERE user_id = ? AND status = 'accepted'
      )
    )
  `).bind(projectId, user.id, user.id).all();

  if (results.length === 0) {
    return c.json({ error: 'Project not found or access denied' }, 404);
  }

  return c.json(ProjectSchema.parse(results[0]));
});

// Audio file endpoints
app.get('/api/projects/:projectId/audio', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('projectId');

  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user has access to project
  const { results: projectResults } = await c.env.DB.prepare(`
    SELECT 1 FROM projects WHERE id = ? AND (
      user_id = ? OR id IN (
        SELECT project_id FROM collaborations 
        WHERE user_id = ? AND status = 'accepted'
      )
    )
  `).bind(projectId, user.id, user.id).all();

  if (projectResults.length === 0) {
    return c.json({ error: 'Project not found or access denied' }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM audio_files WHERE project_id = ? ORDER BY created_at ASC"
  ).bind(projectId).all();

  return c.json(results.map(f => AudioFileSchema.parse(f)));
});

app.post('/api/projects/:projectId/audio/upload', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('projectId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const formData = await c.req.formData();
  
  const file = formData.get('file') as File;
  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  // Check if user has access to project
  const { results: projectResults } = await c.env.DB.prepare(`
    SELECT 1 FROM projects WHERE id = ? AND (
      user_id = ? OR id IN (
        SELECT project_id FROM collaborations 
        WHERE user_id = ? AND status = 'accepted' AND permissions IN ('write', 'admin')
      )
    )
  `).bind(projectId, user.id, user.id).all();

  if (projectResults.length === 0) {
    return c.json({ error: 'Project not found or insufficient permissions' }, 403);
  }

  // Check storage limits
  const { results: userResults } = await c.env.DB.prepare(
    'SELECT storage_used_bytes, storage_limit_bytes FROM users WHERE id = ?'
  ).bind(user.id).all();

  if (userResults.length === 0) {
    return c.json({ error: 'User not found' }, 404);
  }

  const userData = userResults[0] as any;
  const currentUsage = userData.storage_used_bytes || 0;
  const storageLimit = userData.storage_limit_bytes || 536870912000; // 500GB default
  
  // Check if adding this file would exceed storage limit
  if (currentUsage + file.size > storageLimit) {
    const availableSpace = storageLimit - currentUsage;
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return c.json({ 
      error: 'Storage limit exceeded',
      details: `File size: ${formatBytes(file.size)}, Available space: ${formatBytes(availableSpace)}. Upgrade to Premium for 4TB of storage.`,
      storage_exceeded: true,
      current_usage: currentUsage,
      storage_limit: storageLimit,
      file_size: file.size
    }, 413);
  }

  const fileId = crypto.randomUUID();
  const fileKey = `audio/${projectId}/${fileId}/${file.name}`;
  
  try {
    // Upload to R2
    await c.env.R2_BUCKET.put(fileKey, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Save to database and update storage usage in a transaction-like manner
    await c.env.DB.prepare(`
      INSERT INTO audio_files (id, project_id, user_id, filename, file_key, file_size_bytes, file_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      fileId,
      projectId,
      user.id,
      file.name,
      fileKey,
      file.size,
      file.type
    ).run();

    // Update user storage usage
    await c.env.DB.prepare(`
      UPDATE users 
      SET storage_used_bytes = storage_used_bytes + ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(file.size, user.id).run();

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM audio_files WHERE id = ?"
    ).bind(fileId).all();

    return c.json(AudioFileSchema.parse(results[0]), 201);
    
  } catch (error) {
    // If database operations fail, clean up the uploaded file
    try {
      await c.env.R2_BUCKET.delete(fileKey);
    } catch (cleanupError) {
      console.error('Failed to cleanup uploaded file:', cleanupError);
    }
    
    console.error('Upload error:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// File serving endpoint
app.get("/api/files/:fileKey", async (c) => {
  const fileKey = decodeURIComponent(c.req.param("fileKey"));
  
  try {
    const object = await c.env.R2_BUCKET.get(fileKey);
    
    if (!object) {
      return c.json({ error: "File not found" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    return c.body(object.body, { headers });
  } catch (error) {
    return c.json({ error: "Failed to retrieve file" }, 500);
  }
});

// Marketplace endpoints
app.get('/api/marketplace', async (c) => {
  const category = c.req.query('category');
  const search = c.req.query('search');
  
  let query = "SELECT * FROM marketplace_items WHERE is_active = 1";
  const params: any[] = [];
  
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  
  if (search) {
    query += " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += " ORDER BY created_at DESC LIMIT 50";
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json(results.map(item => MarketplaceItemSchema.parse(item)));
});

// Beat Store endpoints
app.get('/api/marketplace/:beatId', async (c) => {
  const beatId = c.req.param('beatId');
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM marketplace_items WHERE id = ? AND is_active = 1"
  ).bind(beatId).all();
  
  if (results.length === 0) {
    return c.json({ error: 'Beat not found' }, 404);
  }
  
  return c.json(MarketplaceItemSchema.parse(results[0]));
});

app.post('/api/marketplace/beats/create', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const formData = await c.req.formData();
    
    // Get beat data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || null;
    const basicPriceCents = parseInt(formData.get('basic_price_cents') as string);
    const bpm = formData.get('bpm') ? parseInt(formData.get('bpm') as string) : null;
    const keySignature = formData.get('key_signature') as string || null;
    const genre = formData.get('genre') as string || null;
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [];
    
    const hasLeaseOption = formData.get('has_lease_option') === 'true';
    const leasePriceCents = hasLeaseOption ? parseInt(formData.get('lease_price_cents') as string || '0') : 0;
    const leaseTerms = hasLeaseOption ? formData.get('lease_terms') as string : null;
    
    const hasExclusiveOption = formData.get('has_exclusive_option') === 'true';
    const exclusivePriceCents = hasExclusiveOption ? parseInt(formData.get('exclusive_price_cents') as string || '0') : 0;
    const licenseTerms = formData.get('license_terms') as string || null;
    
    // Get files
    const audioFile = formData.get('audio') as File;
    const coverImage = formData.get('coverImage') as File | null;
    const audioFull = formData.get('audioFull') as File | null;
    const stems = formData.get('stems') as File | null;
    
    if (!audioFile || !title || !basicPriceCents) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check storage limits
    const { results: userResults } = await c.env.DB.prepare(
      'SELECT storage_used_bytes, storage_limit_bytes FROM users WHERE id = ?'
    ).bind(user.id).all();

    if (userResults.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const userData = userResults[0] as any;
    const currentUsage = userData.storage_used_bytes || 0;
    const storageLimit = userData.storage_limit_bytes || 536870912000;
    
    const totalFileSize = audioFile.size + 
      (coverImage?.size || 0) + 
      (audioFull?.size || 0) + 
      (stems?.size || 0);
    
    if (currentUsage + totalFileSize > storageLimit) {
      return c.json({ error: 'Storage limit exceeded' }, 413);
    }

    const beatId = crypto.randomUUID();
    
    // Upload files to R2
    const audioPreviewKey = `beats/${beatId}/preview/${audioFile.name}`;
    await c.env.R2_BUCKET.put(audioPreviewKey, audioFile, {
      httpMetadata: { contentType: audioFile.type },
    });
    
    let coverImageUrl = null;
    if (coverImage) {
      const coverKey = `beats/${beatId}/cover/${coverImage.name}`;
      await c.env.R2_BUCKET.put(coverKey, coverImage, {
        httpMetadata: { contentType: coverImage.type },
      });
      coverImageUrl = `/api/files/${encodeURIComponent(coverKey)}`;
    }
    
    let audioFullKey = null;
    if (audioFull) {
      audioFullKey = `beats/${beatId}/full/${audioFull.name}`;
      await c.env.R2_BUCKET.put(audioFullKey, audioFull, {
        httpMetadata: { contentType: audioFull.type },
      });
    }
    
    let stemsKey = null;
    if (stems) {
      stemsKey = `beats/${beatId}/stems/${stems.name}`;
      await c.env.R2_BUCKET.put(stemsKey, stems, {
        httpMetadata: { contentType: stems.type },
      });
    }

    // Create marketplace item
    await c.env.DB.prepare(`
      INSERT INTO marketplace_items (
        id, user_id, title, description, price_cents, category, tags, 
        audio_preview_key, download_key, cover_image_url, bpm, key_signature,
        has_lease_option, lease_price_cents, lease_terms,
        has_exclusive_option, exclusive_price_cents, audio_full_key, stems_key,
        license_terms, is_active, download_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      beatId,
      user.id,
      title,
      description,
      basicPriceCents,
      'beat',
      JSON.stringify(tags),
      audioPreviewKey,
      audioFullKey || audioPreviewKey, // Use preview as download if no full version
      coverImageUrl,
      bpm,
      keySignature,
      hasLeaseOption ? 1 : 0,
      leasePriceCents,
      leaseTerms,
      hasExclusiveOption ? 1 : 0,
      exclusivePriceCents,
      audioFullKey,
      stemsKey,
      licenseTerms,
      1, // is_active
      0  // download_count
    ).run();

    // Update user storage usage
    await c.env.DB.prepare(`
      UPDATE users 
      SET storage_used_bytes = storage_used_bytes + ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(totalFileSize, user.id).run();

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM marketplace_items WHERE id = ?"
    ).bind(beatId).all();

    return c.json(MarketplaceItemSchema.parse(results[0]), 201);
    
  } catch (error) {
    console.error('Beat creation error:', error);
    return c.json({ 
      error: 'Failed to create beat listing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Beat reviews endpoints
app.get('/api/marketplace/:beatId/reviews', async (c) => {
  const beatId = c.req.param('beatId');
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM beat_reviews WHERE marketplace_item_id = ? ORDER BY created_at DESC"
  ).bind(beatId).all();
  
  return c.json(results.map(review => BeatReviewSchema.parse(review)));
});

app.post('/api/marketplace/:beatId/reviews', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const beatId = c.req.param('beatId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const body = await c.req.json();
    const data = CreateBeatReviewSchema.parse(body);
    
    // Check if beat exists
    const { results: beatResults } = await c.env.DB.prepare(
      "SELECT 1 FROM marketplace_items WHERE id = ? AND is_active = 1"
    ).bind(beatId).all();
    
    if (beatResults.length === 0) {
      return c.json({ error: 'Beat not found' }, 404);
    }
    
    // Check if user has purchased this beat
    const { results: purchaseResults } = await c.env.DB.prepare(`
      SELECT 1 FROM beat_licenses bl
      JOIN marketplace_items mi ON bl.marketplace_item_id = mi.id
      WHERE bl.user_id = ? AND mi.id = ? AND bl.is_active = 1
    `).bind(user.id, beatId).all();
    
    const isVerifiedPurchase = purchaseResults.length > 0;
    
    // Check if user already reviewed this beat
    const { results: existingReviewResults } = await c.env.DB.prepare(
      "SELECT 1 FROM beat_reviews WHERE marketplace_item_id = ? AND reviewer_id = ?"
    ).bind(beatId, user.id).all();
    
    if (existingReviewResults.length > 0) {
      return c.json({ error: 'You have already reviewed this beat' }, 400);
    }
    
    const reviewId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO beat_reviews (id, marketplace_item_id, reviewer_id, rating, review_text, is_verified_purchase, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      reviewId,
      beatId,
      user.id,
      data.rating,
      data.review_text || null,
      isVerifiedPurchase ? 1 : 0
    ).run();
    
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM beat_reviews WHERE id = ?"
    ).bind(reviewId).all();
    
    return c.json(BeatReviewSchema.parse(results[0]), 201);
    
  } catch (error) {
    console.error('Review creation error:', error);
    return c.json({ 
      error: 'Failed to create review',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// AI Music Generation endpoint
app.post('/api/projects/:projectId/ai/generate', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('projectId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const body = await c.req.json();
  const { type, prompt, bpm, keySignature, genre, length, instruments } = body;
  
  try {
    // Check if user has access to project
    const { results: projectResults } = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND (
        user_id = ? OR id IN (
          SELECT project_id FROM collaborations 
          WHERE user_id = ? AND status = 'accepted'
        )
      )
    `).bind(projectId, user.id, user.id).all();

    if (projectResults.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 403);
    }

    let generationPrompt = '';
    let resultTitle = '';
    
    if (type === 'analyze_rhythm') {
      // Get the project's audio files for analysis
      await c.env.DB.prepare(
        "SELECT * FROM audio_files WHERE project_id = ? LIMIT 1"
      ).bind(projectId).all();
      
      generationPrompt = `Analyze the rhythm and musical patterns from the uploaded audio and generate complementary musical parts. Create a ${bpm} BPM track in ${keySignature} that would work well with the existing material. Generate bass, melody, and harmonic elements that complement the rhythm.`;
      resultTitle = 'AI Rhythm Analysis Track';
      
    } else if (type === 'generate_by_params') {
      generationPrompt = `Create a ${genre} music track at ${bpm} BPM in the key of ${keySignature}. Duration should be ${length} seconds. Include these instruments: ${instruments.join(', ')}. Make it professional quality and musically coherent.`;
      resultTitle = `${genre.charAt(0).toUpperCase() + genre.slice(1)} Track`;
      
    } else if (type === 'generate_by_prompt') {
      generationPrompt = `${prompt}. Musical parameters: ${bpm} BPM, key of ${keySignature}. Create a complete, professional-quality musical composition.`;
      resultTitle = 'AI Generated from Text';
    }

    // Make request to OpenAI for music generation
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(c.env as any).OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an AI music producer. When asked to generate music, provide detailed descriptions of the musical composition you would create, including instrumentation, arrangement, and sonic characteristics. Format your response as a JSON object with title, description, genre, bpm, duration, instruments array, and musical_elements array.'
          },
          {
            role: 'user',
            content: generationPrompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error('Failed to generate music with AI');
    }

    const openaiResult = await openaiResponse.json() as any;
    const musicData = JSON.parse(openaiResult.choices[0].message.content);

    // For now, we'll return the AI-generated musical description
    // In a real implementation, you would integrate with a music generation service
    const result = {
      title: musicData.title || resultTitle,
      description: musicData.description || 'AI-generated musical composition',
      genre: musicData.genre || genre || 'electronic',
      bpm: musicData.bpm || bpm || 120,
      duration: musicData.duration || length || 30,
      instruments: musicData.instruments || instruments || ['synth', 'bass', 'drums'],
      musical_elements: musicData.musical_elements || [],
      audioFiles: [], // Would contain actual audio files in full implementation
      created_at: new Date().toISOString(),
    };

    return c.json(result);
    
  } catch (error) {
    console.error('AI generation error:', error);
    return c.json({ 
      error: 'Failed to generate music',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Payment endpoints
app.post('/api/payments/create-intent', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const body = await c.req.json();
    const data = CreatePaymentIntentSchema.parse(body);
    
    // Get marketplace item
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM marketplace_items WHERE id = ? AND is_active = 1"
    ).bind(data.item_id).all();
    
    if (results.length === 0) {
      return c.json({ error: 'Item not found' }, 404);
    }
    
    const item = results[0] as any;
    
    // Check if user already owns this item with the same or higher license
    const { results: existingLicenses } = await c.env.DB.prepare(
      "SELECT license_type FROM beat_licenses WHERE user_id = ? AND marketplace_item_id = ? AND is_active = 1"
    ).bind(user.id, item.id).all();
    
    if (existingLicenses.length > 0) {
      const existingLicense = existingLicenses[0] as any;
      // If user has exclusive license, they can't buy anything else
      if (existingLicense.license_type === 'exclusive') {
        return c.json({ error: 'You already own the exclusive license for this beat' }, 400);
      }
      // If trying to buy basic/lease but already have lease/exclusive
      if (data.license_type !== 'exclusive' && existingLicense.license_type !== 'basic') {
        return c.json({ error: 'You already own a higher license for this beat' }, 400);
      }
    }
    
    // Determine price based on license type
    let amount = item.price_cents;
    if (data.license_type === 'lease' && item.has_lease_option) {
      amount = item.lease_price_cents;
    } else if (data.license_type === 'exclusive' && item.has_exclusive_option) {
      amount = item.exclusive_price_cents;
    }
    
    // Validate license type availability
    if (data.license_type === 'lease' && !item.has_lease_option) {
      return c.json({ error: 'Lease license not available for this beat' }, 400);
    }
    if (data.license_type === 'exclusive' && !item.has_exclusive_option) {
      return c.json({ error: 'Exclusive license not available for this beat' }, 400);
    }
    
    // For exclusive licenses, check if already sold
    if (data.license_type === 'exclusive') {
      const { results: exclusiveCheck } = await c.env.DB.prepare(
        "SELECT 1 FROM beat_licenses WHERE marketplace_item_id = ? AND license_type = 'exclusive' AND is_active = 1"
      ).bind(item.id).all();
      
      if (exclusiveCheck.length > 0) {
        return c.json({ error: 'Exclusive license has already been sold' }, 400);
      }
    }
    
    const stripe = getStripe(c.env);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        user_id: user.id,
        item_id: item.id,
        item_title: item.title,
        license_type: data.license_type,
      },
    });
    
    // Save payment record
    const paymentId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO payments (id, user_id, stripe_payment_intent_id, amount_cents, currency, status, payment_type, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      paymentId,
      user.id,
      paymentIntent.id,
      amount,
      'usd',
      'pending',
      'marketplace_purchase',
      JSON.stringify({ 
        item_id: item.id, 
        item_title: item.title, 
        license_type: data.license_type 
      })
    ).run();
    
    // Simulate payment success for demo purposes
    // In production, this would be handled by Stripe webhooks
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mark payment as succeeded and create license record
    await c.env.DB.prepare(`
      UPDATE payments SET status = 'succeeded', updated_at = datetime('now') WHERE id = ?
    `).bind(paymentId).run();
    
    // Create beat license
    const licenseId = crypto.randomUUID();
    let licenseTerms = item.license_terms || 'Standard license terms apply';
    let usageLimit = null;
    let expiresAt = null;
    
    if (data.license_type === 'lease') {
      licenseTerms = item.lease_terms || 'Lease license terms apply';
      usageLimit = 10000; // Stream limit for lease
    }
    
    await c.env.DB.prepare(`
      INSERT INTO beat_licenses (id, user_id, marketplace_item_id, license_type, payment_id, license_terms, usage_limit, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      licenseId,
      user.id,
      item.id,
      data.license_type,
      paymentId,
      licenseTerms,
      usageLimit,
      expiresAt
    ).run();
    
    // Create seller analytics record
    const platformCommissionRate = 0.15; // 15% platform fee
    const commissionCents = Math.round(amount * platformCommissionRate);
    const netEarningsCents = amount - commissionCents;
    
    const analyticsId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO seller_analytics (id, user_id, marketplace_item_id, sale_type, amount_cents, commission_cents, net_earnings_cents, sale_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      analyticsId,
      item.user_id, // The seller
      item.id,
      data.license_type,
      amount,
      commissionCents,
      netEarningsCents
    ).run();
    
    // Update download count
    await c.env.DB.prepare(`
      UPDATE marketplace_items SET download_count = download_count + 1 WHERE id = ?
    `).bind(item.id).run();
    
    // If exclusive license sold, deactivate the beat from marketplace
    if (data.license_type === 'exclusive') {
      await c.env.DB.prepare(`
        UPDATE marketplace_items SET is_active = 0 WHERE id = ?
      `).bind(item.id).run();
    }
    
    return c.json({
      success: true,
      payment_id: paymentId,
      license_id: licenseId,
      client_secret: paymentIntent.client_secret,
    });
    
  } catch (error) {
    console.error('Payment creation error:', error);
    return c.json({ 
      error: 'Failed to create payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post('/api/payments/upgrade-subscription', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  try {
    const body = await c.req.json();
    const data = SubscriptionUpgradeSchema.parse(body);
    
    // Get current user info
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(user.id).all();
    
    if (results.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const currentUser = results[0] as any;
    const currentPlan = currentUser.subscription_plan || 'basic';
    
    // Validate upgrade path
    if (currentPlan === 'pro' || 
        (currentPlan === 'premium' && data.plan === 'premium')) {
      return c.json({ error: 'Invalid upgrade path' }, 400);
    }
    
    const planPrices = {
      premium: 999, // $9.99
      pro: 1999,    // $19.99
    };
    
    const amount = planPrices[data.plan];
    
    const stripe = getStripe(c.env);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        user_id: user.id,
        subscription_plan: data.plan,
        upgrade_from: currentPlan,
      },
    });
    
    // Save payment record
    const paymentId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO payments (id, user_id, stripe_payment_intent_id, amount_cents, currency, status, payment_type, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      paymentId,
      user.id,
      paymentIntent.id,
      amount,
      'usd',
      'pending',
      'subscription_upgrade',
      JSON.stringify({ plan: data.plan, from: currentPlan })
    ).run();
    
    // Simulate payment success for demo purposes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mark payment as succeeded and upgrade user
    await c.env.DB.prepare(`
      UPDATE payments SET status = 'succeeded', updated_at = datetime('now') WHERE id = ?
    `).bind(paymentId).run();
    
    // Update user subscription plan and storage limits
    const storageLimit = data.plan === 'premium' ? 4398046511104 : 8796093022208; // 4TB for premium, 8TB for pro
    
    await c.env.DB.prepare(`
      UPDATE users SET 
        subscription_plan = ?, 
        storage_limit_bytes = ?,
        updated_at = datetime('now') 
      WHERE id = ?
    `).bind(data.plan, storageLimit, user.id).run();
    
    return c.json({
      success: true,
      payment_id: paymentId,
      new_plan: data.plan,
      client_secret: paymentIntent.client_secret,
    });
    
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return c.json({ 
      error: 'Failed to upgrade subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user purchases/licenses
app.get('/api/purchases', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      bl.*,
      mi.title,
      mi.description,
      mi.category,
      mi.cover_image_url,
      mi.audio_preview_key,
      mi.download_key,
      mi.audio_full_key,
      mi.stems_key
    FROM beat_licenses bl
    JOIN marketplace_items mi ON bl.marketplace_item_id = mi.id
    WHERE bl.user_id = ? AND bl.is_active = 1
    ORDER BY bl.created_at DESC
  `).bind(user.id).all();
  
  return c.json(results.map(result => BeatLicenseSchema.parse(result)));
});

// Get seller analytics
app.get('/api/seller/analytics', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      sa.*,
      mi.title,
      mi.category
    FROM seller_analytics sa
    JOIN marketplace_items mi ON sa.marketplace_item_id = mi.id
    WHERE sa.user_id = ?
    ORDER BY sa.sale_date DESC
  `).bind(user.id).all();
  
  return c.json(results.map(result => SellerAnalyticsSchema.parse(result)));
});

// Get seller's beats
app.get('/api/seller/beats', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM marketplace_items 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).bind(user.id).all();
  
  return c.json(results.map(item => MarketplaceItemSchema.parse(item)));
});

// Update beat listing
app.put('/api/marketplace/beats/:beatId/update', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const beatId = c.req.param('beatId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  // Verify ownership
  const { results: ownershipCheck } = await c.env.DB.prepare(`
    SELECT 1 FROM marketplace_items WHERE id = ? AND user_id = ?
  `).bind(beatId, user.id).all();
  
  if (ownershipCheck.length === 0) {
    return c.json({ error: "Beat not found or you don't have permission to edit it" }, 403);
  }
  
  try {
    const body = await c.req.json();
    
    // Update the beat
    await c.env.DB.prepare(`
      UPDATE marketplace_items SET
        title = ?,
        description = ?,
        price_cents = ?,
        category = ?,
        tags = ?,
        bpm = ?,
        key_signature = ?,
        has_lease_option = ?,
        lease_price_cents = ?,
        lease_terms = ?,
        has_exclusive_option = ?,
        exclusive_price_cents = ?,
        exclusive_terms = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.title,
      body.description,
      body.price_cents,
      body.category,
      JSON.stringify(body.tags),
      body.bpm,
      body.key_signature,
      body.has_lease_option ? 1 : 0,
      body.lease_price_cents,
      body.lease_terms,
      body.has_exclusive_option ? 1 : 0,
      body.exclusive_price_cents,
      body.exclusive_terms,
      beatId
    ).run();
    
    // Get updated beat
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM marketplace_items WHERE id = ?"
    ).bind(beatId).all();
    
    return c.json(MarketplaceItemSchema.parse(results[0]));
    
  } catch (error) {
    console.error('Beat update error:', error);
    return c.json({ 
      error: 'Failed to update beat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get seller dashboard stats
app.get('/api/seller/stats', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  // Get total earnings
  const { results: earningsResults } = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(net_earnings_cents), 0) as total_earnings_cents
    FROM seller_analytics 
    WHERE user_id = ?
  `).bind(user.id).all();
  
  // Get total sales count
  const { results: salesResults } = await c.env.DB.prepare(`
    SELECT COUNT(*) as total_sales
    FROM seller_analytics 
    WHERE user_id = ?
  `).bind(user.id).all();
  
  // Get active listings count
  const { results: listingsResults } = await c.env.DB.prepare(`
    SELECT COUNT(*) as active_listings
    FROM marketplace_items 
    WHERE user_id = ? AND is_active = 1
  `).bind(user.id).all();
  
  // Get this month's earnings
  const { results: monthlyResults } = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(net_earnings_cents), 0) as monthly_earnings_cents
    FROM seller_analytics 
    WHERE user_id = ? AND date(sale_date) >= date('now', 'start of month')
  `).bind(user.id).all();
  
  return c.json({
    total_earnings_cents: (earningsResults[0] as any).total_earnings_cents,
    total_sales: (salesResults[0] as any).total_sales,
    active_listings: (listingsResults[0] as any).active_listings,
    monthly_earnings_cents: (monthlyResults[0] as any).monthly_earnings_cents,
  });
});

// Download licensed item
app.get('/api/licenses/:licenseId/download', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const licenseId = c.req.param('licenseId');
  const fileType = c.req.query('type') || 'main'; // main, stems
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  // Verify license ownership
  const { results } = await c.env.DB.prepare(`
    SELECT bl.*, mi.download_key, mi.audio_full_key, mi.stems_key, mi.title
    FROM beat_licenses bl
    JOIN marketplace_items mi ON bl.marketplace_item_id = mi.id
    WHERE bl.id = ? AND bl.user_id = ? AND bl.is_active = 1
  `).bind(licenseId, user.id).all();
  
  if (results.length === 0) {
    return c.json({ error: 'License not found or access denied' }, 404);
  }
  
  const license = results[0] as any;
  
  let downloadKey: string | null = null;
  let filename = license.title;
  
  switch (fileType) {
    case 'stems':
      if (license.license_type !== 'exclusive' || !license.stems_key) {
        return c.json({ error: 'Stems only available with exclusive license' }, 403);
      }
      downloadKey = license.stems_key;
      filename += '_stems';
      break;
    case 'main':
    default:
      // Use full audio if available, otherwise use download_key
      downloadKey = license.audio_full_key || license.download_key;
      break;
  }
  
  if (!downloadKey) {
    return c.json({ error: 'Download not available' }, 404);
  }
  
  try {
    const object = await c.env.R2_BUCKET.get(downloadKey);
    
    if (!object) {
      return c.json({ error: "File not found" }, 404);
    }

    // Track usage for lease licenses
    if (license.license_type === 'lease' && license.usage_limit) {
      await c.env.DB.prepare(`
        UPDATE beat_licenses 
        SET usage_count = usage_count + 1, updated_at = datetime('now')
        WHERE id = ?
      `).bind(licenseId).run();
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("content-disposition", `attachment; filename="${filename}"`);
    
    return c.body(object.body, { headers });
  } catch (error) {
    return c.json({ error: "Failed to retrieve file" }, 500);
  }
});

// Suite endpoints
app.get('/api/suites', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT s.* FROM suites s
    WHERE s.is_active = 1 AND s.is_public = 1
    ORDER BY s.created_at DESC
    LIMIT 50
  `).all();
  
  return c.json(results.map(suite => SuiteSchema.parse(suite)));
});

app.post('/api/suites', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const body = await c.req.json();
  const data = CreateSuiteSchema.parse(body);
  
  const suiteId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO suites (id, host_id, title, description, max_participants, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    suiteId,
    user.id,
    data.title,
    data.description || null,
    data.max_participants,
    data.is_public ? 1 : 0
  ).run();

  // Add host as participant
  const participantId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO suite_participants (id, suite_id, user_id, role, joined_at, updated_at)
    VALUES (?, ?, ?, 'host', datetime('now'), datetime('now'))
  `).bind(participantId, suiteId, user.id).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM suites WHERE id = ?"
  ).bind(suiteId).all();

  return c.json(SuiteSchema.parse(results[0]), 201);
});

app.get('/api/suites/:suiteId', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT s.* FROM suites s
    WHERE s.id = ? AND (
      s.is_public = 1 OR 
      s.host_id = ? OR 
      s.id IN (SELECT suite_id FROM suite_participants WHERE user_id = ?)
    )
  `).bind(suiteId, user.id, user.id).all();

  if (results.length === 0) {
    return c.json({ error: 'Suite not found or access denied' }, 404);
  }

  return c.json(SuiteSchema.parse(results[0]));
});

app.patch('/api/suites/:suiteId', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  // Check if user is host
  const { results: suiteResults } = await c.env.DB.prepare(
    "SELECT * FROM suites WHERE id = ? AND host_id = ?"
  ).bind(suiteId, user.id).all();

  if (suiteResults.length === 0) {
    return c.json({ error: 'Suite not found or access denied' }, 403);
  }

  const body = await c.req.json();
  const updates: string[] = [];
  const params: any[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    params.push(body.title);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    params.push(body.description);
  }
  if (body.is_public !== undefined) {
    updates.push('is_public = ?');
    params.push(body.is_public ? 1 : 0);
  }
  if (body.is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(body.is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }

  updates.push('updated_at = datetime(\'now\')');
  params.push(suiteId);

  await c.env.DB.prepare(`
    UPDATE suites SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM suites WHERE id = ?"
  ).bind(suiteId).all();

  return c.json(SuiteSchema.parse(results[0]));
});

app.delete('/api/suites/:suiteId', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  // Check if user is host
  const { results: suiteResults } = await c.env.DB.prepare(
    "SELECT * FROM suites WHERE id = ? AND host_id = ?"
  ).bind(suiteId, user.id).all();

  if (suiteResults.length === 0) {
    return c.json({ error: 'Suite not found or access denied' }, 403);
  }

  // Delete related data
  await c.env.DB.prepare('DELETE FROM suite_reports WHERE suite_id = ?').bind(suiteId).run();
  await c.env.DB.prepare('DELETE FROM suite_bans WHERE suite_id = ?').bind(suiteId).run();
  await c.env.DB.prepare('DELETE FROM suite_participants WHERE suite_id = ?').bind(suiteId).run();
  await c.env.DB.prepare('DELETE FROM suites WHERE id = ?').bind(suiteId).run();

  return c.json({ success: true });
});

// Suite participant endpoints
app.get('/api/suites/:suiteId/participants', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user has access to suite
  const { results: suiteResults } = await c.env.DB.prepare(`
    SELECT s.* FROM suites s
    WHERE s.id = ? AND (
      s.is_public = 1 OR 
      s.host_id = ? OR 
      s.id IN (SELECT suite_id FROM suite_participants WHERE user_id = ?)
    )
  `).bind(suiteId, user.id, user.id).all();

  if (suiteResults.length === 0) {
    return c.json({ error: 'Suite not found or access denied' }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE suite_id = ? ORDER BY joined_at ASC"
  ).bind(suiteId).all();

  return c.json(results.map(p => SuiteParticipantSchema.parse(p)));
});

app.post('/api/suites/:suiteId/join', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if suite exists and is active
  const { results: suiteResults } = await c.env.DB.prepare(
    "SELECT * FROM suites WHERE id = ? AND is_active = 1"
  ).bind(suiteId).all();

  if (suiteResults.length === 0) {
    return c.json({ error: 'Suite not found or inactive' }, 404);
  }

  const suite = suiteResults[0] as any;

  // Check if user is banned
  const { results: banResults } = await c.env.DB.prepare(
    "SELECT 1 FROM suite_bans WHERE suite_id = ? AND user_id = ?"
  ).bind(suiteId, user.id).all();

  if (banResults.length > 0) {
    return c.json({ error: 'You are banned from this suite' }, 403);
  }

  // Check if already a participant
  const { results: participantResults } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE suite_id = ? AND user_id = ?"
  ).bind(suiteId, user.id).all();

  if (participantResults.length > 0) {
    return c.json(SuiteParticipantSchema.parse(participantResults[0]));
  }

  // Check if suite is full
  const { results: countResults } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM suite_participants WHERE suite_id = ?"
  ).bind(suiteId).all();

  const currentCount = (countResults[0] as any).count;
  if (currentCount >= suite.max_participants) {
    return c.json({ error: 'Suite is full' }, 400);
  }

  // Join suite
  const participantId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO suite_participants (id, suite_id, user_id, role, joined_at, updated_at)
    VALUES (?, ?, ?, 'participant', datetime('now'), datetime('now'))
  `).bind(participantId, suiteId, user.id).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE id = ?"
  ).bind(participantId).all();

  return c.json(SuiteParticipantSchema.parse(results[0]), 201);
});

app.post('/api/suites/:suiteId/leave', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Delete participant record
  await c.env.DB.prepare(
    "DELETE FROM suite_participants WHERE suite_id = ? AND user_id = ?"
  ).bind(suiteId, user.id).run();

  return c.json({ success: true });
});

app.patch('/api/suites/:suiteId/participants/:participantId', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  const participantId = c.req.param('participantId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user is host or admin
  const { results: userParticipantResults } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE suite_id = ? AND user_id = ? AND role IN ('host', 'admin')"
  ).bind(suiteId, user.id).all();

  if (userParticipantResults.length === 0) {
    return c.json({ error: 'Insufficient permissions' }, 403);
  }

  const userRole = (userParticipantResults[0] as any).role;

  // Get target participant
  const { results: targetResults } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE id = ? AND suite_id = ?"
  ).bind(participantId, suiteId).all();

  if (targetResults.length === 0) {
    return c.json({ error: 'Participant not found' }, 404);
  }

  const targetParticipant = targetResults[0] as any;

  // Only host can modify admins or make new admins
  if (targetParticipant.role === 'admin' && userRole !== 'host') {
    return c.json({ error: 'Only host can modify admins' }, 403);
  }

  const body = await c.req.json();
  const data = UpdateSuiteParticipantSchema.parse(body);

  const updates: string[] = [];
  const params: any[] = [];

  if (data.role !== undefined) {
    // Only host can change roles
    if (userRole !== 'host') {
      return c.json({ error: 'Only host can change roles' }, 403);
    }

    // Check admin limit
    if (data.role === 'admin') {
      const { results: adminCountResults } = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM suite_participants WHERE suite_id = ? AND role = 'admin'"
      ).bind(suiteId).all();

      const adminCount = (adminCountResults[0] as any).count;
      if (adminCount >= 3) {
        return c.json({ error: 'Maximum of 3 admins allowed' }, 400);
      }
    }

    updates.push('role = ?');
    params.push(data.role);
  }

  if (data.is_muted !== undefined) {
    updates.push('is_muted = ?');
    params.push(data.is_muted ? 1 : 0);
  }

  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }

  updates.push('updated_at = datetime(\'now\')');
  params.push(participantId);

  await c.env.DB.prepare(`
    UPDATE suite_participants SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE id = ?"
  ).bind(participantId).all();

  return c.json(SuiteParticipantSchema.parse(results[0]));
});

app.post('/api/suites/:suiteId/participants/:participantId/kick', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  const participantId = c.req.param('participantId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user is host or admin
  const { results: userParticipantResults } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE suite_id = ? AND user_id = ? AND role IN ('host', 'admin')"
  ).bind(suiteId, user.id).all();

  if (userParticipantResults.length === 0) {
    return c.json({ error: 'Insufficient permissions' }, 403);
  }

  const userRole = (userParticipantResults[0] as any).role;

  // Get target participant
  const { results: targetResults } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE id = ? AND suite_id = ?"
  ).bind(participantId, suiteId).all();

  if (targetResults.length === 0) {
    return c.json({ error: 'Participant not found' }, 404);
  }

  const targetParticipant = targetResults[0] as any;

  // Can't kick host or other admins (unless you're host)
  if (targetParticipant.role === 'host' || 
      (targetParticipant.role === 'admin' && userRole !== 'host')) {
    return c.json({ error: 'Cannot kick this participant' }, 403);
  }

  // Remove participant
  await c.env.DB.prepare(
    "DELETE FROM suite_participants WHERE id = ?"
  ).bind(participantId).run();

  return c.json({ success: true });
});

app.post('/api/suites/:suiteId/participants/:participantId/ban', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  const participantId = c.req.param('participantId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user is host or admin
  const { results: userParticipantResults } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE suite_id = ? AND user_id = ? AND role IN ('host', 'admin')"
  ).bind(suiteId, user.id).all();

  if (userParticipantResults.length === 0) {
    return c.json({ error: 'Insufficient permissions' }, 403);
  }

  const userRole = (userParticipantResults[0] as any).role;

  // Get target participant
  const { results: targetResults } = await c.env.DB.prepare(
    "SELECT * FROM suite_participants WHERE id = ? AND suite_id = ?"
  ).bind(participantId, suiteId).all();

  if (targetResults.length === 0) {
    return c.json({ error: 'Participant not found' }, 404);
  }

  const targetParticipant = targetResults[0] as any;

  // Can't ban host or other admins (unless you're host)
  if (targetParticipant.role === 'host' || 
      (targetParticipant.role === 'admin' && userRole !== 'host')) {
    return c.json({ error: 'Cannot ban this participant' }, 403);
  }

  const body = await c.req.json();
  const reason = body.reason || 'Banned by moderator';

  // Create ban record
  const banId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO suite_bans (id, suite_id, user_id, banned_by, reason, banned_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(banId, suiteId, targetParticipant.user_id, user.id, reason).run();

  // Remove participant
  await c.env.DB.prepare(
    "DELETE FROM suite_participants WHERE id = ?"
  ).bind(participantId).run();

  return c.json({ success: true });
});

// Suite reporting endpoints
app.post('/api/suites/:suiteId/reports', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const suiteId = c.req.param('suiteId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user is participant
  const { results: participantResults } = await c.env.DB.prepare(
    "SELECT 1 FROM suite_participants WHERE suite_id = ? AND user_id = ?"
  ).bind(suiteId, user.id).all();

  if (participantResults.length === 0) {
    return c.json({ error: 'Must be a participant to report' }, 403);
  }

  const body = await c.req.json();
  const data = ReportUserSchema.parse(body);

  // Check if reported user is in the suite
  const { results: reportedParticipantResults } = await c.env.DB.prepare(
    "SELECT 1 FROM suite_participants WHERE suite_id = ? AND user_id = ?"
  ).bind(suiteId, data.reported_user_id).all();

  if (reportedParticipantResults.length === 0) {
    return c.json({ error: 'Reported user is not in this suite' }, 400);
  }

  // Create report
  const reportId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO suite_reports (id, suite_id, reporter_id, reported_user_id, reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(reportId, suiteId, user.id, data.reported_user_id, data.reason).run();

  return c.json({ success: true, report_id: reportId }, 201);
});

// Live Session endpoints
app.get('/api/live-sessions', async (c) => {
  const sessionType = c.req.query('type');
  
  let query = "SELECT * FROM live_sessions WHERE is_active = 1 AND is_public = 1";
  const params: any[] = [];
  
  if (sessionType && sessionType !== 'all') {
    query += " AND session_type = ?";
    params.push(sessionType);
  }
  
  query += " ORDER BY created_at DESC LIMIT 50";
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json(results.map(session => LiveSessionSchema.parse(session)));
});

app.post('/api/live-sessions', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const body = await c.req.json();
  const data = CreateLiveSessionSchema.parse(body);
  
  const sessionId = crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO live_sessions (id, host_id, title, description, session_type, theme, max_participants, is_public, started_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
  `).bind(
    sessionId,
    user.id,
    data.title,
    data.description || null,
    data.session_type,
    data.theme || null,
    data.max_participants,
    data.is_public ? 1 : 0
  ).run();

  // Add host as participant
  const participantId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO session_participants (id, session_id, user_id, role, joined_at, updated_at)
    VALUES (?, ?, ?, 'host', datetime('now'), datetime('now'))
  `).bind(participantId, sessionId, user.id).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM live_sessions WHERE id = ?"
  ).bind(sessionId).all();

  return c.json(LiveSessionSchema.parse(results[0]), 201);
});

app.get('/api/live-sessions/:sessionId', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT s.* FROM live_sessions s
    WHERE s.id = ? AND (
      s.is_public = 1 OR 
      s.host_id = ? OR 
      s.id IN (SELECT session_id FROM session_participants WHERE user_id = ?)
    )
  `).bind(sessionId, user.id, user.id).all();

  if (results.length === 0) {
    return c.json({ error: 'Session not found or access denied' }, 404);
  }

  return c.json(LiveSessionSchema.parse(results[0]));
});

app.patch('/api/live-sessions/:sessionId', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  // Check if user is host
  const { results: sessionResults } = await c.env.DB.prepare(
    "SELECT * FROM live_sessions WHERE id = ? AND host_id = ?"
  ).bind(sessionId, user.id).all();

  if (sessionResults.length === 0) {
    return c.json({ error: 'Session not found or access denied' }, 403);
  }

  const body = await c.req.json();
  const updates: string[] = [];
  const params: any[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    params.push(body.title);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    params.push(body.description);
  }
  if (body.is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(body.is_active ? 1 : 0);
    
    // Set ended_at when deactivating
    if (!body.is_active) {
      updates.push('ended_at = datetime(\'now\')');
    }
  }

  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400);
  }

  updates.push('updated_at = datetime(\'now\')');
  params.push(sessionId);

  await c.env.DB.prepare(`
    UPDATE live_sessions SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM live_sessions WHERE id = ?"
  ).bind(sessionId).all();

  return c.json(LiveSessionSchema.parse(results[0]));
});

app.delete('/api/live-sessions/:sessionId', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  // Check if user is host
  const { results: sessionResults } = await c.env.DB.prepare(
    "SELECT * FROM live_sessions WHERE id = ? AND host_id = ?"
  ).bind(sessionId, user.id).all();

  if (sessionResults.length === 0) {
    return c.json({ error: 'Session not found or access denied' }, 403);
  }

  // Delete related data
  await c.env.DB.prepare('DELETE FROM session_votes WHERE session_id = ?').bind(sessionId).run();
  await c.env.DB.prepare('DELETE FROM session_chat WHERE session_id = ?').bind(sessionId).run();
  await c.env.DB.prepare('DELETE FROM session_submissions WHERE session_id = ?').bind(sessionId).run();
  await c.env.DB.prepare('DELETE FROM session_participants WHERE session_id = ?').bind(sessionId).run();
  await c.env.DB.prepare('DELETE FROM live_sessions WHERE id = ?').bind(sessionId).run();

  return c.json({ success: true });
});

// Session participant endpoints
app.get('/api/live-sessions/:sessionId/participants', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user has access to session
  const { results: sessionResults } = await c.env.DB.prepare(`
    SELECT s.* FROM live_sessions s
    WHERE s.id = ? AND (
      s.is_public = 1 OR 
      s.host_id = ? OR 
      s.id IN (SELECT session_id FROM session_participants WHERE user_id = ?)
    )
  `).bind(sessionId, user.id, user.id).all();

  if (sessionResults.length === 0) {
    return c.json({ error: 'Session not found or access denied' }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM session_participants WHERE session_id = ? ORDER BY joined_at ASC"
  ).bind(sessionId).all();

  return c.json(results.map(p => SessionParticipantSchema.parse(p)));
});

app.post('/api/live-sessions/:sessionId/join', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if session exists and is active
  const { results: sessionResults } = await c.env.DB.prepare(
    "SELECT * FROM live_sessions WHERE id = ? AND is_active = 1"
  ).bind(sessionId).all();

  if (sessionResults.length === 0) {
    return c.json({ error: 'Session not found or inactive' }, 404);
  }

  const session = sessionResults[0] as any;

  // Check if already a participant
  const { results: participantResults } = await c.env.DB.prepare(
    "SELECT * FROM session_participants WHERE session_id = ? AND user_id = ?"
  ).bind(sessionId, user.id).all();

  if (participantResults.length > 0) {
    return c.json(SessionParticipantSchema.parse(participantResults[0]));
  }

  // Check if session is full
  const { results: countResults } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM session_participants WHERE session_id = ?"
  ).bind(sessionId).all();

  const currentCount = (countResults[0] as any).count;
  if (currentCount >= session.max_participants) {
    return c.json({ error: 'Session is full' }, 400);
  }

  // Determine role
  let role = 'viewer';
  if (session.session_type === 'rivals') {
    // Check if there are open contestant slots
    const { results: contestantResults } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM session_participants WHERE session_id = ? AND role = 'contestant'"
    ).bind(sessionId).all();
    
    const contestantCount = (contestantResults[0] as any).count;
    if (contestantCount < 2) {
      role = 'contestant';
    }
  }

  // Join session
  const participantId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO session_participants (id, session_id, user_id, role, joined_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(participantId, sessionId, user.id, role).run();

  // Update viewer count
  await c.env.DB.prepare(`
    UPDATE live_sessions SET viewer_count = viewer_count + 1, updated_at = datetime('now') WHERE id = ?
  `).bind(sessionId).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM session_participants WHERE id = ?"
  ).bind(participantId).all();

  return c.json(SessionParticipantSchema.parse(results[0]), 201);
});

app.post('/api/live-sessions/:sessionId/leave', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Delete participant record
  await c.env.DB.prepare(
    "DELETE FROM session_participants WHERE session_id = ? AND user_id = ?"
  ).bind(sessionId, user.id).run();

  // Update viewer count
  await c.env.DB.prepare(`
    UPDATE live_sessions SET viewer_count = CASE WHEN viewer_count > 0 THEN viewer_count - 1 ELSE 0 END, updated_at = datetime('now') WHERE id = ?
  `).bind(sessionId).run();

  return c.json({ success: true });
});

// Session submissions endpoints
app.get('/api/live-sessions/:sessionId/submissions', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user has access to session
  const { results: sessionResults } = await c.env.DB.prepare(`
    SELECT s.* FROM live_sessions s
    WHERE s.id = ? AND (
      s.is_public = 1 OR 
      s.host_id = ? OR 
      s.id IN (SELECT session_id FROM session_participants WHERE user_id = ?)
    )
  `).bind(sessionId, user.id, user.id).all();

  if (sessionResults.length === 0) {
    return c.json({ error: 'Session not found or access denied' }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM session_submissions WHERE session_id = ? ORDER BY submitted_at DESC"
  ).bind(sessionId).all();

  return c.json(results.map(s => SessionSubmissionSchema.parse(s)));
});

app.post('/api/live-sessions/:sessionId/submit', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user is participant
  const { results: participantResults } = await c.env.DB.prepare(
    "SELECT * FROM session_participants WHERE session_id = ? AND user_id = ?"
  ).bind(sessionId, user.id).all();

  if (participantResults.length === 0) {
    return c.json({ error: 'Must be a participant to submit' }, 403);
  }

  // Get session info
  const { results: sessionResults } = await c.env.DB.prepare(
    "SELECT * FROM live_sessions WHERE id = ?"
  ).bind(sessionId).all();

  if (sessionResults.length === 0) {
    return c.json({ error: 'Session not found' }, 404);
  }

  const session = sessionResults[0] as any;
  const body = await c.req.json();
  const data = SubmitMusicSchema.parse(body);

  // Determine submission type based on session type
  let submissionType = 'playlist';
  if (session.session_type === 'rivals') {
    submissionType = 'battle';
  } else if (session.session_type === 'showcase') {
    submissionType = 'showcase';
  }

  // Create submission
  const submissionId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO session_submissions (id, session_id, submitted_by, music_title, artist_name, audio_url, submission_type, submitted_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    submissionId,
    sessionId,
    user.id,
    data.music_title,
    data.artist_name || null,
    data.audio_url || null,
    submissionType
  ).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM session_submissions WHERE id = ?"
  ).bind(submissionId).all();

  return c.json(SessionSubmissionSchema.parse(results[0]), 201);
});

// Session voting endpoints
app.post('/api/live-sessions/:sessionId/vote', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user is participant
  const { results: participantResults } = await c.env.DB.prepare(
    "SELECT 1 FROM session_participants WHERE session_id = ? AND user_id = ?"
  ).bind(sessionId, user.id).all();

  if (participantResults.length === 0) {
    return c.json({ error: 'Must be a participant to vote' }, 403);
  }

  const body = await c.req.json();
  const { submission_id, vote_type } = body;

  // Check if submission exists in this session
  const { results: submissionResults } = await c.env.DB.prepare(
    "SELECT 1 FROM session_submissions WHERE id = ? AND session_id = ?"
  ).bind(submission_id, sessionId).all();

  if (submissionResults.length === 0) {
    return c.json({ error: 'Submission not found in this session' }, 400);
  }

  // Check if already voted (replace existing vote)
  await c.env.DB.prepare(
    "DELETE FROM session_votes WHERE submission_id = ? AND voter_id = ?"
  ).bind(submission_id, user.id).run();

  // Create new vote
  const voteId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO session_votes (id, session_id, submission_id, voter_id, vote_type, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(voteId, sessionId, submission_id, user.id, vote_type).run();

  // Update vote count on submission
  const { results: voteCountResults } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM session_votes WHERE submission_id = ?"
  ).bind(submission_id).all();

  const voteCount = (voteCountResults[0] as any).count;

  await c.env.DB.prepare(`
    UPDATE session_submissions SET votes_count = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(voteCount, submission_id).run();

  return c.json({ success: true, vote_id: voteId }, 201);
});

// Session chat endpoints
app.get('/api/live-sessions/:sessionId/chat', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user has access to session
  const { results: sessionResults } = await c.env.DB.prepare(`
    SELECT s.* FROM live_sessions s
    WHERE s.id = ? AND (
      s.is_public = 1 OR 
      s.host_id = ? OR 
      s.id IN (SELECT session_id FROM session_participants WHERE user_id = ?)
    )
  `).bind(sessionId, user.id, user.id).all();

  if (sessionResults.length === 0) {
    return c.json({ error: 'Session not found or access denied' }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM session_chat WHERE session_id = ? ORDER BY created_at ASC LIMIT 100"
  ).bind(sessionId).all();

  return c.json(results.map(m => SessionChatSchema.parse(m)));
});

app.post('/api/live-sessions/:sessionId/chat', customAuthMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId');
  
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  // Check if user is participant
  const { results: participantResults } = await c.env.DB.prepare(
    "SELECT 1 FROM session_participants WHERE session_id = ? AND user_id = ?"
  ).bind(sessionId, user.id).all();

  if (participantResults.length === 0) {
    return c.json({ error: 'Must be a participant to chat' }, 403);
  }

  const body = await c.req.json();
  const { message_text } = body;

  if (!message_text || message_text.trim().length === 0) {
    return c.json({ error: 'Message cannot be empty' }, 400);
  }

  // Create chat message
  const messageId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO session_chat (id, session_id, user_id, message_text, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(messageId, sessionId, user.id, message_text.trim()).run();

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM session_chat WHERE id = ?"
  ).bind(messageId).all();

  return c.json(SessionChatSchema.parse(results[0]), 201);
});

export default app;
