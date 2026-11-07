
/* ==========================================
   EVOKER — MINI WEB BROWSER
   Premium Edition | External Search Only
========================================== */

const $ = id => document.getElementById(id);

const KEY = {
  history: "evoker_history",
  bookmarks: "evoker_bookmarks",
  theme: "evoker_theme",
  engine: "evoker_engine",
  guest: "evoker_guest_session"
};

const read = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

let historyData = read(KEY.history);
let bookmarks = read(KEY.bookmarks);
let tabs = [];
let activeTab = 0;
let currentNewsCategory = "all";

const engines = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q="
};

const images = {
  hero: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1400&auto=format&fit=crop",
  news: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop",
  world: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=900&auto=format&fit=crop",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&auto=format&fit=crop"
};

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeURL(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {}
  return "";
}

/* ==========================================
   PREMIUM DESIGN
========================================== */

function installPremiumDesign() {
  if ($("evokerPremiumStyles")) return;

  const style = document.createElement("style");
  style.id = "evokerPremiumStyles";

  style.textContent = `
    :root {
      --ev-bg:#f3f7fa;
      --ev-card:#ffffff;
      --ev-text:#142b40;
      --ev-muted:#718397;
      --ev-navy:#10283f;
      --ev-blue:#1677bd;
      --ev-teal:#12a99b;
      --ev-border:#e2eaf0;
      --ev-shadow:0 12px 35px rgba(20,48,70,.08);
    }

    body {
      background:var(--ev-bg);
      color:var(--ev-text);
      font-family:'DM Sans',Arial,sans-serif;
    }

    body.dark-mode {
      --ev-bg:#091724;
      --ev-card:#12283a;
      --ev-text:#edf6fb;
      --ev-muted:#a2b5c4;
      --ev-border:#294153;
      --ev-shadow:0 12px 35px rgba(0,0,0,.2);
    }

    .browser-header,.browser-tabs,.browser-nav {
      border-color:var(--ev-border)!important;
    }

    .content-page {
      color:var(--ev-text);
    }

    .evoker-hero {
      position:relative;
      min-height:250px;
      padding:38px 25px;
      border-radius:24px;
      overflow:hidden;
      color:white;
      background:
        linear-gradient(100deg,rgba(8,29,49,.94),rgba(13,76,101,.68)),
        url('${images.hero}') center/cover;
      display:flex;
      flex-direction:column;
      justify-content:center;
      margin:20px 0;
      box-shadow:var(--ev-shadow);
    }

    .evoker-hero h1 {
      font-size:clamp(30px,5vw,48px);
      margin:0 0 10px;
      font-weight:800;
      letter-spacing:-1.5px;
    }

    .evoker-hero p {
      color:#d9edf4;
      max-width:550px;
      line-height:1.7;
    }

    .evoker-tag {
      display:inline-block;
      color:#8ff5df;
      font-size:12px;
      font-weight:800;
      letter-spacing:2px;
      margin-bottom:12px;
    }

    .evoker-section-title {
      font-size:21px;
      font-weight:800;
      margin:28px 0 15px;
    }

    .evoker-quick-grid {
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(125px,1fr));
      gap:13px;
      margin:20px 0;
    }

    .evoker-quick {
      border:1px solid var(--ev-border);
      background:var(--ev-card);
      color:var(--ev-text);
      border-radius:17px;
      padding:18px 12px;
      cursor:pointer;
      text-align:left;
      transition:.2s;
      box-shadow:var(--ev-shadow);
    }

    .evoker-quick:hover {
      transform:translateY(-4px);
      border-color:var(--ev-teal);
    }

    .evoker-quick-icon {
      width:38px;
      height:38px;
      display:grid;
      place-items:center;
      border-radius:12px;
      background:#e5f7f5;
      color:#087f79;
      margin-bottom:12px;
      font-size:18px;
    }

    .dark-mode .evoker-quick-icon {
      background:#194c50;
      color:#8af2dc;
    }

    .evoker-quick strong {
      display:block;
      font-size:14px;
    }

    .evoker-quick small {
      display:block;
      color:var(--ev-muted);
      margin-top:5px;
    }

    .news-card {
      overflow:hidden;
      background:var(--ev-card);
      border:1px solid var(--ev-border);
      border-radius:17px;
      margin:15px 0;
      box-shadow:var(--ev-shadow);
    }

    .news-card img {
      width:100%;
      height:190px;
      object-fit:cover;
      display:block;
    }

    .news-card-content {
      padding:17px;
    }

    .news-card h3 {
      font-size:17px;
      line-height:1.5;
      margin:0 0 9px;
    }

    .news-card p {
      color:var(--ev-muted);
      font-size:13px;
    }

    .news-card a,.search-engine-link {
      color:var(--ev-teal);
      font-weight:700;
      text-decoration:none;
    }

    .news-card a:hover {
      text-decoration:underline;
    }

    .evoker-news-fallback {
      padding:25px;
      background:var(--ev-card);
      border:1px solid var(--ev-border);
      border-radius:18px;
      line-height:1.7;
    }

    .evoker-news-fallback a {
      color:var(--ev-teal);
      font-weight:700;
    }

    .evoker-empty {
      text-align:center;
      padding:35px 15px;
      color:var(--ev-muted);
      background:var(--ev-card);
      border-radius:17px;
    }

    .evoker-guest-overlay {
      position:fixed;
      inset:0;
      z-index:99999;
      background:rgba(5,19,32,.88);
      display:grid;
      place-items:center;
      padding:20px;
      backdrop-filter:blur(12px);
    }

    .evoker-guest-box {
      max-width:420px;
      width:100%;
      padding:32px;
      text-align:center;
      background:#122d43;
      color:white;
      border:1px solid #31546a;
      border-radius:24px;
      box-shadow:0 25px 90px rgba(0,0,0,.4);
    }

    .evoker-guest-logo {
      width:68px;
      height:68px;
      display:grid;
      place-items:center;
      margin:0 auto 18px;
      background:linear-gradient(135deg,#12b5a4,#1677bd);
      border-radius:21px;
      font-size:27px;
      font-weight:900;
    }

    .evoker-guest-box h2 {
      margin:0 0 10px;
      font-size:27px;
    }

    .evoker-guest-box p {
      color:#c2d6e4;
      line-height:1.7;
    }

    .evoker-primary {
      display:inline-block;
      border:0;
      border-radius:12px;
      padding:13px 22px;
      background:linear-gradient(110deg,#13aa9e,#1677bd);
      color:white;
      font-weight:800;
      cursor:pointer;
      margin-top:14px;
    }

    .evoker-secondary {
      background:var(--ev-card);
      border:1px solid var(--ev-border);
      color:var(--ev-text);
      border-radius:12px;
      padding:11px 16px;
      cursor:pointer;
    }

    .evoker-search-tip {
      color:var(--ev-muted);
      font-size:13px;
      margin:10px 0;
    }

    .evoker-external-note {
      padding:20px;
      border-radius:16px;
      background:var(--ev-card);
      border:1px solid var(--ev-border);
      line-height:1.7;
    }

    .evoker-search-buttons {
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:15px;
    }

    .evoker-search-buttons button {
      border:1px solid var(--ev-border);
      background:var(--ev-card);
      color:var(--ev-text);
      padding:11px 16px;
      border-radius:12px;
      cursor:pointer;
    }

    .evoker-search-buttons button:hover {
      border-color:var(--ev-teal);
    }

    @media(max-width:600px) {
      .evoker-hero {
        min-height:220px;
        padding:25px 18px;
      }

      .news-card img {
        height:155px;
      }
    }
  `;

  document.head.appendChild(style);
}

