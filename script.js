
"use strict";

/* =========================================
   EVOKER — FIXED PREMIUM VERSION
   External Search | Guest | News | Images
========================================= */

const $ = id => document.getElementById(id);

const STORAGE = {
  history: "evoker_history",
  bookmarks: "evoker_bookmarks",
  downloads: "evoker_downloads",
  theme: "evoker_theme",
  engine: "evoker_engine",
  homepage: "evoker_homepage",
  guest: "evoker_guest"
};

const ENGINES = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q="
};

const QUICK_LINKS = [
  { name: "Google", url: "https://www.google.com", icon: "G" },
  { name: "YouTube", url: "https://www.youtube.com", icon: "Y" },
  { name: "Wikipedia", url: "https://www.wikipedia.org", icon: "W" },
  { name: "GitHub", url: "https://github.com", icon: "GH" },
  { name: "Bing", url: "https://www.bing.com", icon: "B" },
  { name: "News", url: "https://news.google.com", icon: "N" }
];

const NEWS_IMAGES = {
  all: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900",
  india: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=900",
  world: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=900",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900",
  business: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900"
};

function readData(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

let historyItems = readData(STORAGE.history);
let bookmarks = readData(STORAGE.bookmarks);
let downloads = readData(STORAGE.downloads);

let tabs = [];
let activeTab = 0;
let currentPage = "home";
let currentNewsCategory = "all";

function saveData() {
  localStorage.setItem(STORAGE.history, JSON.stringify(historyItems));
  localStorage.setItem(STORAGE.bookmarks, JSON.stringify(bookmarks));
  localStorage.setItem(STORAGE.downloads, JSON.stringify(downloads));
}

function setStatus(message) {
  const status = $("connectionStatus");
  if (status) status.textContent = message;
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

/* =========================================
   PREMIUM VISUAL IMPROVEMENTS
========================================= */

function addPremiumStyles() {
  if ($("evokerExtraCSS")) return;

  const style = document.createElement("style");
  style.id = "evokerExtraCSS";

  style.textContent = `
    .hero-section {
      background:
        linear-gradient(100deg,rgba(10,28,45,.96),rgba(10,65,83,.66)),
        url("https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1400")
        center/cover !important;
    }

    .hero-section,
    .quick-link,
    .preview-card,
    .discover-card,
    .news-card,
    .guest-card {
      transition:all .25s ease;
    }

    .quick-link:hover,
    .preview-card:hover,
    .discover-card:hover {
      transform:translateY(-4px);
      border-color:var(--teal);
      box-shadow:var(--shadow);
    }

    .shortcut-icon {
      width:38px;
      height:38px;
      display:grid;
      place-items:center;
      border-radius:12px;
      background:linear-gradient(135deg,#d9f8f1,#dceeff);
      color:#087e80;
      font-weight:800;
      font-size:14px;
    }

    body.dark .shortcut-icon {
      background:#214b57;
      color:#a1f1df;
    }

    .news-card {
      padding:0 !important;
      overflow:hidden;
    }

    .news-card img {
      display:block;
      width:100%;
      height:175px;
      object-fit:cover;
      background:var(--surface-2);
    }

    .news-card .news-content {
      padding:17px;
    }

    .news-card h3 {
      line-height:1.5;
      overflow-wrap:anywhere;
    }

    .news-card .news-source {
      color:var(--muted);
      font-size:12px;
      margin:8px 0 12px;
    }

    .news-card a {
      display:inline-block;
      color:var(--teal);
      text-decoration:none;
      font-weight:700;
      padding-bottom:4px;
    }

    .news-card a:hover {
      text-decoration:underline;
    }

    .evoker-empty {
      padding:25px;
      background:var(--surface);
      border:1px solid var(--border);
      border-radius:15px;
      color:var(--muted);
      text-align:center;
      grid-column:1/-1;
    }

    .evoker-news-actions {
      display:flex;
      gap:12px;
      flex-wrap:wrap;
      margin-top:15px;
    }

    .evoker-news-actions a {
      color:var(--teal);
      font-weight:700;
    }

    .evoker-external-label {
      display:inline-block;
      margin-top:10px;
      color:var(--muted);
      font-size:12px;
    }

    @media(max-width:700px) {
      .news-card img { height:155px; }
    }
  `;

  document.head.appendChild(style);
}

/* =========================================
   URL + EXTERNAL SEARCH
========================================= */

function isWebsite(value) {
  return /^((https?:\/\/)?[\w-]+(\.[\w-]+)+)([/?#][^\s]*)?$/i.test(value);
}

function normalizeURL(value) {
  let url = value.trim();

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  return safeURL(url);
}

function getSearchEngine() {
  const saved = localStorage.getItem(STORAGE.engine);
  return ENGINES[saved] ? saved : "google";
}

function makeSearchURL(query) {
  const engine = getSearchEngine();
  return ENGINES[engine] + encodeURIComponent(query.trim());
}

function addHistory(title, url) {
  historyItems.unshift({
    title,
    url,
    time: new Date().toLocaleString()
  });

  historyItems = historyItems.slice(0, 300);
  saveData();
}

function openExternalURL(url, title = "") {
  const safe = safeURL(url);

  if (!safe) {
    setStatus("Invalid website address.");
    return;
  }

  const tab = tabs[activeTab];

  if (tab) {
    tab.url = safe;
    tab.title = title || new URL(safe).hostname;
  }

  renderTabs();

  window.open(safe, "_blank", "noopener,noreferrer");

  addHistory(title || safe, safe);
  setStatus("Opened in external browser.");
}

function navigate(value) {
  const text = value.trim();

  if (!text) return;

  if (isWebsite(text)) {
    openExternalURL(normalizeURL(text));
  } else {
    openExternalURL(makeSearchURL(text), "Search: " + text);
  }
}

/* =========================================
   TABS
========================================= */

function createTab() {
  tabs.push({
    id: Date.now() + Math.random(),
    url: "",
    title: "New Tab"
  });

  activeTab = tabs.length - 1;
  renderTabs();
  showPage("home");
}

function getActiveTab() {
  return tabs[activeTab];
}

function renderTabs() {
  const container = $("tabsContainer");
  if (!container) return;

  container.innerHTML = "";

  tabs.forEach((tab, index) => {
    const button = document.createElement("button");
    button.className =
      "browser-tab" + (index === activeTab ? " active" : "");

    const label = document.createElement("span");
    label.textContent = tab.title;

    const close = document.createElement("span");
    close.textContent = " ×";
    close.title = "Close tab";

    close.onclick = event => {
      event.stopPropagation();
      closeTab(index);
    };

    button.append(label, close);

    button.onclick = () => {
      activeTab = index;
      renderTabs();
      showPage("home");
    };

    container.appendChild(button);
  });
}

function closeTab(index) {
  if (tabs.length === 1) {
    tabs[0] = { id: Date.now(), url: "", title: "New Tab" };
    activeTab = 0;
  } else {
    tabs.splice(index, 1);
    activeTab = Math.min(activeTab, tabs.length - 1);
  }

  renderTabs();
  showPage("home");
}

function newTab() {
  createTab();
}

/* =========================================
   PAGE NAVIGATION
========================================= */

function showPage(page) {
  const allowed = [
    "home", "website", "discover", "news",
    "bookmarks", "history", "downloads", "settings"
  ];

  if (!allowed.includes(page)) return;

  currentPage = page;

  document.querySelectorAll(".content-page").forEach(element => {
    element.classList.add("hidden");
  });

  $(page + "Page")?.classList.remove("hidden");
  $("browserMenu")?.classList.add("hidden");

  if (page === "bookmarks") renderBookmarks();
  if (page === "history") renderHistory();
  if (page === "downloads") renderDownloads();
  if (page === "news") loadNews(currentNewsCategory);
}

function goHome() {
  const tab = getActiveTab();

  if (tab) {
    tab.url = "";
    tab.title = "New Tab";
  }

  if ($("addressInput")) $("addressInput").value = "";

  renderTabs();
  showPage("home");
  setStatus("EVOKER is ready.");
}

/* =========================================
   GUEST MODE
========================================= */

function openGuestPanel() {
  $("guestPanel")?.classList.remove("hidden");
}

function closeGuestPanel() {
  $("guestPanel")?.classList.add("hidden");
}

function continueAsGuest() {
  localStorage.setItem(STORAGE.guest, "true");

  if ($("profileLabel")) {
    $("profileLabel").textContent = "Guest";
  }

  closeGuestPanel();
  setStatus("Browsing as Guest");

  const homepage = localStorage.getItem(STORAGE.homepage) || "home";
  showPage(homepage);
}

function exitGuestMode() {
  if (!confirm("End this Guest session?")) return;

  localStorage.removeItem(STORAGE.guest);
  openGuestPanel();
}

/* =========================================
   QUICK LINKS
========================================= */

function renderQuickLinks() {
  const container = $("quickLinksContainer");
  if (!container) return;

  container.innerHTML = "";

  QUICK_LINKS.forEach(item => {
    const button = document.createElement("button");
    button.className = "quick-link";

    const icon = document.createElement("span");
    icon.className = "shortcut-icon";
    icon.textContent = item.icon;

    const label = document.createElement("span");
    label.textContent = item.name;

    button.append(icon, label);
    button.onclick = () => openExternalURL(item.url, item.name);

    container.appendChild(button);
  });
}

/* =========================================
   HISTORY
========================================= */

function renderHistory() {
  const container = $("historyContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!historyItems.length) {
    container.textContent = "Your browsing history is empty.";
    return;
  }

  historyItems.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "saved-item";

    const info = document.createElement("div");
    const link = document.createElement("button");

    link.textContent = item.title || item.url;
    link.onclick = () => openExternalURL(item.url, item.title);

    const time = document.createElement("small");
    time.textContent = item.time || "";

    info.append(link, document.createElement("br"), time);

    const remove = document.createElement("button");
    remove.textContent = "Remove";

    remove.onclick = () => {
      historyItems.splice(index, 1);
      saveData();
      renderHistory();
    };

    row.append(info, remove);
    container.appendChild(row);
  });
}

/* =========================================
   BOOKMARKS
========================================= */

function addBookmark() {
  const tab = getActiveTab();

  if (!tab?.url) {
    setStatus("Open a website first.");
    return;
  }

  if (bookmarks.some(item => item.url === tab.url)) {
    setStatus("Already bookmarked.");
    return;
  }

  bookmarks.unshift({
    url: tab.url,
    title: tab.title,
    time: new Date().toLocaleDateString()
  });

  saveData();
  setStatus("Bookmark saved.");
}

function renderBookmarks() {
  const container = $("bookmarksContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!bookmarks.length) {
    container.textContent = "No bookmarks saved yet.";
    return;
  }

  bookmarks.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "saved-item";

    const link = document.createElement("button");
    link.textContent = item.title || item.url;
    link.onclick = () => openExternalURL(item.url, item.title);

    const remove = document.createElement("button");
    remove.textContent = "Remove";

    remove.onclick = () => {
      bookmarks.splice(index, 1);
      saveData();
      renderBookmarks();
    };

    row.append(link, remove);
    container.appendChild(row);
  });
}

