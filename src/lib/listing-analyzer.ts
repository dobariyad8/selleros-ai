import type {
  EtsyListing,
  ListingAnalysis,
  ListingRecommendation,
} from "@/lib/etsy-types";

function clampScore(score: number, maximum: number) {
  return Math.max(0, Math.min(score, maximum));
}

function createRecommendation(
  recommendation: ListingRecommendation
) {
  return recommendation;
}

function analyzeTitle(
  listing: EtsyListing,
  recommendations: ListingRecommendation[]
) {
  const title = listing.title.trim();
  const titleLength = title.length;

  let score = 25;

  if (!title) {
    score = 0;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-title-missing`,
        field: "title",
        priority: "High",
        title: "Add a listing title",
        reason:
          "This listing does not have a usable title.",
        action:
          "Write a clear title that describes the product and its strongest buyer-focused keywords.",
        possibleScoreIncrease: 25,
      })
    );

    return score;
  }

  if (titleLength < 40) {
    score -= 8;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-title-short`,
        field: "title",
        priority: "High",
        title: "Expand the listing title",
        reason:
          "The title may be too short to describe the product and its important search phrases.",
        action:
          "Add the product type, recipient, style, material, or occasion where relevant.",
        possibleScoreIncrease: 8,
      })
    );
  }

  if (titleLength > 140) {
    score -= 5;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-title-long`,
        field: "title",
        priority: "Medium",
        title: "Shorten the listing title",
        reason:
          "The title is difficult to scan and may contain unnecessary wording.",
        action:
          "Keep the strongest phrases and remove repeated or low-value words.",
        possibleScoreIncrease: 5,
      })
    );
  }

  const words = title
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const uniqueWords = new Set(words);

  if (words.length - uniqueWords.size >= 4) {
    score -= 5;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-title-repetition`,
        field: "title",
        priority: "Medium",
        title: "Remove repeated title words",
        reason:
          "Several words appear repeatedly in the title.",
        action:
          "Rewrite the title so each phrase adds new information.",
        possibleScoreIncrease: 5,
      })
    );
  }

  return clampScore(score, 25);
}

function analyzeTags(
  listing: EtsyListing,
  recommendations: ListingRecommendation[]
) {
  const tags = listing.tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const uniqueTags = new Set(tags);

  let score = 25;

  if (tags.length === 0) {
    score = 0;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-tags-missing`,
        field: "tags",
        priority: "High",
        title: "Add relevant tags",
        reason:
          "No usable tags were found for this listing.",
        action:
          "Add specific phrases describing the product, recipient, occasion, material, and style.",
        possibleScoreIncrease: 25,
      })
    );

    return score;
  }

  if (tags.length < 13) {
    const missingTagCount = 13 - tags.length;
    const deduction = Math.min(missingTagCount, 8);

    score -= deduction;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-tags-unused`,
        field: "tags",
        priority: tags.length < 8 ? "High" : "Medium",
        title: "Use more tag opportunities",
        reason: `${missingTagCount} tag positions are currently unused in our scoring model.`,
        action:
          "Add relevant long-tail phrases without repeating the same buyer intent.",
        possibleScoreIncrease: deduction,
      })
    );
  }

  if (uniqueTags.size !== tags.length) {
    const duplicateCount = tags.length - uniqueTags.size;

    score -= Math.min(duplicateCount * 2, 6);

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-tags-duplicate`,
        field: "tags",
        priority: "Medium",
        title: "Replace duplicate tags",
        reason:
          "Some tags repeat the same exact phrase.",
        action:
          "Replace duplicates with additional buyer-focused search phrases.",
        possibleScoreIncrease: Math.min(
          duplicateCount * 2,
          6
        ),
      })
    );
  }

  const shortTags = tags.filter(
    (tag) => tag.split(/\s+/).length === 1
  );

  if (shortTags.length > Math.ceil(tags.length / 2)) {
    score -= 4;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-tags-generic`,
        field: "tags",
        priority: "Medium",
        title: "Add more specific tag phrases",
        reason:
          "Many tags contain only one broad word.",
        action:
          "Use more descriptive phrases that reflect how a buyer might search.",
        possibleScoreIncrease: 4,
      })
    );
  }

  return clampScore(score, 25);
}

