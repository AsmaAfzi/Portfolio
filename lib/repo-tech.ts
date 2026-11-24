import { GITHUB_CACHE_TAG, getDisplayConfig, type GitHubRepo } from "@/lib/github-repos";

// Curated so cards show meaningful frameworks and tools, not every utility
// package. Keys are matched case-insensitively against dependency names.
const NPM_PACKAGES: Record<string, string> = {
  react: "React",
  next: "Next.js",
  vue: "Vue",
  nuxt: "Nuxt",
  svelte: "Svelte",
  "@angular/core": "Angular",
  express: "Express",
  "@nestjs/core": "NestJS",
  fastify: "Fastify",
  "socket.io": "Socket.IO",
  "socket.io-client": "Socket.IO",
  mongoose: "MongoDB",
  mongodb: "MongoDB",
  pg: "PostgreSQL",
  mysql: "MySQL",
  mysql2: "MySQL",
  prisma: "Prisma",
  "@prisma/client": "Prisma",
  sequelize: "Sequelize",
  redis: "Redis",
  ioredis: "Redis",
  firebase: "Firebase",
  "firebase-admin": "Firebase",
  "@supabase/supabase-js": "Supabase",
  tailwindcss: "Tailwind CSS",
  "chart.js": "Chart.js",
  d3: "D3.js",
  three: "Three.js",
  redux: "Redux",
  "@reduxjs/toolkit": "Redux",
  electron: "Electron",
  "react-native": "React Native",
  expo: "Expo",
  graphql: "GraphQL",
  "@apollo/client": "GraphQL",
  stripe: "Stripe",
  ethers: "Ethereum",
  web3: "Ethereum",
  hardhat: "Hardhat",
  jest: "Jest",
  "@monaco-editor/react": "Monaco Editor",
  "monaco-editor": "Monaco Editor",
  openai: "OpenAI API",
  langchain: "LangChain",
  "@tensorflow/tfjs": "TensorFlow.js",
};

const PYTHON_PACKAGES: Record<string, string> = {
  fastapi: "FastAPI",
  flask: "Flask",
  django: "Django",
  streamlit: "Streamlit",
  dash: "Dash",
  "flask-socketio": "Socket.IO",
  "python-socketio": "Socket.IO",
  tensorflow: "TensorFlow",
  "tensorflow-cpu": "TensorFlow",
  keras: "Keras",
  torch: "PyTorch",
  "scikit-learn": "Scikit-learn",
  sklearn: "Scikit-learn",
  xgboost: "XGBoost",
  pandas: "Pandas",
  "opencv-python": "OpenCV",
  "opencv-python-headless": "OpenCV",
  ultralytics: "YOLOv8",
  mlflow: "MLflow",
  transformers: "Hugging Face",
  langchain: "LangChain",
  openai: "OpenAI API",
  nltk: "NLP",
  spacy: "NLP",
  textblob: "NLP",
  vadersentiment: "NLP",
  pytesseract: "OCR",
  easyocr: "OCR",
  paddleocr: "OCR",
  prophet: "Forecasting",
  statsmodels: "Forecasting",
  sqlalchemy: "SQLAlchemy",
  "psycopg2": "PostgreSQL",
  "psycopg2-binary": "PostgreSQL",
  asyncpg: "PostgreSQL",
  pymongo: "MongoDB",
  motor: "MongoDB",
  "mysql-connector-python": "MySQL",
  pymysql: "MySQL",
  redis: "Redis",
  celery: "Celery",
  "apache-airflow": "Airflow",
  boto3: "AWS",
  "firebase-admin": "Firebase",
  plotly: "Plotly",
  web3: "Ethereum",
  selenium: "Selenium",
  beautifulsoup4: "Web Scraping",
};

