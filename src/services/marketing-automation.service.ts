/**
 * Marketing Automation Service
 *
 * This module provides a comprehensive API for managing marketing campaigns,
 * media generation, and Meta/Facebook platform integration. It is organized
 * into three main API groups:
 *
 * 1. **Campaign API** - Campaign creation, AI-powered suggestions, chat, and ad publishing
 * 2. **Media API** - Media generation, regeneration, and ImageKit integration
 * 3. **Meta API** - Facebook authentication, user data, webhook management, and pixel retrieval
 *
 * All API calls use the configured marketing automation backend prefix from environment variables.
 *
 * @module marketing-automation.service
 * @requires @/lib/api
 *
 * @example
 * ```typescript
 * import { campaignAPI, mediaAPI, metaAPI } from '@/services/marketing-automation.service';
 *
 * // Get initial campaign suggestions
 * const suggestions = await campaignAPI.getInitialSuggestions('project-123');
 *
 * // Generate media for an ad
 * const media = await mediaAPI.generateMedia('project-123', 'ad-456');
 *
 * // Get user's Facebook data
 * const userData = await metaAPI.getUserData();
 * ```
 */

import api from "@/lib/api";
import type { Campaign, AdSet, Ad, Persona } from "@/types/campaign";

/**
 * Campaign API
 *
 * Provides functions for managing marketing campaigns including AI-powered
 * suggestions, chat interactions, campaign data management, ad generation,
 * and publishing to Meta platforms.
 */
