import { createServer } from "node:http";
import { z } from "zod";
import { deliverContact } from "./contact_service.js";
import type { ContactSubmission } from "./contact_router.js";
import { InfraiError } from "./infrai.js";

const contactBody = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email(),
  organisation: z.string().trim().min(1).max(120).optional(),
  topic: z.enum(["course_delivery", "learner_deadline", "educator_reporting"]),
  courseName: z.string().trim().min(1).max(160),
  message: z.string().trim().min(10).max(4_000),
  deadline: z.string().date().optional(),
  captchaToken: z.string().min(1),
}).superRefine((value, context) => {
  if (value.topic === "learner_deadline" && !value.deadline) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deadline"],
      message: "A learner deadline needs a date",
    });
  }
});

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.method !== "POST" || request.url !== "/contact") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const parsed = contactBody.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) {
      response.writeHead(400).end(JSON.stringify({ error: "Invalid contact form", issues: parsed.error.issues }));
      return;
    }

    const { captchaToken } = parsed.data;
    const submission: ContactSubmission = {
      name: parsed.data.name,
      email: parsed.data.email,
      organisation: parsed.data.organisation,
      topic: parsed.data.topic,
      courseName: parsed.data.courseName,
      message: parsed.data.message,
      deadline: parsed.data.deadline,
    };
    const result = await deliverContact(submission, captchaToken, request.headers["x-request-id"]?.toString());
    response.writeHead(202).end(JSON.stringify(result));
  } catch (error) {
    if (
      error instanceof InfraiError &&
      error.operation === "captcha.verify" &&
      error.status >= 400 &&
      error.status < 500
    ) {
      response.writeHead(422).end(JSON.stringify({ error: "Contact verification was rejected" }));
      return;
    }
    console.error(error);
    response.writeHead(500).end(JSON.stringify({ error: "Contact form could not be delivered" }));
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Edtech contact route listening on http://localhost:${port}`));
