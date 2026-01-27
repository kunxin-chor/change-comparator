# Backend (Express + EJS + MongoDB driver)

No mongoose. No authentication.

## Setup

1. Create a `.env` file in this folder (you can copy `.env.example`).
2. Install deps:

```bash
npm install
```

3. Start server:

```bash
npm run dev
```

Server runs at `http://localhost:3001` by default.

## Routes

- `GET /changeset/create`
  - Form to create a changeset by fetching commit trees from a GitHub repo.

- `POST /changeset/create`
  - Body fields:
    - `name` (required)
    - `repoUrl` (required)
    - `branch` (optional, default `main`)
    - `token` (optional, for private repos)
    - `commitCount` (optional, 2-20, default 4)
  - Stores document in MongoDB with `{ name, repoUrl, branch, createdAt, changesets }`.
  - `changesets` uses the same array structure used by the frontend.

- `GET /changeset/list`
  - Lists all saved changesets.
