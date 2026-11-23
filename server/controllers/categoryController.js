import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * Course categories live in the landing site's database (one list for both sites). The LMS reads them from the
 * landing API's public endpoint and manages them through its admin endpoints with a server-to-server token
 * (LANDING_CATEGORY_TOKEN = the landing API's CATEGORY_SERVICE_TOKEN); the token never reaches the browser.
 */
const DEFAULT_LANDING_API = 'https://cahan-academy-api.vercel.app/api';
const CACHE_MS = 60_000;

const landingApi = () => (process.env.LANDING_API_URL || DEFAULT_LANDING_API).replace(/\/+$/, '');

let cache = { at: 0, data: null };
export const resetCategoryCache = () => {
  cache = { at: 0, data: null };
};

const callLanding = async (path, { method = 'GET', body, service = false } = {}) => {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (service) headers['X-Service-Token'] = process.env.LANDING_CATEGORY_TOKEN;
  const res = await fetch(`${landingApi()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};

const pick = ({ nameAz, nameEn, nameRu, slug }) => ({ nameAz, nameEn, nameRu, slug });

/**
 * @route   GET /api/categories
 * @access  Private (every role: course forms and filters)
 */
export const getCategories = async (req, res) => {
  if (cache.data && Date.now() - cache.at < CACHE_MS) {
    return sendSuccess(res, 'Categories fetched successfully', cache.data);
  }
  try {
    const { status, json } = await callLanding('/categories');
    if (status !== 200 || !Array.isArray(json.data)) {
      return sendError(res, 'Kateqoriyaları yükləmək olmadı', 502);
    }
    const data = json.data
      .map((c) => ({ id: c.id, ...pick(c) }))
      .sort((a, b) => a.nameAz.localeCompare(b.nameAz, 'az'));
    cache = { at: Date.now(), data };
    return sendSuccess(res, 'Categories fetched successfully', data);
  } catch {
    return sendError(res, 'Kateqoriyaları yükləmək olmadı', 502);
  }
};

const write = (method, pathFor, okStatus) => async (req, res) => {
  if (!process.env.LANDING_CATEGORY_TOKEN) {
    return sendError(res, 'Kateqoriya idarəsi qoşulmayıb (LANDING_CATEGORY_TOKEN yoxdur)', 503);
  }
  try {
    const { status, json } = await callLanding(pathFor(req), {
      method,
      body: method === 'DELETE' ? undefined : pick(req.body || {}),
      service: true,
    });
    if (status >= 200 && status < 300) {
      resetCategoryCache();
      return sendSuccess(res, json.message || 'OK', json.data ?? null, okStatus);
    }
    const passOn = [400, 404, 409, 422].includes(status) ? status : 502;
    return sendError(res, json.message || 'Kateqoriya əməliyyatı alınmadı', passOn, json.errors ?? null);
  } catch {
    return sendError(res, 'Kateqoriya əməliyyatı alınmadı', 502);
  }
};

/** @route POST /api/categories  @access Admin */
export const createCategory = write('POST', () => '/categories/admin', 201);
/** @route PUT /api/categories/:id  @access Admin */
export const updateCategory = write('PUT', (req) => `/categories/admin/${encodeURIComponent(req.params.id)}`, 200);
/** @route DELETE /api/categories/:id  @access Admin */
export const deleteCategory = write('DELETE', (req) => `/categories/admin/${encodeURIComponent(req.params.id)}`, 200);
