import { sleep } from "./rateLimiter";

type EtsyClientOptions = {
  apiKey: string;
  sharedSecret: string;
  accessToken: string;
};

type EtsyRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  maxRetries?: number;
};

export class EtsyApiError extends Error {
  status: number;
  responseBody: unknown;

  constructor(
    message: string,
    status: number,
    responseBody: unknown
  ) {
    super(message);

    this.name = "EtsyApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

async function readJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text,
    };
  }
}

function getRetryDelayMilliseconds(
  response: Response,
  attempt: number
): number {
  const retryAfterHeader = response.headers.get("retry-after");

  if (retryAfterHeader) {
    const retryAfterSeconds = Number.parseFloat(retryAfterHeader);

    if (Number.isFinite(retryAfterSeconds)) {
      return retryAfterSeconds * 1000;
    }
  }

  // Exponential fallback:
  // attempt 0 = 1 second
  // attempt 1 = 2 seconds
  // attempt 2 = 4 seconds
  return Math.pow(2, attempt) * 1000;
}

export class EtsyClient {
  private readonly apiKey: string;
  private readonly sharedSecret: string;
  private readonly accessToken: string;

  constructor(options: EtsyClientOptions) {
    this.apiKey = options.apiKey;
    this.sharedSecret = options.sharedSecret;
    this.accessToken = options.accessToken;
  }

  private getHeaders(): HeadersInit {
    return {
      "x-api-key": `${this.apiKey}:${this.sharedSecret}`,
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async request<T>(
    url: string,
    options: EtsyRequestOptions = {}
  ): Promise<T> {
    const {
      method = "GET",
      body,
      maxRetries = 3,
    } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      });

      const responseBody = await readJsonSafely(response);

      if (response.ok) {
        return responseBody as T;
      }

      const shouldRetry =
        response.status === 429 && attempt < maxRetries;

      if (shouldRetry) {
        const delayMilliseconds = getRetryDelayMilliseconds(
          response,
          attempt
        );

        console.warn(
          `Etsy rate limit reached. Retrying in ${
            delayMilliseconds / 1000
          } seconds.`
        );

        await sleep(delayMilliseconds);
        continue;
      }

      const errorMessage =
        typeof responseBody === "object" &&
        responseBody !== null &&
        "error" in responseBody &&
        typeof responseBody.error === "string"
          ? responseBody.error
          : `Etsy request failed with status ${response.status}.`;

      throw new EtsyApiError(
        errorMessage,
        response.status,
        responseBody
      );
    }

    throw new EtsyApiError(
      "Etsy request failed after all retries.",
      429,
      {}
    );
  }

  get<T>(url: string, maxRetries = 3): Promise<T> {
    return this.request<T>(url, {
      method: "GET",
      maxRetries,
    });
  }

  post<T>(
    url: string,
    body: unknown,
    maxRetries = 3
  ): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      body,
      maxRetries,
    });
  }

  put<T>(
    url: string,
    body: unknown,
    maxRetries = 3
  ): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      body,
      maxRetries,
    });
  }

  delete<T>(url: string, maxRetries = 3): Promise<T> {
    return this.request<T>(url, {
      method: "DELETE",
      maxRetries,
    });
  }
}