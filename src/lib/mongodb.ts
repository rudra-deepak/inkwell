import { MongoClient, type Db } from "mongodb";

/* ------------------------------------------------------------------ *
 * MongoDB connection singleton.
 *
 * `MongoClient` pools its own connections internally, so the important
 * thing is to create it exactly once per process. In dev, Next.js hot
 * reloads this module on every edit, so the client is cached on
 * `globalThis` to survive that; in production the module is simply
 * evaluated once.
 * ------------------------------------------------------------------ */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "inkwell";

declare global {
  var __inkwellMongoClientPromise: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and point it at a MongoDB instance.",
    );
  }
  const client = new MongoClient(uri);
  return client.connect();
}

const clientPromise = globalThis.__inkwellMongoClientPromise ?? connect();
if (process.env.NODE_ENV !== "production") {
  globalThis.__inkwellMongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}
