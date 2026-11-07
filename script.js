
"use strict";

/* =====================================
   EVOKER MINI WEB BROWSER
   Main JavaScript
===================================== */

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

function readData(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

let historyItems = readData(STORAGE.history);
let bookmarks = readData(STORAGE.bookmarks);
let downloads = readData(STORAGE.downloads);

let tabs = [];
let activeTab = null;
let tabCounter = 0;
let currentPage = "home";
let guestMode = true;

const searchEngines = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q="
};

const quickLinks = [
  { name: "Google", url: "https://www.google.com", icon: "G" },
  { name: "YouTube", url: "https://www.youtube.com", icon: "Y" },
  { name: "Wikipedia", url: "https://www.wikipedia.org", icon: "W" },
  { name: "GitHub", url: "https://github.com", icon: "GH" },
  { name: "Bing", url: "https://www.bing.com", icon: "B" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com", icon: "D" }
];

/* =====================================
   STORAGE
===================================== */

function saveData() {
  localStorage.setItem(STORAGE.history, JSON.stringify(historyItems));
  localStorage.setItem(STORAGE.bookmarks, JSON.stringify(bookmarks));
  localStorage.setItem(STORAGE.downloads, JSON.stringify(downloads));
}

function setStatus(message) {
  $("connectionStatus").textContent = message;
}

/* =====================================
   URL AND SEARCH
===================================== */

function isURL(value) {
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}([/?#][^\s]*)?$/i.test(value);
}

function normalizeURL(value) {
  let url = value.trim();

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.href;
  } catch {
    return "";
  }
}

function getSearchEngine() {
  return localStorage.getItem(STORAGE.engine) || "google";
}

function searchURL(query) {
  const engine = getSearchEngine();
  const base = searchEngines[engine] || searchEngines.google;

  return base + encodeURIComponent(query.trim());
}

function makeSearchURL(value) {
  const text = value.trim();

  if (!text) return "";

  return isURL(text)
    ? normalizeURL(text)
    : searchURL(text);
}

function navigate(value) {
  const url = makeSearchURL(value);

  if (!url) {
    setStatus("Please enter a valid address.");
    return;
  }

  openWebsite(url);
}

/* =====================================
   TABS
===================================== */

function createTab() {
  tabCounter++;

  const tab = {
    id: tabCounter,
    url: "",
    title: "New Tab"
  };

  tabs.push(tab);
  activeTab = tab.id;

  renderTabs();
  showPage("home");

  return tab;
}

function getActiveTab() {
  return tabs.find(tab => tab.id === activeTab);
}

function renderTabs() {
  const container = $("tabsContainer");
  container.innerHTML = "";

  tabs.forEach(tab => {
    const button = document.createElement("button");

    button.className =
      "browser-tab" + (tab.id === activeTab ? " active" : "");

    const label = document.createElement("span");
    label.textContent = tab.title;

    const close = document.createElement("span");
    close.textContent = " ×";
    close.title = "Close tab";

    close.addEventListener("click", event => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    button.append(label, close);

    button.addEventListener("click", () => {
      activeTab = tab.id;
      renderTabs();

      if (tab.url) {
        showPage("website");
        $("websiteFrame").src = tab.url;
        $("addressInput").value = tab.url;
        $("currentWebsiteTitle").textContent = tab.title;
      } else {
        goHome();
      }
    });

    container.appendChild(button);
  });
}

function newTab() {
  createTab();
}

function closeTab(id) {
  if (tabs.length === 1) {
    const tab = getActiveTab();

    if (tab) {
      tab.url = "";
      tab.title = "New Tab";
    }

    goHome();
    renderTabs();
    return;
  }

  const closingIndex = tabs.findIndex(tab => tab.id === id);

  tabs = tabs.filter(tab => tab.id !== id);

  if (activeTab === id) {
    const nextTab = tabs[Math.max(0, closingIndex - 1)];
    activeTab = nextTab.id;

    if (nextTab.url) {
      showPage("website");
      $("websiteFrame").src = nextTab.url;
      $("addressInput").value = nextTab.url;
      $("currentWebsiteTitle").textContent = nextTab.title;
    } else {
      goHome();
    }
  }

  renderTabs();
}

/* =====================================
   WEBSITE VIEWER
===================================== */

function openWebsite(url) {
  const tab = getActiveTab();

  if (!tab) {
    createTab();
  }

  const active = getActiveTab();

  active.url = url;

  try {
    active.title = new URL(url).hostname;
  } catch {
    active.title = "Website";
  }

  $("addressInput").value = url;
  $("currentWebsiteTitle").textContent = active.title;

  showPage("website");

  $("websiteFrame").src = url;

  addHistory(url);
  renderTabs();

  setStatus("Opening website...");
}

$("websiteFrame").addEventListener("load", () => {
  if (currentPage === "website") {
    setStatus("Page loaded or loading completed.");
  }
});

function openExternal() {
  const tab = getActiveTab();

  if (!tab?.url) return;

  window.open(tab.url, "_blank", "noopener,noreferrer");
}

function goHome() {
  const tab = getActiveTab();

  if (tab) {
    tab.url = "";
    tab.title = "New Tab";
  }

  $("addressInput").value = "";
  showPage("home");
  renderTabs();

  setStatus("Ready");
}

/* =====================================
   PAGE NAVIGATION
===================================== */

function showPage(page) {
  const validPages = [
    "home",
    "website",
    "discover",
    "news",
    "bookmarks",
    "history",
    "downloads",
    "settings"
  ];

  if (!validPages.includes(page)) return;

  currentPage = page;

  document.querySelectorAll(".content-page").forEach(element => {
    element.classList.add("hidden");
  });

  const target = $(page + "Page");

  if (target) {
    target.classList.remove("hidden");
  }

  $("browserMenu").classList.add("hidden");

  if (page === "bookmarks") renderBookmarks();
  if (page === "history") renderHistory();
  if (page === "downloads") renderDownloads();
  if (page === "news") loadNews();
}

function goToSavedPage(page) {
  showPage(page);
}

/* =====================================
   GUEST MODE
===================================== */

function openGuestPanel() {
  $("guestPanel").classList.remove("hidden");
}

function closeGuestPanel() {
  $("guestPanel").classList.add("hidden");
}

function continueAsGuest() {
  guestMode = true;

  localStorage.setItem(STORAGE.guest, "true");

  $("profileLabel").textContent = "Guest";

  closeGuestPanel();

  setStatus("Browsing as Guest");

  const homepage = localStorage.getItem(STORAGE.homepage) || "home";
  showPage(homepage);
}

function exitGuestMode() {
  const confirmExit = confirm(
    "Exit Guest Mode? Your saved browser data will remain on this device."
  );

  if (!confirmExit) return;

  closeGuestPanel();
  setStatus("Guest session ended");

  // This browser has no real account system yet.
  // Returning to Guest Mode is currently the available option.
  openGuestPanel();
}

$("profileButton").addEventListener("click", openGuestPanel);
$("guestMenuButton").addEventListener("click", openGuestPanel);
$("continueGuestButton").addEventListener("click", continueAsGuest);
$("closeGuestButton").addEventListener("click", closeGuestPanel);

/* =====================================
   HISTORY
===================================== */

function addHistory(url) {
  historyItems.unshift({
    url,
    time: new Date().toLocaleString()
  });

  historyItems = historyItems.slice(0, 300);

  saveData();
}

function renderHistory() {
  const container = $("historyContainer");
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
    link.textContent = item.url;

    link.addEventListener("click", () => navigate(item.url));

    const time = document.createElement("small");
    time.textContent = item.time;

    info.append(link, document.createElement("br"), time);

    const remove = document.createElement("button");
    remove.textContent = "Remove";

    remove.addEventListener("click", () => {
      historyItems.splice(index, 1);
      saveData();
      renderHistory();
    });

    row.append(info, remove);
    container.appendChild(row);
  });
}

