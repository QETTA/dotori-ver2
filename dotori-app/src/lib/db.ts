import mongoose from "mongoose";
import { log } from "@/lib/logger";

const getMongoUri = () => {
	if (!process.env.MONGODB_URI) {
		throw new Error("MONGODB_URI is not configured");
	}
	return process.env.MONGODB_URI;
};

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
		const conn = await mongoose.connect(getMongoUri(), {
			dbName: process.env.MONGODB_DB_NAME ?? "dotori",
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

	// Register all models to ensure they're available for populate/ref
	await Promise.all([
		import("@/models/User"),
		import("@/models/Facility"),
		import("@/models/ChatHistory"),
		import("@/models/Post"),
		import("@/models/Comment"),
		import("@/models/Alert"),
		import("@/models/Subscription"),
		import("@/models/Waitlist"),
		import("@/models/UsageLog"),
		import("@/models/ActionIntent"),
		import("@/models/ActionExecution"),
		import("@/models/AlimtalkLog"),
		import("@/models/FacilitySnapshot"),
		import("@/models/SystemConfig"),
		import("@/models/Review"),
		import("@/models/PopulationData"),
		import("@/models/TOPrediction"),
		import("@/models/CPAEvent"),
		import("@/models/ESignatureDocument"),
		import("@/models/AuditLog"),
		import("@/models/Visit"),
		import("@/models/Partner"),
		import("@/models/ApiUsageLog"),
		import("@/models/BillingSubscription"),
		import("@/models/Invoice"),
		import("@/models/Campaign"),
		import("@/models/CampaignEvent"),
	]);

	return cached.conn;
}
