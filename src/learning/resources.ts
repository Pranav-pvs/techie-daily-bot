export interface LearningResource {
  name: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topic: string;
  url: string;
}

// Free, reputable platforms only. Verify with: npm run check-resources
export const LEARNING_RESOURCES: LearningResource[] = [
  {
    name: "freeCodeCamp",
    description: "Free, project-based courses covering HTML, CSS, JavaScript, and more.",
    difficulty: "Beginner",
    topic: "Web Development",
    url: "https://www.freecodecamp.org/learn",
  },
  // {
  //   name: "Kaggle Learn",
  //   description: "Short, hands-on micro-courses in Python, data science, and machine learning.",
  //   difficulty: "Beginner",
  //   topic: "Machine Learning",
  //   url: "https://www.kaggle.com/learn/python",
  // },
  {
    name: "Hugging Face Learn",
    description: "Free courses on transformers, LLMs, and building with open-source AI.",
    difficulty: "Intermediate",
    topic: "AI Models",
    url: "https://huggingface.co/learn",
  },
  {
    name: "Google ML Crash Course",
    description: "Google's free, self-paced course on core machine learning concepts.",
    difficulty: "Beginner",
    topic: "Machine Learning",
    url: "https://developers.google.com/machine-learning/crash-course",
  },
  {
    name: "MIT OpenCourseWare",
    description: "Free lecture notes, videos, and assignments from MIT's own courses.",
    difficulty: "Advanced",
    topic: "Computer Science",
    url: "https://ocw.mit.edu",
  },
  {
    name: "GitHub Skills",
    description: "Interactive, hands-on tutorials for Git, GitHub, and open-source workflows.",
    difficulty: "Beginner",
    topic: "Developer Tools",
    url: "https://skills.github.com",
  },
  {
    name: "MDN Web Docs",
    description: "Mozilla's reference and guides for HTML, CSS, and JavaScript.",
    difficulty: "Beginner",
    topic: "Web Development",
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development",
  },
];

/** Picks one resource per day, cycling through the list in order. */
export function getResourceOfTheDay(date: Date = new Date()): LearningResource {
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return LEARNING_RESOURCES[dayNumber % LEARNING_RESOURCES.length];
}