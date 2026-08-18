export type AccordChatApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class AccordChatHttpError extends Error {
  readonly status: number;
  readonly contentType: string;
  readonly code?: string;

  constructor(input: {
    message: string;
    status: number;
    contentType: string;
    code?: string;
  }) {
    super(input.message);
    this.name = "AccordChatHttpError";
    this.status = input.status;
    this.contentType = input.contentType;
    this.code = input.code;
  }
}

export async function readAccordChatJson<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T & AccordChatApiError> {
  const contentType = response.headers.get("content-type") ?? "unknown";
  if (!contentType.toLowerCase().includes("application/json")) {
    if (process.env.NODE_ENV === "development") {
      console.error("Accord Chat API returned a non-JSON response.", {
        url: response.url,
        status: response.status,
        contentType,
      });
    }
    throw new AccordChatHttpError({
      status: response.status,
      contentType,
      message:
        response.status === 404
          ? "Accord Chat authentication endpoint was not found. Restart the development server and retry."
          : `${fallbackMessage} The server returned an unexpected response.`,
    });
  }

  let payload: (T & AccordChatApiError) | undefined;
  try {
    payload = (await response.json()) as T & AccordChatApiError;
  } catch {
    throw new AccordChatHttpError({
      status: response.status,
      contentType,
      message: `${fallbackMessage} The server returned malformed JSON.`,
    });
  }

  if (!response.ok) {
    throw new AccordChatHttpError({
      status: response.status,
      contentType,
      code: payload.error?.code,
      message: payload.error?.message ?? fallbackMessage,
    });
  }
  return payload;
}