/* =========================================
   NEWS EXPLORER
========================================= */

const NEWS_QUERIES = {
  all: "India OR world",
  india: "India",
  world: "world news",
  technology: "technology",
  sports: "sports",
  business: "business"
};

async function loadNews(category = "all") {
  currentNewsCategory = category;

  const container = $("newsContainer");
  if (!container) return;

  container.innerHTML =
    '<div class="evoker-empty">Loading latest news...</div>';

  const query = encodeURIComponent(NEWS_QUERIES[category] || "India");

  const api =
    "https://api.gdeltproject.org/api/v2/doc/doc" +
    "?query=" + query +
    "&mode=ArtList&format=json&maxrecords=15&sort=DateDesc";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(api, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error("News source unavailable");

    const data = await response.json();
    const articles = data.articles || [];

    if (!articles.length) throw new Error("No articles found");

    container.innerHTML = "";

    articles.forEach(article => {
      const url = safeURL(article.url);
      if (!url) return;

      const card = document.createElement("article");
      card.className = "news-card";

      const image = document.createElement("img");
      image.src = safeURL(article.socialimage) ||
        NEWS_IMAGES[category] || NEWS_IMAGES.all;
      image.alt = "News image";
      image.loading = "lazy";
      image.onerror = () => {
        image.onerror = null;
        image.src = NEWS_IMAGES[category] || NEWS_IMAGES.all;
      };

      const content = document.createElement("div");
      content.className = "news-content";

      const title = document.createElement("h3");
      title.textContent = article.title || "Latest News";

      const source = document.createElement("p");
      source.className = "news-source";
      source.textContent =
        (article.domain || "News source") +
        (article.seendate ? " • " + article.seendate : "");

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Read Full Story →";

      content.append(title, source, link);
      card.append(image, content);
      container.appendChild(card);
    });

    if (!container.children.length) {
      throw new Error("No valid articles");
    }

    setStatus("Latest news loaded.");

  } catch (error) {
    container.innerHTML = `
      <div class="evoker-empty">
        <h3>News is temporarily unavailable</h3>
        <p>Try again or explore headlines from Google News.</p>
        <div class="evoker-news-actions">
          <button class="secondary-button" id="retryNewsButton">
            Try Again
          </button>
          <a href="https://news.google.com/"
             target="_blank" rel="noopener">
            Open Google News
          </a>
        </div>
      </div>
    `;

    $("retryNewsButton").onclick = () => loadNews(category);
    setStatus("News source unavailable.");
  }
}

