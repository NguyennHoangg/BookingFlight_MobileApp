/**
 * Tiện ích hỗ trợ nhận diện và tải ảnh SVG / ảnh từ xa (Remote Image)
 * Giải quyết lỗi HTTP 403 Forbidden từ các máy chủ như Wikimedia / Wikipedia
 */

export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

export const DEFAULT_IMAGE_HEADERS = {
  'User-Agent': BROWSER_USER_AGENT,
  Accept: 'image/svg+xml,image/*,*/*',
};

// Bộ nhớ đệm tạm thời cho XML để tránh fetch lặp lại khi render danh sách
const svgMemoryCache = new Map<string, string>();

/**
 * Kiểm tra xem một URL có phải là định dạng file SVG hay không
 */
export const isSvgUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return /\.svg($|\?)/i.test(url);
};

/**
 * Tải nội dung XML của file SVG qua fetch với User-Agent chuẩn trình duyệt
 * Tránh lỗi 403 Forbidden từ các máy chủ như Wikimedia / Wikipedia
 */
export const fetchSvgXml = async (url: string): Promise<string> => {
  if (!url) throw new Error('URL SVG không hợp lệ');

  // Kiểm tra cache trong bộ nhớ trước
  if (svgMemoryCache.has(url)) {
    return svgMemoryCache.get(url)!;
  }

  const response = await fetch(url, {
    headers: DEFAULT_IMAGE_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Tải SVG thất bại với mã lỗi HTTP ${response.status}`);
  }

  const xmlText = await response.text();
  svgMemoryCache.set(url, xmlText);
  return xmlText;
};

/**
 * Xóa bộ nhớ đệm cache SVG nếu cần
 */
export const clearSvgCache = (): void => {
  svgMemoryCache.clear();
};
