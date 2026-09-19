tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        accent: '#00b8c9',
        'accent-light': '#5ee4f0',
        'accent-dark': '#087f8c',
        paper: '#ffffff',
        ink: '#12161c',
      }
    }
  }
}

const LANG_FILES = {
  en: "javaScript/lang/en.js",
  kh: "javaScript/lang/kh.js",
  cn: "javaScript/lang/cn.js",
};

const CERT_FILES = [
  { id: "step", src: "img/certificate/itstep.jpg", year: "2025" },
  { id: "intro", src: "img/certificate/intro%20cyber.jpg", year: "2025" },
  { id: "threat", src: "img/certificate/cyber%20threat%20management.jpg", year: "2025" },
  { id: "endpoint", src: "img/certificate/end%20point.jpg", year: "2025" },
  { id: "hsk", src: "img/certificate/hsk6.jpg", year: "2020" },
  { id: "samsung", src: "img/certificate/samsung.jpg", year: "2016" },
];

function app() {
  return {
    dark: false,
    mm: false,
    sc: false,
    s: "hero",
    cert: null,
    lang: "en",
    dict: {},
    langs: [
      { id: "kh", code: "KH", label: "Khmer" },
      { id: "en", code: "EN", label: "English" },
      { id: "cn", code: "中", label: "Chinese" },
    ],
    certs: [],

    t(key) {
      const parts = key.split(".");
      const read = (pack) => parts.reduce((cur, part) => cur?.[part], pack);
      return read(this.dict) ?? read(window.LANG_PACKS?.en) ?? key;
    },

    htmlLang() {
      return { en: "en", kh: "km", cn: "zh-CN" }[this.lang] || "en";
    },

    seoUrl(code) {
      const origin = "https://by-kimhy.site/";
      return code === "en" ? origin : origin + "?lang=" + code;
    },

    setMeta(selector, value) {
      const el = document.querySelector(selector);
      if (el && value) el.setAttribute("content", value);
    },

    applySeo() {
      const pack = this.dict.seo || window.LANG_PACKS?.en?.seo || {};
      const title = pack.title || document.title;
      const desc = pack.description || "";
      const og = pack.og || desc;
      const locale = { en: "en_US", kh: "km_KH", cn: "zh_CN" }[this.lang] || "en_US";
      const url = this.seoUrl(this.lang);
      const htmlLang = this.htmlLang();

      document.title = title;
      this.setMeta('meta[name="description"]', desc);
      this.setMeta('meta[property="og:title"]', title);
      this.setMeta('meta[property="og:description"]', og);
      this.setMeta('meta[property="og:url"]', url);
      this.setMeta('meta[property="og:locale"]', locale);
      this.setMeta('meta[name="twitter:title"]', title);
      this.setMeta('meta[name="twitter:description"]', desc);

      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.setAttribute("href", url);

      const ld = document.getElementById("ld-json");
      if (!ld) return;
      try {
        const data = JSON.parse(ld.textContent);
        (data["@graph"] || []).forEach((node) => {
          if (node["@type"] === "WebSite") {
            node.inLanguage = htmlLang;
            node.description = desc;
          }
          if (node["@type"] === "ProfilePage") {
            node.inLanguage = htmlLang;
            node.url = url;
            node.name = title.replace(" | by-kimhy.site", "");
          }
        });
        ld.textContent = JSON.stringify(data);
      } catch (_) {}
    },

    buildCerts() {
      const pack = this.dict.certs || {};
      const fallback = window.LANG_PACKS?.en?.certs || {};
      return CERT_FILES.map((file) => ({
        ...file,
        ...(fallback[file.id] || {}),
        ...(pack[file.id] || {}),
      }));
    },

    async loadLang(code) {
      window.LANG_PACKS = window.LANG_PACKS || {};
      if (window.LANG_PACKS[code]) return window.LANG_PACKS[code];
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = LANG_FILES[code];
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load " + code));
        document.head.appendChild(script);
      });
      return window.LANG_PACKS[code];
    },

    diploma() {
      return {
        title: this.t("edu.bachelor"),
        issuer: "SETEC Institute",
        year: "2025",
        src: "img/certificate/it bachelor.jpg",
        alt: this.t("edu.diplomaAlt"),
      };
    },

    transcript() {
      return {
        title: this.t("edu.viewTranscript"),
        issuer: "SETEC Institute",
        year: "2025",
        src: "img/certificate/setec transcript.jpg",
        alt: this.t("edu.transcriptAlt"),
      };
    },

    async setLang(code) {
      if (!LANG_FILES[code]) return;
      const pack = await this.loadLang(code);
      if (!pack) return;
      this.lang = code;
      this.dict = pack;
      localStorage.setItem("lang", code);
      document.documentElement.lang = this.htmlLang();
      document.documentElement.dataset.lang = code;
      this.certs = this.buildCerts();
      this.applySeo();
      const url = new URL(location.href);
      if (code === "en") url.searchParams.delete("lang");
      else url.searchParams.set("lang", code);
      history.replaceState(null, "", url);
    },

    openCert(cert) {
      this.cert = cert;
    },

    closeCert() {
      this.cert = null;
    },

    async init() {
      const aliases = { km: "kh", zh: "cn", "zh-cn": "cn" };
      const query = new URLSearchParams(location.search).get("lang");
      const saved = localStorage.getItem("lang");
      const start = LANG_FILES[query]
        ? query
        : LANG_FILES[aliases[query]]
          ? aliases[query]
          : LANG_FILES[saved]
            ? saved
            : "en";
      await this.setLang(start);

      // dark mode
      this.dark =
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      this.$watch("dark", (v) => {
        localStorage.setItem("theme", v ? "dark" : "light");
        startParticles(v);
      });
      this.$nextTick(() => startParticles(this.dark));
      this.$watch("cert", (v) => {
        document.body.style.overflow = v ? "hidden" : "";
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.closeCert();
      });

      // scroll
      window.addEventListener(
        "scroll",
        () => {
          this.sc = window.scrollY > 20;
          this.updateSection();
        },
        { passive: true },
      );

      // reveal
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
      );
      const watchReveal = () => {
        document.querySelectorAll(".reveal:not(.in)").forEach((el) => {
          io.observe(el);
        });
      };
      watchReveal();
      this.$nextTick(watchReveal);

      // year
      document.getElementById("yr").textContent =
        new Date().getFullYear();
    },

    updateSection() {
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.body.scrollHeight - 60;
      if (atBottom) {
        this.s = "contact";
        return;
      }
      const ids = [
        "contact",
        "blog",
        "reviews",
        "education",
        "about",
        "services",
        "hero",
      ];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 130) {
          this.s = id;
          return;
        }
      }
    },
  };
}