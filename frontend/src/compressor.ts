// public/ is the small app shell, so compress it once and keep it in memory.
// map data in the docker volume is too large to keep resident.
const memo = new Map<string, { compressed: Uint8Array; contentType: string; etag: string }>();

// function to compress all the static files that need to be served
async function compressor(filePath: string) {
    try {
        let entry = memo.get(filePath);
        if (!entry) {
            // read file
            const file = Bun.file(filePath);
            // get "Content-Type"
            const contentType = new Response(file).headers.get("Content-Type") ?? "application/octet-stream";
            // convert file to single unsigned int byte array and compress
            const compressed = Bun.gzipSync(new Uint8Array(await file.arrayBuffer()));
            const etag = `"${Buffer.from(compressed).toString('base64').substring(0, 27)}"`;
            entry = { compressed, contentType, etag };
            if (filePath.startsWith("./public/")) memo.set(filePath, entry);
        }
        // create response content with header
        return new Response(entry.compressed, {
            headers: {
                "Content-Type": entry.contentType,
                "Content-Encoding": "gzip",
                "Cache-Control": "public, max-age=31536000, immutable",
                "CDN-Cache-Control": "max-age=31536000",
                "Vary": "Accept-Encoding",
                "ETag": entry.etag,
            },
        });
    } catch (error) {
        console.error(`Error compressing ${filePath}:`, error);
        return new Response(`Internal Server Error, ${{ status: 500 }}`);
    }
}

export default compressor;