/* ==========================================
   GUEST MODE
========================================== */

function showGuestWelcome() {
  if (sessionStorage.getItem(KEY.guest) === "true") return;

  let overlay = $("evokerGuestOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "evokerGuestOverlay";
    overlay.className = "evoker-guest-overlay";

    overlay.innerHTML = `
      <div class="evoker-guest-box">
        <div class="evoker-guest-logo">E</div>
        <h2>Welcome to EVOKER</h2>
        <p>Your simple space to explore the web, discover news
        and access your favourite websites.</p>
        <button class="evoker-primary" id="evokerStartGuest">
          Continue as Guest
        </button>
        <p style="font-size:11px;margin-top:16px">
          No account required
        </p>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  $("evokerStartGuest").onclick = continueAsGuest;
}

function continueAsGuest() {
  sessionStorage.setItem(KEY.guest, "true");
  $("evokerGuestOverlay")?.remove();
  showPage("home");
}

/* ==========================================
   TABS
========================================== */

function createTab() {
  tabs.push({
    id: Date.now(),
    title: "New Tab",
    url: ""
  });

  activeTab = tabs.length - 1;
  renderTabs();
  showPage("home");
}

function renderTabs() {
  const container = $("tabsContainer");
  if (!container) return;

  container.innerHTML = "";

  tabs.forEach((tab, index) => {
    const button = document.createElement("button");
    button.className =
      "browser-tab" + (index === activeTab ? " active" : "");
    button.textContent = tab.title;
    button.title = tab.title;

    button.onclick = () => {
      activeTab = index;
      renderTabs();
      showPage("home");
    };

    container.appendChild(button);
  });
}

/* ==========================================
   EXTERNAL SEARCH ONLY
========================================== */

function normalizeUrl(value) {
  value = value.trim();

  if (/^https?:\/\//i.test(value)) return value;

  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(value)) {
    return "https://" + value;
  }

  return "";
}

function getSearchEngine() {
  return (
    localStorage.getItem(KEY.engine) ||
    $("searchEngineSelect")?.value ||
    "google"
  );
}

function externalSearch(query) {
  query = query.trim();
  if (!query) return;

  const engine = getSearchEngine();
  const base = engines[engine] || engines.google;

  const url = base + encodeURIComponent(query);
  window.open(url, "_blank", "noopener");

  addHistory(query, url);
}

function handleSearch(value) {
  value = value.trim();
  if (!value) return;

  const url = normalizeUrl(value);

  if (url) {
    window.open(url, "_blank", "noopener");
    addHistory(value, url);
  } else {
    externalSearch(value);
  }
}

/* ==========================================
   HISTORY
========================================== */

function addHistory(title, url) {
  historyData.unshift({
    title,
    url,
    date: new Date().toLocaleString()
  });

  historyData = historyData.slice(0, 100);
  save(KEY.history, historyData);
}

function renderHistory() {
  const container = $("historyContainer");
  if (!container) return;

  if (!historyData.length) {
    container.innerHTML =
      '<div class="evoker-empty">No browsing history yet.</div>';
    return;
  }

  container.innerHTML = historyData.map(item => `
    <div class="saved-item">
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(item.date || "")}</small>
      </div>
      <a href="${escapeHTML(safeURL(item.url))}"
         target="_blank" rel="noopener">Open</a>
    </div>
  `).join("");
}

/* ==========================================
   BOOKMARKS
========================================== */

function addBookmark() {
  const tab = tabs[activeTab];

  if (!tab || !tab.url) {
    alert("Open a website first.");
    return;
  }

  if (bookmarks.some(item => item.url === tab.url)) {
    alert("This bookmark already exists.");
    return;
  }

  bookmarks.unshift({
    title: tab.title,
    url: tab.url,
    date: new Date().toLocaleDateString()
  });

  save(KEY.bookmarks, bookmarks);
  alert("Bookmark saved!");
}

function renderBookmarks() {
  const container = $("bookmarksContainer");
  if (!container) return;

  if (!bookmarks.length) {
    container.innerHTML =
      '<div class="evoker-empty">No bookmarks saved yet.</div>';
    return;
  }

  container.innerHTML = bookmarks.map((item, index) => `
    <div class="saved-item">
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(item.url)}</small>
      </div>
      <div>
        <a href="${escapeHTML(safeURL(item.url))}"
           target="_blank" rel="noopener">Open</a>
        <button data-remove-bookmark="${index}">Delete</button>
      </div>
    </div>
  `).join("");

  container.querySelectorAll("[data-remove-bookmark]").forEach(button => {
    button.onclick = () => {
      bookmarks.splice(Number(button.dataset.removeBookmark), 1);
      save(KEY.bookmarks, bookmarks);
      renderBookmarks();
    };
  });
}

/* ==========================================
   NEWS
========================================== */

async function loadNews(category = currentNewsCategory) {
  currentNewsCategory = category;

  const container = $("newsContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="evoker-empty">
      Loading latest news...
    </div>
  `;

  const queries = {
    all: "India OR world",
    india: "India",
    world: "world news",
    technology: "technology",
    sports: "sports",
    business: "business"
  };

  const query = queries[category] || queries.all;

  const api =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(query) +
    "&mode=ArtList&format=json&maxrecords=15&sort=DateDesc";

  try {
    const response = await fetch(api);

    if (!response.ok) throw new Error("News API error");

    const data = await response.json();
    const articles = data.articles || [];

    if (!articles.length) throw new Error("No news available");

    container.innerHTML = articles.map(article => {
      const url = safeURL(article.url);
      const image = safeURL(article.socialimage) || images.news;

      if (!url) return "";

      return `
        <article class="news-card">
          <img
            src="${escapeHTML(image)}"
            alt="News image"
            loading="lazy"
            onerror="this.src='${images.news}'"
          >
          <div class="news-card-content">
            <p>${escapeHTML(article.domain || "Latest News")}</p>
            <h3>${escapeHTML(article.title || "News Update")}</h3>
            <p>${escapeHTML(article.seendate || "")}</p>
            <a href="${escapeHTML(url)}"
               target="_blank" rel="noopener">
              Read Full Story →
            </a>
          </div>
        </article>
      `;
    }).join("");

    if (!container.innerHTML.trim()) {
      throw new Error("No valid articles");
    }

  } catch (error) {
    container.innerHTML = `
      <div class="evoker-news-fallback">
        <h3>News is temporarily unavailable</h3>
        <p>Our news source could not load right now.
        You can still read the latest headlines from Google News.</p>
        <a href="https://news.google.com/"
           target="_blank" rel="noopener">
          Explore Latest News →
        </a>
        <br><br>
        <button class="evoker-secondary" id="retryNews">
          Try Again
        </button>
      </div>
    `;

    $("retryNews").onclick = () => loadNews(category);
  }
}

