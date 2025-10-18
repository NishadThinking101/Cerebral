import z from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  subscription_plan: z.enum(['basic', 'premium', 'pro']).default('basic'),
  storage_used_bytes: z.number().default(0),
  storage_limit_bytes: z.number().default(536870912000),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
});

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  bpm: z.number(),
  key_signature: z.string(),
  time_signature: z.string(),
  project_data: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  is_public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AudioFileSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  user_id: z.string(),
  filename: z.string(),
  file_key: z.string(),
  file_size_bytes: z.number(),
  duration_seconds: z.number().nullable(),
  file_type: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const MarketplaceItemSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  price_cents: z.number(),
  category: z.enum(['beat', 'song', 'sample', 'loop', 'vocal']),
  tags: z.string().nullable(),
  audio_preview_key: z.string().nullable(),
  download_key: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  bpm: z.number().nullable(),
  key_signature: z.string().nullable(),
  is_active: z.boolean(),
  download_count: z.number(),
  has_lease_option: z.boolean().default(false),
  lease_price_cents: z.number().default(0),
  lease_terms: z.string().nullable(),
  has_exclusive_option: z.boolean().default(false),
  exclusive_price_cents: z.number().default(0),
  audio_full_key: z.string().nullable(),
  stems_key: z.string().nullable(),
  license_terms: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  bpm: z.number().min(60).max(200).default(120),
  key_signature: z.string().default('C'),
  time_signature: z.string().default('4/4'),
});

export const UploadAudioSchema = z.object({
  project_id: z.string(),
  filename: z.string(),
  file_type: z.string(),
  file_size_bytes: z.number(),
});

export const PaymentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  stripe_payment_intent_id: z.string().nullable(),
  amount_cents: z.number(),
  currency: z.string().default('usd'),
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'canceled']),
  payment_type: z.enum(['marketplace_purchase', 'subscription', 'subscription_upgrade']),
  metadata: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserPurchaseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  marketplace_item_id: z.string(),
  payment_id: z.string(),
  purchased_at: z.string(),
});

export const CreatePaymentIntentSchema = z.object({
  item_id: z.string(),
  license_type: z.enum(['basic', 'lease', 'exclusive']).default('basic'),
  payment_method: z.object({
    card: z.object({
      number: z.string(),
      exp_month: z.number(),
      exp_year: z.number(),
      cvc: z.string(),
    }),
    billing_details: z.object({
      name: z.string(),
    }),
  }),
});

export const SubscriptionUpgradeSchema = z.object({
  plan: z.enum(['premium', 'pro']),
  payment_method: z.object({
    card: z.object({
      number: z.string(),
      exp_month: z.number(),
      exp_year: z.number(),
      cvc: z.string(),
    }),
    billing_details: z.object({
      name: z.string(),
    }),
  }),
});

export type User = z.infer<typeof UserSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type AudioFile = z.infer<typeof AudioFileSchema>;
export type MarketplaceItem = z.infer<typeof MarketplaceItemSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type LoginUser = z.infer<typeof LoginUserSchema>;
export type UploadAudio = z.infer<typeof UploadAudioSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type UserPurchase = z.infer<typeof UserPurchaseSchema>;
export type CreatePaymentIntent = z.infer<typeof CreatePaymentIntentSchema>;
export type SubscriptionUpgrade = z.infer<typeof SubscriptionUpgradeSchema>;

