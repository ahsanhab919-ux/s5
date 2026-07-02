export type CampaignObjective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_APP_PROMOTION"
  | "OUTCOME_SALES";

// Human-readable labels for UI
export const CampaignObjectiveLabels: Record<CampaignObjective, string> = {
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_TRAFFIC: "Traffic",
  OUTCOME_ENGAGEMENT: "Engagement",
  OUTCOME_LEADS: "Lead Generation",
  OUTCOME_APP_PROMOTION: "App Promotion",
  OUTCOME_SALES: "Sales",
};

// ==================== STATUS TYPES ====================

export type CampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
export type AdSetStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
export type AdStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export const StatusLabels: Record<
  CampaignStatus | AdSetStatus | AdStatus,
  string
> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  DELETED: "Deleted",
  ARCHIVED: "Archived",
};

export const StatusColors: Record<
  CampaignStatus | AdSetStatus | AdStatus,
  string
> = {
  ACTIVE: "green",
  PAUSED: "yellow",
  DELETED: "red",
  ARCHIVED: "gray",
};

// ==================== BID STRATEGIES ====================

export type BidStrategy =
  | "LOWEST_COST_WITHOUT_CAP"
  | "LOWEST_COST_WITH_BID_CAP"
  | "COST_CAP"
  | "LOWEST_COST_WITH_MIN_ROAS";

export const BidStrategyLabels: Record<BidStrategy, string> = {
  LOWEST_COST_WITHOUT_CAP: "Lowest Cost (No Cap)",
  LOWEST_COST_WITH_BID_CAP: "Bid Cap",
  COST_CAP: "Cost Cap",
  LOWEST_COST_WITH_MIN_ROAS: "Min ROAS",
};

// ==================== OPTIMIZATION GOALS ====================

export type OptimizationGoal =
  | "NONE"
  | "APP_INSTALLS"
  | "AD_RECALL_LIFT"
  | "ENGAGED_USERS"
  | "EVENT_RESPONSES"
  | "IMPRESSIONS"
  | "LEAD_GENERATION"
  | "QUALITY_LEAD"
  | "LINK_CLICKS"
  | "OFFSITE_CONVERSIONS"
  | "PAGE_LIKES"
  | "POST_ENGAGEMENT"
  | "QUALITY_CALL"
  | "REACH"
  | "LANDING_PAGE_VIEWS"
  | "VISIT_INSTAGRAM_PROFILE"
  | "VALUE"
  | "THRUPLAY"
  | "DERIVED_EVENTS"
  | "APP_INSTALLS_AND_OFFSITE_CONVERSIONS"
  | "CONVERSATIONS"
  | "IN_APP_VALUE"
  | "MESSAGING_PURCHASE_CONVERSION"
  | "SUBSCRIBERS"
  | "REMINDERS_SET"
  | "MEANINGFUL_CALL_ATTEMPT"
  | "PROFILE_VISIT"
  | "PROFILE_AND_PAGE_ENGAGEMENT"
  | "ADVERTISER_SILOED_VALUE"
  | "AUTOMATIC_OBJECTIVE"
  | "MESSAGING_APPOINTMENT_CONVERSION";

export const OptimizationGoalLabels: Record<OptimizationGoal, string> = {
  NONE: "None",
  APP_INSTALLS: "App Installs",
  AD_RECALL_LIFT: "Ad Recall Lift",
  ENGAGED_USERS: "Engaged Users",
  EVENT_RESPONSES: "Event Responses",
  IMPRESSIONS: "Impressions",
  LEAD_GENERATION: "Lead Generation",
  QUALITY_LEAD: "Quality Lead",
  LINK_CLICKS: "Link Clicks",
  OFFSITE_CONVERSIONS: "Offsite Conversions",
  PAGE_LIKES: "Page Likes",
  POST_ENGAGEMENT: "Post Engagement",
  QUALITY_CALL: "Quality Call",
  REACH: "Reach",
  LANDING_PAGE_VIEWS: "Landing Page Views",
  VISIT_INSTAGRAM_PROFILE: "Visit Instagram Profile",
  VALUE: "Value (ROAS)",
  THRUPLAY: "ThruPlay",
  DERIVED_EVENTS: "Derived Events",
  APP_INSTALLS_AND_OFFSITE_CONVERSIONS: "App Installs and Offsite Conversions",
  CONVERSATIONS: "Conversations",
  IN_APP_VALUE: "In-App Value",
  MESSAGING_PURCHASE_CONVERSION: "Messaging Purchase Conversion",
  SUBSCRIBERS: "Subscribers",
  REMINDERS_SET: "Reminders Set",
  MEANINGFUL_CALL_ATTEMPT: "Meaningful Call Attempt",
  PROFILE_VISIT: "Profile Visit",
  PROFILE_AND_PAGE_ENGAGEMENT: "Profile and Page Engagement",
  ADVERTISER_SILOED_VALUE: "Advertiser Siloed Value",
  AUTOMATIC_OBJECTIVE: "Automatic Objective",
  MESSAGING_APPOINTMENT_CONVERSION: "Messaging Appointment Conversion",
};

