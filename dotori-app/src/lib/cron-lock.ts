/**
 * Distributed cron lock using MongoDB (SystemConfig collection).
 * Prevents concurrent execution of the same cron job across multiple instances.
 *
 * Uses atomic findOneAndUpdate + ownerToken for safe lock acquisition.
 *
 * Usage:
 *   const ownerToken = await acquireCronLock("to-monitor", 300_000);
 *   if (!ownerToken) return NextResponse.json({ error: "Already running" }, { status: 409 });
 *   try { ... } finally { await releaseCronLock("to-monitor", ownerToken); }
 */
import SystemConfig from "@/models/SystemConfig";

const LOCK_PREFIX = "cron_lock:";

/**
 * Attempt to acquire a distributed lock atomically.
 * Returns an ownerToken string if lock was acquired, null if another instance holds it.
 *
 * @param jobName - Unique job identifier (e.g. "to-monitor")
 * @param ttlMs - Lock auto-expires after this duration (ms), default 5 minutes
 */
export async function acquireCronLock(
	jobName: string,
	ttlMs = 300_000,
): Promise<string | null> {
	const key = `${LOCK_PREFIX}${jobName}`;
	const now = new Date();
	const expiresAt = new Date(now.getTime() + ttlMs);
	const ownerToken = crypto.randomUUID();

	try {
		const result = await SystemConfig.findOneAndUpdate(
			{
				key,
				$or: [
					{ value: { $exists: false } },
					{ expiresAt: { $lte: now } },
				],
			},
			{
				$set: {
					value: ownerToken,
					expiresAt,
					description: `Cron lock: ${jobName}`,
				},
			},
			{ upsert: true, new: true },
		);

		return result?.value === ownerToken ? ownerToken : null;
	} catch {
		// Unique constraint race — another instance just acquired it
		return null;
	}
}

/**
 * Release a distributed lock. Only the owner (matching ownerToken) can release it.
 */
export async function releaseCronLock(
	jobName: string,
	ownerToken: string,
): Promise<void> {
	const key = `${LOCK_PREFIX}${jobName}`;
	await SystemConfig.deleteOne({ key, value: ownerToken });
}
