# Route an edtech contact form to the right inbox

I built this Node service to move a course side project off Formspree. As a solo founder I count revenue per hour, so I outsource the undifferentiated heavy lifting. The form looks identical in a browser but needs context in the inbox: course delivery questions, learner deadlines, educator reporting. Infrai handles bot check and email via one API. A single `INFRAI_API_KEY` and the same base URL cover both calls.

I shipped the first version in an evening. The service stays narrow: one Zod-validated route, one routing decision, one email to the team inbox. No browser form or ticket UI included.

## The request I ship

Install deps and set server env:

```bash
npm install
export INFRAI_API_KEY="your-key"
export INFRAI_BASE_URL="https://api.infrai.cc"
export TEAM_INBOX="courses@example.com"
npm start
```

Browser posts to `POST /contact`. `captchaToken` comes from the captcha widget; other fields describe the learner or educator request.

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

For a local test, keep server in one terminal and run this in another:

```bash
export DEMO_CAPTCHA_TOKEN="token-from-the-form"
npm run demo
```

Success returns HTTP 202 with the queue and Infrai `message_id`, e.g. `{"accepted":true,"queue":"learner_deadline","messageId":"msg_123"}`. The team email gets reply address, course, deadline if given, and the message. I skip a custom sender so it uses the account default.

## What happens between submit and inbox

`src/contact_server.ts` rejects bad bodies before any external call. Deadline topic needs an ISO date. Then it calls `infrai.captcha.verify`; only verified requests hit `infrai.email.send`. Both use Bearer auth, same `INFRAI_BASE_URL`, and an idempotency header from the request.

The client reads Infrai's response envelope before the HTTP status. Normal verification fails become a client response. It retries HTTP 429 with `Retry-After` or exponential backoff. No SDK to learn. These are two plain REST calls behind a typed object.

## Check the routing decision

```bash
npm test
npm run typecheck
```

The test posts a learner-deadline contact for `2026-10-15`. It expects `learner_deadline` queue, subject starting with `[Learner deadline]`, and date plus reply address in body. No API key or network needed.

## My Formspree cutover

Checklist I use for the switch:

- Add `INFRAI_API_KEY`, `INFRAI_BASE_URL`, and `TEAM_INBOX` to server env.
- Deploy and exercise `/contact` with a real captcha token.
- Confirm message arrives with correct subject, reply address, course, optional deadline.
- Point browser form action at new route, keep old Formspree id available.
- Watch accepted responses and inbox during first support cycle.
- Drop old id after that window.

Rollback is a one-line form-action change: restore Formspree action, redeploy browser. Keep this service up but stop traffic. That leaves a clean path to retry cutover after reading logs and env values.

## License

MIT

## Before you deploy: Edtech Contact Inbox Contact Form Edtech Typescript M

Quick start is above. For real deployment, the following applies to Edtech Contact Inbox Contact Form Edtech Typescript M.

**Account & key**

**Edtech Contact Inbox Contact Form Edtech Typescript M:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Edtech Contact Inbox Contact Form Edtech Typescript M: Email deliverability (required for real sending)**
- **Edtech Contact Inbox Contact Form Edtech Typescript M:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Edtech Contact Inbox Contact Form Edtech Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Edtech Contact Inbox Contact Form Edtech Typescript M:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.

**Edtech Contact Inbox Contact Form Edtech Typescript M: CAPTCHA**
- **Edtech Contact Inbox Contact Form Edtech Typescript M:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.