// User Profile schemas
export const UserProfileSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  display_name: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  website_url: z.string().nullable(),
  avatar_file_key: z.string().nullable(),
  banner_file_key: z.string().nullable(),
  is_public: z.boolean(),
  followers_count: z.number(),
  following_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserMediaSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  file_key: z.string(),
  file_type: z.string(),
  file_size_bytes: z.number(),
  duration_seconds: z.number().nullable(),
  cover_image_key: z.string().nullable(),
  is_public: z.boolean(),
  play_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserLinkSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  url: z.string(),
  link_type: z.string(),
  display_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ConversationSchema = z.object({
  id: z.string(),
  participant_1_id: z.string(),
  participant_2_id: z.string(),
  last_message_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const MessageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  sender_id: z.string(),
  message_text: z.string(),
  is_read: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SendMessageSchema = z.object({
  recipient_id: z.string(),
  message_text: z.string().min(1).max(1000),
});

export const UpdateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  links: z.string().optional(), // JSON string of links array
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserMedia = z.infer<typeof UserMediaSchema>;
export type UserLink = z.infer<typeof UserLinkSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

// Suite schemas
export const SuiteSchema = z.object({
  id: z.string(),
  host_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  max_participants: z.number(),
  is_active: z.boolean(),
  is_public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SuiteParticipantSchema = z.object({
  id: z.string(),
  suite_id: z.string(),
  user_id: z.string(),
  role: z.enum(['host', 'admin', 'participant']),
  is_muted: z.boolean(),
  is_speaking: z.boolean(),
  joined_at: z.string(),
  updated_at: z.string(),
});

export const SuiteBanSchema = z.object({
  id: z.string(),
  suite_id: z.string(),
  user_id: z.string(),
  banned_by: z.string(),
  reason: z.string().nullable(),
  banned_at: z.string(),
});

export const SuiteReportSchema = z.object({
  id: z.string(),
  suite_id: z.string(),
  reporter_id: z.string(),
  reported_user_id: z.string(),
  reason: z.string(),
  status: z.enum(['pending', 'reviewed', 'resolved']),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateSuiteSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  max_participants: z.number().min(2).max(10).default(10),
  is_public: z.boolean().default(true),
});

export const UpdateSuiteParticipantSchema = z.object({
  role: z.enum(['admin', 'participant']).optional(),
  is_muted: z.boolean().optional(),
});

export const ReportUserSchema = z.object({
  reported_user_id: z.string(),
  reason: z.string().min(1).max(500),
});

export type Suite = z.infer<typeof SuiteSchema>;
export type SuiteParticipant = z.infer<typeof SuiteParticipantSchema>;
export type SuiteBan = z.infer<typeof SuiteBanSchema>;
export type SuiteReport = z.infer<typeof SuiteReportSchema>;
export type CreateSuite = z.infer<typeof CreateSuiteSchema>;
export type UpdateSuiteParticipant = z.infer<typeof UpdateSuiteParticipantSchema>;
export type ReportUser = z.infer<typeof ReportUserSchema>;

// Live Session schemas
export const LiveSessionSchema = z.object({
  id: z.string(),
  host_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  session_type: z.enum(['showcase', 'rivals', 'playlisted']),
  theme: z.string().nullable(),
  max_participants: z.number(),
  is_active: z.boolean(),
  is_public: z.boolean(),
  viewer_count: z.number(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SessionParticipantSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  user_id: z.string(),
  role: z.enum(['host', 'contestant', 'viewer']),
  is_muted: z.boolean(),
  is_camera_on: z.boolean(),
  joined_at: z.string(),
  updated_at: z.string(),
});

export const SessionSubmissionSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  submitted_by: z.string(),
  music_title: z.string(),
  artist_name: z.string().nullable(),
  file_key: z.string().nullable(),
  audio_url: z.string().nullable(),
  submission_type: z.enum(['playlist', 'battle', 'showcase']),
  votes_count: z.number(),
  is_approved: z.boolean(),
  is_played: z.boolean(),
  played_at: z.string().nullable(),
  submitted_at: z.string(),
  updated_at: z.string(),
});

export const SessionVoteSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  submission_id: z.string(),
  voter_id: z.string(),
  vote_type: z.enum(['like', 'fire', 'crown']),
  created_at: z.string(),
});

export const SessionChatSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  user_id: z.string(),
  message_text: z.string(),
  message_type: z.enum(['chat', 'reaction', 'system']),
  created_at: z.string(),
});

export const CreateLiveSessionSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  session_type: z.enum(['showcase', 'rivals', 'playlisted']),
  theme: z.string().max(100).optional(),
  max_participants: z.number().min(2).max(100).default(100),
  is_public: z.boolean().default(true),
});

export const SubmitMusicSchema = z.object({
  music_title: z.string().min(1).max(100),
  artist_name: z.string().max(100).optional(),
  audio_url: z.string().url().optional(),
});

export type LiveSession = z.infer<typeof LiveSessionSchema>;
export type SessionParticipant = z.infer<typeof SessionParticipantSchema>;
export type SessionSubmission = z.infer<typeof SessionSubmissionSchema>;
export type SessionVote = z.infer<typeof SessionVoteSchema>;
export type SessionChat = z.infer<typeof SessionChatSchema>;
export type CreateLiveSession = z.infer<typeof CreateLiveSessionSchema>;
export type SubmitMusic = z.infer<typeof SubmitMusicSchema>;

// Beat Store schemas
export const BeatLicenseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  marketplace_item_id: z.string(),
  license_type: z.enum(['basic', 'lease', 'exclusive']),
  payment_id: z.string(),
  license_terms: z.string().nullable(),
  usage_limit: z.number().nullable(),
  usage_count: z.number().default(0),
  is_active: z.boolean(),
  expires_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SellerAnalyticsSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  marketplace_item_id: z.string(),
  sale_type: z.enum(['basic', 'lease', 'exclusive']),
  amount_cents: z.number(),
  commission_cents: z.number(),
  net_earnings_cents: z.number(),
  sale_date: z.string(),
});

export const BeatReviewSchema = z.object({
  id: z.string(),
  marketplace_item_id: z.string(),
  reviewer_id: z.string(),
  rating: z.number().min(1).max(5),
  review_text: z.string().nullable(),
  is_verified_purchase: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateBeatListingSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  basic_price_cents: z.number().min(99), // Minimum $0.99
  bpm: z.number().min(60).max(200).optional(),
  key_signature: z.string().optional(),
  genre: z.string().optional(),
  tags: z.array(z.string()).optional(),
  has_lease_option: z.boolean().default(false),
  lease_price_cents: z.number().optional(),
  lease_terms: z.string().optional(),
  has_exclusive_option: z.boolean().default(false),
  exclusive_price_cents: z.number().optional(),
  license_terms: z.string().optional(),
});

export const CreateBeatReviewSchema = z.object({
  marketplace_item_id: z.string(),
  rating: z.number().min(1).max(5),
  review_text: z.string().max(500).optional(),
});

export type BeatLicense = z.infer<typeof BeatLicenseSchema>;
export type SellerAnalytics = z.infer<typeof SellerAnalyticsSchema>;
export type BeatReview = z.infer<typeof BeatReviewSchema>;
export type CreateBeatListing = z.infer<typeof CreateBeatListingSchema>;
export type CreateBeatReview = z.infer<typeof CreateBeatReviewSchema>;
