export type ListingStatus =
  | "Active"
  | "Draft"
  | "Inactive"
  | "Needs Attention";

export interface EtsyListing {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;

  category: string;
  materials: string[];
  tags: string[];

  imageUrls: string[];

  views: number;
  favorites: number;
  orders: number;
  revenue: number;
  conversionRate: number;

  status: ListingStatus;

  createdAt?: string;
  updatedAt?: string;
  listingUrl?: string;
}

export interface ListingImageAnalysis {
  listingId: string;
  imageUrl: string;
  brightnessScore: number;
  compositionScore: number;
  backgroundScore: number;
  clarityScore: number;
  recommendations: string[];
}

export interface ListingAIAnalysis {
  listingId: string;
  overallScore: number;
  seoScore: number;
  imageScore: number;
  descriptionScore: number;
  tagsScore: number;
  pricingScore: number;
  recommendations: string[];
  analyzedAt: string;
}

export interface CompetitorListing {
  id: string;
  sourceListingId: string;
  title: string;
  price: number;
  imageUrl?: string;
  shopName?: string;
  listingUrl?: string;
}

export interface OptimizationHistory {
  id: string;
  listingId: string;
  field:
    | "title"
    | "description"
    | "tags"
    | "price"
    | "image";
  previousValue: string;
  newValue: string;
  scoreBefore: number;
  scoreAfter: number;
  appliedAt: string;
}

export type RecommendationPriority =
  | "High"
  | "Medium"
  | "Low";

export type RecommendationField =
  | "title"
  | "description"
  | "tags"
  | "images"
  | "pricing";

export interface ListingRecommendation {
  id: string;
  field: RecommendationField;
  priority: RecommendationPriority;
  title: string;
  reason: string;
  action: string;
  possibleScoreIncrease: number;
}

export interface ListingAnalysis {
  listingId: string;

  overallScore: number;

  titleScore: number;
  descriptionScore: number;
  tagsScore: number;
  imageScore: number;
  pricingScore: number;

  recommendations: ListingRecommendation[];
}