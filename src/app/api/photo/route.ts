const BLOB_HOSTNAME = "rwjv07fuxbtccnji.private.blob.vercel-storage.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response(null, { status: 404 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (parsed.hostname !== BLOB_HOSTNAME) {
    return new Response(null, { status: 403 });
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });

  if (!res.ok) return new Response(null, { status: res.status });

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
