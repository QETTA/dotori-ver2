import mongoose from "mongoose";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";

const MONGODB_URI = env.MONGODB_URI;

declare global {
	var mongooseCache: {
		conn: typeof mongoose | null;
		promise: Promise<typeof mongoose> | null;
	};
}

const cached = global.mongooseCache ?? { conn: null, promise: null };
if (!global.mongooseCache) {
	global.mongooseCache = cached;
}

/** Max connection retries before giving up */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function connectWithRetry(attempt = 1): Promise<typeof mongoose> {
	try {
		const conn = await mongoose.connect(MONGODB_URI, {
			dbName: "dotori",
			bufferCommands: false,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});
		return conn;
	} catch (err) {
		if (attempt < MAX_RETRIES) {
			const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
			log.warn("DB connection attempt failed, retrying", {
				attempt,
				retryInMs: delay,
			});
			await new Promise((r) => setTimeout(r, delay));
			return connectWithRetry(attempt + 1);
		}
		throw err;
	}
}

// Connection event listeners (register once)
let listenersRegistered = false;
function registerListeners() {
	if (listenersRegistered) return;
	listenersRegistered = true;

	mongoose.connection.on("connected", () => {
		log.info("MongoDB connected");
	});

	mongoose.connection.on("disconnected", () => {
		log.warn("MongoDB disconnected — cache reset");
		cached.conn = null;
		cached.promise = null;
	});

	mongoose.connection.on("error", (err: Error) => {
		log.error("MongoDB error", { error: err.message });
		cached.conn = null;
		cached.promise = null;
	});
}

export default async function dbConnect(): Promise<typeof mongoose> {
	registerListeners();

	if (cached.conn) return cached.conn;

	if (!cached.promise) {
		cached.promise = connectWithRetry().catch((err) => {
			// Reset cache on final failure so next call can retry
			cached.promise = null;
			throw err;
		});
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
