
"use strict";

/* EVOKER - FIXED MAIN SCRIPT */

const $ = id => document.getElementById(id);

const STORAGE = {
  history: "evoker_history",
  bookmarks: "evoker_bookmarks",
  theme: "evoker_theme",
  engine: "evoker_engine",
  guest: "evoker_guest",
  homepage: "evoker_homepage"
};

let tabs = [];
let activeTab = 0;
let historyItems = safeRead(STORAGE.history);
let bookmarks = safeRead(STORAGE.bookmarks);
let currentCategory = "all";

function safeRead(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE.history, JSON.stringify(historyItems));
  localStorage.setItem(STORAGE.bookmarks, JSON.stringify(bookmarks));
}

function status(message) {
  if ($("connectionStatus")) {
    $("connectionStatus").textContent = message;
  }
}

function listen(id, event, callback) {
  const element = $(id);
  if (element) element.addEventListener(event, callback);
}

function engineURL(query) {
  const engine = localStorage.getItem(STORAGE.engine) || "google";

  const engines = {
    google: "https://www.google.com/search?q=",
    bing: "https://www.bing.com/search?q=",
    duckduckgo: "https://duckduckgo.com/?q="
  };

  return (engines[engine] || engines.google) +
    encodeURIComponent(query);
}

/* EXTERNAL SEARCH - NO INTERNAL SEARCH */

function navigate(value) {
  const text = String(value || "").trim();

  if (!text) {
    status("Enter a website or search term.");
    return;
  }

  let url;

  if (/^(https?:\/\/)/i.test(text)) {
    url = text;
  } else if (/^[\w-]+\.[a-z]{2,}([/?#].*)?$/i.test(text)) {
    url = "https://" + text;
  } else {
    url = engineURL(text);
  }

  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid URL");
    }

    url = parsed.href;
  } catch {
    status("Invalid website address.");
    return;
  }

  window.open(url, "_blank", "noopener");

  historyItems.unshift({
    url,
    time: new Date().toLocaleString()
  });

  historyItems = historyItems.slice(0, 200);
  save();

  status("Opened in external browser.");
}

/* PAGE NAVIGATION */

function showPage(page) {
  const valid = [
    "home", "discover", "news",
    "bookmarks", "history",
    "downloads", "settings"
  ];

  if (!valid.includes(page)) return;

  document.querySelectorAll(".content-page").forEach(item => {
    item.classList.add("hidden");
  });

  const target = $(page + "Page");
  if (target) target.classList.remove("hidden");

  if ($("browserMenu")) {
    $("browserMenu").classList.add("hidden");
  }

  if (page === "news") loadNews(currentCategory);
  if (page === "history") renderHistory();
  if (page === "bookmarks") renderBookmarks();

  status(page.charAt(0).toUpperCase() + page.slice(1));
}

function goHome() {
  showPage("home");
}

/* SEARCH FORMS */

listen("searchForm", "submit", event => {
  event.preventDefault();
  navigate($("addressInput")?.value);
});

listen("homeSearchForm", "submit", event => {
  event.preventDefault();
  navigate($("homeSearchInput")?.value);
});

listen("clearAddressButton", "click", () => {
  if ($("addressInput")) {
    $("addressInput").value = "";
    $("addressInput").focus();
  }
});

/* TABS */

function renderTabs() {
  const container = $("tabsContainer");
  if (!container) return;

  container.innerHTML = "";

  tabs.forEach((tab, index) => {
    const button = document.createElement("button");
    button.className =
      "browser-tab" + (index === activeTab ? " active" : "");

    button.textContent = tab;

    button.addEventListener("click", () => {
      activeTab = index;
      renderTabs();
      goHome();
    });

    container.appendChild(button);
  });
}

function newTab() {
  tabs.push("New Tab " + (tabs.length + 1));
  activeTab = tabs.length - 1;
  renderTabs();
  goHome();
}

listen("newTabButton", "click", newTab);

/* QUICK LINKS */

