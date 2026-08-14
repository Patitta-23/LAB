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
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error(`Health check failed with status ${healthRes.status}`);
  }

  const categoriesRes = await fetch(`${API_URL}/api/categories`);
  if (!categoriesRes.ok) {
    throw new Error(`Categories fetch failed with status ${categoriesRes.status}`);
  }

  const categories = await categoriesRes.json();
  return { online: true, categories };
}
