export type ProjectLinks = {
  live?: string;
  github?: string;
};

export type Project = {
  slug: string;
  title: string;
  description: string;
  tech: string[];
  links: ProjectLinks;
  image?: string;
  featured?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type ProjectInput = {
  title: string;
  description: string;
  tech: string[];
  links: ProjectLinks;
  image?: string;
  featured?: boolean;
};
