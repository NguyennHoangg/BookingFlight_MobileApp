import "dotenv/config";
import { createClient } from "redis";

const connection = createClient({
  url: process.env.REDIS_URL || (process.env.NODE_ENV === "production"
    ? process.env.REDIS_URL_PROD
    : process.env.REDIS_URL_DEV) || "redis://127.0.0.1:6379",
  disableOfflineQueue: true,
  commandsQueueMaxLength: 1000,
  commandOptions: { timeout: 500 },
  socket: {
    connectTimeout: 2000,
    reconnectStrategy: retries => Math.min(1000 * 2 ** Math.min(retries, 5), 30_000),
  },
});

// Never log connection URLs or credentials. Reconnect in the background.
connection.on("error", () => {});
connection.on("ready", () => console.log("[Redis] Ready"));
let connecting: Promise<void> | undefined;

async function init() {
  if (connection.isReady) return connection;
  if (!connection.isOpen && !connecting) {
    connecting = connection.connect().then(() => undefined).finally(() => { connecting = undefined; });
  }
  await connecting;
  return connection.isReady ? connection : null;
}

const getRedis = () => connection.isReady ? connection : null;
const getRedisStatus = () => connection.isReady;
async function closeRedis() {
  if (connection.isOpen) connection.destroy();
  await connecting?.catch(() => {});
}

export default { init, getRedis, getRedisStatus, closeRedis };