/* ==========================================
   HOME DESIGN
========================================== */

function buildHomeDesign() {
  const home = $("homePage");
  if (!home || $("evokerHomeDecoration")) return;

  const section = document.createElement("section");
  section.id = "evokerHomeDecoration";

  section.innerHTML = `
    <div class="evoker-hero">
      <span class="evoker-tag">EXPLORE WITHOUT LIMITS</span>
      <h1>Discover More.<br>Explore Better.</h1>
      <p>One place to search the web, discover news
      and reach your favourite destinations.</p>
    </div>

    <h2 class="evoker-section-title">Explore the Web</h2>

    <div class="evoker-quick-grid">
      <button class="evoker-quick" data-evoker-search="web">
        <span class="evoker-quick-icon">W</span>
        <strong>Web Search</strong>
        <small>Explore websites</small>
      </button>

      <button class="evoker-quick" data-evoker-search="images">
        <span class="evoker-quick-icon">I</span>
        <strong>Images</strong>
        <small>Discover pictures</small>
      </button>

      <button class="evoker-quick" data-evoker-search="videos">
        <span class="evoker-quick-icon">V</span>
        <strong>Videos</strong>
        <small>Watch online</small>
      </button>

      <button class="evoker-quick" data-evoker-search="news">
        <span class="evoker-quick-icon">N</span>
        <strong>News</strong>
        <small>Latest headlines</small>
      </button>

      <button class="evoker-quick" data-evoker-search="shopping">
        <span class="evoker-quick-icon">S</span>
        <strong>Shopping</strong>
        <small>Find products</small>
      </button>

      <button class="evoker-quick" data-evoker-search="maps">
        <span class="evoker-quick-icon">M</span>
        <strong>Maps</strong>
        <small>Explore places</small>
      </button>
    </div>

    <p class="evoker-search-tip">
      Search opens in your device's external browser.
    </p>
  `;

  home.appendChild(section);

  section.querySelectorAll("[data-evoker-search]").forEach(button => {
    button.onclick = () => {
      const type = button.dataset.evokerSearch;

      const searches = {
        web: "popular websites",
        images: "https://www.google.com/imghp",
        videos: "https://www.youtube.com",
        news: "https://news.google.com",
        shopping: "online shopping",
        maps: "https://www.google.com/maps"
      };

      handleSearch(searches[type]);
    };
  });
}

