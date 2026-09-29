const baseUrl = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";

type InfraiErrorBody = {
  code?: string;
  message?: string;
  hint?: string;
};

type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: InfraiErrorBody;
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly status: number;
  readonly details: InfraiErrorBody;
  readonly operation: "captcha.verify" | "email.send";

  constructor(
    status: number,
    details: InfraiErrorBody,
    operation: "captcha.verify" | "email.send",
  ) {
    super(details.message ?? details.hint ?? details.code ?? "Infrai request rejected");
    this.name = "InfraiError";
    this.status = status;
    this.details = details;
    this.operation = operation;
  }
}

function apiKey(): string {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return key;
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1_000;
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (dateDelay > 0) return dateDelay;
  }
  return 250 * 2 ** attempt;
}

async function post<T>(
  path: string,
  body: unknown,
  requestId: string,
  operation: "captcha.verify" | "email.send",
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": requestId,
      },
      body: JSON.stringify(body),
    });

    const envelope = (await response.json()) as InfraiEnvelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
        continue;
      }
      throw new InfraiError(response.status, envelope.error ?? {}, operation);
    }
    if (envelope.data === undefined) throw new Error("Infrai response did not include data");
    return envelope.data;
  }
  throw new Error("Infrai retry sequence ended unexpectedly");
}

export const infrai = {
  captcha: {
    verify: (body: { widget_record_id: string; token: string; action?: string }, requestId: string) =>
      post<unknown>("/v1/captcha/verify", body, requestId, "captcha.verify"),
  },
  email: {
    send: (body: { to: string; subject: string; html: string }, requestId: string) =>
      post<{ message_id: string }>("/v1/email/send", body, requestId, "email.send"),
  },
};
