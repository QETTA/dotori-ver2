/**
 * Progress logger for sync scripts.
 * Prints inline progress bars and summary stats.
 */

export class Progress {
  private label: string;
  private total: number;
  private current = 0;
  private startTime: number;
  private lastPrint = 0;

  constructor(label: string, total: number) {
    this.label = label;
    this.total = total;
    this.startTime = Date.now();
  }

  tick(count = 1) {
    this.current += count;
    const now = Date.now();
    if (now - this.lastPrint < 200 && this.current < this.total) return;
    this.lastPrint = now;
    this.print();
  }

  private print() {
    const pct = this.total > 0 ? Math.round((this.current / this.total) * 100) : 0;
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const barLen = 30;
    const filled = Math.round((pct / 100) * barLen);
    const bar = "\u2588".repeat(filled) + "\u2591".repeat(barLen - filled);
    process.stdout.write(
      `\r  ${this.label} [${bar}] ${pct}% (${this.current}/${this.total}) ${elapsed}s`,
    );
    if (this.current >= this.total) process.stdout.write("\n");
  }

  done() {
    this.current = this.total;
    this.print();
  }
}

export function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

export function logError(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.error(`[${ts}] ERROR: ${msg}`);
}

export function logWarn(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.warn(`[${ts}] WARN: ${msg}`);
}
