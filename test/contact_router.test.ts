import assert from "node:assert/strict";
import test from "node:test";
import { routeContact } from "../src/contact_router.js";

test("routes a learner deadline with the date visible to the inbox team", () => {
  const routed = routeContact({
    name: "Maya Chen",
    email: "maya@example.edu",
    topic: "learner_deadline",
    courseName: "Introduction to Data Literacy",
    deadline: "2026-10-15",
    message: "Two learners need help confirming the final project cutoff.",
  });

  assert.equal(routed.queue, "learner_deadline");
  assert.equal(routed.subject, "[Learner deadline] Introduction to Data Literacy - Maya Chen");
  assert.match(routed.html, /Learner deadline:<\/strong> 2026-10-15/);
  assert.match(routed.html, /Reply to:<\/strong> Maya Chen &lt;maya@example\.edu&gt;/);
});
