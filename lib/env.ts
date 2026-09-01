type Env = {
  adminPassword: string;
  cmsSessionSecret: string;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubContentPrefix: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local and your host.`);
  }
  return value;
}

export function getEnv(): Env {
  return {
    adminPassword: required("ADMIN_PASSWORD"),
    cmsSessionSecret: required("CMS_SESSION_SECRET"),
    githubToken: required("GITHUB_TOKEN"),
    githubOwner: required("GITHUB_OWNER"),
    githubRepo: required("GITHUB_REPO"),
    githubBranch: process.env.GITHUB_BRANCH?.trim() || "main",
    githubContentPrefix: process.env.GITHUB_CONTENT_PREFIX?.trim() ?? "",
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim(),
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
  };
}

export function getCloudinaryEnv() {
  const env = getEnv();
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
  return {
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
    apiSecret: env.cloudinaryApiSecret,
  };
}
