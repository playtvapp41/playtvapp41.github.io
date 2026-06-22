var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_stream = require("stream");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD");
    res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type, Authorization, Accept, Origin");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges, Content-Type");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(import_express.default.json({ limit: "50mb" }));
  function parseM3UContent(text) {
    const lines = text.split(/\r?\n/);
    const items = [];
    let currentItem = {};
    let idCounter = 1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith("#EXTINF:")) {
        currentItem = {};
        const commaIdx = line.lastIndexOf(",");
        let channelName = "Bilinmeyen Kanal";
        if (commaIdx !== -1) {
          channelName = line.substring(commaIdx + 1).trim();
        }
        const logoMatch = line.match(/tvg-logo="([^"]+)"/) || line.match(/logo="([^"]+)"/);
        const logo = logoMatch ? logoMatch[1] : "";
        const groupMatch = line.match(/group-title="([^"]+)"/) || line.match(/category="([^"]+)"/);
        const group = groupMatch ? groupMatch[1] : "Genel";
        currentItem.name = channelName;
        currentItem.logo = logo;
        currentItem.group = group;
        currentItem.id = `ch-${idCounter++}`;
      } else if (line.startsWith("#EXTGRP:")) {
        const groupValue = line.replace("#EXTGRP:", "").trim();
        if (currentItem && groupValue) {
          currentItem.group = groupValue;
        }
        continue;
      } else if (line.startsWith("#")) {
        continue;
      } else {
        if (line.match(/^https?:\/\//i) || line.includes("://") || line.includes("/")) {
          if (!currentItem.name) {
            let fallbackName = `Kanal ${idCounter}`;
            try {
              const u = new URL(line);
              const pathname = u.pathname;
              const lastPart = pathname.substring(pathname.lastIndexOf("/") + 1);
              if (lastPart) {
                fallbackName = decodeURIComponent(lastPart.replace(/\.[^/.]+$/, "")).trim();
              }
            } catch (e) {
            }
            currentItem.name = fallbackName || `Yay\u0131n ${idCounter}`;
            currentItem.logo = "";
            currentItem.group = "Genel";
            currentItem.id = `ch-${idCounter++}`;
          }
          currentItem.url = line;
          const isSonEklenenler = currentItem.group && currentItem.group.toLowerCase().trim() === "son eklenenler";
          if (!isSonEklenenler) {
            items.push(currentItem);
          }
          currentItem = {};
        }
      }
    }
    return items;
  }
  app.get("/api/parse-m3u", async (req, res) => {
    try {
      const playlistUrl = req.query.url;
      if (!playlistUrl) {
        return res.status(400).json({ error: "Playlist URL is required" });
      }
      if (playlistUrl.startsWith("content://") || playlistUrl.startsWith("file://")) {
        return res.status(400).json({
          success: false,
          error: "Android 'content://' veya yerel 'file://' adresleri uzaktan \xE7ekilemez. L\xFCtfen dosyay\u0131 do\u011Frudan y\xFCkleyin."
        });
      }
      const getFallbackUrls = (urlStr) => {
        const urls = [];
        try {
          const u = new URL(urlStr);
          urls.push(u.toString());
          if (u.hostname === "cdn.jsdelivr.net" && u.pathname.startsWith("/gh/")) {
            const parts = u.pathname.substring(4).split("/");
            if (parts.length >= 2) {
              const user = parts[0];
              const repoWithVersion = parts[1];
              const [repo, branch = "main"] = repoWithVersion.split("@");
              const filePath = parts.slice(2).join("/");
              if (user && repo) {
                const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filePath}`;
                urls.push(new URL(rawUrl).toString());
              }
            }
          } else if (u.hostname === "raw.githubusercontent.com") {
            const parts = u.pathname.substring(1).split("/");
            if (parts.length >= 3) {
              const user = parts[0];
              const repo = parts[1];
              const branch = parts[2];
              const filePath = parts.slice(3).join("/");
              if (user && repo && branch) {
                const jsdelivrUrl = `https://cdn.jsdelivr.net/${user}/${repo}@${branch}/${filePath}`;
                urls.push(new URL(jsdelivrUrl).toString());
              }
            }
          }
        } catch (e) {
          console.error("URL parsing/fallback generation error:", e);
          urls.push(urlStr);
        }
        return Array.from(new Set(urls));
      };
      const targetUrls = getFallbackUrls(playlistUrl);
      console.log(`Processing fetch for IPTV playlist with targets:`, targetUrls);
      let response = null;
      let lastError = null;
      for (const tUrl of targetUrls) {
        try {
          console.log(`[M3U Parser] Fetching from: ${tUrl}`);
          const res2 = await fetch(tUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
          if (res2.ok) {
            response = res2;
            console.log(`[M3U Parser] Successfully fetched from: ${tUrl}`);
            break;
          } else {
            console.log(`[M3U Parser] Fetch notice: Status ${res2.status} for URL: ${tUrl}`);
            lastError = new Error(`Failed to fetch playlist (Status: ${res2.status})`);
          }
        } catch (err) {
          console.log(`[M3U Parser] Fetch deviation for URL ${tUrl}, moving to next candidate:`, err.message || err);
          lastError = err;
        }
      }
      let text = "";
      let isFallback = false;
      let errorNote = "";
      if (!response) {
        console.log("[M3U Parser] Selected target list is offline or unreachable. Serving pre-compiled channel playlist roster.");
        isFallback = true;
        errorNote = lastError ? lastError.message : "M3U listesi sunucusuna eri\u015Filemedi (CORS veya SSL engeli olabilir).";
        text = `#EXTM3U
#EXTINF:-1 tvg-id="trt1" tvg-name="TRT 1 HD" tvg-logo="https://img-s1.onedio.com/id-631f47895f51084b1dbcc0a5/o-400x400/s-0bde231bf33d999fa5b5ef07ba14b6fc70c9ba9f.jpg" group-title="Ulusal Kanallar",TRT 1 HD
https://tv-trt1.medya.trt.net.tr/trt1/master.m3u8
#EXTINF:-1 tvg-id="trthaber" tvg-name="TRT Haber" tvg-logo="https://img-s1.onedio.com/id-631f47895f51084b1dbcc0a5/o-400x400/s-0bde231bf33d999fa5b5ef07ba14b6fc70c9ba9f.jpg" group-title="Haberler",TRT Haber HD
https://tv-trthaber.medya.trt.net.tr/trthaber/master.m3u8
#EXTINF:-1 tvg-id="trtbelgesel" tvg-name="TRT Belgesel" tvg-logo="https://img-s1.onedio.com/id-631f47895f51084b1dbcc0a5/o-400x400/s-0bde231bf33d999fa5b5ef07ba14b6fc70c9ba9f.jpg" group-title="Belgesel",TRT Belgesel HD
https://tv-trtbelgesel.medya.trt.net.tr/trtbelgesel/master.m3u8
#EXTINF:-1 tvg-id="trtspor" tvg-name="TRT Spor" tvg-logo="https://img-s1.onedio.com/id-631f47895f51084b1dbcc0a5/o-400x400/s-0bde231bf33d999fa5b5ef07ba14b6fc70c9ba9f.jpg" group-title="Spor",TRT Spor HD
https://tv-trtspor.medya.trt.net.tr/trtspor/master.m3u8
#EXTINF:-1 tvg-id="sintel_hls" tvg-name="Sintel (HLS Sinema - Akamai)" tvg-logo="https://images.unsplash.com/photo-1542204172-e7052809a850?w=200" group-title="\xD6rnek Yay\u0131nlar",Sintel HLS 4K Yay\u0131n
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
#EXTINF:-1 tvg-id="bunny_hls" tvg-name="Big Buck Bunny (HLS Komedi - Mux)" tvg-logo="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200" group-title="\xD6rnek Yay\u0131nlar",Big Buck Bunny HLS Test
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="jellyfish" tvg-name="Jellyfish HLS (Akamai Test)" tvg-logo="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200" group-title="\xD6rnek Yay\u0131nlar",Jellyfish Akamai Test Yay\u0131n\u0131
https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8
#EXTINF:-1 tvg-id="sintel" tvg-name="Sintel (Full HD Film)" tvg-logo="https://images.unsplash.com/photo-1542204172-e7052809a850?w=200" group-title="Sinema / Pop\xFCler",Sintel (Bilim Kurgu / Animasyon)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4
#EXTINF:-1 tvg-id="tears" tvg-name="Tears of Steel (VFX Film)" tvg-logo="https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=200" group-title="Sinema / Pop\xFCler",Tears of Steel (Aksiyon / Bilim Kurgu)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4
#EXTINF:-1 tvg-id="bigbuck" tvg-name="Big Buck Bunny (Komedi)" tvg-logo="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200" group-title="Sinema / Pop\xFCler",Big Buck Bunny (Komedi / Klasik)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
#EXTINF:-1 tvg-id="elephant" tvg-name="Elephant's Dream (Gizem)" tvg-logo="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200" group-title="Sinema / Pop\xFCler",Elephant's Dream (Gizem / Dram)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
#EXTINF:-1 tvg-id="nasatv" tvg-name="NASA TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" group-title="Bilim & Uzay",NASA TV Canl\u0131 Yay\u0131n
https://ntv-hls.nasa.gov/hls/nasa_tv.m3u8`;
      } else {
        text = await response.text();
      }
      const items = parseM3UContent(text);
      console.log(`Successfully parsed ${items.length} items. Fallback state: ${isFallback}`);
      res.json({
        success: true,
        total: items.length,
        items,
        isFallback,
        errorNote
      });
    } catch (error) {
      console.error("Error parsing M3U:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch and parse the playlist"
      });
    }
  });
  app.post("/api/parse-m3u-text", (req, res) => {
    try {
      const { text } = req.body;
      if (typeof text !== "string") {
        return res.status(400).json({ success: false, error: "Missing or invalid M3U content text." });
      }
      const items = parseM3UContent(text);
      res.json({
        success: true,
        total: items.length,
        items,
        isFallback: false,
        errorNote: ""
      });
    } catch (error) {
      console.error("Error parsing raw POST M3U:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to parse the provided M3U content text."
      });
    }
  });
  app.get("/api/proxy-stream", async (req, res) => {
    let timeoutId = null;
    try {
      const streamUrl = req.query.url;
      if (!streamUrl) {
        return res.status(400).json({ error: "Stream URL is required" });
      }
      console.log(`[Stream Proxy] Fetch request initiated for url: ${streamUrl}`);
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      };
      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller.abort();
      }, 6e3);
      const response = await fetch(streamUrl, {
        headers,
        signal: controller.signal
      });
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      const contentType = response.headers.get("content-type") || "";
      const contentTypeLower = contentType.toLowerCase();
      const isM3U8 = streamUrl.toLowerCase().includes(".m3u8") || streamUrl.toLowerCase().includes(".m3u") || contentTypeLower.includes("mpegurl") || contentTypeLower.includes("m3u8") || contentTypeLower.includes("apple.mpegurl");
      if (isM3U8) {
        const text = await response.text();
        const baseUrl = new URL(streamUrl);
        const rewrittenLines = text.split("\n").map((line) => {
          let modifiedLine = line;
          if (line.trim().startsWith("#")) {
            modifiedLine = line.replace(/URI="([^"]+)"/g, (match, p1) => {
              try {
                const absoluteUrl = new URL(p1, baseUrl).toString();
                return `URI="/api/proxy-stream?url=${encodeURIComponent(absoluteUrl)}"`;
              } catch (e) {
                return match;
              }
            });
          } else {
            const trimmed = line.trim();
            if (trimmed) {
              try {
                const absoluteUrl = new URL(trimmed, baseUrl).toString();
                return `/api/proxy-stream?url=${encodeURIComponent(absoluteUrl)}`;
              } catch (e) {
                return line;
              }
            }
          }
          return modifiedLine;
        });
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        if (process.env.NODE_ENV !== "production") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        }
        return res.status(200).send(rewrittenLines.join("\n"));
      } else {
        if (contentType) {
          res.setHeader("Content-Type", contentType);
        }
        const contentRange = response.headers.get("content-range");
        if (contentRange) res.setHeader("Content-Range", contentRange);
        const acceptRanges = response.headers.get("accept-ranges");
        if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
        const contentLength = response.headers.get("content-length");
        if (contentLength) res.setHeader("Content-Length", contentLength);
        res.status(response.status);
        if (!response.body) {
          return res.end();
        }
        const nodeStream = import_stream.Readable.fromWeb(response.body);
        nodeStream.pipe(res);
      }
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const errStr = String(error?.message || "");
      const causeStr = error?.cause ? String(error.cause.message || error.cause) : "";
      console.log(`[Stream Proxy] Stream offline indicator: Connection bypass successfully handled.`);
      let clientMsg = "Yay\u0131n sunucusuyla ba\u011Flant\u0131 kurulamad\u0131.";
      if (errStr.includes("ENOTFOUND") || causeStr.includes("ENOTFOUND")) {
        clientMsg = "Yay\u0131n adresi ad sunucusunda bulunamad\u0131 (\xC7evrimd\u0131\u015F\u0131 veya DNS Hatas\u0131). Yay\u0131n adresi ge\xE7ersiz veya kapat\u0131lm\u0131\u015F olabilir.";
      } else if (errStr.includes("ECONNREFUSED") || causeStr.includes("ECONNREFUSED")) {
        clientMsg = "Yay\u0131n sunucusu ba\u011Flant\u0131y\u0131 reddetti. Sunucu kapal\u0131 veya a\u015F\u0131r\u0131 yo\u011Fun.";
      } else if (errStr.includes("ETIMEDOUT") || causeStr.includes("ETIMEDOUT") || errStr.includes("aborted") || errStr.includes("timeout")) {
        clientMsg = "Yay\u0131n sunucusu yan\u0131t vermedi (Zaman a\u015F\u0131m\u0131). L\xFCtfen yay\u0131n\u0131 veya internet ba\u011Flant\u0131n\u0131z\u0131 kontrol edin.";
      }
      res.status(502).json({ error: clientMsg });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IPTV App running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
