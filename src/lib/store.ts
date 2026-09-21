import type { Collection, Filter } from "mongodb";
import { getDb } from "./mongodb";
import { hashPassword, randomId, randomToken, verifyPassword } from "./password";

/* ------------------------------------------------------------------ *
 * MongoDB-backed persistence layer.
 *
 * Accounts, sessions, posts, comments and likes each live in their own
 * collection. This module is the *only* place that talks to the
 * database — every route, page and component imports functions and
 * types from here, never a collection directly, so the storage engine
 * can change again without touching call sites.
 * ------------------------------------------------------------------ */

export type UserDoc = {
  _id: string;
  name: string;
  handle: string;
  email: string;
  passwordHash: string;
  salt: string;
  bio: string;
  avatarColor: string;
  avatarImage: string | null;
  createdAt: Date;
  verified?: boolean;
};

export type VerificationRequestDoc = {
  _id: string;
  userId: string;
  email: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  reviewedAt?: Date;
};

export type SessionDoc = {
  _id: string; // the session token itself
  userId: string;
  createdAt: Date;
  expiresAt: Date;
};

export type PostDoc = {
  _id: string;
  slug: string;
  authorId: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  coverImage: string | null;
  status: "published" | "draft";
  views: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CommentDoc = {
  _id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LikeDoc = {
  _id: string; // `${postId}:${userId}` — doubles as the uniqueness constraint
  postId: string;
  userId: string;
  createdAt: Date;
};

export type PublicUser = {
  id: string;
  name: string;
  handle: string;
  email: string;
  bio: string;
  avatarColor: string;
  avatarImage: string | null;
  createdAt: string;
  postCount: number;
  commentCount: number;
  verified: boolean;
};

export type PostView = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  coverImage: string | null;
  status: "published" | "draft";
  views: number;
  createdAt: string;
  updatedAt: string;
  readingMinutes: number;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
  isAuthor: boolean;
  author: PublicUser;
};

export type PostDetail = PostView & { content: string };

export type CommentView = {
  id: string;
  postId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  edited: boolean;
  isAuthor: boolean;
  author: PublicUser;
};

export const SESSION_TTL_DAYS = 30;

/* ----------------------------- helpers ---------------------------- */

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 70) || "untitled"
  );
}

export function readingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function stripMarkdown(content: string) {
  return content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const AVATAR_COLORS = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-cyan-400",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-400",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-500",
];

export function pickAvatarColor(seed: string) {
  let total = 0;
  for (const char of seed) total += char.charCodeAt(0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDuplicateKeyError(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000);
}

export class StoreError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "StoreError";
  }
}

/* ------------------------- connection + setup ----------------------- */

let readyPromise: Promise<void> | null = null;

/** Ensures indexes exist and the database is seeded. Safe to call repeatedly. */
function ready(): Promise<void> {
  if (!readyPromise) {
    readyPromise = initialize().catch((err) => {
      readyPromise = null; // allow a retry on the next call instead of caching a failure forever
      throw err;
    });
  }
  return readyPromise;
}

async function initialize(): Promise<void> {
  const db = await getDb();
  const users = db.collection<UserDoc>("users");
  const sessions = db.collection<SessionDoc>("sessions");
  const posts = db.collection<PostDoc>("posts");
  const comments = db.collection<CommentDoc>("comments");
  const likes = db.collection<LikeDoc>("likes");

  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    users.createIndex({ handle: 1 }, { unique: true }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }), // Mongo prunes expired sessions itself
    sessions.createIndex({ userId: 1 }),
    posts.createIndex({ slug: 1 }, { unique: true }),
    posts.createIndex({ authorId: 1 }),
    posts.createIndex({ status: 1 }),
    posts.createIndex({ tags: 1 }),
    comments.createIndex({ postId: 1 }),
    comments.createIndex({ authorId: 1 }),
    comments.createIndex({ parentId: 1 }),
    likes.createIndex({ postId: 1 }),
    likes.createIndex({ userId: 1 }),
  ]);

  if ((await users.countDocuments({})) === 0) {
    await seedDatabase();
  }
}

async function usersCol(): Promise<Collection<UserDoc>> {
  await ready();
  return (await getDb()).collection<UserDoc>("users");
}

async function verificationCol(): Promise<Collection<VerificationRequestDoc>> {
  await ready();
  return (await getDb()).collection<VerificationRequestDoc>("verification_requests");
}
async function sessionsCol(): Promise<Collection<SessionDoc>> {
  await ready();
  return (await getDb()).collection<SessionDoc>("sessions");
}
async function postsCol(): Promise<Collection<PostDoc>> {
  await ready();
  return (await getDb()).collection<PostDoc>("posts");
}
async function commentsCol(): Promise<Collection<CommentDoc>> {
  await ready();
  return (await getDb()).collection<CommentDoc>("comments");
}
async function likesCol(): Promise<Collection<LikeDoc>> {
  await ready();
  return (await getDb()).collection<LikeDoc>("likes");
}

