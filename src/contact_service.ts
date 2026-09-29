import { randomUUID } from "node:crypto";
import { infrai } from "./infrai.js";
import { routeContact, type ContactSubmission } from "./contact_router.js";

export async function deliverContact(
  submission: ContactSubmission,
  captchaToken: string,
  requestId: string = randomUUID(),
) {
  const widgetRecordId = process.env.CAPTCHA_WIDGET_RECORD_ID;
  if (!widgetRecordId) throw new Error("CAPTCHA_WIDGET_RECORD_ID is required");

  await infrai.captcha.verify(
    { widget_record_id: widgetRecordId, token: captchaToken, action: "edtech_contact" },
    `${requestId}:captcha`,
  );

  const routed = routeContact(submission);
  const to = process.env.TEAM_INBOX;
  if (!to) throw new Error("TEAM_INBOX is required");

  const sent = await infrai.email.send(
    { to, subject: routed.subject, html: routed.html },
    `${requestId}:email`,
  );

  return { accepted: true as const, queue: routed.queue, messageId: sent.message_id };
}
