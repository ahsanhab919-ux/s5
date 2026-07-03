/**
 * Campaign domain types for the marketing automation feature.
 *
 * These interfaces model the AI-generated campaign strategy (suggestions,
 * personas, ad concepts) as well as the concrete entities that are created
 * and published to Meta (campaigns, ad sets, ads). They are the shared
 * contract between the marketing-automation services, hooks and UI
 * components.
 *
 * @module types/campaign
 */

import type {
  AdFormat,
  BidStrategy,
  CallToActionType,
  CampaignObjective,
  OptimizationGoal,
  Placement,
} from "./metaCampaign";

/**
 * A complete AI-generated campaign strategy proposal.
 *
 * Returned by the strategy-generation step before any entities are
 * persisted. It bundles the recommended campaign settings together with
 * the ad sets, target personas and creative concepts the AI proposes.
 */
export interface CampaignSuggestion {
  /** Top-level campaign configuration the AI recommends. */
  campaign: {
    /** Human-readable campaign name. */
    name: string;
    /** Marketing objective (e.g. traffic, conversions) for the campaign. */
    objective: CampaignObjective;
    /** Suggested daily budget range with the reasoning behind it. */
    budget_recommendation: {
      /** Minimum recommended daily budget, in account currency. */
      daily_min: number;
      /** Maximum recommended daily budget, in account currency. */
      daily_max: number;
      /** Explanation of why this budget range was suggested. */
      reasoning: string;
    };
  };
  /** Ad sets to create under the campaign, each with its own targeting. */
  ad_sets: Array<{
    /** Human-readable ad set name. */
    name: string;
    /** Bidding strategy Meta should use for this ad set. */
    bid_strategy: BidStrategy;
    /** Optional audience targeting rules for this ad set. */
    targeting?: {
      /** Minimum audience age. */
      age_min?: number;
      /** Maximum audience age. */
      age_max?: number;
      /** Geographic targeting by country and/or city. */
      geo_locations?: {
        /** ISO country codes to target. */
        countries?: string[];
        /** Specific cities to target. */
        cities?: Array<{
          /** Meta city key identifier. */
          key: string;
          /** Display name of the city. */
          name?: string;
        }>;
      };
      /** Whether to enable Meta Advantage+ audience expansion. */
      advantage_audience?: boolean;
    };
  }>;
  /** Target audience personas the strategy is built around. */
  personas: Persona[];
  /** Creative ad concepts proposed for the personas. */
  ad_concepts: AdConcept[];
  /** Free-form strategic notes and recommendations from the AI. */
  strategy_notes: string[];
}

/**
 * A target audience persona used to guide creative generation.
 */
export interface Persona {
  /** Short label identifying the persona. */
  name: string;
  /** Narrative description of who this persona is. */
  description: string;
  /** Problems or frustrations this persona experiences. */
  pain_points: string[];
  /** What drives this persona to take action. */
  motivations: string[];
  /** Optional demographic attributes for the persona. */
  demographics?: {
    /** Age range, e.g. "25-34". */
    age_range?: string;
    /** Gender identity of the persona. */
    gender?: string;
    /** Interests and affinities relevant to targeting. */
    interests?: string[];
  };
}

/**
 * A single creative ad concept tailored to a persona and awareness stage.
 */
export interface AdConcept {
  /** Name of the persona this concept targets. */
  persona: string;
  /** Buyer awareness stage this creative is written for. */
  awareness_stage:
    | "problem_aware"
    | "solution_aware"
    | "product_aware"
    | "most_aware";
  /** Ad format (image, video, carousel, etc.). */
  format: AdFormat;
  /** Primary headline text. */
  headline: string;
  /** Main body copy of the ad. */
  primary_text: string;
  /** Supporting description/subtext. */
  description: string;
  /** Call-to-action button type. */
  cta: CallToActionType;
  /** Guidance for the visual/creative execution. */
  creative_direction: string;
  /** The attention-grabbing hook that opens the ad. */
  hook: string;
  /** Optional marketing angle used for the concept. */
  angle?: string;
  /** Optional key benefit the concept emphasizes. */
  benefit_focus?: string;
  /** Optional landing page URL the ad drives to. */
  destination_url?: string;
}