/** Probe used by /api/health. */
export async function getStoreHealth() {
  const [users, sessions, posts, comments] = await Promise.all([
    usersCol(),
    sessionsCol(),
    postsCol(),
    commentsCol(),
  ]);
  const [userCount, sessionCount, postCount, commentCount] = await Promise.all([
    users.countDocuments({}),
    sessions.countDocuments({}),
    posts.countDocuments({}),
    comments.countDocuments({}),
  ]);
  const db = await getDb();
  return {
    database: db.databaseName,
    counts: { users: userCount, posts: postCount, comments: commentCount, sessions: sessionCount },
  };
}

/* ------------------------- view projections ----------------------- */

export async function toPublicUser(user: UserDoc): Promise<PublicUser> {
  const [posts, comments] = await Promise.all([postsCol(), commentsCol()]);
  const [postCount, commentCount] = await Promise.all([
    posts.countDocuments({ authorId: user._id }),
    comments.countDocuments({ authorId: user._id }),
  ]);
  return {
    id: user._id,
    name: user.name,
    handle: user.handle,
    email: user.email,
    bio: user.bio,
    avatarColor: user.avatarColor,
    avatarImage: user.avatarImage ?? null,
    createdAt: user.createdAt.toISOString(),
    postCount,
    commentCount,
    verified: Boolean(user.verified),
  };
}

/** Hydrate a single post (author + counts). One-off use — createPost/updatePost/getPostBySlug. */
async function hydratePost(post: PostDoc, viewerId?: string | null): Promise<PostView | null> {
  const [users, comments, likes] = await Promise.all([usersCol(), commentsCol(), likesCol()]);
  const author = await users.findOne({ _id: post.authorId });
  if (!author) return null;
  const [commentCount, likeCount, likedByMe] = await Promise.all([
    comments.countDocuments({ postId: post._id }),
    likes.countDocuments({ postId: post._id }),
    viewerId
      ? likes.findOne({ postId: post._id, userId: viewerId }, { projection: { _id: 1 } }).then(Boolean)
      : Promise.resolve(false),
  ]);
  return {
    id: post._id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    coverImage: post.coverImage,
    status: post.status,
    views: post.views,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    readingMinutes: readingMinutes(post.content),
    commentCount,
    likeCount,
    likedByMe,
    isAuthor: Boolean(viewerId && post.authorId === viewerId),
    author: await toPublicUser(author),
  };
}

async function hydratePostDetail(post: PostDoc, viewerId?: string | null): Promise<PostDetail | null> {
  const base = await hydratePost(post, viewerId);
  if (!base) return null;
  return { ...base, content: post.content };
}

/** Batch-hydrate many posts in a fixed number of queries, for listPosts/getUserDashboard. */
async function hydratePosts(posts: PostDoc[], viewerId?: string | null): Promise<PostView[]> {
  if (posts.length === 0) return [];
  const [usersC, commentsC, likesC] = await Promise.all([usersCol(), commentsCol(), likesCol()]);
  const authorIds = Array.from(new Set(posts.map((p) => p.authorId)));
  const postIds = posts.map((p) => p._id);

  const [authors, commentAgg, likeAgg, likedRows] = await Promise.all([
    usersC.find({ _id: { $in: authorIds } }).toArray(),
    commentsC
      .aggregate<{ _id: string; count: number }>([
        { $match: { postId: { $in: postIds } } },
        { $group: { _id: "$postId", count: { $sum: 1 } } },
      ])
      .toArray(),
    likesC
      .aggregate<{ _id: string; count: number }>([
        { $match: { postId: { $in: postIds } } },
        { $group: { _id: "$postId", count: { $sum: 1 } } },
      ])
      .toArray(),
    viewerId
      ? likesC.find({ postId: { $in: postIds }, userId: viewerId }, { projection: { postId: 1 } }).toArray()
      : Promise.resolve([]),
  ]);

  const commentCountMap = new Map(commentAgg.map((r) => [r._id, r.count]));
  const likeCountMap = new Map(likeAgg.map((r) => [r._id, r.count]));
  const likedSet = new Set(likedRows.map((r) => r.postId));

  const publicAuthorMap = new Map<string, PublicUser>();
  await Promise.all(authors.map(async (author) => publicAuthorMap.set(author._id, await toPublicUser(author))));

  const views: PostView[] = [];
  for (const post of posts) {
    const author = publicAuthorMap.get(post.authorId);
    if (!author) continue;
    views.push({
      id: post._id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      tags: post.tags,
      coverImage: post.coverImage,
      status: post.status,
      views: post.views,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      readingMinutes: readingMinutes(post.content),
      commentCount: commentCountMap.get(post._id) ?? 0,
      likeCount: likeCountMap.get(post._id) ?? 0,
      likedByMe: likedSet.has(post._id),
      isAuthor: Boolean(viewerId && post.authorId === viewerId),
      author,
    });
  }
  return views;
}

