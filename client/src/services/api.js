export async function fetchChangesets() {
  const res = await fetch('/api/changesets');
  if (!res.ok) {
    throw new Error(`Failed to fetch changesets: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchChangesetById(id) {
  const res = await fetch(`/api/changesets/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch changeset: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