// ==================== CALL TO ACTION ====================

export type CallToActionType =
  | "LEARN_MORE"
  | "SHOP_NOW"
  | "SIGN_UP"
  | "DOWNLOAD"
  | "BOOK_NOW"
  | "CONTACT_US"
  | "GET_QUOTE"
  | "SUBSCRIBE"
  | "APPLY_NOW"
  | "WATCH_MORE"
  | "SEND_MESSAGE"
  | "CALL_NOW"
  | "GET_DIRECTIONS"
  | "SEND_WHATSAPP_MESSAGE"
  | "NO_BUTTON";

export const CallToActionLabels: Record<CallToActionType, string> = {
  LEARN_MORE: "Learn More",
  SHOP_NOW: "Shop Now",
  SIGN_UP: "Sign Up",
  DOWNLOAD: "Download",
  BOOK_NOW: "Book Now",
  CONTACT_US: "Contact Us",
  GET_QUOTE: "Get Quote",
  SUBSCRIBE: "Subscribe",
  APPLY_NOW: "Apply Now",
  WATCH_MORE: "Watch More",
  SEND_MESSAGE: "Send Message",
  CALL_NOW: "Call Now",
  GET_DIRECTIONS: "Get Directions",
  SEND_WHATSAPP_MESSAGE: "Send WhatsApp",
  NO_BUTTON: "No Button",
};

// ==================== AD FORMATS ====================

export type AdFormat =
  | "SINGLE_IMAGE"
  | "CAROUSEL"
  | "VIDEO"
  | "SHORT_VIDEO"
  | "LONG_VIDEO"
  | "STORY"
  | "COLLECTION"
  | "SLIDESHOW"
  | "INSTANT_EXPERIENCE";

export const AdFormatLabels: Record<AdFormat, string> = {
  SINGLE_IMAGE: "Single Image",
  CAROUSEL: "Carousel",
  VIDEO: "Video",
  SHORT_VIDEO: "Short Video (Reels)",
  LONG_VIDEO: "Long Video",
  STORY: "Story",
  COLLECTION: "Collection",
  SLIDESHOW: "Slideshow",
  INSTANT_EXPERIENCE: "Instant Experience",
};

// ==================== PLACEMENTS ====================

export type Placement =
  | "AUTOMATIC"
  | "FACEBOOK_FEED"
  | "INSTAGRAM_FEED"
  | "FACEBOOK_STORIES"
  | "INSTAGRAM_STORIES"
  | "REELS"
  | "MESSENGER"
  | "AUDIENCE_NETWORK"
  | "FACEBOOK_RIGHT_COLUMN"
  | "INSTAGRAM_EXPLORE";

export const PlacementLabels: Record<Placement, string> = {
  AUTOMATIC: "Automatic (Recommended)",
  FACEBOOK_FEED: "Facebook Feed",
  INSTAGRAM_FEED: "Instagram Feed",
  FACEBOOK_STORIES: "Facebook Stories",
  INSTAGRAM_STORIES: "Instagram Stories",
  REELS: "Reels",
  MESSENGER: "Messenger",
  AUDIENCE_NETWORK: "Audience Network",
  FACEBOOK_RIGHT_COLUMN: "Facebook Right Column",
  INSTAGRAM_EXPLORE: "Instagram Explore",
};

// ==================== SPECIAL AD CATEGORIES ====================

export type SpecialAdCategory =
  | "NONE"
  | "EMPLOYMENT"
  | "HOUSING"
  | "CREDIT"
  | "ISSUES_ELECTIONS_POLITICS";

export const SpecialAdCategoryLabels: Record<SpecialAdCategory, string> = {
  NONE: "None",
  EMPLOYMENT: "Employment",
  HOUSING: "Housing",
  CREDIT: "Credit",
  ISSUES_ELECTIONS_POLITICS: "Issues, Elections, or Politics",
};

// ==================== TARGETING ====================

export interface Targeting {
  geo_locations?: {
    countries?: string[];
    regions?: Array<{
      key: string;
      name?: string;
    }>;
    cities?: Array<{
      key: string;
      name?: string;
      radius?: number;
      distance_unit?: "mile" | "kilometer";
    }>;
  };

  age_min?: number;
  age_max?: number;
  genders?: (1 | 2)[];

  flexible_spec?: Array<{
    interests?: Array<{ id: string; name?: string }>;
    behaviors?: Array<{ id: string; name?: string }>;
  }>;

  advantage_audience?: boolean;
  locales?: number[];
}

// ==================== CAMPAIGN STRUCTURE ====================

export interface Campaign {
  id: string;
  meta_campaign_id?: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  daily_budget: number;
  bid_strategy: BidStrategy;
  special_ad_categories: SpecialAdCategory[];

