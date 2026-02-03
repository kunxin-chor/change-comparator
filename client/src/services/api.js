const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function fetchChangesets() {
  const res = await fetch(apiUrl('/api/changesets'));
  if (!res.ok) {
    throw new Error(`Failed to fetch changesets: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchChangesetById(id) {
  const res = await fetch(apiUrl(`/api/changesets/${id}`));
  if (!res.ok) {
    throw new Error(`Failed to fetch changeset: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