function renderQuickLinks() {
  const container = $("quickLinksContainer");
  if (!container) return;

  const links = [
    ["Google", "https://google.com", "G"],
    ["YouTube", "https://youtube.com", "Y"],
    ["Wikipedia", "https://wikipedia.org", "W"],
    ["GitHub", "https://github.com", "GH"],
    ["Bing", "https://bing.com", "B"],
    ["DuckDuckGo", "https://duckduckgo.com", "D"]
  ];

  container.innerHTML = "";

  links.forEach(([name, url, icon]) => {
    const button = document.createElement("button");
    button.className = "quick-link";

    const symbol = document.createElement("span");
    symbol.className = "shortcut-icon";
    symbol.textContent = icon;

    const label = document.createElement("span");
    label.textContent = name;

    button.append(symbol, label);
    button.addEventListener("click", () => navigate(url));

    container.appendChild(button);
  });
}

/* MENU */

listen("menuButton", "click", () => {
  $("browserMenu")?.classList.toggle("hidden");
});

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

listen("settingsButton", "click", () => showPage("settings"));

/* DISCOVER */

const discoverQueries = {
  web: "web search",
  images: "images",
  videos: "videos",
  news: "latest news",
  shopping: "online shopping",
  maps: "maps"
};

document.querySelectorAll(".discover-card, .preview-card")
  .forEach(button => {
    button.addEventListener("click", () => {
      const query = discoverQueries[button.dataset.search];
      navigate(query || "web search");
    });
  });

/* GUEST MODE */

function openGuest() {
  $("guestPanel")?.classList.remove("hidden");
}

function closeGuest() {
  $("guestPanel")?.classList.add("hidden");
}

function continueGuest() {
  localStorage.setItem(STORAGE.guest, "true");
  closeGuest();

  if ($("profileLabel")) {
    $("profileLabel").textContent = "Guest";
  }

  status("Browsing as Guest");
}

listen("profileButton", "click", openGuest);
listen("guestMenuButton", "click", openGuest);
listen("continueGuestButton", "click", continueGuest);
listen("closeGuestButton", "click", closeGuest);

/* HISTORY */

function renderHistory() {
  const container = $("historyContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!historyItems.length) {
    container.textContent = "No browsing history yet.";
    return;
  }

  historyItems.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "saved-item";

    const link = document.createElement("button");
    link.textContent = item.url;
    link.addEventListener("click", () => navigate(item.url));

    const remove = document.createElement("button");
    remove.textContent = "Remove";

    remove.addEventListener("click", () => {
      historyItems.splice(index, 1);
      save();
      renderHistory();
    });

    row.append(link, remove);
    container.appendChild(row);
  });
}

listen("clearHistoryButton", "click", () => {
  if (!confirm("Clear browsing history?")) return;

  historyItems = [];
  save();
  renderHistory();
});

/* BOOKMARKS */

function addBookmark() {
  const input = $("addressInput");
  const url = input?.value.trim();

  if (!url) {
    status("Enter a website first.");
    return;
  }

  bookmarks.unshift({
    url,
    title: url
  });

  save();
  status("Bookmark saved.");
}

function renderBookmarks() {
  const container = $("bookmarksContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!bookmarks.length) {
    container.textContent = "No bookmarks saved.";
    return;
  }

  bookmarks.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "saved-item";

    const link = document.createElement("button");
    link.textContent = item.title || item.url;
    link.addEventListener("click", () => navigate(item.url));

    const remove = document.createElement("button");
    remove.textContent = "Remove";

    remove.addEventListener("click", () => {
      bookmarks.splice(index, 1);
      save();
      renderBookmarks();
    });

    row.append(link, remove);
    container.appendChild(row);
  });
}

listen("bookmarkButton", "click", addBookmark);

/* NEWS EXPLORER */

const newsQueries = {
  all: "India",
  india: "India",
  world: "world",
  technology: "technology",
  sports: "sports",
  business: "business"
};