function toCommentView(comment: CommentDoc, author: PublicUser, viewerId?: string | null): CommentView {
  return {
    id: comment._id,
    postId: comment.postId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    parentId: comment.parentId,
    edited: comment.updatedAt.getTime() !== comment.createdAt.getTime(),
    isAuthor: Boolean(viewerId && comment.authorId === viewerId),
    author,
  };
}

/* ------------------------------ users ----------------------------- */

async function uniqueHandle(desired: string) {
  const users = await usersCol();
  const base = slugify(desired).replace(/-/g, "") || "writer";
  let handle = base;
  let i = 1;
  while (await users.findOne({ handle }, { projection: { _id: 1 } })) {
    handle = `${base}${++i}`;
  }
  return handle;
}

export async function createUser(input: { name: string; email: string; password: string; bio?: string }) {
  const users = await usersCol();
  const email = normalizeEmail(input.email);
  if (await users.findOne({ email }, { projection: { _id: 1 } })) {
    throw new StoreError("An account with that email already exists.", 409);
  }
  const handle = await uniqueHandle(input.name);
  const { salt, hash } = hashPassword(input.password);
  const doc: UserDoc = {
    _id: randomId("usr"),
    name: input.name.trim(),
    handle,
    email,
    passwordHash: hash,
    salt,
    bio: input.bio?.trim() || "New here — writing my first post soon.",
    avatarColor: pickAvatarColor(email),
    avatarImage: null,
    createdAt: new Date(),
  };
  try {
    await users.insertOne(doc);
  } catch (err) {
    // Belt-and-suspenders: the unique index catches a race the pre-check above misses.
    if (isDuplicateKeyError(err)) throw new StoreError("An account with that email already exists.", 409);
    throw err;
  }
  return doc;
}

export async function authenticateUser(email: string, password: string) {
  const users = await usersCol();
  const user = await users.findOne({ email: normalizeEmail(email) });
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) return null;
  return user;
}

export async function findUserById(id: string) {
  const users = await usersCol();
  return users.findOne({ _id: id });
}

export async function findUserByHandle(handle: string) {
  const users = await usersCol();
  const user = await users.findOne({ handle: handle.toLowerCase() });
  return user ? toPublicUser(user) : null;
}

export async function updateUser(
  id: string,
  patch: { name?: string; bio?: string; password?: string; avatarImage?: string | null },
) {
  const users = await usersCol();
  const user = await users.findOne({ _id: id });
  if (!user) throw new StoreError("User not found.", 404);

  const update: Partial<UserDoc> = {};
  if (patch.name) update.name = patch.name.trim();
  if (patch.bio !== undefined) update.bio = patch.bio.trim();
  if (patch.avatarImage !== undefined) update.avatarImage = patch.avatarImage;
  if (patch.password) {
    const { salt, hash } = hashPassword(patch.password);
    update.salt = salt;
    update.passwordHash = hash;
  }
  if (Object.keys(update).length > 0) {
    await users.updateOne({ _id: id }, { $set: update });
  }
  if (patch.password) {
    const sessions = await sessionsCol();
    await sessions.deleteMany({ userId: id }); // password change revokes every existing session
  }
  return { ...user, ...update };
}

/* ---------------------------- sessions ---------------------------- */

export async function createSession(userId: string) {
  const sessions = await sessionsCol();
  const token = randomToken();
  const created = new Date();
  const expiresAt = new Date(created.getTime() + SESSION_TTL_DAYS * 86_400_000);
  await sessions.deleteMany({ expiresAt: { $lt: created } });
  await sessions.insertOne({ _id: token, userId, createdAt: created, expiresAt });
  return { token, userId, createdAt: created.toISOString(), expiresAt: expiresAt.toISOString() };
}

export async function resolveSession(token: string | undefined | null): Promise<PublicUser | null> {
  if (!token) return null;
  const sessions = await sessionsCol();
  const session = await sessions.findOne({ _id: token });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  const users = await usersCol();
  const user = await users.findOne({ _id: session.userId });
  return user ? toPublicUser(user) : null;
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  const sessions = await sessionsCol();
  await sessions.deleteOne({ _id: token });
}

/* ------------------------------ posts ----------------------------- */

export type ListPostsQuery = {
  q?: string;
  tag?: string;
  authorHandle?: string;
  authorId?: string;
  viewerId?: string | null;
  includeDrafts?: boolean;
  sort?: "recent" | "popular" | "discussed";
  limit?: number;
};