/**
 * A persisted advertising campaign entity.
 */
export interface Campaign {
  /** Unique campaign identifier. */
  id: string;
  /** Human-readable campaign name. */
  name: string;
  /** Marketing objective the campaign optimizes for. */
  objective: CampaignObjective;
  /** Daily/lifetime budget amount in account currency. */
  budget: number;
  /** Current lifecycle status of the campaign. */
  status: "draft" | "active" | "paused";
}

/**
 * A persisted ad set that groups ads under a campaign and defines
 * targeting, placement and optimization settings.
 */
export interface AdSet {
  /** Unique ad set identifier. */
  id: string;
  /** ID of the parent campaign this ad set belongs to. */
  campaignId: string;
  /** Human-readable ad set name. */
  name: string;
  /** Optional budget for the ad set, in account currency. */
  budget?: number;
  /** Where ads will show (Facebook Feed, Instagram Stories, Reels, etc.). */
  placements?: Placement[];
  /** Current lifecycle status of the ad set. */
  status?: "draft" | "active" | "paused";
  /** Bidding strategy applied to the ad set. */
  bid_strategy?: BidStrategy;
  /** Delivery optimization goal for the ad set. */
  optimization_goal?: OptimizationGoal;
  /** Optional audience targeting rules. */
  targeting?: {
    /** Minimum audience age. */
    age_min?: number;
    /** Maximum audience age. */
    age_max?: number;
    /** Geographic targeting by country and/or city. */
    geo_locations?: {
      /** ISO country codes to target. */
      countries?: string[];
      /** Specific cities to target. */
      cities?: Array<{
        /** Meta city key identifier. */
        key: string;
        /** Display name of the city. */
        name?: string;
      }>;
    };
    /** Whether to enable Meta Advantage+ audience expansion. */
    advantage_audience?: boolean;
  };
}

/**
 * A persisted ad (creative) belonging to an ad set.
 *
 * Holds the copy and media generated for the ad along with Meta
 * publishing metadata populated once the ad is live.
 */
export interface Ad {
  /** Unique ad identifier. */
  id: string;
  /** ID of the ad set this ad belongs to. */
  adSetId: string;
  /** Optional persona name the ad targets. */
  persona?: string;
  /** Optional buyer awareness stage the ad is written for. */
  awareness_stage?: string;
  /** Ad format (image, video, carousel, etc.). */
  format: AdFormat;
  /** Primary headline text. */
  headline: string;
  /** Optional main body copy. */
  primary_text?: string;
  /** Supporting description/subtext. */
  description: string;
  /** Call-to-action button type. */
  cta: CallToActionType;
  /** URL of a single generated image. */
  imageUrl?: string;
  /** URLs of multiple images for carousel format. */
  imageUrls?: string[];
  /** URL of the generated video for video-format ads. */
  videoUrl?: string;
  /** Guidance for the visual/creative execution. */
  creative_direction?: string;
  /** The attention-grabbing hook that opens the ad. */
  hook?: string;
  /** Optional marketing angle. */
  angle?: string;
  /** Optional key benefit the ad emphasizes. */
  benefit_focus?: string;
  /** Optional landing page URL the ad drives to. */
  destination_url?: string;
  /** Optional language code of the ad copy. */
  language?: string;
  /** Recommended placements based on the ad format. */
  recommended_placements?: Placement[];
  /** Ad publication status. */
  status?: "draft" | "published" | "paused";
  /** Meta ad ID assigned after publishing. */
  metaAdId?: string;
  /** Meta ad creative ID assigned after publishing. */
  metaCreativeId?: string;
  /** Timestamp of when the ad was published. */
  publishedAt?: Date;
  /** Error message if publishing failed. */
  error?: string;
}

/**
 * A single message exchanged in a marketing-automation chat session.
 */
export interface ChatMessage {
  /** Who authored the message. */
  role: "user" | "assistant" | "system";
  /** Text content of the message. */
  content: string;
  /** Optional time the message was created. */
  timestamp?: Date;
}
