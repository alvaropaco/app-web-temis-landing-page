import { writeFile } from "node:fs/promises";

const manifestUrl = "https://temis-chat-releases.temischat.com/temischat/latest/latest.json";
const outputUrl = new URL("./assets/release-latest.json", import.meta.url);
const response = await fetch(manifestUrl);
if (!response.ok) throw new Error(`Release CDN returned ${response.status}`);

const payload = await response.json();
const { version, pub_date: pubDate } = payload;
const notes = typeof payload.notes === "string" ? payload.notes : "";
if (!version || !pubDate) throw new Error("Release manifest is missing version or pub_date");

// Several builds share the public version (0.2.10) until a milestone bumps it,
// so the commit suffix in the notes is what tells two releases apart. The
// landing labels the download with it and appends it to the versionless URLs
// so a cached copy from a previous release cannot answer the request.
const buildMatch = notes.match(/\bBuild\s+([0-9a-f]{7,40})\b/i);
const build =
  typeof payload.build === "string" && /^[0-9a-f]{7,40}$/i.test(payload.build)
    ? payload.build
    : buildMatch?.[1] || "";

const fallback = {
  version,
  pub_date: pubDate,
  notes,
  ...(build ? { build } : {})
};
await writeFile(outputUrl, `${JSON.stringify(fallback, null, 2)}\n`, "utf8");
console.log(`Release metadata synchronized: ${version}${build ? ` (build ${build})` : ""} — ${pubDate}`);