export async function listPosts(query: ListPostsQuery = {}): Promise<PostView[]> {
  const { q, tag, authorHandle, authorId, viewerId, includeDrafts, sort = "recent", limit } = query;

  if (includeDrafts && !viewerId) return [];

  const posts = await postsCol();
  const users = await usersCol();
  const conditions: Filter<PostDoc>[] = [];

  if (includeDrafts) {
    conditions.push({ authorId: viewerId! });
  } else {
    conditions.push(viewerId ? { $or: [{ status: "published" }, { authorId: viewerId }] } : { status: "published" });
  }

  if (authorId) conditions.push({ authorId });

  if (authorHandle) {
    const author = await users.findOne({ handle: authorHandle.toLowerCase() }, { projection: { _id: 1 } });
    if (!author) return [];
    conditions.push({ authorId: author._id });
  }

  if (tag) conditions.push({ tags: tag.toLowerCase() });

  if (q) {
    const needle = escapeRegex(q.trim());
    if (needle) {
      conditions.push({
        $or: [
          { title: { $regex: needle, $options: "i" } },
          { excerpt: { $regex: needle, $options: "i" } },
          { content: { $regex: needle, $options: "i" } },
          { tags: { $elemMatch: { $regex: needle, $options: "i" } } },
        ],
      });
    }
  }

  const filter: Filter<PostDoc> = conditions.length ? { $and: conditions } : {};
  const matched = await posts.find(filter).toArray();
  const hydrated = await hydratePosts(matched, viewerId);

  hydrated.sort((a, b) => {
    if (sort === "popular") return b.likeCount - a.likeCount || b.views - a.views;
    if (sort === "discussed") return b.commentCount - a.commentCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return typeof limit === "number" ? hydrated.slice(0, limit) : hydrated;
}

export async function getPostBySlug(slug: string, viewerId?: string | null): Promise<PostDetail | null> {
  const posts = await postsCol();
  const post = await posts.findOne({ $or: [{ slug }, { _id: slug }] });
  if (!post) return null;
  if (post.status === "draft" && post.authorId !== viewerId) return null;
  return hydratePostDetail(post, viewerId);
}

async function uniqueSlug(title: string, ignoreId?: string) {
  const posts = await postsCol();
  const base = slugify(title);
  let slug = base;
  let i = 1;
  for (;;) {
    const filter: Filter<PostDoc> = ignoreId ? { slug, _id: { $ne: ignoreId } } : { slug };
    const exists = await posts.findOne(filter, { projection: { _id: 1 } });
    if (!exists) return slug;
    slug = `${base}-${++i}`;
  }
}

export type PostInput = {
  title: string;
  excerpt?: string;
  content: string;
  tags?: string[];
  coverImage?: string | null;
  status?: "published" | "draft";
};

function normalizeTags(tags?: string[]) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter((t) => t.length > 0)
        .slice(0, 6),
    ),
  );
}

export async function createPost(authorId: string, input: PostInput): Promise<PostDetail> {
  const posts = await postsCol();
  const created = new Date();
  const doc: PostDoc = {
    _id: randomId("pst"),
    slug: await uniqueSlug(input.title),
    authorId,
    title: input.title.trim(),
    excerpt: input.excerpt?.trim() || stripMarkdown(input.content).slice(0, 180),
    content: input.content.trim(),
    tags: normalizeTags(input.tags),
    coverImage: input.coverImage || null,
    status: input.status ?? "published",
    views: 0,
    createdAt: created,
    updatedAt: created,
  };
  await posts.insertOne(doc);
  return (await hydratePostDetail(doc, authorId)) as PostDetail;
}

export async function updatePost(postIdOrSlug: string, authorId: string, input: Partial<PostInput>): Promise<PostDetail> {
  const posts = await postsCol();
  const post = await posts.findOne({ $or: [{ _id: postIdOrSlug }, { slug: postIdOrSlug }] });
  if (!post) throw new StoreError("Post not found.", 404);
  if (post.authorId !== authorId) throw new StoreError("You can only edit your own posts.", 403);

  const update: Partial<PostDoc> = {};
  if (input.title && input.title.trim() !== post.title) {
    update.title = input.title.trim();
    update.slug = await uniqueSlug(update.title, post._id);
  }
  if (input.content !== undefined) update.content = input.content.trim();
  if (input.excerpt !== undefined) {
    update.excerpt = input.excerpt.trim() || stripMarkdown(update.content ?? post.content).slice(0, 180);
  }
  if (input.tags !== undefined) update.tags = normalizeTags(input.tags);
  if (input.coverImage !== undefined) update.coverImage = input.coverImage || null;
  if (input.status !== undefined) update.status = input.status;
  update.updatedAt = new Date();

  await posts.updateOne({ _id: post._id }, { $set: update });
  return (await hydratePostDetail({ ...post, ...update }, authorId)) as PostDetail;
}

export async function deletePost(postIdOrSlug: string, authorId: string) {
  const posts = await postsCol();
  const post = await posts.findOne({ $or: [{ _id: postIdOrSlug }, { slug: postIdOrSlug }] });
  if (!post) throw new StoreError("Post not found.", 404);
  if (post.authorId !== authorId) throw new StoreError("You can only delete your own posts.", 403);
  const [comments, likes] = await Promise.all([commentsCol(), likesCol()]);
  await Promise.all([
    posts.deleteOne({ _id: post._id }),
    comments.deleteMany({ postId: post._id }),
    likes.deleteMany({ postId: post._id }),
  ]);
  return { id: post._id, slug: post.slug };
}

