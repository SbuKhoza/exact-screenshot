// Editable company content. Update these values to change the site everywhere.
export const site = {
  name: "Sanele Sims Academy",
  tagline: "Empowering learners, one class at a time.",
  short:
    "Quality tutoring in a safe, supportive and inspiring environment — in the comfort of your child's home.",
  phone: "078 176 3322",
  phoneHref: "tel:+27781763322",
  email: "twistkarabo83@gmail.com",
  location: "South Africa (location to be confirmed)",
  whatsapp: "https://wa.me/27781763322",
};

export type Subject = { id: string; name: string; blurb: string; icon: string };

// Add, remove or reorder subjects here.
export const subjects: Subject[] = [
  { id: "mathematics", name: "Mathematics", blurb: "Build strong foundations and problem-solving confidence.", icon: "Sigma" },
  { id: "math-lit", name: "Mathematical Literacy", blurb: "Practical maths for everyday life and the exam.", icon: "Calculator" },
  { id: "english", name: "English (Grade 8–9)", blurb: "Reading, writing and language skills that last.", icon: "BookOpen" },
  { id: "web-dev", name: "Website Development", blurb: "Learn to design and build real websites.", icon: "Code2" },
  { id: "animation", name: "Computer Animation (Blender 5.0)", blurb: "Bring ideas to life with 3D modelling and animation.", icon: "Box" },
];

export const OTHER_SUBJECT = "Other";

export const grades = [
  "Grade R",
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
  "Post-matric / Adult learner",
  "Other / Not in school",
];

export const statusLabels: Record<string, string> = {
  pending_review: "Pending Review",
  contacted: "Contacted",
  enrolled: "Enrolled",
  declined: "Declined",
};
