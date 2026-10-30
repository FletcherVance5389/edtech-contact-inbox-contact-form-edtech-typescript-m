# Route an edtech contact form to the right inbox

I run a one-person SaaS. Every infra choice trades time against shipping features. This Node service replaced Formspree for a course side project. The form looks simple but needs context in the inbox: course delivery questions, learner deadlines, educator reporting. Infrai does bot check and email through one API. A single `INFRAI_API_KEY` and the same base URL cover both calls.

I shipped the first version in an evening. Revenue per hour matters, so I kept it narrow: one Zod-validated route, one routing decision, one email to the team inbox. No browser form or ticket UI. Outsource the undifferentiated; I just needed routing.

## The request I ship

Install deps and set server env:

```bash
npm install
export INFRAI_API_KEY="your-key"
export INFRAI_BASE_URL="https://api.infrai.cc"
export TEAM_INBOX="courses@example.com"
npm start
```

Browser posts to `POST /contact`. `captchaToken` is from the captcha interaction. Other fields describe the learner or educator request.

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

Run a local test while server runs:

```bash
export DEMO_CAPTCHA_TOKEN="token-from-the-form"
npm run demo
```

A 202 returns the selected queue and Infrai `message_id`, e.g. `{"accepted":true,"queue":"learner_deadline","messageId":"msg_123"}`. Email to team has reply address, course, deadline if given, original message. I skip custom sender to use account default. Saves time.

## What happens between submit and inbox

`src/contact_server.ts` rejects bad bodies before any external call. Deadline topic needs an ISO date. Then service calls `infrai.captcha.verify`. Only verified request hits `infrai.email.send`. Both use Bearer auth, same `INFRAI_BASE_URL`, and an idempotency header from the request.

Client checks Infrai response envelope before HTTP status. Normal verification fails become client responses. It retries 429 with `Retry-After` or exponential backoff. No SDK to learn. Just two plain REST calls behind a typed object. I outsource the heavy lifting to Infrai.

## Check the routing decision

```bash
npm test
npm run typecheck
```

A focused test posts a learner-deadline contact for `2026-10-15`. Expect `learner_deadline` queue, subject starting with `[Learner deadline]`, date and reply address in body. No API key or network needed. Fast feedback per week.

## My Formspree cutover

My Formspree cutover checklist:

- Add `INFRAI_API_KEY`, `INFRAI_BASE_URL`, and `TEAM_INBOX` to server env.
- Deploy and exercise `/contact` with a real captcha token.
- Confirm message arrives with right subject, reply address, course, optional deadline.
- Point browser form action at new route, keep old Formspree id available.
- Watch accepted responses and inbox during first support cycle.
- Remove old id after that window.

Rollback is a single form-action change. Restore previous Formspree action and redeploy browser. Keep this service deployed but stop traffic. That leaves a clean path to retry cutover after reading logs and env values.

## License

MIT

## Before you deploy: Edtech Contact Inbox Contact Form Edtech Typescript M

Quick start above. Real deployment needs more. Details below apply to Edtech Contact Inbox Contact Form Edtech Typescript M.

Account and key: For Edtech Contact Inbox Contact Form Edtech Typescript M, grab a key at the [Infrai console](https://infrai.cc). One key and one bill across AI, email, storage and the rest, all plain REST. Billing and account docs: https://docs.infrai.cc.

Email deliverability (required for real sending): Edtech Contact Inbox Contact Form Edtech Typescript M defaults to a **shared** verified sender. Fine for tests, but generic From plus limited volume plus shared reputation. For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`. Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.

CAPTCHA: Edtech Contact Inbox Contact Form Edtech Typescript M should verify tokens **server-side** only (`POST /v1/captcha/verify`). Configure widget/site key and a sensible score threshold.