/* ==========================================
   WEBSITE PAGE
========================================== */

function setupWebsitePage() {
  const page = $("websitePage");
  if (!page || $("evokerExternalMessage")) return;

  const note = document.createElement("div");
  note.id = "evokerExternalMessage";
  note.className = "evoker-external-note";

  note.innerHTML = `
    <h2>External Browser</h2>
    <p>EVOKER opens websites in your device's browser.
    Some websites do not allow embedded viewing.</p>
    <p>Use the address bar above to search or open a website.</p>
  `;

  page.appendChild(note);
}

/* ==========================================
   PAGE NAVIGATION
========================================== */

function showPage(name) {
  document.querySelectorAll(".content-page").forEach(page => {
    page.classList.add("hidden");
  });

  const page = $(name + "Page");
  if (page) page.classList.remove("hidden");

  if (name === "history") renderHistory();
  if (name === "bookmarks") renderBookmarks();
  if (name === "news") loadNews();
}

/* ==========================================
   THEME
========================================== */

function applyTheme(theme) {
  document.body.classList.toggle("dark-mode", theme === "dark");
  localStorage.setItem(KEY.theme, theme);

  if ($("appearanceSelect")) {
    $("appearanceSelect").value = theme;
  }
}

/* ==========================================
   EVENT LISTENERS
========================================== */

