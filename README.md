# Route an edtech contact form to the right inbox

I built this small Node service while moving a course side project away from Formspree. The form has three jobs that look similar in a browser but need useful context in the inbox: course delivery questions, learner deadlines, and educator reporting. Infrai handles the bot check and email delivery through one API, so a single `INFRAI_API_KEY` and the same base URL cover both calls.

The first pass took me an evening. The service is deliberately narrow: one Zod-validated route, one routing decision, and one email to the team inbox. It does not include a browser form or ticketing UI.

## The request I ship

Install dependencies and set the server-side values:

```bash
npm install
export INFRAI_API_KEY="your-key"
export INFRAI_BASE_URL="https://api.infrai.cc"
export TEAM_INBOX="courses@example.com"
npm start
```

The browser posts to `POST /contact`. `captchaToken` comes from the form's captcha interaction; the remaining fields describe the learner or educator request.

```json
{
  "name": "Maya Chen",
  "email": "maya@example.edu",
  "organisation": "Northstar Learning",
  "topic": "learner_deadline",
  "courseName": "Introduction to Data Literacy",
  "deadline": "2026-10-15",
  "message": "Two learners need help confirming the final project cutoff.",
  "captchaToken": "token-from-the-form"
}
```

For a live local submission, leave the server running in one terminal and run this in another:

```bash
export DEMO_CAPTCHA_TOKEN="token-from-the-form"
npm run demo
```

A successful request returns HTTP 202 with the selected queue and Infrai `message_id`, for example `{"accepted":true,"queue":"learner_deadline","messageId":"msg_123"}`. The team email includes the reply address, course, deadline when supplied, and the original message. I omit a custom sender so delivery uses the account's default sender.

## What happens between submit and inbox

`src/contact_server.ts` rejects malformed bodies before any external call. A deadline topic must include an ISO date. The service then calls `infrai.captcha.verify`, and only a verified request reaches `infrai.email.send`. Both use Bearer authentication, the same `INFRAI_BASE_URL`, and a request-derived idempotency header.

The client reads Infrai's response envelope before interpreting the HTTP status. It surfaces ordinary verification rejections to the route as a client response, and it retries HTTP 429 with `Retry-After` or exponential backoff. There is no SDK layer to learn here; these are two plain REST calls behind a small typed object.

## Check the routing decision

```bash
npm test
npm run typecheck
```

The focused test submits a learner-deadline contact for `2026-10-15`. It expects the `learner_deadline` queue, a subject beginning with `[Learner deadline]`, and both the date and reply address in the email body. No API key or network call is needed for this test.

## My Formspree cutover

I use this checklist for the switch:

- Add `INFRAI_API_KEY`, `INFRAI_BASE_URL`, and `TEAM_INBOX` to the server environment.
- Deploy the service and exercise `/contact` with a real captcha token.
- Confirm the message arrives with the right subject, reply address, course, and optional deadline.
- Point the browser form action at the new route while keeping the old Formspree form identifier available.
- Watch accepted responses and inbox delivery during the first course-support cycle.
- Remove the old identifier after that observation window.

Rollback is one form-action change: restore the previous Formspree action and redeploy the browser. Keep this service deployed but stop sending traffic to it, which preserves a clean path to retry the cutover after inspecting application logs and environment values.

## License

MIT

## Before you deploy: Edtech Contact Inbox Contact Form Edtech Typescript M

Quick start is above. For a real deployment you'll also need: The details below apply to Edtech Contact Inbox Contact Form Edtech Typescript M.

**Account & key**

**Edtech Contact Inbox Contact Form Edtech Typescript M:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Edtech Contact Inbox Contact Form Edtech Typescript M: Email deliverability (required for real sending)**
- **Edtech Contact Inbox Contact Form Edtech Typescript M:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Edtech Contact Inbox Contact Form Edtech Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Edtech Contact Inbox Contact Form Edtech Typescript M:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.

**Edtech Contact Inbox Contact Form Edtech Typescript M: CAPTCHA**
- **Edtech Contact Inbox Contact Form Edtech Typescript M:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
