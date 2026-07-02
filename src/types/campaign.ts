import type {
  AdFormat,
  BidStrategy,
  CallToActionType,
  CampaignObjective,
  OptimizationGoal,
  Placement,
} from "./metaCampaign";

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
  ad_sets: Array<{
    name: string;
    bid_strategy: BidStrategy;
    targeting?: {
      age_min?: number;
      age_max?: number;
      geo_locations?: {
        countries?: string[];
        cities?: Array<{
          key: string;
          name?: string;
        }>;
      };
      advantage_audience?: boolean;
    };
  }>;
  personas: Persona[];
  ad_concepts: AdConcept[];
  strategy_notes: string[];
}

export interface Persona {
  name: string;
  description: string;
  pain_points: string[];
  motivations: string[];
  demographics?: {
    age_range?: string;
    gender?: string;
    interests?: string[];
  };
}

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
  destination_url?: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  budget: number;
  status: "draft" | "active" | "paused";
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  budget?: number;
  placements?: Placement[]; // Where ads will show (Facebook Feed, Instagram Stories, Reels, etc.)
  status?: "draft" | "active" | "paused";
  bid_strategy?: BidStrategy;
  optimization_goal?: OptimizationGoal;
  targeting?: {
    age_min?: number;
    age_max?: number;
    geo_locations?: {
      countries?: string[];
      cities?: Array<{
        key: string;
        name?: string;
      }>;
    };
    advantage_audience?: boolean;
  };
}

export interface Ad {
  id: string;
  adSetId: string;
  persona?: string;
  awareness_stage?: string;
  format: AdFormat;
  headline: string;
  primary_text?: string;
  description: string;
  cta: CallToActionType;
  imageUrl?: string;
  imageUrls?: string[]; // For carousel format with multiple images
  videoUrl?: string; // For video format ads
  creative_direction?: string;
  hook?: string;
  angle?: string;
  benefit_focus?: string;
  destination_url?: string;
  language?: string;
  recommended_placements?: Placement[]; // Recommended placements based on format
  status?: "draft" | "published" | "paused"; // Ad publication status
  metaAdId?: string; // Meta ad ID after publishing
  metaCreativeId?: string; // Meta ad creative ID after publishing
  publishedAt?: Date; // Publication timestamp
  error?: string; // Error message if publishing failed
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}
