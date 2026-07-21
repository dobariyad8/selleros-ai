export const healthScores = [
{
    name: "SEO",
    score: 92,
},
{
    name: "Images",
    score:74,
},
{
    name: "Pricing",
    score: 81,
},
{
    name: "Descriptions",
    score: 86,
},
{
    name: "Taghs",
    score: 68,
},
];

type ListingPriority = "High" | "Medium" | "Low";

type ListingAttention = {
  id: string;
  title: string;
  issue: string;
  score: number;
  priority: ListingPriority;
};

export const listingsNeedingAttention: ListingAttention[] = [
  {
    id: "1",
    title: "Couple Rakhi Set",
    issue: "Main image is too dark",
    score: 62,
    priority: "High",
  },
  {
    id: "2",
    title: "Evil Eye Bracelet",
    issue: "Title has repeated keywords",
    score: 74,
    priority: "Medium",
  },
  {
    id: "3",
    title: "Bridal Ear Chain",
    issue: "Only 7 tags are being used",
    score: 58,
    priority: "High",
  },
];

type RecommendationPriority = "High" | "Medium" | "Low";

type AIRecommendation = {
  id: string;
  listingTitle: string;
  type: "Image" | "SEO" | "Tags" | "Pricing" | "Promotion";
  title: string;
  reason: string;
  action: string;
  priority: RecommendationPriority;
};

export const aiRecommendations: AIRecommendation[] = [
  {
    id: "rec-1",
    listingTitle: "Couple Rakhi Set",
    type: "Image",
    title: "Improve the hero image",
    reason:
      "The product appears small in the frame and the image could be brighter.",
    action:
      "Use a brighter close-up photo that clearly shows every item in the set.",
    priority: "High",
  },
  {
    id: "rec-2",
    listingTitle: "Evil Eye Bracelet",
    type: "SEO",
    title: "Rewrite the title for better reach",
    reason:
      "The current title repeats keywords and does not begin with the strongest search phrase.",
    action:
      "Start the title with the primary product keyword and remove repeated phrases.",
    priority: "High",
  },
  {
    id: "rec-3",
    listingTitle: "Bridal Ear Chain",
    type: "Tags",
    title: "Add stronger related tags",
    reason:
      "Some tag positions are unused or contain overlapping keywords.",
    action:
      "Add relevant long-tail tags based on the product category and buyer intent.",
    priority: "Medium",
  },
  {
    id: "rec-4",
    listingTitle: "Pregnancy Bracelet",
    type: "Pricing",
    title: "Review the listing price",
    reason:
      "The current price differs significantly from comparable products in this category.",
    action:
      "Compare similar products and test a more competitive price.",
    priority: "Medium",
  },
  {
    id: "rec-5",
    listingTitle: "Couple Rakhi Gift Set",
    type: "Promotion",
    title: "Consider a limited-time sale",
    reason:
      "Seasonal demand may make a short promotion useful for this listing.",
    action:
      "Test a 15% discount for five days and compare views, favorites, and conversion.",
    priority: "Low",
  },
];