$("clearHistoryButton").addEventListener("click", () => {
  if (!confirm("Delete all browsing history?")) return;

  historyItems = [];
  saveData();
  renderHistory();

  setStatus("History cleared");
});

/* =====================================
   BOOKMARKS
===================================== */

function addBookmark() {
  const tab = getActiveTab();

  if (!tab?.url) {
    setStatus("Open a website first.");
    return;
  }

  if (bookmarks.some(item => item.url === tab.url)) {
    setStatus("This website is already bookmarked.");
    return;
  }

  bookmarks.unshift({
    url: tab.url,
    title: tab.title,
    time: new Date().toLocaleDateString()
  });

  saveData();
  setStatus("Bookmark saved successfully");
}

function renderBookmarks() {
  const container = $("bookmarksContainer");
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

    link.addEventListener("click", () => navigate(item.url));

    const remove = document.createElement("button");
    remove.textContent = "Remove";

    remove.addEventListener("click", () => {
      bookmarks.splice(index, 1);
      saveData();
      renderBookmarks();
    });

    row.append(link, remove);
    container.appendChild(row);
  });
}

/* =====================================
   QUICK LINKS
===================================== */

function renderQuickLinks() {
  const container = $("quickLinksContainer");
  container.innerHTML = "";

  quickLinks.forEach(item => {
    const button = document.createElement("button");
    button.className = "quick-link";

    const icon = document.createElement("span");
    icon.className = "shortcut-icon";
    icon.textContent = item.icon;

    const label = document.createElement("span");
    label.textContent = item.name;

    button.append(icon, label);

    button.addEventListener("click", () => navigate(item.url));

    container.appendChild(button);
  });
}

