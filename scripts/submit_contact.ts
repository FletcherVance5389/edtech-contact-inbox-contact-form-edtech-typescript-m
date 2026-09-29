export {};

const captchaToken = process.env.DEMO_CAPTCHA_TOKEN;
if (!captchaToken) throw new Error("DEMO_CAPTCHA_TOKEN is required");

const response = await fetch("http://localhost:3000/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Maya Chen",
    email: "maya@example.edu",
    organisation: "Northstar Learning",
    topic: "learner_deadline",
    courseName: "Introduction to Data Literacy",
    deadline: "2026-10-15",
    message: "Two learners need help confirming the final project cutoff.",
    captchaToken,
  }),
});

console.log(response.status, await response.json());