/* =========================================
   DOWNLOADS
========================================= */

function renderDownloads() {
  const container = $("downloadsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!downloads.length) {
    container.textContent =
      "Downloads are managed by your device browser.";
    return;
  }

  downloads.forEach(item => {
    const row = document.createElement("div");
    row.className = "saved-item";
    row.textContent = item;
    container.appendChild(row);
  });
}

/* =========================================
   THEME
========================================= */

function applyTheme(theme) {
  const dark = theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.body.classList.toggle("dark", dark);
  localStorage.setItem(STORAGE.theme, theme);

  if ($("appearanceSelect")) {
    $("appearanceSelect").value = theme;
  }
}

/* =========================================
   ADDRESS SUGGESTIONS
========================================= */

function setupSuggestions() {
  const input = $("addressInput");
  const box = $("suggestionsBox");
  const list = $("suggestionsList");

  if (!input || !box || !list) return;

  input.addEventListener("input", () => {
    const value = input.value.trim();
    list.innerHTML = "";

    if (!value) {
      box.classList.add("hidden");
      return;
    }

    const options = [
      "Search " + value,
      "Images of " + value,
      "Videos of " + value
    ];

    options.forEach(text => {
      const button = document.createElement("button");
      button.textContent = text;

      button.onclick = () => {
        input.value = text;
        box.classList.add("hidden");
        navigate(text);
      };

      list.appendChild(button);
    });

    box.classList.remove("hidden");
  });
}