export const campaignAPI = {
  /**
   * Get AI-powered initial campaign suggestions for a project
   *
   * Analyzes the project context and generates intelligent campaign suggestions
   * including target audiences, messaging strategies, and campaign objectives.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @returns {Promise<Object>} Campaign suggestions data including personas, objectives, and strategies
   * @throws {Error} If the API request fails or projectId is invalid
   *
   * @example
   * ```typescript
   * const suggestions = await campaignAPI.getInitialSuggestions('project-123');
   * console.log(suggestions.personas); // Suggested target personas
   * console.log(suggestions.objectives); // Campaign objectives
   * ```
   */
  getInitialSuggestions: async (projectId: string) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/initial-suggestions/${projectId}`,
    );
    return response.data;
  },

  /**
   * Chat with AI assistant for campaign planning (with conversation memory)
   *
   * Sends a message to the AI assistant and receives context-aware responses.
   * The AI maintains conversation history for the project, allowing for
   * natural, iterative campaign planning discussions.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @param {string} message - The user's message to send to the AI assistant
   * @returns {Promise<Object>} AI response containing the reply and updated conversation state
   * @throws {Error} If the API request fails or parameters are invalid
   *
   * @example
   * ```typescript
   * const response = await campaignAPI.chat(
   *   'project-123',
   *   'What target audience would work best for a tech product?'
   * );
   * console.log(response.message); // AI's response
   * ```
   */
  chat: async (projectId: string, message: string) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/chat/${projectId}`,
      {
        message,
      },
    );
    return response.data;
  },

  /**
   * Retrieve the complete chat conversation history for a project
   *
   * Fetches all previous messages exchanged with the AI assistant for the
   * specified project, maintaining chronological order.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @returns {Promise<Array>} Array of chat messages with timestamps and roles
   * @throws {Error} If the API request fails or projectId is invalid
   *
   * @example
   * ```typescript
   * const history = await campaignAPI.getChatHistory('project-123');
   * history.forEach(msg => {
   *   console.log(`${msg.role}: ${msg.content}`);
   * });
   * ```
   */
  getChatHistory: async (projectId: string) => {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/chat-history/${projectId}`,
    );
    return response.data;
  },

  /**
   * Clear all chat conversation history for a project
   *
   * Deletes all previous messages and resets the AI conversation state.
   * This action is irreversible and will remove all context from the AI assistant.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @returns {Promise<Object>} Confirmation response
   * @throws {Error} If the API request fails or projectId is invalid
   *
   * @example
   * ```typescript
   * await campaignAPI.clearChatHistory('project-123');
   * console.log('Chat history cleared - AI will start fresh');
   * ```
   */
  clearChatHistory: async (projectId: string) => {
    const response = await api.delete(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/chat-history/${projectId}`,
    );
    return response.data;
  },

  /**
   * Save complete campaign structure and data for a project
   *
   * Persists the entire campaign hierarchy including campaigns, ad sets,
   * individual ads, and target personas. This is typically called after
   * the user has finalized their campaign structure.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @param {Object} data - Complete campaign data structure
   * @param {Array} data.campaigns - Array of campaign objects
   * @param {Array} data.adSets - Array of ad set objects (grouped ads with targeting)
   * @param {Array} data.ads - Array of individual ad objects (copy, creative, CTA)
   * @param {Array} data.personas - Array of target persona/audience definitions
   * @returns {Promise<Object>} Saved campaign data with server-generated IDs
   * @throws {Error} If the API request fails or data structure is invalid
   *
   * @example
   * ```typescript
   * const campaignData = {
   *   campaigns: [{ name: 'Summer Sale', objective: 'CONVERSIONS' }],
   *   adSets: [{ name: 'Young Adults 18-25', targeting: {...} }],
   *   ads: [{ headline: 'Save 50%!', body: '...', cta: 'SHOP_NOW' }],
   *   personas: [{ name: 'Tech Enthusiast', age: '18-35', interests: [...] }]
   * };
   * const saved = await campaignAPI.saveCampaignData('project-123', campaignData);
   * ```
   */
  saveCampaignData: async (
    projectId: string,
    data: {
      campaigns: Campaign[];
      adSets: AdSet[];
      ads: Ad[];
      personas: Persona[];
    },
  ) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/data/${projectId}`,
      data,
    );
    return response.data;
  },

  /**
   * Retrieve saved campaign data for a project
   *
   * Fetches the complete campaign structure including all campaigns, ad sets,
   * ads, and personas previously saved for this project.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @returns {Promise<Object>} Campaign data object containing campaigns, adSets, ads, and personas arrays
   * @throws {Error} If the API request fails or projectId is invalid
   *
   * @example
   * ```typescript
   * const data = await campaignAPI.getCampaignData('project-123');
   * console.log(`Found ${data.campaigns.length} campaigns`);
   * console.log(`Total ads: ${data.ads.length}`);
   * ```
   */
  getCampaignData: async (projectId: string) => {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/data/${projectId}`,
    );
    return response.data;
  },

  /**
   * Generate AI-powered ad copy based on product, persona, and campaign parameters
   *
   * Creates compelling ad copy tailored to the specified target persona and
   * awareness stage. Uses AI to generate headlines, body text, and call-to-action
   * that align with best practices for the chosen format.
   *
   * @param {Object} params - Ad generation parameters
   * @param {string} params.product - Product or service being advertised
   * @param {string} params.persona - Target audience persona/segment
   * @param {string} params.awareness_stage - Customer awareness level (e.g., 'problem-aware', 'solution-aware', 'product-aware')
   * @param {string} params.format - Ad format (e.g., 'single-image', 'carousel', 'video')
   * @param {string} [params.angle] - Optional creative angle or unique selling proposition
   * @returns {Promise<Object>} Generated ad with headline, body, CTA, and additional variants
   * @throws {Error} If the API request fails or required parameters are missing
   *
   * @example
   * ```typescript
   * const ad = await campaignAPI.generateAd({
   *   product: 'Smart Fitness Tracker',
   *   persona: 'Health-conscious millennials',
   *   awareness_stage: 'solution-aware',
   *   format: 'single-image',
   *   angle: 'Track sleep quality for better recovery'
   * });
   * console.log(ad.headline); // "Sleep Better, Train Harder"
   * console.log(ad.cta); // "Start Tracking"
   * ```
   */
  generateAd: async (params: {
    product: string;
    persona: string;
    awareness_stage: string;
    format: string;
    angle?: string;
  }) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/generate-ad`,
      params,
    );
    return response.data;
  },

  /**
   * Improve existing ad copy based on user feedback
   *
   * Iteratively enhances ad copy by incorporating specific feedback from the user.
   * The AI analyzes the current ad and feedback to generate an improved version
   * while maintaining the core message and intent.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @param {Object} currentAd - The current ad object to be improved
   * @param {string} feedback - User feedback describing desired improvements (e.g., "Make it more urgent", "Focus on price value")
   * @returns {Promise<Object>} Improved ad copy with revised headline, body, and CTA
   * @throws {Error} If the API request fails or parameters are invalid
   *
   * @example
   * ```typescript
   * const improvedAd = await campaignAPI.improveAd(
   *   'project-123',
   *   currentAd,
   *   'Make the headline more compelling and add social proof'
   * );
   * console.log(improvedAd.headline); // Updated with social proof element
   * ```
   */
  improveAd: async (projectId: string, currentAd: Ad, feedback: string) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/improve-ad/${projectId}`,
      {
        currentAd,
        feedback,
      },
    );
    return response.data;
  },

  /**
   * Update the media for a specific ad
   *
   * @param {string} projectId - Project ID
   * @param {string} adId - Ad ID
   * @param {Object} mediaData - Object containing imageUrl, imageUrls, or videoUrl
   * @returns {Promise<Object>} Updated ad object
   */
  updateAdMedia: async (
    projectId: string,
    adId: string,
    mediaData: {
      imageUrl?: string;
      imageUrls?: string[];
      videoUrl?: string;
    },
  ) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/update-ad-media/${projectId}/${adId}`,
      mediaData,
    );
    return response.data;
  },

  /**
   * Publish ads to Meta (Facebook/Instagram) platforms
   *
   * Submits finalized ads to Meta's advertising platform for review and publishing.
   * This creates actual ad campaigns in the user's Meta Ads Manager account with
   * the specified targeting, creative, and tracking parameters.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @param {string[]} adIds - Array of ad IDs to publish
   * @param {string} pageId - Meta page ID to publish ads from
   * @param {string} adAccountId - Meta ad account ID for billing and management
   * @param {string} [pixelId] - Optional Meta Pixel ID for conversion tracking
   * @param {string} [businessAccountId] - Optional Meta Business Manager account ID
   * @param {Array<{cta: string, url: string}>} [ctasWithUrls] - Optional array mapping CTAs to destination URLs
   * @returns {Promise<Object>} Publishing status and Meta campaign IDs
   * @throws {Error} If the API request fails, authentication is invalid, or Meta API returns errors
   *
   * @example
   * ```typescript
   * const result = await campaignAPI.publishAds(
   *   'project-123',
   *   ['ad-1', 'ad-2', 'ad-3'],
   *   'page-456',
   *   'act-789',
   *   'pixel-012',
   *   'business-345',
   *   [
   *     { cta: 'SHOP_NOW', url: 'https://example.com/shop' },
   *     { cta: 'LEARN_MORE', url: 'https://example.com/about' }
   *   ]
   * );
   * console.log(result.campaignIds); // Meta campaign IDs
   * console.log(result.status); // 'pending_review' or 'active'
   * ```
   */
  publishAds: async (
    projectId: string,
    adIds: string[],
    pageId: string,
    adAccountId: string,
    pixelId?: string,
    businessAccountId?: string,
    ctasWithUrls?: Array<{ cta: string; url: string }>,
  ) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/publish-ads/${projectId}`,
      {
        adIds,
        pageId,
        adAccountId,
        pixelId,
        businessAccountId,
        ctasWithUrls,
      },
    );
    return response.data;
  },
};

