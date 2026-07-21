export type RecommendationImpact =
  | "low"
  | "medium"
  | "high";

export interface ScoreRecommendation {
  title: string;
  description: string;
  impact: RecommendationImpact;
}

export interface ScoreResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: ScoreRecommendation[];
}