import type { FastifyInstance } from 'fastify';

/**
 * Fastify route plugin for the server-side logo proxy with durable SQLite cache.
 */

interface LogoCacheRow {
  data: Buffer;
  content_type: string;
}

/**
 * Normalises a provider name to a consistent cache key.
 *
 * @param name - Raw provider name from the query string
 * @returns Trimmed, lowercased name used as the logo_cache primary key
 */
function cacheKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Builds the logo.dev image URL for a given provider name.
 *
 * @param name - URL-encoded provider name
 * @param token - logo.dev API token from the LOGO_DEV_TOKEN env var
 * @returns The full logo.dev image URL
 */
function logoDevUrl(name: string, token: string): string {
  return `https://img.logo.dev/name/${encodeURIComponent(name)}?token=${token}`;
}

/**
 * Registers the public GET /api/logos route on the Fastify instance.
 *
 * The route checks the logo_cache table first; on a miss it fetches from logo.dev
 * using the server-side LOGO_DEV_TOKEN, stores successful responses in the cache,
 * and returns the binary image. Non-2xx responses from logo.dev are forwarded as 502
 * and are never cached.
 *
 * @param fastify - The Fastify instance to register routes on
 */
export async function logosRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/logos', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const rawName = query['name'] ?? '';
    const key = cacheKey(rawName);

    if (!key) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'name is required',
      });
    }

    const cached = fastify.db
      .prepare<[string], LogoCacheRow>(`SELECT data, content_type FROM logo_cache WHERE name = ?`)
      .get(key);

    if (cached) {
      return reply
        .header('Content-Type', cached.content_type)
        .header('Cache-Control', 'public, max-age=86400')
        .send(cached.data);
    }

    const token = process.env['LOGO_DEV_TOKEN'] ?? '';
    let response: Response;

    try {
      response = await fetch(logoDevUrl(rawName, token));
    } catch {
      return reply.status(502).send({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Failed to fetch logo',
      });
    }

    if (!response.ok) {
      return reply.status(502).send({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Failed to fetch logo',
      });
    }

    const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
    const data = Buffer.from(await response.arrayBuffer());

    fastify.db
      .prepare(
        `INSERT OR REPLACE INTO logo_cache (name, data, content_type, cached_at) VALUES (?, ?, ?, ?)`,
      )
      .run(key, data, contentType, Date.now());

    return reply
      .header('Content-Type', contentType)
      .header('Cache-Control', 'public, max-age=86400')
      .send(data);
  });
}