/* =====================================
   NAVIGATION BUTTONS
===================================== */

$("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  navigate($("addressInput").value);
  $("suggestionsBox").classList.add("hidden");
});

$("homeSearchForm").addEventListener("submit", event => {
  event.preventDefault();
  navigate($("homeSearchInput").value);
});

$("newTabButton").addEventListener("click", newTab);
$("homeButton").addEventListener("click", goHome);
$("openExternalButton").addEventListener("click", openExternal);
$("bookmarkButton").addEventListener("click", addBookmark);

$("reloadButton").addEventListener("click", () => {
  const tab = getActiveTab();

  if (tab?.url) {
    $("websiteFrame").src = tab.url;
    setStatus("Reloading...");
  }
});

$("backButton").addEventListener("click", () => {
  try {
    $("websiteFrame").contentWindow.history.back();
  } catch {
    setStatus("Back navigation unavailable for this website.");
  }
});

$("forwardButton").addEventListener("click", () => {
  try {
    $("websiteFrame").contentWindow.history.forward();
  } catch {
    setStatus("Forward navigation unavailable.");
  }
});

$("clearAddressButton").addEventListener("click", () => {
  $("addressInput").value = "";
  $("addressInput").focus();
});

$("menuButton").addEventListener("click", () => {
  $("browserMenu").classList.toggle("hidden");
});

$("settingsButton").addEventListener("click", () => {
  showPage("settings");
});

/* =====================================
   MENU AND DISCOVER
===================================== */

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

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
    const query = discoverSearches[type] || type;

    navigate(query);
  });
});

/* =====================================
   ADDRESS SUGGESTIONS
===================================== */

$("addressInput").addEventListener("input", event => {
  const value = event.target.value.trim();
  const box = $("suggestionsBox");
  const list = $("suggestionsList");

  list.innerHTML = "";

  if (!value) {
    box.classList.add("hidden");
    return;
  }

  const suggestions = [
    "Search " + value,
    value + ".com",
    "Images of " + value,
    "Videos of " + value
  ];

  suggestions.forEach(text => {
    const button = document.createElement("button");
    button.textContent = text;

    button.addEventListener("click", () => {
      $("addressInput").value = text;
      box.classList.add("hidden");
      navigate(text);
    });

    list.appendChild(button);
  });

  box.classList.remove("hidden");
});

