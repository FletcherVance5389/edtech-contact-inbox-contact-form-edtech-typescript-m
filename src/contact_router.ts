export type ContactTopic = "course_delivery" | "learner_deadline" | "educator_reporting";

export type ContactSubmission = {
  name: string;
  email: string;
  organisation?: string;
  topic: ContactTopic;
  courseName: string;
  message: string;
  deadline?: string;
};

const topicLabels: Record<ContactTopic, string> = {
  course_delivery: "Course delivery",
  learner_deadline: "Learner deadline",
  educator_reporting: "Educator reporting",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function routeContact(submission: ContactSubmission) {
  const deadlineLine = submission.deadline
    ? `<p><strong>Learner deadline:</strong> ${escapeHtml(submission.deadline)}</p>`
    : "";
  const organisationLine = submission.organisation
    ? `<p><strong>Organisation:</strong> ${escapeHtml(submission.organisation)}</p>`
    : "";

  return {
    queue: submission.topic,
    subject: `[${topicLabels[submission.topic]}] ${submission.courseName} - ${submission.name}`,
    html:
      `<p><strong>Reply to:</strong> ${escapeHtml(submission.name)} &lt;${escapeHtml(submission.email)}&gt;</p>` +
      organisationLine +
      `<p><strong>Course:</strong> ${escapeHtml(submission.courseName)}</p>` +
      deadlineLine +
      `<p>${escapeHtml(submission.message)}</p>`,
  };
}