async function loadNews(category = "all") {
  const container = $("newsContainer");
  if (!container) return;

  currentCategory = category;
  container.innerHTML = "<p>Loading latest news...</p>";

  const query = encodeURIComponent(
    newsQueries[category] || "India"
  );

  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc" +
    "?query=" + query +
    "&mode=ArtList&format=json&maxrecords=15&sort=DateDesc";

  try {
    const response = await fetch(url);

    if (!response.ok) throw new Error("News request failed");

    const data = await response.json();
    container.innerHTML = "";

    (data.articles || []).forEach(article => {
      const card = document.createElement("article");
      card.className = "news-card";

      const image = document.createElement("img");
      image.className = "news-image";
      image.alt = "News image";
      image.loading = "lazy";
      image.src = article.socialimage || 
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700";

      const title = document.createElement("h3");
      title.textContent = article.title || "News update";

      const source = document.createElement("p");
      source.textContent = article.domain || "News";

      const link = document.createElement("a");
      link.href = article.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Read full story";

      card.append(image, title, source, link);
      container.appendChild(card);
    });

    if (!container.children.length) {
      throw new Error("No articles found");
    }

    status("News updated");
  } catch (error) {
    container.innerHTML = `
      <div class="news-fallback">
        <h3>News is temporarily unavailable</h3>
        <p>You can still read the latest headlines.</p>
        <a href="https://news.google.com/" target="_blank"
           rel="noopener noreferrer">Open Google News</a>
        <button id="retryNewsButton">Try Again</button>
      </div>
    `;

    listen("retryNewsButton", "click", () => loadNews(category));
    status("News service unavailable");
  }
}

listen("refreshNewsButton", "click", () => {
  loadNews(currentCategory);
});

document.querySelectorAll(".news-filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".news-filter").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    loadNews(button.dataset.category);
  });
});

/* THEME */

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

listen("themeToggle", "click", () => {
  const dark = document.body.classList.contains("dark");
  applyTheme(dark ? "light" : "dark");
});

listen("appearanceSelect", "change", event => {
  applyTheme(event.target.value);
});

/* SETTINGS */

listen("searchEngineSelect", "change", event => {
  localStorage.setItem(STORAGE.engine, event.target.value);
  if ($("settingsSearchEngine")) {
    $("settingsSearchEngine").value = event.target.value;
  }
});

listen("settingsSearchEngine", "change", event => {
  localStorage.setItem(STORAGE.engine, event.target.value);
  if ($("searchEngineSelect")) {
    $("searchEngineSelect").value = event.target.value;
  }
});

listen("homepageSelect", "change", event => {
  localStorage.setItem(STORAGE.homepage, event.target.value);
});

listen("clearDataButton", "click", () => {
  if (!confirm("Clear all EVOKER data?")) return;

  Object.values(STORAGE).forEach(key => {
    localStorage.removeItem(key);
  });

  location.reload();
});

/* NAVIGATION CONTROLS */

listen("homeButton", "click", goHome);

listen("reloadButton", "click", () => {
  status("External pages are controlled by your browser.");
});

listen("backButton", "click", () => {
  status("Use your browser's Back button.");
});

listen("forwardButton", "click", () => {
  status("Use your browser's Forward button.");
});

listen("openExternalButton", "click", () => {
  const value = $("addressInput")?.value;
  if (value) navigate(value);
});

/* DOWNLOADS */

function renderDownloads() {
  const container = $("downloadsContainer");
  if (!container) return;

  container.innerHTML =
    "Downloads are managed by your device browser.";
}

showPage("home");

/* INITIALIZE */

function initializeEvoker() {
  tabs = ["New Tab"];
  activeTab = 0;

  renderTabs();
  renderQuickLinks();

  const theme = localStorage.getItem(STORAGE.theme) || "light";
  applyTheme(theme);

  const engine = localStorage.getItem(STORAGE.engine) || "google";

  if ($("searchEngineSelect")) {
    $("searchEngineSelect").value = engine;
  }

  if ($("settingsSearchEngine")) {
    $("settingsSearchEngine").value = engine;
  }

  if ($("homepageSelect")) {
    $("homepageSelect").value =
      localStorage.getItem(STORAGE.homepage) || "home";
  }

  if ($("profileLabel")) {
    $("profileLabel").textContent = "Guest";
  }

  if (localStorage.getItem(STORAGE.guest) !== "true") {
    openGuest();
  }

  status("EVOKER is ready");
}

initializeEvoker();