/* =========================================
   ALL EVENT LISTENERS
========================================= */

function initializeEvoker() {
  addPremiumStyles();

  // Search bar: external only
  $("searchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    navigate($("addressInput").value);
    $("suggestionsBox")?.classList.add("hidden");
  });

  $("homeSearchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    navigate($("homeSearchInput").value);
  });

  // Browser buttons
  $("newTabButton")?.addEventListener("click", newTab);
  $("homeButton")?.addEventListener("click", goHome);
  $("bookmarkButton")?.addEventListener("click", addBookmark);

  $("openExternalButton")?.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab?.url) {
      window.open(tab.url, "_blank", "noopener,noreferrer");
    }
  });

  $("reloadButton")?.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab?.url) {
      window.open(tab.url, "_blank", "noopener,noreferrer");
    } else {
      location.reload();
    }
  });

  $("backButton")?.addEventListener("click", () => {
    setStatus("Use Back in your external browser.");
  });

  $("forwardButton")?.addEventListener("click", () => {
    setStatus("Use Forward in your external browser.");
  });

  $("clearAddressButton")?.addEventListener("click", () => {
    $("addressInput").value = "";
    $("addressInput").focus();
  });

  // Guest Mode
  $("profileButton")?.addEventListener("click", openGuestPanel);
  $("guestMenuButton")?.addEventListener("click", openGuestPanel);
  $("continueGuestButton")?.addEventListener("click", continueAsGuest);

  // Closing the welcome panel also continues as Guest
  $("closeGuestButton")?.addEventListener("click", continueAsGuest);

  // Menu
  $("menuButton")?.addEventListener("click", () => {
    $("browserMenu")?.classList.toggle("hidden");
  });

  $("settingsButton")?.addEventListener("click", () => {
    showPage("settings");
  });

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  // Discover categories open external destinations/search
  const discoverSearches = {
    web: "web search",
    images: "images",
    videos: "videos",
    news: "latest news",
    shopping: "shopping",
    maps: "maps"
  };

  document.querySelectorAll(".discover-card, .preview-card").forEach(button => {
    button.addEventListener("click", () => {
      const type = button.dataset.search;

      if (type === "news") {
        showPage("news");
        return;
      }

      navigate(discoverSearches[type] || type);
    });
  });

  // Search engine
  $("settingsSearchEngine")?.addEventListener("change", event => {
    localStorage.setItem(STORAGE.engine, event.target.value);
    if ($("searchEngineSelect")) {
      $("searchEngineSelect").value = event.target.value;
    }
  });

  $("searchEngineSelect")?.addEventListener("change", event => {
    localStorage.setItem(STORAGE.engine, event.target.value);
    if ($("settingsSearchEngine")) {
      $("settingsSearchEngine").value = event.target.value;
    }
  });

  // Theme
  $("themeToggle")?.addEventListener("click", () => {
    const dark = document.body.classList.contains("dark");
    applyTheme(dark ? "light" : "dark");
  });

  $("appearanceSelect")?.addEventListener("change", event => {
    applyTheme(event.target.value);
  });

  // Homepage
  $("homepageSelect")?.addEventListener("change", event => {
    localStorage.setItem(STORAGE.homepage, event.target.value);
  });

  // News
  $("refreshNewsButton")?.addEventListener("click", () => {
    loadNews(currentNewsCategory);
  });

  document.querySelectorAll(".news-filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".news-filter").forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");
      loadNews(button.dataset.category || "all");
    });
  });

  // History
  $("clearHistoryButton")?.addEventListener("click", () => {
    if (!confirm("Delete all browsing history?")) return;

    historyItems = [];
    saveData();
    renderHistory();
    setStatus("History cleared.");
  });

  // Clear all data
  $("clearDataButton")?.addEventListener("click", () => {
    if (!confirm("Clear all EVOKER browser data?")) return;

    Object.values(STORAGE).forEach(key => {
      localStorage.removeItem(key);
    });

    location.reload();
  });

  setupSuggestions();

  document.addEventListener("click", event => {
    if (!event.target.closest("#searchForm")) {
      $("suggestionsBox")?.classList.add("hidden");
    }

    if (
      !event.target.closest("#browserMenu") &&
      !event.target.closest("#menuButton")
    ) {
      $("browserMenu")?.classList.add("hidden");
    }
  });

  // Initial setup
  const savedTheme = localStorage.getItem(STORAGE.theme) || "light";
  const savedEngine = getSearchEngine();
  const savedHomepage = localStorage.getItem(STORAGE.homepage) || "home";

  applyTheme(savedTheme);

  if ($("searchEngineSelect")) {
    $("searchEngineSelect").value = savedEngine;
  }

  if ($("settingsSearchEngine")) {
    $("settingsSearchEngine").value = savedEngine;
  }

  if ($("homepageSelect")) {
    $("homepageSelect").value = savedHomepage;
  }

  renderQuickLinks();
  createTab();

  if (localStorage.getItem(STORAGE.guest) !== "true") {
    openGuestPanel();
  } else {
    if ($("profileLabel")) $("profileLabel").textContent = "Guest";
  }

  setStatus("EVOKER is ready.");
}

initializeEvoker();