export async function registerView(slug: string) {
  const posts = await postsCol();
  const result = await posts.findOneAndUpdate(
    { $or: [{ slug }, { _id: slug }] },
    { $inc: { views: 1 } },
    { returnDocument: "after" },
  );
  return result?.views ?? null;
}

export async function toggleLike(postIdOrSlug: string, userId: string) {
  const posts = await postsCol();
  const likes = await likesCol();
  const post = await posts.findOne({ $or: [{ slug: postIdOrSlug }, { _id: postIdOrSlug }] }, { projection: { _id: 1 } });
  if (!post) throw new StoreError("Post not found.", 404);

  // Atomic toggle: the like's _id IS the (postId, userId) pair, so there is no
  // read-then-write race window the way there would be with a separate check.
  const likeId = `${post._id}:${userId}`;
  const removed = await likes.findOneAndDelete({ _id: likeId });
  let liked: boolean;
  if (removed) {
    liked = false;
  } else {
    try {
      await likes.insertOne({ _id: likeId, postId: post._id, userId, createdAt: new Date() });
      liked = true;
    } catch (err) {
      if (isDuplicateKeyError(err)) liked = true; // a concurrent click already inserted it
      else throw err;
    }
  }
  const likeCount = await likes.countDocuments({ postId: post._id });
  return { liked, likeCount };
}

/* ---------------------------- comments ---------------------------- */

export async function listComments(postIdOrSlug: string, viewerId?: string | null): Promise<CommentView[]> {
  const posts = await postsCol();
  const post = await posts.findOne({ $or: [{ _id: postIdOrSlug }, { slug: postIdOrSlug }] }, { projection: { _id: 1 } });
  if (!post) return [];

  const comments = await commentsCol();
  const rows = await comments.find({ postId: post._id }).sort({ createdAt: 1 }).toArray();
  if (rows.length === 0) return [];

  const users = await usersCol();
  const authorIds = Array.from(new Set(rows.map((c) => c.authorId)));
  const authors = await users.find({ _id: { $in: authorIds } }).toArray();
  const publicAuthorMap = new Map<string, PublicUser>();
  await Promise.all(authors.map(async (author) => publicAuthorMap.set(author._id, await toPublicUser(author))));

  const result: CommentView[] = [];
  for (const comment of rows) {
    const author = publicAuthorMap.get(comment.authorId);
    if (!author) continue;
    result.push(toCommentView(comment, author, viewerId));
  }
  return result;
}

export async function createComment(input: {
  postIdOrSlug: string;
  authorId: string;
  body: string;
  parentId?: string | null;
}): Promise<CommentView> {
  const posts = await postsCol();
  const post = await posts.findOne({ $or: [{ _id: input.postIdOrSlug }, { slug: input.postIdOrSlug }] }, { projection: { _id: 1 } });
  if (!post) throw new StoreError("Post not found.", 404);

  const comments = await commentsCol();
  const created = new Date();
  const doc: CommentDoc = {
    _id: randomId("cmt"),
    postId: post._id,
    authorId: input.authorId,
    parentId: input.parentId ?? null,
    body: input.body.trim(),
    createdAt: created,
    updatedAt: created,
  };
  await comments.insertOne(doc);

  const users = await usersCol();
  const author = await users.findOne({ _id: input.authorId });
  if (!author) throw new StoreError("Author not found.", 404);
  return toCommentView(doc, await toPublicUser(author), input.authorId);
}

export async function updateComment(commentId: string, userId: string, body: string): Promise<CommentView> {
  const comments = await commentsCol();
  const comment = await comments.findOne({ _id: commentId });
  if (!comment) throw new StoreError("Comment not found.", 404);
  if (comment.authorId !== userId) throw new StoreError("You can only edit your own comments.", 403);

  const updatedAt = new Date();
  const trimmedBody = body.trim();
  await comments.updateOne({ _id: commentId }, { $set: { body: trimmedBody, updatedAt } });

  const users = await usersCol();
  const author = await users.findOne({ _id: userId });
  if (!author) throw new StoreError("Author not found.", 404);
  return toCommentView({ ...comment, body: trimmedBody, updatedAt }, await toPublicUser(author), userId);
}

export async function deleteComment(commentId: string, userId: string) {
  const comments = await commentsCol();
  const comment = await comments.findOne({ _id: commentId });
  if (!comment) throw new StoreError("Comment not found.", 404);
  if (comment.authorId !== userId) throw new StoreError("You can only delete your own comments.", 403);
  await comments.deleteMany({ $or: [{ _id: commentId }, { parentId: commentId }] }); // cascade one-level replies
  return { id: comment._id, postId: comment.postId };
}

/* ----------------------------- discovery --------------------------- */

