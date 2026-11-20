export interface TechConcept {
  title: string;
  explanation: string;
}

export interface BuildProject {
  name: string;
  description: string;
  startHere: string;
}

export interface LearningContent {
  concept: TechConcept;
  project: BuildProject;
}

// Hand-written general knowledge. No statistics, no news claims.
export const TECH_CONCEPTS: TechConcept[] = [
  {
    title: "What is an API?",
    explanation:
      "An API is a set of rules that lets one program request data or actions from another. The request goes out, and a response comes back, often as JSON. For example, a weather app asks a weather service for today's forecast.",
  },
  {
    title: "What is Big-O notation?",
    explanation:
      "Big-O notation describes how an algorithm's running time grows as its input grows. It ignores exact speed and focuses on the trend. For example, checking every item in a list is O(n), while binary search on a sorted list is O(log n).",
  },
  {
    title: "What is a hash table?",
    explanation:
      "A hash table stores key-value pairs. A hash function turns each key into a storage position, so lookups are usually very fast. For example, a phone app can find a contact by name without checking every entry one by one.",
  },
  {
    title: "What is version control?",
    explanation:
      "Version control records every change to your files, so you can see history, undo mistakes, and work with others. Git is the most common tool. For example, a team can create a branch to test a feature without touching the main code.",
  },
  {
    title: "What is a neural network?",
    explanation:
      "A neural network is made of layers of simple units. It adjusts the strength of its connections while learning from examples. For example, after seeing many labelled photos, it can learn to tell cats from dogs.",
  },
  {
    title: "What is HTTP?",
    explanation:
      "HTTP is the set of rules browsers and servers use to exchange messages. Each response carries a status code that says what happened. For example, 200 means success, and 404 means the page was not found.",
  },
  {
    title: "How do robots sense and move?",
    explanation:
      "Many robots run a loop: read sensors, decide what to do, then drive their motors. They repeat it many times per second. For example, a line-following robot checks its light sensors and steers to keep the line centred.",
  },
];

export const BUILD_PROJECTS: BuildProject[] = [
  {
    name: "Currency converter",
    description:
      "A command-line tool that converts an amount between two currencies using live exchange rates from a free API.",
    startHere:
      "Start with a fixed rate in your code, then replace it with a call to a free exchange-rate API.",
  },
  {
    name: "Link shortener",
    description:
      "A small Node.js program that maps short codes to long URLs and looks them up when asked.",
    startHere:
      "Store two or three codes in a plain JavaScript object, then add a function that looks one up.",
  },
  {
    name: "Word counter",
    description:
      "A script that reads a text file and counts how often each word appears, using a dictionary.",
    startHere:
      "Read the file, split it into words, and store each count in an object with the word as the key.",
  },
  {
    name: "Git practice repository",
    description:
      "A small repository where you create a branch, commit a change, and merge it back into main.",
    startHere: "Run git init, make one commit, create a branch, then merge it back.",
  },
  {
    name: "Flower classifier",
    description:
      "Train a simple model with scikit-learn to classify flower types from a built-in dataset, then test its accuracy.",
    startHere:
      "Load the built-in iris dataset, split it into training and test sets, and fit a model.",
  },
  {
    name: "Website status checker",
    description:
      "A script that requests a list of websites and prints the HTTP status code for each one.",
    startHere: "Fetch one URL and print the response status, then loop over a list of URLs.",
  },
  {
    name: "Line-follower simulation",
    description:
      "A grid simulation where a robot senses a line and steers toward it. No hardware needed.",
    startHere:
      "Draw a line on a small 2D grid, then move the robot one step at a time toward the line.",
  },
];

function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000);
}

/** Concept and project rotate daily on different offsets, so they don't always pair up. */
export function getDailyLearningContent(date: Date = new Date()): LearningContent {
  const day = dayNumber(date);
  return {
    concept: TECH_CONCEPTS[day % TECH_CONCEPTS.length],
    project: BUILD_PROJECTS[(day + 3) % BUILD_PROJECTS.length],
  };
}