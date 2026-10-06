#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const OG_IMAGE = "https://by-kimhy.site/img/seo/og-image.jpg?v=2";

const LANGS = {
  kh: {
    dir: "kh",
    htmlLang: "km",
    locale: "km_KH",
    url: "https://by-kimhy.site/kh/",
    packFile: "javaScript/lang/kh.js",
  },
  cn: {
    dir: "cn",
    htmlLang: "zh-CN",
    locale: "zh_CN",
    url: "https://by-kimhy.site/cn/",
    packFile: "javaScript/lang/cn.js",
  },
};

function loadPack(rel) {
  const code = fs.readFileSync(path.join(root, rel), "utf8");
  const sandbox = { window: { LANG_PACKS: {} } };
  vm.runInNewContext(code, sandbox);
  const packs = sandbox.window.LANG_PACKS;
  const codeKey = Object.keys(packs)[0];
  return packs[codeKey];
}

function replaceAttr(html, attrSelector, value) {
  // attrSelector like: meta[property="og:title"] or meta[name="description"]
  const m = attrSelector.match(/^(\w+)\[([^=]+)="([^"]+)"\]$/);
  if (!m) throw new Error("bad selector " + attrSelector);
  const [, tag, attr, key] = m;
  const re = new RegExp(
    `(<${tag}\\s+[^>]*${attr}="${key}"[^>]*content=")([^"]*)(")`,
    "i",
  );
  const re2 = new RegExp(
    `(<${tag}\\s+[^>]*content=")([^"]*)("[^>]*${attr}="${key}")`,
    "i",
  );
  if (re.test(html)) return html.replace(re, `$1${value}$3`);
  if (re2.test(html)) return html.replace(re2, `$1${value}$3`);
  throw new Error("not found: " + attrSelector);
}

function replaceTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
}

function replaceCanonical(html, url) {
  return html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${url}$2`,
  );
}

function replaceHtmlLang(html, lang) {
  return html.replace(/<html(\s[^>]*)?\slang="[^"]*"/, `<html$1 lang="${lang}"`);
}

function replaceOgUrl(html, url) {
  return replaceAttr(html, 'meta[property="og:url"]', url);
}

function replaceLocale(html, locale) {
  return replaceAttr(html, 'meta[property="og:locale"]', locale);
}

function replaceHreflang(html) {
  return html
    .replace(
      /href="https:\/\/by-kimhy\.site\/\?lang=kh"/g,
      'href="https://by-kimhy.site/kh/"',
    )
    .replace(
      /href="https:\/\/by-kimhy\.site\/\?lang=cn"/g,
      'href="https://by-kimhy.site/cn/"',
    );
}

function ensureImageMeta(html) {
  let out = html;
  out = out.replace(
    /content="https:\/\/by-kimhy\.site\/img\/seo\/og-image\.jpg(?:\?[^"]*)?"/g,
    `content="${OG_IMAGE}"`,
  );
  if (!out.includes('property="og:image:secure_url"')) {
    out = out.replace(
      /(<meta\s+property="og:image"\s+content="[^"]*"\s*\/>)/,
      `$1\n    <meta property="og:image:secure_url" content="${OG_IMAGE}" />\n    <meta property="og:image:type" content="image/jpeg" />\n    <link rel="image_src" href="${OG_IMAGE}" />`,
    );
  }
  return out;
}

function patchLdJson(html, { title, desc, url, htmlLang }) {
  return html.replace(
    /<script id="ld-json" type="application\/ld\+json">([\s\S]*?)<\/script>/,
    (_, json) => {
      const data = JSON.parse(json);
      for (const node of data["@graph"] || []) {
        if (node["@type"] === "WebSite") {
          node.inLanguage = htmlLang;
          node.description = desc;
          node.url = "https://by-kimhy.site/";
        }
        if (node["@type"] === "ProfilePage") {
          node.inLanguage = htmlLang;
          node.url = url;
          node.name = title.replace(" | by-kimhy.site", "");
        }
      }
      return `<script id="ld-json" type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n    </script>`;
    },
  );
}

const base = fs.readFileSync(path.join(root, "index.html"), "utf8");

// Harden root index OG image tags too
let rootHtml = ensureImageMeta(replaceHreflang(base));
rootHtml = rootHtml.replace(
  /(<link\s+rel="alternate"\s+hreflang="km"\s+href=")[^"]*(")/,
  "$1https://by-kimhy.site/kh/$2",
);
rootHtml = rootHtml.replace(
  /(<link\s+rel="alternate"\s+hreflang="zh-CN"\s+href=")[^"]*(")/,
  "$1https://by-kimhy.site/cn/$2",
);
fs.writeFileSync(path.join(root, "index.html"), rootHtml);

for (const [code, cfg] of Object.entries(LANGS)) {
  const pack = loadPack(cfg.packFile);
  const seo = pack.seo;
  let html = rootHtml;
  html = replaceHtmlLang(html, cfg.htmlLang);
  html = replaceTitle(html, seo.title);
  html = replaceAttr(html, 'meta[name="description"]', seo.description);
  html = replaceAttr(html, 'meta[property="og:title"]', seo.title);
  html = replaceAttr(html, 'meta[property="og:description"]', seo.og);
  html = replaceAttr(html, 'meta[name="twitter:title"]', seo.title);
  html = replaceAttr(html, 'meta[name="twitter:description"]', seo.description);
  html = replaceOgUrl(html, cfg.url);
  html = replaceLocale(html, cfg.locale);
  html = replaceCanonical(html, cfg.url);
  html = patchLdJson(html, {
    title: seo.title,
    desc: seo.description,
    url: cfg.url,
    htmlLang: cfg.htmlLang,
  });
  html = ensureImageMeta(html);

  const outDir = path.join(root, cfg.dir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
  console.log(`wrote ${cfg.dir}/index.html (${code})`);
}

console.log("done");