export async function listTags() {
  const posts = await postsCol();
  const rows = await posts
    .aggregate<{ _id: string; count: number }>([
      { $match: { status: "published" } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ])
    .toArray();
  return rows.map((r) => ({ tag: r._id, count: r.count }));
}

export async function getStats() {
  const [posts, users, comments] = await Promise.all([postsCol(), usersCol(), commentsCol()]);
  const [published, writers, commentCount, tagRows] = await Promise.all([
    posts.countDocuments({ status: "published" }),
    users.countDocuments({}),
    comments.countDocuments({}),
    posts
      .aggregate<{ _id: string }>([
        { $match: { status: "published" } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags" } },
      ])
      .toArray(),
  ]);
  return { posts: published, writers, comments: commentCount, tags: tagRows.length };
}

export async function getUserDashboard(userId: string) {
  const postsC = await postsCol();
  const postRows = await postsC.find({ authorId: userId }).sort({ updatedAt: -1 }).toArray();
  const posts = await hydratePosts(postRows, userId);

  const commentsC = await commentsCol();
  const commentRows = await commentsC.find({ authorId: userId }).sort({ createdAt: -1 }).toArray();
  const users = await usersCol();
  const self = await users.findOne({ _id: userId });
  const publicSelf = self ? await toPublicUser(self) : null;
  const comments: CommentView[] = publicSelf ? commentRows.map((c) => toCommentView(c, publicSelf, userId)) : [];

  const postIds = posts.map((p) => p.id);
  const likes = await likesCol();
  const likesReceived = postIds.length ? await likes.countDocuments({ postId: { $in: postIds } }) : 0;

  return {
    posts,
    comments,
    totals: {
      posts: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      drafts: posts.filter((p) => p.status === "draft").length,
      views: posts.reduce((sum, p) => sum + p.views, 0),
      likesReceived,
      commentsWritten: comments.length,
    },
  };
}

export async function getCommentWithPost(commentId: string) {
  const comments = await commentsCol();
  const comment = await comments.findOne({ _id: commentId });
  if (!comment) return null;
  const posts = await postsCol();
  const post = await posts.findOne({ _id: comment.postId });
  return { comment, post: post ?? null };
}

/* ------------------------------ seeding --------------------------- */

const SEED_PASSWORD = "password123";

const seedUsers = [
  {
    name: "Ada Whitfield",
    handle: "ada",
    email: "ada@inkwell.dev",
    bio: "Staff engineer. Writes about interfaces, performance, and the craft of shipping.",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    name: "Milo Reyes",
    handle: "milo",
    email: "milo@inkwell.dev",
    bio: "Product designer turned tinkerer. Obsessed with tiny interactions.",
    color: "from-sky-500 to-cyan-400",
  },
  {
    name: "Jun Park",
    handle: "jun",
    email: "jun@inkwell.dev",
    bio: "Writer of words and queries. Ex-journalist, current database nerd.",
    color: "from-emerald-500 to-teal-400",
  },
];

type SeedPost = {
  author: string;
  title: string;
  tags: string[];
  cover: string;
  createdOffsetDays: number;
  content: string;
};

const seedPosts: SeedPost[] = [
  {
    author: "ada",
    title: "Designing a blog engine with zero database",
    tags: ["architecture", "javascript", "local-first"],
    cover:
      "https://images.pexels.com/photos/34803969/pexels-photo-34803969.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    createdOffsetDays: 0,
    content: `Most side projects die in the setup phase. You open a terminal, provision a database, write migrations, and by the time the first user row exists you have lost the plot.

## Constraints make products

A blog has three jobs: keep writers, keep readers, and keep a comment thread that does not become a swamp. None of those jobs requires a distributed system.

So for this build I chose a constraint: **no external database**. Just one JSON document on disk, an atomic rename per write, and a promise chain that serialises mutations so two requests never scribble over each other.

- Users, sessions, posts, comments and likes all live in a single file
- Passwords are hashed with scrypt and a per-user salt
- Sessions are opaque random tokens stored in an httpOnly cookie
- Every write lands via a temp file and an atomic rename

> The interesting part of a system is rarely the storage engine. It is the guarantees you can actually keep.

## What you give up

Honesty matters. A single file store is not going to survive a thousand concurrent writers, and it will not scale horizontally. But it will let you finish the product, and finishing is the only feature users can experience.

If the thing takes off, the API surface does not change. Swapping the store for Postgres becomes a Tuesday afternoon instead of a rewrite.`,
  },
  {
    author: "milo",
    title: "Comment sections are a design problem, not a moderation problem",
    tags: ["design", "community", "ux"],
    cover:
      "https://images.pexels.com/photos/7889065/pexels-photo-7889065.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    createdOffsetDays: 1,
    content: `Everyone blames moderation tooling for toxic comment sections. Tooling helps, but most of the damage is done before a human ever reads a reply.

## Three small choices that change everything

1. **Show the writer first.** Names, avatars and join dates signal that a real person is on the other end.
2. **Keep threads one level deep.** Nested trees reward point-scoring; a single reply layer rewards conversation.
3. **Let people edit their own words.** Deletion feels like defeat. Editing feels like thinking.

When I redesigned the thread view for a small reading app, mean replies dropped by a third without a single new rule. The only change was making the avatar and the timestamp visible above every message.

## The affordance test

Before shipping, ask what the interface makes *easy*. If it is easier to shout than to reply, people will shout. Design the easy path and the hard path takes care of itself.`,
  },
  {
    author: "jun",
    title: "Session cookies in Next.js, explained like a reporter",
    tags: ["security", "nextjs", "auth"],
    cover:
      "https://images.pexels.com/photos/4218883/pexels-photo-4218883.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    createdOffsetDays: 2,
    content: `I spent a decade writing about politics, so let me explain authentication the way a reporter would: who is claiming what, and who verified it?

## The claim

A browser says "I am Ada". Anyone can type that into a console. On its own, a claim is worth nothing.

## The verification

When Ada logs in, the server burns a random 64-character token into a record that also names her user id and an expiry date. That token goes back to the browser in a cookie marked **httpOnly**, which means JavaScript cannot read it. Session state stays on the server side where the client cannot forge it.

- \`SameSite=Lax\` keeps cross-site POSTs from riding along on the cookie
- The token is compared against the session table on every request, never trusted as data
- Expired sessions are pruned on the next write

## The retraction

Logging out does not "clear" a claim, it revokes a credential. The server deletes the session row and the cookie evaporates.

That is the whole story. No JWT gymnastics required, and revocation works instantly — which is more than you can say for a signed token with a two-week lifetime.`,
  },
  {
    author: "ada",
    title: "REST is a naming habit",
    tags: ["api", "architecture"],
    cover:
      "https://images.pexels.com/photos/34803983/pexels-photo-34803983.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    createdOffsetDays: 4,
    content: `Start with the nouns and the verbs fall out naturally.

## The nouns

- \`/api/posts\` — the collection
- \`/api/posts/:slug\` — one resource
- \`/api/posts/:slug/comments\` — comments belonging to a resource
- \`/api/comments/:id\` — a comment on its own terms

## The verbs

\`GET\` reads, \`POST\` creates, \`PATCH\` changes part of something, \`DELETE\` removes it. That is the whole vocabulary, and it maps cleanly onto a file-backed store just as well as it maps onto Postgres.

The payoff is not purity, it is predictability. A reader of your API can guess the next endpoint before they read the docs, and your own fetch calls end up looking boring — which is exactly what you want at the call site.`,
  },
  {
    author: "milo",
    title: "The cover image is the hardest design decision on a blog",
    tags: ["design", "writing"],
    cover:
      "https://images.pexels.com/photos/5554754/pexels-photo-5554754.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    createdOffsetDays: 6,
    content: `A cover image sets the emotional temperature of an article before a single word is read. It also adds 200KB and one more thing that can look broken on a slow connection.

## My rule

If the cover does not say something the title cannot, skip it. Otherwise use it at full width, and commit to the crop.

- Keep it wide: 1200x627 loads fast and looks deliberate in a card grid
- Give it a title, not a filename, for anyone using a screen reader
- Let it fade into the page instead of boxing it behind a border

Typography earns the rest. A tight title, a readable measure of 68 characters, and generous line height will beat any illustration you can commission.`,
  },
  {
    author: "jun",
    title: "Notes from shipping in public",
    tags: ["writing", "community", "local-first"],
    cover:
      "https://images.pexels.com/photos/7657611/pexels-photo-7657611.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    createdOffsetDays: 9,
    content: `Shipping in public is a commitment device. You write the post before the feature is finished, and then you have to finish it.

## What changed for me

1. Drafts became shorter and more frequent
2. Comments became useful instead of decorative
3. I stopped waiting for permission to publish

> Nobody is reading your blog to catch you being wrong. They are reading it to find something they can use.

## Keep the receipt

Link the commit, the file, the number. It is the difference between an opinion and a report.`,
  },
];

const seedComments: Array<{ post: number; author: string; body: string; offsetHours: number; parent?: number }> = [
  { post: 0, author: "milo", body: "The atomic rename detail is the part people skip. Do you fsync before renaming?", offsetHours: 20 },
  { post: 0, author: "ada", body: "Not on every write — the rename gives me consistency, and I accept the risk of losing the last write on a hard power cut.", offsetHours: 19, parent: 0 },
  { post: 0, author: "jun", body: "I want a follow-up on what the Postgres migration would look like.", offsetHours: 12 },
  { post: 1, author: "ada", body: "One level deep is the underrated call here. It also makes the mobile layout trivial.", offsetHours: 30 },
  { post: 1, author: "jun", body: "Editing instead of deleting: exactly right. Most people are just trying to restate a half-formed thought.", offsetHours: 22 },
  { post: 2, author: "ada", body: "Praning expired sessions on write is a neat trick to avoid a cron job.", offsetHours: 40 },
  { post: 2, author: "milo", body: "The reporter framing is delightful. More of this please.", offsetHours: 34 },
  { post: 3, author: "jun", body: "Boring fetch calls are the goal. I keep saying this to my team.", offsetHours: 70 },
  { post: 4, author: "ada", body: "68 characters is the number I keep coming back to as well.", offsetHours: 100 },
  { post: 5, author: "milo", body: "The receipt line is going on a sticky note above my desk.", offsetHours: 130 },
];

async function seedDatabase(): Promise<void> {
  const db = await getDb();
  const users = db.collection<UserDoc>("users");
  const posts = db.collection<PostDoc>("posts");
  const comments = db.collection<CommentDoc>("comments");
  const likes = db.collection<LikeDoc>("likes");

  const created = new Date();

  const userDocs: UserDoc[] = seedUsers.map((seed) => {
    const { salt, hash } = hashPassword(SEED_PASSWORD);
    return {
      _id: randomId("usr"),
      name: seed.name,
      handle: seed.handle,
      email: seed.email,
      passwordHash: hash,
      salt,
      bio: seed.bio,
      avatarColor: seed.color,
      avatarImage: null,
      createdAt: new Date(created.getTime() - 120 * 86_400_000),
    };
  });
  await users.insertMany(userDocs);

  const postDocs: PostDoc[] = [];
  seedPosts.forEach((seed, index) => {
    const author = userDocs.find((u) => u.handle === seed.author);
    if (!author) return;
    const createdAt = new Date(created.getTime() - seed.createdOffsetDays * 86_400_000);
    postDocs.push({
      _id: randomId("pst"),
      slug: slugify(seed.title),
      authorId: author._id,
      title: seed.title,
      excerpt: stripMarkdown(seed.content).slice(0, 180),
      content: seed.content,
      tags: seed.tags,
      coverImage: seed.cover,
      status: "published",
      views: 42 + index * 37,
      createdAt,
      updatedAt: createdAt,
    });
  });
  await posts.insertMany(postDocs);

  const commentDocs: CommentDoc[] = [];
  const addedByIndex: CommentDoc[] = [];
  seedComments.forEach((seed, index) => {
    const post = postDocs[seed.post];
    const author = userDocs.find((u) => u.handle === seed.author);
    if (!post || !author) return;
    const createdAt = new Date(created.getTime() - seed.offsetHours * 3_600_000);
    const parent = seed.parent !== undefined ? addedByIndex[seed.parent] : undefined;
    const doc: CommentDoc = {
      _id: randomId("cmt"),
      postId: post._id,
      authorId: author._id,
      parentId: parent ? parent._id : null,
      body: seed.body,
      createdAt,
      updatedAt: createdAt,
    };
    addedByIndex[index] = doc;
    commentDocs.push(doc);
  });
  if (commentDocs.length) await comments.insertMany(commentDocs);

  const likeDocs = new Map<string, LikeDoc>();
  postDocs.forEach((post, index) => {
    const readers = userDocs.filter((_, i) => (index + i) % 2 === 0);
    readers.forEach((reader) => {
      const id = `${post._id}:${reader._id}`;
      likeDocs.set(id, { _id: id, postId: post._id, userId: reader._id, createdAt: post.createdAt });
    });
    if (index % 2 === 0) {
      const other = userDocs.find((u) => u._id !== post.authorId);
      if (other) {
        const id = `${post._id}:${other._id}`;
        likeDocs.set(id, { _id: id, postId: post._id, userId: other._id, createdAt: post.createdAt });
      }
    }
  });
  if (likeDocs.size) await likes.insertMany(Array.from(likeDocs.values()));
}

export const DEMO_ACCOUNTS = seedUsers.map((u) => ({ email: u.email, handle: u.handle, name: u.name, password: SEED_PASSWORD }));


export async function createVerificationRequest(userId: string, reason: string) {
  const user = await usersCol().then((c) => c.findOne({ _id: userId }));
  if (!user) throw new Error("User not found");
  const col = await verificationCol();
  const existing = await col.findOne({ userId, status: "pending" });
  if (existing) throw new Error("You already have a pending request.");
  const request: VerificationRequestDoc = { _id: randomId(), userId, email: user.email, reason, status: "pending", createdAt: new Date() };
  await col.insertOne(request);
  return request;
}

export async function listVerificationRequests() {
  const requests = await (await verificationCol()).find({}).sort({ createdAt: -1 }).toArray();
  const users = await usersCol();
  return Promise.all(requests.map(async (request) => ({ ...request, user: await users.findOne({ _id: request.userId }, { projection: { passwordHash: 0, salt: 0 } }) })));
}

export async function reviewVerificationRequest(requestId: string, status: "approved" | "rejected") {
  const requests = await verificationCol();
  const request = await requests.findOne({ _id: requestId });
  if (!request) throw new Error("Request not found");
  await requests.updateOne({ _id: requestId }, { $set: { status, reviewedAt: new Date() } });
  await (await usersCol()).updateOne({ _id: request.userId }, { $set: { verified: status === "approved" } });
  return { ...request, status };
}
