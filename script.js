
const $ = (id) => document.getElementById(id);

let tabs = [{ id: 1, url: "", title: "New Tab" }];
let activeTab = 1;
let historyItems = JSON.parse(localStorage.getItem("em_history") || "[]");
let bookmarks = JSON.parse(localStorage.getItem("em_bookmarks") || "[]");
let downloads = JSON.parse(localStorage.getItem("em_downloads") || "[]");
let currentPage = "home";

const searchEngines = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q="
};

function saveData() {
  localStorage.setItem("em_history", JSON.stringify(historyItems));
  localStorage.setItem("em_bookmarks", JSON.stringify(bookmarks));
  localStorage.setItem("em_downloads", JSON.stringify(downloads));
}

function getActiveTab() {
  return tabs.find(tab => tab.id === activeTab);
}

function isURL(value) {
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}([/?#].*)?$/i.test(value);
}

function normalizeURL(value) {
  value = value.trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  return value;
}

function searchURL(value) {
  const engine = $("searchEngineSelect")?.value || "google";
  return (searchEngines[engine] || searchEngines.google) +
    encodeURIComponent(value);
}

function navigate(value) {
  if (!value.trim()) return;

  const url = isURL(value) ? normalizeURL(value) : searchURL(value);
  openWebsite(url);
}

function openWebsite(url) {
  const frame = $("websiteFrame");
  if (!frame) return;

  const tab = getActiveTab();
  if (tab) {
    tab.url = url;
    tab.title = url;
  }

  $("addressInput").value = url;
  $("homePage").classList.add("hidden");
  $("websitePage").classList.remove("hidden");

  document.querySelectorAll(".content-page").forEach(page => {
    if (page.id !== "websitePage") page.classList.add("hidden");
  });

  $("currentWebsiteTitle").textContent = url;
  $("connectionStatus").textContent = "Loading website...";

  frame.src = url;

  const warning = $("websiteWarning");
  if (warning) {
    warning.textContent =
      "Some websites block embedded viewing. If this page does not load, use Open External.";
  }

  historyItems.unshift({
    url,
    time: new Date().toLocaleString()
  });

  historyItems = historyItems.slice(0, 200);
  saveData();
  updateTabs();
  currentPage = "website";
}

function showPage(page) {
  currentPage = page;

  document.querySelectorAll(".content-page").forEach(item => {
    item.classList.add("hidden");
  });

  const target = $(page + "Page");
  if (target) target.classList.remove("hidden");

  $("websitePage").classList.toggle("hidden", page !== "website");
  $("homePage").classList.toggle("hidden", page !== "home");

  $("browserMenu").classList.add("hidden");

  if (page === "bookmarks") renderBookmarks();
  if (page === "history") renderHistory();
  if (page === "downloads") renderDownloads();
}

function goHome() {
  showPage("home");
  $("addressInput").value = "";
  $("connectionStatus").textContent = "Ready";
}

function updateTabs() {
  const container = $("tabsContainer");
  container.innerHTML = "";

  tabs.forEach(tab => {
    const element = document.createElement("button");
    element.className = "browser-tab" +
      (tab.id === activeTab ? " active" : "");

    element.textContent = tab.title.length > 22
      ? tab.title.slice(0, 22) + "..."
      : tab.title;

    element.onclick = () => {
      activeTab = tab.id;
      updateTabs();

      if (tab.url) openWebsite(tab.url);
      else goHome();
    };

    const close = document.createElement("span");
    close.textContent = " ×";
    close.onclick = (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    };

    element.appendChild(close);
    container.appendChild(element);
  });
}

function newTab() {
  const id = Date.now();
  tabs.push({ id, url: "", title: "New Tab" });
  activeTab = id;
  updateTabs();
  goHome();
}

function closeTab(id) {
  if (tabs.length === 1) {
    tabs[0] = { id: Date.now(), url: "", title: "New Tab" };
    activeTab = tabs[0].id;
    goHome();
  } else {
    tabs = tabs.filter(tab => tab.id !== id);
    if (activeTab === id) {
      activeTab = tabs[tabs.length - 1].id;
      const tab = getActiveTab();
      if (tab.url) openWebsite(tab.url);
      else goHome();
    }
  }
  updateTabs();
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
    link.textContent = item;
    link.onclick = () => navigate(item);

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

function renderHistory() {
  const container = $("historyContainer");
  container.innerHTML = "";

  if (!historyItems.length) {
    container.textContent = "No browsing history.";
    return;
  }

  historyItems.forEach(item => {
    const row = document.createElement("div");
    row.className = "saved-item";

    const link = document.createElement("button");
    link.textContent = item.url;
    link.onclick = () => navigate(item.url);

    const time = document.createElement("small");
    time.textContent = item.time;

    row.append(link, time);
    container.appendChild(row);
  });
}

function renderDownloads() {
  const container = $("downloadsContainer");
  container.innerHTML = "";

  if (!downloads.length) {
    container.textContent = "No downloads recorded.";
    return;
  }

  downloads.forEach(item => {
    const row = document.createElement("div");
    row.className = "saved-item";
    row.textContent = item;
    container.appendChild(row);
  });
}

// Main address bar
$("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  navigate($("addressInput").value);
});

$("homeSearchForm").addEventListener("submit", event => {
  event.preventDefault();
  navigate($("homeSearchInput").value);
});

$("newTabButton").onclick = newTab;
$("homeButton").onclick = goHome;

$("reloadButton").onclick = () => {
  const tab = getActiveTab();
  if (tab?.url) $("websiteFrame").src = tab.url;
};

$("backButton").onclick = () => {
  try {
    $("websiteFrame").contentWindow.history.back();
  } catch {
    $("connectionStatus").textContent =
      "Browser history is unavailable for this website.";
  }
};

$("forwardButton").onclick = () => {
  try {
    $("websiteFrame").contentWindow.history.forward();
  } catch {
    $("connectionStatus").textContent =
      "Forward navigation is unavailable.";
  }
};

$("openExternalButton").onclick = () => {
  const tab = getActiveTab();
  if (tab?.url) window.open(tab.url, "_blank", "noopener");
};

$("bookmarkButton").onclick = () => {
  const tab = getActiveTab();
  if (!tab?.url) return;

  if (!bookmarks.includes(tab.url)) {
    bookmarks.push(tab.url);
    saveData();
    $("connectionStatus").textContent = "Bookmark saved";
  } else {
    $("connectionStatus").textContent = "Already bookmarked";
  }
};

$("clearAddressButton").onclick = () => {
  $("addressInput").value = "";
  $("addressInput").focus();
};

$("menuButton").onclick = () => {
  $("browserMenu").classList.toggle("hidden");
};

$("settingsButton").onclick = () => showPage("settings");
$("profileButton").onclick = () => {
  alert("Profile feature is coming soon.");
};

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll(".discover-card").forEach(button => {
  button.addEventListener("click", () => {
    const type = button.dataset.search;
    const searches = {
      web: "web search",
      images: "image search",
      videos: "video search",
      news: "latest news",
      shopping: "online shopping",
      maps: "maps"
    };
    navigate(searches[type] || type);
  });
});

// Theme
function applyTheme(theme) {
  const dark = theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.body.classList.toggle("dark", dark);
  localStorage.setItem("em_theme", theme);
}

$("themeToggle").onclick = () => {
  const dark = !document.body.classList.contains("dark");
  applyTheme(dark ? "dark" : "light");
  if ($("appearanceSelect")) {
    $("appearanceSelect").value = dark ? "dark" : "light";
  }
};

$("appearanceSelect").onchange = event => {
  applyTheme(event.target.value);
};

// Settings
$("settingsSearchEngine").onchange = event => {
  $("searchEngineSelect").value = event.target.value;
  localStorage.setItem("em_engine", event.target.value);
};

$("homepageSelect").onchange = event => {
  localStorage.setItem("em_homepage", event.target.value);
};

$("clearHistoryButton").onclick = () => {
  if (confirm("Clear all browsing history?")) {
    historyItems = [];
    saveData();
    renderHistory();
  }
};

$("clearDataButton").onclick = () => {
  if (confirm("Clear all EventManager browser data?")) {
    localStorage.removeItem("em_history");
    localStorage.removeItem("em_bookmarks");
    localStorage.removeItem("em_downloads");
    location.reload();
  }
};

// Quick links
const defaultLinks = [
  { name: "Google", url: "https://www.google.com" },
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "Wikipedia", url: "https://www.wikipedia.org" },
  { name: "GitHub", url: "https://github.com" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com" },
  { name: "Bing", url: "https://www.bing.com" }
];

function renderQuickLinks() {
  const container = $("quickLinksContainer");
  container.innerHTML = "";

  defaultLinks.forEach(item => {
    const button = document.createElement("button");
    button.className = "quick-link";
    button.textContent = item.name;
    button.onclick = () => navigate(item.url);
    container.appendChild(button);
  });
}

// Suggestions
$("addressInput").addEventListener("input", event => {
  const value = event.target.value.trim();
  const box = $("suggestionsBox");
  const list = $("suggestionsList");

  if (!value) {
    box.classList.add("hidden");
    return;
  }

  list.innerHTML = "";

  const options = [
    "Search " + value,
    "Open " + value + ".com",
    "Search images of " + value,
    "Search videos of " + value
  ];

  options.forEach(option => {
    const button = document.createElement("button");
    button.textContent = option;
    button.onclick = () => {
      $("addressInput").value = option;
      box.classList.add("hidden");
      navigate(option);
    };
    list.appendChild(button);
  });

  box.classList.remove("hidden");
});

document.addEventListener("click", event => {
  if (!event.target.closest("#searchForm")) {
    $("suggestionsBox").classList.add("hidden");
  }
});

// News API: GDELT public endpoint
async function loadNews() {
  const container = $("newsContainer");
  container.innerHTML = "Loading news...";

  try {
    const response = await fetch(
      "https://api.gdeltproject.org/api/v2/doc/doc?query=India&mode=ArtList&format=json&maxrecords=12&sort=DateDesc"
    );

    if (!response.ok) throw new Error("News service unavailable");

    const data = await response.json();
    container.innerHTML = "";

    (data.articles || []).forEach(article => {
      const card = document.createElement("article");
      card.className = "news-card";

      const title = document.createElement("h3");
      title.textContent = article.title || "Untitled news";

      const source = document.createElement("p");
      source.textContent = article.domain || "News source";

      const link = document.createElement("a");
      link.href = article.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Read article";

      card.append(title, source, link);
      container.appendChild(card);
    });

    if (!container.children.length) {
      container.textContent = "No news found.";
    }
  } catch (error) {
    container.textContent =
      "News could not be loaded right now. Please try again later.";
  }
}

$("refreshNewsButton").onclick = loadNews;

document.querySelectorAll(".news-filter").forEach(button => {
  button.onclick = () => {
    const category = button.dataset.category;
    const queries = {
      all: "India",
      india: "India",
      world: "world news",
      technology: "technology",
      sports: "sports",
      business: "business"
    };

    loadNewsByQuery(queries[category] || "India");
  };
});

async function loadNewsByQuery(query) {
  const container = $("newsContainer");
  container.innerHTML = "Loading news...";

  try {
    const url =
      "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
      encodeURIComponent(query) +
      "&mode=ArtList&format=json&maxrecords=12&sort=DateDesc";

    const response = await fetch(url);
    if (!response.ok) throw new Error();

    const data = await response.json();
    container.innerHTML = "";

    (data.articles || []).forEach(article => {
      const card = document.createElement("article");
      card.className = "news-card";

      const title = document.createElement("h3");
      title.textContent = article.title || "Untitled";

      const link = document.createElement("a");
      link.href = article.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Read article";

      card.append(title, link);
      container.appendChild(card);
    });

    if (!container.children.length) {
      container.textContent = "No articles found.";
    }
  } catch {
    container.textContent = "Unable to load news at the moment.";
  }
}

// Initial setup
const savedTheme = localStorage.getItem("em_theme") || "light";
applyTheme(savedTheme);

const savedEngine = localStorage.getItem("em_engine") || "google";
$("searchEngineSelect").value = savedEngine;
$("settingsSearchEngine").value = savedEngine;

$("appearanceSelect").value = savedTheme;
renderQuickLinks();
updateTabs();
showPage("home");
