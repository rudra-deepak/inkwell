# Inkwell — blog platform with comments (MongoDB-backed)

A fullstack blogging platform built with Next.js App Router: user registration/login,
post CRUD, threaded (one-level) comments, likes, tags, search and a writer dashboard.

**Persistence is MongoDB.** Accounts, sessions, posts, comments and likes each live in
their own collection (`src/lib/store.ts` is the only module that talks to the database —
every route, page and component goes through its exported functions). On first connection
the store creates its indexes (unique email/handle, a TTL index that auto-expires
sessions, lookup indexes for posts/comments/likes) and seeds itself with demo writers,
6 posts, comments and likes if the `users` collection is empty.

## Setup

```bash
cp .env.example .env.local   # then point MONGODB_URI at a running MongoDB instance
npm install
npm run dev
```

See `.env.example` for local options (Docker, Homebrew, or a free Atlas cluster).

## Auth model (local)

- Passwords are hashed with Node's built-in `scrypt` + a per-user random salt.
- Login issues a random 64-char opaque session token stored in an `httpOnly`, `SameSite=Lax` cookie.
- Sessions are rows in the local store with a 30-day expiry, resolved on every request
  server-side (`getCurrentUser()`), so revocation is instant.
- API clients may also send `Authorization: Bearer <token>`.
- The browser mirrors the returned profile into `localStorage` only to hydrate UI state —
  the cookie remains the source of truth.

### Demo accounts (password: `password123`)

| Writer | Email |
| --- | --- |
| Ada Whitfield | `ada@inkwell.dev` |
| Milo Reyes | `milo@inkwell.dev` |
| Jun Park | `jun@inkwell.dev` |

## REST API

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/health` | Database probe + record counts |
| POST | `/api/auth/register` | `{ name, email, password }` → sets session cookie |
| POST | `/api/auth/login` | `{ email, password }` → sets session cookie |
| POST | `/api/auth/logout` | Revokes the session server-side |
| GET / PATCH | `/api/auth/me` | Current profile / update name + bio |
| GET | `/api/posts` | `?q=&tag=&author=&sort=recent\|popular\|discussed&limit=&mine=true` |
| POST | `/api/posts` | `{ title, content, excerpt?, tags, coverImage?, status }` |
| GET / PATCH / DELETE | `/api/posts/:slug` | Read, edit (author only), delete (author only) |
| GET / POST | `/api/posts/:slug/comments` | List / create (`parentId` for a one-level reply) |
| POST | `/api/posts/:slug/like` | Toggle like, returns `{ liked, likeCount }` |
| POST | `/api/posts/:slug/view` | Increment view counter (once per browser session) |
| PATCH / DELETE | `/api/comments/:id` | Edit or delete your own comment (cascades replies) |
| GET | `/api/users/:handle` | Author profile + their posts |
| GET | `/api/tags` | Tag list with post counts |

## Pages

`/` feed with search, tag filters and sorting · `/posts/[slug]` article + comments ·
`/posts/[slug]/edit` editor with live preview · `/new` · `/dashboard` (stats, post management,
written comments, profile) · `/authors/[handle]` · `/login` · `/register`

## Notes on rendering

Post bodies are rendered by a small dependency-free markdown renderer that emits React nodes,
so inline HTML can never be injected. All pages that touch the store or cookies are
`force-dynamic`; MongoDB is the only persistence layer.

## Scripts

```bash
npm run dev     # develop
npm run build   # production build
npm start       # serve the production build
```
"# blog" 
