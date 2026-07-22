export type ListingOptimizationDraft = {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedTags: string[];
  updatedAt: string;
};

export type ListingOptimizationDraftInput = {
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedTags?: string[];
};

const STORAGE_PREFIX =
  "selleros:optimization-draft";

function getStorageKey(
  listingId: string | number,
) {
  return `${STORAGE_PREFIX}:${String(listingId)}`;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (tag): tag is string =>
        typeof tag === "string",
    )
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 13);
}

function normalizeStoredDraft(
  value: unknown,
): ListingOptimizationDraft | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const draft =
    value as Partial<ListingOptimizationDraft>;

  const suggestedTitle =
    typeof draft.suggestedTitle === "string"
      ? draft.suggestedTitle.trim()
      : "";

  const suggestedDescription =
    typeof draft.suggestedDescription === "string"
      ? draft.suggestedDescription.trim()
      : "";

  const suggestedTags = normalizeTags(
    draft.suggestedTags,
  );

  const hasSuggestion =
    suggestedTitle.length > 0 ||
    suggestedDescription.length > 0 ||
    suggestedTags.length > 0;

  if (!hasSuggestion) {
    return null;
  }

  return {
    suggestedTitle,
    suggestedDescription,
    suggestedTags,
    updatedAt:
      typeof draft.updatedAt === "string"
        ? draft.updatedAt
        : new Date().toISOString(),
  };
}

export function loadOptimizationDraft(
  listingId: string | number,
): ListingOptimizationDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(
      getStorageKey(listingId),
    );

    if (!storedValue) {
      return null;
    }

    return normalizeStoredDraft(
      JSON.parse(storedValue) as unknown,
    );
  } catch {
    return null;
  }
}

export function saveOptimizationDraft(
  listingId: string | number,
  input: ListingOptimizationDraftInput,
): ListingOptimizationDraft | null {
  const draft = normalizeStoredDraft({
    suggestedTitle:
      input.suggestedTitle ?? "",
    suggestedDescription:
      input.suggestedDescription ?? "",
    suggestedTags:
      input.suggestedTags ?? [],
    updatedAt: new Date().toISOString(),
  });

  if (typeof window === "undefined") {
    return draft;
  }

  if (!draft) {
    clearOptimizationDraft(listingId);
    return null;
  }

  window.localStorage.setItem(
    getStorageKey(listingId),
    JSON.stringify(draft),
  );

  return draft;
}

export function clearOptimizationDraft(
  listingId: string | number,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(
    getStorageKey(listingId),
  );
}