document.addEventListener("click", event => {
  if (!event.target.closest("#searchForm")) {
    $("suggestionsBox").classList.add("hidden");
  }

  if (
    !event.target.closest("#browserMenu") &&
    !event.target.closest("#menuButton")
  ) {
    $("browserMenu").classList.add("hidden");
  }
});

/* =====================================
   THEME
===================================== */

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

$("themeToggle").addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark");
  applyTheme(dark ? "dark" : "light");
});

$("appearanceSelect").addEventListener("change", event => {
  applyTheme(event.target.value);
});

/* =====================================
   SETTINGS
===================================== */

$("settingsSearchEngine").addEventListener("change", event => {
  localStorage.setItem(STORAGE.engine, event.target.value);
  $("searchEngineSelect").value = event.target.value;
});

$("searchEngineSelect").addEventListener("change", event => {
  localStorage.setItem(STORAGE.engine, event.target.value);
  $("settingsSearchEngine").value = event.target.value;
});

$("homepageSelect").addEventListener("change", event => {
  localStorage.setItem(STORAGE.homepage, event.target.value);
});

$("clearDataButton").addEventListener("click", () => {
  if (!confirm("Clear all EVOKER browser data?")) return;

  Object.values(STORAGE).forEach(key => {
    localStorage.removeItem(key);
  });

  location.reload();
});

/* =====================================
   NEWS EXPLORER
===================================== */

const newsQueries = {
  all: "India",
  india: "India",
  world: "world news",
  technology: "technology",
  sports: "sports",
  business: "business"
};

async function loadNews(category = "all") {
  const container = $("newsContainer");
  container.innerHTML = "Loading news...";

  try {
    const query = encodeURIComponent(newsQueries[category] || "India");

    const url =
      "https://api.gdeltproject.org/api/v2/doc/doc" +
      "?query=" + query +
      "&mode=ArtList&format=json&maxrecords=15&sort=DateDesc";

    const response = await fetch(url);

    if (!response.ok) throw new Error("News API error");

    const data = await response.json();

    container.innerHTML = "";

    (data.articles || []).forEach(article => {
      const card = document.createElement("article");
      card.className = "news-card";

      const title = document.createElement("h3");
      title.textContent = article.title || "Untitled article";

      const source = document.createElement("p");
      source.textContent = article.domain || "News source";

      const link = document.createElement("a");
      link.href = article.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Read article";

      card.append(title, source, link);
      container.appendChild(card);
    });

    if (!container.children.length) {
      container.textContent = "No news articles found.";
    }
  } catch (error) {
    container.textContent =
      "News could not be loaded. Please try again later.";
  }
}

$("refreshNewsButton").addEventListener("click", () => {
  const active = document.querySelector(".news-filter.active");
  loadNews(active?.dataset.category || "all");
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

/* =====================================
   DOWNLOADS
===================================== */

function renderDownloads() {
  const container = $("downloadsContainer");
  container.innerHTML = "";

  if (!downloads.length) {
    container.textContent =
      "No download records yet. Downloads are handled by your browser.";
    return;
  }

  downloads.forEach(item => {
    const row = document.createElement("div");
    row.className = "saved-item";
    row.textContent = item;
    container.appendChild(row);
  });
}

/* =====================================
   INITIALIZE EVOKER
===================================== */

function initializeEvoker() {
  const savedTheme = localStorage.getItem(STORAGE.theme) || "light";
  const savedEngine = getSearchEngine();
  const savedHomepage = localStorage.getItem(STORAGE.homepage) || "home";

  applyTheme(savedTheme);

  $("searchEngineSelect").value = savedEngine;
  $("settingsSearchEngine").value = savedEngine;
  $("homepageSelect").value = savedHomepage;

  guestMode = true;
  $("profileLabel").textContent = "Guest";

  renderQuickLinks();

  createTab();

  if (localStorage.getItem(STORAGE.guest) !== "true") {
    openGuestPanel();
  } else {
    continueAsGuest();
  }

  setStatus("EVOKER is ready");
}

initializeEvoker();
