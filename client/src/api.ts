const rawUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const API_URL = rawUrl.replace(/["']/g, "").replace(/\/+$/, "");

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  let healthRes: Response;
  try {
    healthRes = await fetch(`${API_URL}/api/health`);
  } catch {
    throw new Error("Cannot connect to the server. Please make sure the server is running.");
  }

  if (!healthRes.ok) {
    throw new Error(`Server responded with status ${healthRes.status}. Please try again later.`);
  }

  let categoriesRes: Response;
  try {
    categoriesRes = await fetch(`${API_URL}/api/categories`);
  } catch {
    throw new Error("Cannot fetch categories. Please make sure the database is reachable.");
  }

  if (!categoriesRes.ok) {
    throw new Error(
      categoriesRes.status === 500
        ? "Database error: cannot load categories. Please contact the administrator."
        : `Categories fetch failed with status ${categoriesRes.status}.`
    );
  }

  const categories = await categoriesRes.json();
  return { online: true, categories };
}
