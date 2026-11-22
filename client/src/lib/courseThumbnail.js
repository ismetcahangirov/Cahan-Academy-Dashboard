// The Course model's default thumbnail points at a placeholder service (grey "300x200" boxes, often
// offline). Treat those — and empty values — as "no image" so the UI can show its own sketch instead.
const PLACEHOLDER_HOSTS = /(^|\.)(via\.placeholder\.com|placeholder\.com|placehold\.co|placehold\.it|dummyimage\.com|fakeimg\.pl)$/i;

export function courseThumbnail(course) {
  const src = course?.thumbnail?.trim();
  if (!src) return null;
  try {
    const { hostname } = new URL(src, 'http://localhost');
    if (PLACEHOLDER_HOSTS.test(hostname)) return null;
  } catch {
    return null;
  }
  return src;
}

export default courseThumbnail;