function analyzeDescription(
  listing: EtsyListing,
  recommendations: ListingRecommendation[]
) {
  const description = listing.description.trim();

  let score = 20;

  if (!description) {
    score = 0;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-description-missing`,
        field: "description",
        priority: "High",
        title: "Add a product description",
        reason:
          "The listing does not contain a usable description.",
        action:
          "Describe the product, materials, size, use, gifting occasion, care, and shipping expectations.",
        possibleScoreIncrease: 20,
      })
    );

    return score;
  }

  if (description.length < 150) {
    score -= 8;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-description-short`,
        field: "description",
        priority: "High",
        title: "Expand the description",
        reason:
          "The description may not answer enough buyer questions.",
        action:
          "Add product details, dimensions, materials, use cases, and care information.",
        possibleScoreIncrease: 8,
      })
    );
  } else if (description.length < 300) {
    score -= 4;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-description-detail`,
        field: "description",
        priority: "Medium",
        title: "Add more product details",
        reason:
          "The description could provide additional purchase information.",
        action:
          "Add any missing size, material, gifting, customization, or care details.",
        possibleScoreIncrease: 4,
      })
    );
  }

  if (
    listing.materials.length > 0 &&
    !listing.materials.some((material) =>
      description
        .toLowerCase()
        .includes(material.toLowerCase())
    )
  ) {
    score -= 3;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-description-materials`,
        field: "description",
        priority: "Low",
        title: "Mention the product materials",
        reason:
          "Materials are present in the CSV but may not be clearly included in the description.",
        action:
          "Add a short materials section to help buyers understand what the item is made from.",
        possibleScoreIncrease: 3,
      })
    );
  }

  return clampScore(score, 20);
}

function analyzeImages(
  listing: EtsyListing,
  recommendations: ListingRecommendation[]
) {
  const imageCount = listing.imageUrls.length;

  let score = 20;

  if (imageCount === 0) {
    score = 0;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-images-missing`,
        field: "images",
        priority: "High",
        title: "Add listing images",
        reason:
          "No image URLs were found in the imported listing.",
        action:
          "Add a clear hero image followed by close-ups, scale, detail, packaging, and lifestyle views.",
        possibleScoreIncrease: 20,
      })
    );

    return score;
  }

  if (imageCount < 4) {
    score -= 10;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-images-few`,
        field: "images",
        priority: "High",
        title: "Add more product images",
        reason: `Only ${imageCount} listing image${imageCount === 1 ? " was" : "s were"} found.`,
        action:
          "Add close-ups, different angles, scale references, packaging, and lifestyle images.",
        possibleScoreIncrease: 10,
      })
    );
  } else if (imageCount < 7) {
    score -= 5;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-images-more`,
        field: "images",
        priority: "Medium",
        title: "Strengthen the image gallery",
        reason: `The listing currently contains ${imageCount} images.`,
        action:
          "Add additional images that answer common buyer questions and show product details.",
        possibleScoreIncrease: 5,
      })
    );
  }

  return clampScore(score, 20);
}

function analyzePricing(
  listing: EtsyListing,
  recommendations: ListingRecommendation[]
) {
  let score = 10;

  if (!Number.isFinite(listing.price) || listing.price <= 0) {
    score = 0;

    recommendations.push(
      createRecommendation({
        id: `${listing.id}-price-invalid`,
        field: "pricing",
        priority: "High",
        title: "Review the listing price",
        reason:
          "The imported price is missing or invalid.",
        action:
          "Enter a valid price before publishing or analyzing comparable products.",
        possibleScoreIncrease: 10,
      })
    );
  }

  return clampScore(score, 10);
}

export function analyzeListing(
  listing: EtsyListing
): ListingAnalysis {
  const recommendations: ListingRecommendation[] = [];

  const titleScore = analyzeTitle(
    listing,
    recommendations
  );

  const tagsScore = analyzeTags(
    listing,
    recommendations
  );

  const descriptionScore = analyzeDescription(
    listing,
    recommendations
  );

  const imageScore = analyzeImages(
    listing,
    recommendations
  );

  const pricingScore = analyzePricing(
    listing,
    recommendations
  );

  const overallScore =
    titleScore +
    tagsScore +
    descriptionScore +
    imageScore +
    pricingScore;

  const priorityOrder = {
    High: 0,
    Medium: 1,
    Low: 2,
  };

  recommendations.sort((first, second) => {
    return (
      priorityOrder[first.priority] -
      priorityOrder[second.priority]
    );
  });

  return {
    listingId: listing.id,
    overallScore,
    titleScore,
    descriptionScore,
    tagsScore,
    imageScore,
    pricingScore,
    recommendations,
  };
}

export function analyzeAllListings(
  listings: EtsyListing[]
): ListingAnalysis[] {
  return listings.map(analyzeListing);
}