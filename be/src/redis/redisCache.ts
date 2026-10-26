import redisConfig from "../config/redis.config";

// Thời gian mặc định là 5 phút
const DEFAULT_TTL_SECONDS = 60 * 5;

/**
 * Lấy data từ cache. Nếu không có → gọi fetchFn() rồi lưu vào cache.
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function lấy data từ DB
 * @param {number} ttl - Thời gian sống (giây)
 */
const getOrSet = async (key, fetchFn, ttl = DEFAULT_TTL_SECONDS) => {
  const client = redisConfig.getRedis();

  // Redis offline → bypass cache, lấy thẳng từ DB
  if (!client) {
    return await fetchFn(); // Bug fix: thiếu return
  }

  try {
    // Tìm trong cache
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Không có trong cache → lấy từ DB
  } catch (err) {
    // Redis lỗi giữa chừng → fallback về DB, không crash app

    return await fetchFn(); // Bug fix: thiếu message trong console.error gốc
  }

  //Laays dữ liệu từ database
  const freshData = await fetchFn();

  try {
    await client.setEx(key, ttl, JSON.stringify(freshData));
    return freshData;
  } catch (error) {}
  return freshData;
};

/**
 * Xóa 1 cache key
 */
const del = async (key) => {
  const client = redisConfig.getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch (err) {
    // Bug fix: gốc dùng `throw err` nhưng biến tên là `error` → ReferenceError
  }
};

/**
 * Xóa nhiều key theo pattern (vd: "books:list:*")
 * Dùng sau khi tạo/sửa/xóa sách để invalidate cache danh sách
 */
const delPattern = async (pattern) => {
  const client = redisConfig.getRedis();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (err) {}
};

/**
 * Set giá trị trực tiếp (không qua fetchFn)
 * Dùng cho: token blacklist, rate limit counter, v.v.
 */
const set = async (key, value, ttl) => {
  const client = redisConfig.getRedis();
  if (!client) return;

  try {
    if (ttl) {
      await client.setEx(key, ttl, String(value));
    } else {
      await client.set(key, String(value));
    }
  } catch (err) {}
};

/**
 * Lấy giá trị trực tiếp
 */
const get = async (key) => {
  const client = redisConfig.getRedis();
  if (!client) return null;

  try {
    return await client.get(key);
  } catch (err) {
    return null;
  }
};

const increaseLoginAttempts = async (key, LOCK_OUT_TIME) => {
  const client = redisConfig.getRedis();
  if (!client) {
    return;
  }

  try {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, LOCK_OUT_TIME);
    }
  } catch (error) {}
};

export default { getOrSet, del, delPattern, set, get, increaseLoginAttempts };
export { getOrSet, del, delPattern, set, get, increaseLoginAttempts };
