import redis from "redis";

let isConnected = false;
let client: any = null;
let retryInterval: NodeJS.Timeout | null = null;

// Tạo client
const createClient = redis.createClient({
  url:
    process.env.NODE_ENV === "development"
      ? process.env.REDIS_URL_DEV
      : process.env.REDIS_URL_PROD,
  socket: {
    // Khi đang chạy mà đứt kết nối -> đợi 60s rồi tự động kết nối lại
    reconnectStrategy: () => {
      console.log("[Redis] Kết nối bị ngắt, sẽ thử kết nối lại sau 60s...");
      return 60000;
    },
    connectTimeout: 10000,
    keepAlive: true,
  },
});

// Sự kiện báo lỗi
createClient.on("error", (error) => {
  console.error("[Redis Error]:", error.message || error);
  isConnected = false;
});

// Sự kiện đang kết nối lại (tự động kích hoạt bởi reconnectStrategy sau 60s)
createClient.on("reconnecting", () => {
  console.log("[Redis] Đang thử kết nối lại (sau 60s)...");
});

// Khi kết nối thành công và sẵn sàng nhận lệnh
createClient.on("ready", () => {
  isConnected = true;
  client = createClient;
  console.log("[Redis] Kết nối thành công và đã sẵn sàng!");

  // Nếu trước đó đang có vòng lặp thử lại 60s thì hủy bỏ
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
  }
});

createClient.on("end", () => {
  console.log("[Redis] Kết nối đã đóng.");
  isConnected = false;
});

// Hàm khởi tạo kết nối
const init = async () => {
  if (isConnected && client) {
    return client;
  }

  const attemptConnect = async () => {
    try {
      console.log("[Redis] Đang thử kết nối đến Redis...");
      await createClient.connect();
    } catch (error: any) {
      isConnected = false;
      console.error(
        "[Redis] Kết nối thất bại. App vẫn chạy, sẽ thử lại sau 60s...",
      );

      // Nếu chưa có vòng lặp thử lại thì lên lịch cứ 60s thử kết nối 1 lần
      if (!retryInterval) {
        retryInterval = setInterval(async () => {
          if (!isConnected) {
            console.log("[Redis] [60s Timer] Đang thử kết nối lại...");
            attemptConnect();
          }
        }, 60000);
      }
    }
  };

  await attemptConnect();
  return client;
};

const getRedis = () => client;

const getRedisStatus = () => isConnected;

const closeRedis = async () => {
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
  }
  if (client) {
    await client.quit();
    client = null;
    isConnected = false;
    console.log("[Redis] Đã ngắt kết nối hoàn toàn.");
  }
};

export default { init, getRedis, getRedisStatus, closeRedis };