  // App-specific
  project_id?: string;
  targeting_strategy?: "broad" | "detailed" | "advantage_plus";

  // Metadata
  created_at?: Date;
  updated_at?: Date;
  synced_at?: Date;
}

export interface AdSet {
  id: string;
  campaign_id: string;
  meta_adset_id?: string;
  meta_campaign_id?: string;
  name: string;
  status: AdSetStatus;
  daily_budget?: number;
  optimization_goal: OptimizationGoal;
  targeting: Targeting;

  // App-specific
  persona?: string;
  awareness_stage?:
    | "problem_aware"
    | "solution_aware"
    | "product_aware"
    | "most_aware";

  // Metadata
  created_at?: Date;
  updated_at?: Date;
  synced_at?: Date;
}

export interface Ad {
  id: string;
  adset_id: string;
  meta_ad_id?: string;
  meta_adset_id?: string;
  name: string;
  status: AdStatus;

  // Creative
  format: AdFormat;
  headline: string;
  primary_text: string;
  description?: string;
  cta: CallToActionType;
  destination_url?: string;

  // Media
  image_url?: string;
  video_id?: string;

  // Carousel
  carousel_cards?: Array<{
    headline: string;
    description?: string;
    image_url?: string;
    destination_url?: string;
  }>;

  // App-specific
  persona?: string;
  awareness_stage?: string;
  hook?: string;
  creative_direction?: string;
  angle?: string;
  benefit_focus?: string;
  language?: string;

  // Metadata
  created_at?: Date;
  updated_at?: Date;
  synced_at?: Date;
}

// ==================== PERSONAS ====================

export interface Persona {
  id?: string;
  name: string;
  description: string;
  pain_points: string[];
  motivations: string[];

  // Demographics
  age_range?: string;
  gender?: string;
  interests?: string[];
  locations?: string[];

  // Metadata
  created_at?: Date;
}

// ==================== AD CONCEPTS ====================

export interface AdConcept {
  persona: string;
  awareness_stage:
    | "problem_aware"
    | "solution_aware"
    | "product_aware"
    | "most_aware";
  format: AdFormat;
  headline: string;
  primary_text: string;
  description: string;
  cta: CallToActionType;
  creative_direction: string;
  hook: string;
  angle?: string;
  benefit_focus?: string;
  language?: string;
}

// ==================== CAMPAIGN SUGGESTIONS ====================

export interface CampaignSuggestion {
  campaign: {
    name: string;
    objective: CampaignObjective;
    budget_recommendation: {
      daily_min: number;
      daily_max: number;
      reasoning: string;
    };
  };
  personas: Persona[];
  ad_concepts: AdConcept[];
  strategy_notes: string[];
}

// ==================== AWARENESS STAGES ====================

export type AwarenessStage =
  | "problem_aware"
  | "solution_aware"
  | "product_aware"
  | "most_aware";

export const AwarenessStageLabels: Record<AwarenessStage, string> = {
  problem_aware: "Problem Aware",
  solution_aware: "Solution Aware",
  product_aware: "Product Aware",
  most_aware: "Most Aware",
};

export const AwarenessStageDescriptions: Record<AwarenessStage, string> = {
  problem_aware: "People don't realize the problem yet",
  solution_aware: "People know the problem but not the solution",
  product_aware: "People know solutions exist but not your product",
  most_aware: "People ready to buy",
};

// ==================== HELPER FUNCTIONS ====================

export function getCampaignObjectiveForGoal(goal: string): CampaignObjective {
  const goalMap: Record<string, CampaignObjective> = {
    awareness: "OUTCOME_AWARENESS",
    traffic: "OUTCOME_TRAFFIC",
    engagement: "OUTCOME_ENGAGEMENT",
    leads: "OUTCOME_LEADS",
    app: "OUTCOME_APP_PROMOTION",
    sales: "OUTCOME_SALES",
    conversions: "OUTCOME_SALES",
  };

  return goalMap[goal.toLowerCase()] || "OUTCOME_SALES";
}

export function getRecommendedOptimizationGoal(
  objective: CampaignObjective,
): OptimizationGoal {
  const goalMap: Record<CampaignObjective, OptimizationGoal> = {
    OUTCOME_AWARENESS: "REACH",
    OUTCOME_TRAFFIC: "LANDING_PAGE_VIEWS",
    OUTCOME_ENGAGEMENT: "POST_ENGAGEMENT",
    OUTCOME_LEADS: "LEAD_GENERATION",
    OUTCOME_APP_PROMOTION: "APP_INSTALLS",
    OUTCOME_SALES: "LINK_CLICKS",
  };

  return goalMap[objective];
}

export function formatBudget(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// ==================== PERFORMANCE METRICS ====================

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
  cost_per_conversion: number;
  roas: number;
  cpm: number;
  cpc: number;
}

export interface PerformanceData {
  campaign_id: string;
  date: Date;
  metrics: CampaignMetrics;
}
