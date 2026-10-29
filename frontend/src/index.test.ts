import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Subprocess } from "bun";

const PORT = 3399;
const BASE = `http://127.0.0.1:${PORT}`;
let server: Subprocess;

beforeAll(async () => {
    server = Bun.spawn(["bun", "src/index.ts"], {
        cwd: `${import.meta.dir}/..`,
        env: { ...process.env, PORT: String(PORT) },
        stdout: "pipe",
        stderr: "ignore",
    });
    const decoder = new TextDecoder();
    let log = "";
    for await (const chunk of server.stdout as ReadableStream<Uint8Array>) {
        log += decoder.decode(chunk);
        if (log.includes("Frontend is running")) return;
    }
    throw new Error(`server exited before listening:\n${log}`);
});

afterAll(() => server.kill());

test("homepage links to the 1deg build", async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const body = await res.text();
    expect(body).toContain('id="planet-link"');
    expect(body).toContain('href="planet.html"');
});

test("planet.html serves the packed wasm build", async () => {
    const res = await fetch(`${BASE}/planet.html`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const body = await res.text();
    expect(body).toContain('id="bin-wasm-app"');
});