function initializeEvoker() {
  installPremiumDesign();
  buildHomeDesign();
  setupWebsitePage();

  if (!tabs.length) createTab();

  applyTheme(localStorage.getItem(KEY.theme) || "light");

  showGuestWelcome();

  $("continueGuestButton")?.addEventListener("click", continueAsGuest);
  $("closeGuestButton")?.addEventListener("click", continueAsGuest);
  $("guestMenuButton")?.addEventListener("click", showGuestWelcome);

  $("newTabButton")?.addEventListener("click", createTab);

  $("homeButton")?.addEventListener("click", () => showPage("home"));

  $("backButton")?.addEventListener("click", () => {
    alert("External browser controls its own back navigation.");
  });

  $("forwardButton")?.addEventListener("click", () => {
    alert("External browser controls its own forward navigation.");
  });

  $("reloadButton")?.addEventListener("click", () => {
    if (tabs[activeTab]?.url) {
      window.open(tabs[activeTab].url, "_blank", "noopener");
    } else {
      location.reload();
    }
  });

  $("searchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    handleSearch($("addressInput")?.value || "");
  });

  $("homeSearchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    handleSearch($("homeSearchInput")?.value || "");
  });

  $("address-search-button")?.addEventListener("click", () => {
    handleSearch($("addressInput")?.value || "");
  });

  $("openExternalButton")?.addEventListener("click", () => {
    const url = tabs[activeTab]?.url;
    if (url) window.open(url, "_blank", "noopener");
  });

  $("bookmarkButton")?.addEventListener("click", addBookmark);

  $("themeToggle")?.addEventListener("click", () => {
    const dark = document.body.classList.contains("dark-mode");
    applyTheme(dark ? "light" : "dark");
  });

  $("appearanceSelect")?.addEventListener("change", event => {
    applyTheme(event.target.value);
  });

  $("searchEngineSelect")?.addEventListener("change", event => {
    localStorage.setItem(KEY.engine, event.target.value);
    if ($("settingsSearchEngine")) {
      $("settingsSearchEngine").value = event.target.value;
    }
  });

  $("settingsSearchEngine")?.addEventListener("change", event => {
    localStorage.setItem(KEY.engine, event.target.value);
    if ($("searchEngineSelect")) {
      $("searchEngineSelect").value = event.target.value;
    }
  });

  $("refreshNewsButton")?.addEventListener("click", () => {
    loadNews(currentNewsCategory);
  });

  document.querySelectorAll(".news-filter").forEach(button => {
    button.addEventListener("click", () => {
      loadNews(button.dataset.category || "all");
    });
  });

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
      $("browserMenu")?.classList.add("hidden");
    });
  });

  $("menuButton")?.addEventListener("click", () => {
    $("browserMenu")?.classList.toggle("hidden");
  });

  $("clearAddressButton")?.addEventListener("click", () => {
    if ($("addressInput")) $("addressInput").value = "";
  });

  $("clearHistoryButton")?.addEventListener("click", () => {
    if (confirm("Clear all browsing history?")) {
      historyData = [];
      save(KEY.history, historyData);
      renderHistory();
    }
  });

  $("clearDataButton")?.addEventListener("click", () => {
    if (confirm("Clear EVOKER data?")) {
      Object.values(KEY).forEach(key => {
        localStorage.removeItem(key);
      });
      sessionStorage.removeItem(KEY.guest);
      location.reload();
    }
  });

  renderTabs();

  const engine = getSearchEngine();

  if ($("searchEngineSelect")) {
    $("searchEngineSelect").value = engine;
  }

  if ($("settingsSearchEngine")) {
    $("settingsSearchEngine").value = engine;
  }
}

document.addEventListener("DOMContentLoaded", initializeEvoker);
