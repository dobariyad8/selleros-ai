import { sleep } from "./rateLimiter";

type EtsyClientOptions = {
  apiKey: string;
  sharedSecret: string;
  accessToken: string;
};

type EtsyRequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

type EtsyBodyType =
  | "json"
  | "form"
  | "multipart";

type EtsyRequestOptions = {
  method?: EtsyRequestMethod;
  body?: unknown;
  bodyType?: EtsyBodyType;
  maxRetries?: number;
};

export class EtsyApiError extends Error {
  status: number;
  responseBody: unknown;

  constructor(
    message: string,
    status: number,
    responseBody: unknown,
  ) {
    super(message);

    this.name = "EtsyApiError";
    this.status = status;
    this.responseBody =
      responseBody;
  }
}

async function readJsonSafely(
  response: Response,
): Promise<unknown> {
  const text =
    await response.text();

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
  attempt: number,
): number {
  const retryAfterHeader =
    response.headers.get(
      "retry-after",
    );

  if (retryAfterHeader) {
    const retryAfterSeconds =
      Number.parseFloat(
        retryAfterHeader,
      );

    if (
      Number.isFinite(
        retryAfterSeconds,
      )
    ) {
      return (
        retryAfterSeconds * 1000
      );
    }
  }

  return (
    Math.pow(2, attempt) * 1000
  );
}

function getErrorMessage(
  responseBody: unknown,
  status: number,
) {
  if (
    typeof responseBody ===
      "object" &&
    responseBody !== null &&
    "error" in responseBody &&
    typeof responseBody.error ===
      "string"
  ) {
    return responseBody.error;
  }

  return `Etsy request failed with status ${status}.`;
}

export class EtsyClient {
  private readonly apiKey: string;
  private readonly sharedSecret: string;
  private readonly accessToken: string;

  constructor(
    options: EtsyClientOptions,
  ) {
    this.apiKey =
      options.apiKey;

    this.sharedSecret =
      options.sharedSecret;

    this.accessToken =
      options.accessToken;
  }

  private getHeaders(
    bodyType: EtsyBodyType,
  ) {
    const headers =
      new Headers();

    headers.set(
      "x-api-key",
      `${this.apiKey}:${this.sharedSecret}`,
    );

    headers.set(
      "Authorization",
      `Bearer ${this.accessToken}`,
    );

    if (bodyType === "json") {
      headers.set(
        "Content-Type",
        "application/json",
      );
    }

    if (bodyType === "form") {
      headers.set(
        "Content-Type",
        "application/x-www-form-urlencoded",
      );
    }

    /*
     * Do not manually set Content-Type for FormData.
     * fetch must add the multipart boundary automatically.
     */

    return headers;
  }

  private prepareBody(
    body: unknown,
    bodyType: EtsyBodyType,
  ): BodyInit | undefined {
    if (body === undefined) {
      return undefined;
    }

    if (bodyType === "json") {
      return JSON.stringify(body);
    }

    if (bodyType === "form") {
      if (
        !(
          body instanceof
          URLSearchParams
        )
      ) {
        throw new Error(
          "URL-encoded Etsy requests require URLSearchParams.",
        );
      }

      return body;
    }

    if (
      !(body instanceof FormData)
    ) {
      throw new Error(
        "Multipart Etsy requests require FormData.",
      );
    }

    return body;
  }

  async request<T>(
    url: string,
    options: EtsyRequestOptions = {},
  ): Promise<T> {
    const {
      method = "GET",
      body,
      bodyType = "json",
      maxRetries = 3,
    } = options;

    for (
      let attempt = 0;
      attempt <= maxRetries;
      attempt += 1
    ) {
      const response =
        await fetch(url, {
          method,
          headers:
            this.getHeaders(
              bodyType,
            ),
          body:
            this.prepareBody(
              body,
              bodyType,
            ),
          cache: "no-store",
        });

      const responseBody =
        await readJsonSafely(
          response,
        );

      if (response.ok) {
        return responseBody as T;
      }

      const shouldRetry =
        response.status === 429 &&
        attempt < maxRetries;

      if (shouldRetry) {
        const delayMilliseconds =
          getRetryDelayMilliseconds(
            response,
            attempt,
          );

        console.warn(
          `Etsy rate limit reached. Retrying in ${
            delayMilliseconds /
            1000
          } seconds.`,
        );

        await sleep(
          delayMilliseconds,
        );

        continue;
      }

      throw new EtsyApiError(
        getErrorMessage(
          responseBody,
          response.status,
        ),
        response.status,
        responseBody,
      );
    }

    throw new EtsyApiError(
      "Etsy request failed after all retries.",
      429,
      {},
    );
  }

  get<T>(
    url: string,
    maxRetries = 3,
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "GET",
        maxRetries,
      },
    );
  }

  post<T>(
    url: string,
    body: unknown,
    maxRetries = 3,
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "POST",
        body,
        bodyType: "json",
        maxRetries,
      },
    );
  }

  postForm<T>(
    url: string,
    body: URLSearchParams,
    maxRetries = 3,
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "POST",
        body,
        bodyType: "form",
        maxRetries,
      },
    );
  }

  postMultipart<T>(
    url: string,
    body: FormData,
    maxRetries = 3,
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "POST",
        body,
        bodyType:
          "multipart",
        maxRetries,
      },
    );
  }

  put<T>(
    url: string,
    body: unknown,
    maxRetries = 3,
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "PUT",
        body,
        bodyType: "json",
        maxRetries,
      },
    );
  }

  patch<T>(
    url: string,
    body: unknown,
    maxRetries = 3,
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "PATCH",
        body,
        bodyType: "json",
        maxRetries,
      },
    );
  }

  delete<T>(
    url: string,
    maxRetries = 3,
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: "DELETE",
        maxRetries,
      },
    );
  }
}