/**
 * Media API
 *
 * Provides functions for AI-powered media generation, regeneration with custom prompts,
 * media upload handling, and geographic targeting support. Integrates with ImageKit
 * for media storage and Meta's location targeting APIs.
 */
export const mediaAPI = {
  /**
   * Generate AI-powered media (image/video) for a specific ad
   *
   * Creates visual content based on the ad's copy, target audience, and campaign
   * objectives. The AI analyzes the ad context to generate appropriate imagery.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @param {string} adId - The unique identifier of the ad
   * @returns {Promise<Object>} Generated media object with URL, type, and metadata
   * @throws {Error} If the API request fails or IDs are invalid
   *
   * @example
   * ```typescript
   * const media = await mediaAPI.generateMedia('project-123', 'ad-456');
   * console.log(media.url); // URL to generated image
   * console.log(media.type); // 'image' or 'video'
   * ```
   */
  generateMedia: async (projectId: string, adId: string) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/generate/${projectId}/${adId}`,
    );
    return response.data;
  },

  /**
   * Generate media for multiple ads in a single batch request
   *
   * Efficiently generates visual content for multiple ads simultaneously,
   * reducing API calls and improving performance for bulk operations.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @param {string[]} adIds - Array of ad IDs to generate media for
   * @returns {Promise<Object>} Batch generation results with media URLs mapped to ad IDs
   * @throws {Error} If the API request fails or any ad ID is invalid
   *
   * @example
   * ```typescript
   * const results = await mediaAPI.generateMediaBatch('project-123', ['ad-1', 'ad-2', 'ad-3']);
   * results.media.forEach(item => {
   *   console.log(`${item.adId}: ${item.url}`);
   * });
   * ```
   */
  generateMediaBatch: async (projectId: string, adIds: string[]) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/generate-batch/${projectId}`,
      {
        adIds,
      },
    );
    return response.data;
  },

  /**
   * Regenerate media with a custom prompt and optional region selection
   *
   * Allows fine-tuned control over media generation by providing specific
   * instructions and optionally selecting image regions to modify or preserve.
   * Useful for iterative refinement of generated content.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @param {string} adId - The unique identifier of the ad
   * @param {string} prompt - Custom prompt describing desired changes (e.g., "Add a sunset background", "Make colors more vibrant")
   * @param {Array<{x: number, y: number, width: number, height: number}>} [selectedRegions] - Optional array of image regions to focus on or modify
   * @returns {Promise<Object>} Regenerated media with updated URL
   * @throws {Error} If the API request fails or parameters are invalid
   *
   * @example
   * ```typescript
   * const newMedia = await mediaAPI.regenerateMedia(
   *   'project-123',
   *   'ad-456',
   *   'Add a mountain landscape in the background',
   *   [{ x: 0, y: 0, width: 1920, height: 600 }] // Top region
   * );
   * console.log(newMedia.url); // Updated image URL
   * ```
   */
  regenerateMedia: async (
    projectId: string,
    adId: string,
    prompt: string,
    selectedRegions?: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>,
  ) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/regenerate/${projectId}/${adId}`,
      {
        prompt,
        selectedRegions,
      },
    );
    return response.data;
  },

  /**
   * Save user-uploaded media to an ad
   *
   * Associates custom uploaded media (from ImageKit or other sources) with
   * a specific ad. Use this when users want to use their own images/videos
   * instead of AI-generated content.
   *
   * @param {string} projectId - The unique identifier of the marketing project
   * @param {string} adId - The unique identifier of the ad
   * @param {string} mediaUrl - The URL of the uploaded media
   * @param {"image" | "video"} mediaType - The type of media being uploaded
   * @returns {Promise<Object>} Confirmation with saved media details
   * @throws {Error} If the API request fails or media URL is invalid
   *
   * @example
   * ```typescript
   * const saved = await mediaAPI.saveUploadedMedia(
   *   'project-123',
   *   'ad-456',
   *   'https://ik.imagekit.io/myapp/ad-image.jpg',
   *   'image'
   * );
   * console.log(saved.success); // true
   * ```
   */
  saveUploadedMedia: async (
    projectId: string,
    adId: string,
    mediaUrl: string,
    mediaType: "image" | "video",
  ) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/save/${projectId}/${adId}`,
      {
        mediaUrl,
        mediaType,
      },
    );
    return response.data;
  },

  /**
   * Get ImageKit authentication parameters for secure client-side uploads
   *
   * Retrieves temporary authentication credentials (signature, token, expire)
   * required for direct client-side uploads to ImageKit. This enables secure
   * media uploads without exposing API keys in the frontend.
   *
   * @returns {Promise<Object>} ImageKit auth parameters including signature, token, and expiration
   * @throws {Error} If the API request fails or ImageKit is not configured
   *
   * @example
   * ```typescript
   * const authParams = await mediaAPI.getImageKitAuth();
   * // Use authParams with ImageKit's client-side upload SDK
   * const uploader = new ImageKit({
   *   publicKey: 'your_public_key',
   *   authenticationEndpoint: authParams
   * });
   * ```
   */
  getImageKitAuth: async () => {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}imagekit/auth`,
    );
    return response.data;
  },

  /**
   * Search for cities to use in geographic ad targeting
   *
   * Queries Meta's location database to find cities matching the search term.
   * Returns city IDs and metadata compatible with Meta's ad targeting API.
   *
   * @param {string} query - City name search query
   * @param {string} [country="BD"] - ISO country code (defaults to Bangladesh)
   * @returns {Promise<Array>} Array of matching cities with IDs, names, and Meta targeting keys
   * @throws {Error} If the API request fails or query is empty
   *
   * @example
   * ```typescript
   * const cities = await mediaAPI.searchCities('Dhaka', 'BD');
   * cities.forEach(city => {
   *   console.log(`${city.name} (ID: ${city.key})`);
   * });
   * ```
   */
  searchCities: async (query: string, country: string = "BD") => {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/search-cities?q=${encodeURIComponent(
        query,
      )}&country=${country}`,
    );
    return response.data;
  },

  /**
   * Get a curated list of common cities in Bangladesh with verified Meta API keys
   *
   * Returns a pre-defined list of major Bangladeshi cities with their official
   * Meta targeting keys. Useful for quick targeting setup without search.
   *
   * @returns {Promise<Array>} Array of common Bangladesh cities with Meta targeting data
   * @throws {Error} If the API request fails
   *
   * @example
   * ```typescript
   * const commonCities = await mediaAPI.getCommonCities();
   * // Returns: [{ name: 'Dhaka', key: '123', ... }, { name: 'Chittagong', key: '456', ... }]
   * ```
   */
  getCommonCities: async () => {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/common-cities`,
    );
    return response.data;
  },
};

/**
 * Meta API
 *
 * Provides functions for Facebook/Instagram platform integration including OAuth
 * authentication, user data retrieval, business account management, Meta Pixel
 * configuration, and webhook subscriptions for real-time event notifications.
 */
export const metaAPI = {
  /**
   * Initiate Facebook OAuth authentication flow
   *
   * Starts the OAuth process to connect a user's Facebook account. Returns
   * the authorization URL that the user should be redirected to for granting
   * permissions to manage their Facebook pages and ad accounts.
   *
   * @returns {Promise<Object>} OAuth data including authorization URL and state token
   * @throws {Error} If the API request fails or OAuth configuration is invalid
   *
   * @example
   * ```typescript
   * const authData = await metaAPI.initiateAuth();
   * window.location.href = authData.authUrl; // Redirect user to Facebook
   * ```
   */
  initiateAuth: async () => {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/facebook`,
    );
    return response.data;
  },

  /**
   * Get authenticated user's Facebook data and connected assets
   *
   * Retrieves the user's Facebook profile information, available pages,
   * business accounts, ad accounts, and current permission status. This data
   * is used to populate account selection interfaces.
   *
   * @returns {Promise<Object>} User data including profile, pages, business accounts, and ad accounts
   * @throws {Error} If the API request fails or user is not authenticated
   *
   * @example
   * ```typescript
   * const userData = await metaAPI.getUserData();
   * console.log(userData.pages); // Available Facebook pages
   * console.log(userData.adAccounts); // Available ad accounts
   * console.log(userData.businessAccounts); // Business Manager accounts
   * ```
   */
  getUserData: async () => {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/user-data`,
    );
    return response.data;
  },

  /**
   * Update user's selected Meta pages and business/ad account preferences
   *
   * Saves the user's choices for which Facebook pages, business account, and
   * ad account to use for campaign operations. These selections are used as
   * defaults for subsequent API calls.
   *
   * @param {Object} data - Selection data
   * @param {string[]} data.selectedPageIds - Array of Facebook page IDs to use
   * @param {string} data.selectedBusinessAccountId - Meta Business Manager account ID
   * @param {string} data.selectedAdsAccountId - Meta Ads account ID for billing
   * @returns {Promise<Object>} Confirmation of saved selections
   * @throws {Error} If the API request fails or selections are invalid
   *
   * @example
   * ```typescript
   * await metaAPI.updateSelections({
   *   selectedPageIds: ['page-123', 'page-456'],
   *   selectedBusinessAccountId: 'business-789',
   *   selectedAdsAccountId: 'act-012'
   * });
   * ```
   */
  updateSelections: async (data: {
    selectedPageIds: string[];
    selectedBusinessAccountId: string;
    selectedAdsAccountId: string;
  }) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/update-selections`,
      data,
    );
    return response.data;
  },

  /**
   * Get Meta Pixels associated with a business account
   *
   * Retrieves all Meta Pixel tracking codes available under the specified
   * Business Manager account. Pixels are used for conversion tracking,
   * retargeting, and measuring ad campaign effectiveness.
   *
   * @param {string} businessAccountId - Meta Business Manager account ID
   * @returns {Promise<Array>} Array of pixel objects with IDs, names, and configuration
   * @throws {Error} If the API request fails or business account is invalid
   *
   * @example
   * ```typescript
   * const pixels = await metaAPI.getPixels('business-123');
   * pixels.forEach(pixel => {
   *   console.log(`${pixel.name}: ${pixel.id}`);
   * });
   * ```
   */
  getPixels: async (businessAccountId: string) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}campaign/pixels`,
      {
        businessAccountId,
      },
    );
    return response.data;
  },

  /**
   * Check webhook subscription status for a Facebook page
   *
   * Verifies whether the specified Facebook page is currently subscribed to
   * receive webhook events (messages, comments, etc.). Returns subscription
   * status and configured event types.
   *
   * @param {string} pageId - Facebook page ID to check
   * @returns {Promise<Object>} Webhook status including subscribed events and configuration
   * @throws {Error} If the API request fails or page ID is invalid
   *
   * @example
   * ```typescript
   * const status = await metaAPI.getWebhookStatus('page-123');
   * console.log(status.isSubscribed); // true or false
   * console.log(status.subscribedFields); // ['messages', 'messaging_postbacks']
   * ```
   */
  getWebhookStatus: async (pageId: string) => {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/webhook/status/${pageId}`,
    );
    return response.data;
  },

  /**
   * Subscribe a Facebook page to webhook events
   *
   * Enables real-time webhook notifications for the specified page. This allows
   * the application to receive instant updates about messages, comments, and
   * other page interactions for automated responses and engagement tracking.
   *
   * @param {string} pageId - Facebook page ID to subscribe
   * @returns {Promise<Object>} Subscription confirmation with active event types
   * @throws {Error} If the API request fails, page ID is invalid, or webhook is already subscribed
   *
   * @example
   * ```typescript
   * const result = await metaAPI.subscribeWebhook('page-123');
   * console.log(result.success); // true
   * console.log(result.subscribedFields); // Configured event types
   * ```
   */
  subscribeWebhook: async (pageId: string) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/webhook/subscribe`,
      {
        pageId,
      },
    );
    return response.data;
  },

  /**
   * Unsubscribe a Facebook page from webhook events
   *
   * Disables webhook notifications for the specified page. The application will
   * stop receiving real-time updates about page interactions after unsubscription.
   *
   * @param {string} pageId - Facebook page ID to unsubscribe
   * @returns {Promise<Object>} Unsubscription confirmation
   * @throws {Error} If the API request fails or page ID is invalid
   *
   * @example
   * ```typescript
   * await metaAPI.unsubscribeWebhook('page-123');
   * console.log('Webhook disabled for page');
   * ```
   */
  unsubscribeWebhook: async (pageId: string) => {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/webhook/unsubscribe`,
      {
        pageId,
      },
    );
    return response.data;
  },

  /**
   * Disconnect and revoke the user's Facebook account integration
   *
   * Completely removes the Facebook connection, revokes all permissions, and
   * deletes stored access tokens. This action is irreversible and will require
   * the user to re-authenticate to use Facebook features again.
   *
   * @returns {Promise<Object>} Disconnection confirmation
   * @throws {Error} If the API request fails
   *
   * @example
   * ```typescript
   * await metaAPI.disconnect();
   * console.log('Facebook account disconnected successfully');
   * // User must re-authenticate to use Meta features
   * ```
   */
  disconnect: async () => {
    const response = await api.delete(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}connect/facebook`,
    );
    return response.data;
  },
};

export default api;