// Tech recognised from the presence of files rather than dependencies.
const PATH_RULES: { test: (path: string) => boolean; tech: string }[] = [
  { test: (p) => /(^|\/)dockerfile[^/]*$/i.test(p) || /(^|\/)docker-compose[^/]*\.ya?ml$/i.test(p), tech: "Docker" },
  { test: (p) => /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(p), tech: "GitHub Actions" },
  { test: (p) => /\.tf$/i.test(p), tech: "Terraform" },
  { test: (p) => /(^|\/)(k8s|kubernetes|helm)\//i.test(p) || /(^|\/)chart\.ya?ml$/i.test(p), tech: "Kubernetes" },
  { test: (p) => /(^|\/)nginx[^/]*\.conf$/i.test(p) || /(^|\/)nginx\//i.test(p), tech: "Nginx" },
  { test: (p) => /(^|\/)vercel\.json$/i.test(p), tech: "Vercel" },
  { test: (p) => /(^|\/)firebase\.json$/i.test(p), tech: "Firebase" },
  { test: (p) => /(^|\/)mlproject$/i.test(p), tech: "MLflow" },
  { test: (p) => /(^|\/)dags\/[^/]+\.py$/i.test(p), tech: "Airflow" },
  { test: (p) => /(^|\/)schema\.prisma$/i.test(p), tech: "Prisma" },
];

const PYTHON_MANIFESTS = ["requirements.txt", "pyproject.toml", "pipfile", "environment.yml", "setup.py"];
const NPM_MANIFEST = "package.json";
const IGNORED_DIRS = /(^|\/)(node_modules|venv|\.venv|env|site-packages|vendor|dist|build)\//i;
const MAX_MANIFESTS = 5;

function githubHeaders(token: string | undefined) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fromPackageJson(text: string) {
  try {
    const pkg = JSON.parse(text) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).map((name) =>
      name.toLowerCase(),
    );
    return names.map((name) => NPM_PACKAGES[name]).filter(Boolean);
  } catch {
    return [];
  }
}

// Python manifests come in several formats, so match package names as whole
// tokens rather than parsing each one.
function fromPythonManifest(text: string) {
  const source = text.toLowerCase().replace(/_/g, "-");
  return Object.entries(PYTHON_PACKAGES)
    .filter(([name]) =>
      new RegExp(`(^|[\\s"'\\[,])${escapeRegExp(name)}(?=$|[\\s"'<>=~!;\\[\\],])`, "m").test(source),
    )
    .map(([, tech]) => tech);
}

async function detectForRepo(repo: GitHubRepo, token: string | undefined): Promise<string[] | null> {
  const treeResponse = await fetch(
    `https://api.github.com/repos/${repo.fullName}/git/trees/${encodeURIComponent(repo.defaultBranch)}?recursive=1`,
    { headers: githubHeaders(token), next: { revalidate: 3600, tags: [GITHUB_CACHE_TAG] } },
  );
  if (!treeResponse.ok) return null;
  const tree = (await treeResponse.json()) as { tree?: { path: string; type: string }[] };
  const paths = (tree.tree ?? [])
    .filter((entry) => entry.type === "blob" && !IGNORED_DIRS.test(entry.path))
    .map((entry) => entry.path);

  const found: string[] = [];
  for (const rule of PATH_RULES) {
    if (paths.some(rule.test)) found.push(rule.tech);
  }

  // Shallowest manifests first: the root ones describe the project best.
  const manifests = paths
    .filter((path) => {
      const base = path.split("/").pop()!.toLowerCase();
      return base === NPM_MANIFEST || PYTHON_MANIFESTS.includes(base);
    })
    .sort((a, b) => a.split("/").length - b.split("/").length)
    .slice(0, MAX_MANIFESTS);

  // raw.githubusercontent.com doesn't count against the REST API rate limit.
  const contents = await Promise.all(
    manifests.map(async (path) => {
      try {
        const encodedPath = path.split("/").map(encodeURIComponent).join("/");
        const response = await fetch(
          `https://raw.githubusercontent.com/${repo.fullName}/${encodeURIComponent(repo.defaultBranch)}/${encodedPath}`,
          { next: { revalidate: 3600, tags: [GITHUB_CACHE_TAG] } },
        );
        return response.ok ? { path, text: await response.text() } : null;
      } catch {
        return null;
      }
    }),
  );

  const fromDependencies: string[] = [];
  for (const file of contents) {
    if (!file) continue;
    const base = file.path.split("/").pop()!.toLowerCase();
    fromDependencies.push(
      ...(base === NPM_MANIFEST ? fromPackageJson(file.text) : fromPythonManifest(file.text)),
    );
  }

  // Frameworks read best ahead of infrastructure.
  return [...new Set([...fromDependencies, ...found])];
}

/** Frameworks and tools detected from each repo's files. Missing entries mean detection failed. */
export async function getDetectedTech(repos: GitHubRepo[]): Promise<Record<number, string[]>> {
  const { token } = getDisplayConfig();
  const entries = await Promise.all(
    repos.map(async (repo) => {
      try {
        const tech = await detectForRepo(repo, token);
        return tech ? ([repo.id, tech] as const) : null;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
}

/** Manual entries first, then detected tech and GitHub topics, without duplicates. */
export function mergeTech(...lists: string[][]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of lists.flat()) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item.trim());
  }
  return result;
}
