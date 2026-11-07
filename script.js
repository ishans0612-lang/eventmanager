
/* =========================================
   EVOKER — MINI WEB BROWSER
   Guest • Search • News • Bookmarks • History
========================================= */

const $ = (id) => document.getElementById(id);

const STORAGE = {
  history: "evoker_history",
  bookmarks: "evoker_bookmarks",
  guest: "evoker_guest",
  theme: "evoker_theme",
  engine: "evoker_engine",
  homepage: "evoker_homepage"
};

let historyData = JSON.parse(localStorage.getItem(STORAGE.history) || "[]");
let bookmarks = JSON.parse(localStorage.getItem(STORAGE.bookmarks) || "[]");
let tabs = [];
let activeTab = 0;

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showPage(name) {
  document.querySelectorAll(".content-page").forEach(page => {
    page.classList.add("hidden");
  });

  const page = $(name + "Page");
  if (page) page.classList.remove("hidden");

  if (name === "history") renderHistory();
  if (name === "bookmarks") renderBookmarks();
  if (name === "news") loadNews();
  if (name === "downloads") renderDownloads();
}

function createTab() {
  const tab = {
    id: Date.now(),
    title: "New Tab",
    url: ""
  };

  tabs.push(tab);
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
    button.className = "browser-tab" + (index === activeTab ? " active" : "");
    button.textContent = tab.title;

    button.onclick = () => {
      activeTab = index;
      renderTabs();

      if (tab.url) openWebsite(tab.url, false);
      else showPage("home");
    };

    container.appendChild(button);
  });
}

function normalizeUrl(value) {
  value = value.trim();

  if (/^https?:\/\//i.test(value)) return value;

  if (/^[\w-]+\.[a-z]{2,}/i.test(value)) {
    return "https://" + value;
  }

  return "";
}

function openWebsite(url, addHistory = true) {
  const frame = $("websiteFrame");
  if (!frame) return;

  const title = $("currentWebsiteTitle");
  const warning = $("websiteWarning");

  if (title) title.textContent = url;
  if (warning) warning.classList.remove("hidden");

  const results = $("internalSearchResults");
  if (results) results.remove();

  frame.classList.remove("hidden");
  frame.src = url;

  if (tabs[activeTab]) {
    tabs[activeTab].url = url;
    tabs[activeTab].title = new URL(url).hostname;
  }

  renderTabs();

  if (addHistory) {
    historyData.unshift({
      title: url,
      url,
      date: new Date().toLocaleString()
    });

    historyData = historyData.slice(0, 100);
    save(STORAGE.history, historyData);
  }

  showPage("website");
}

function internalSearch(query) {
  query = query.trim();
  if (!query) return;

  const frame = $("websiteFrame");
  if (frame) frame.classList.add("hidden");

  const warning = $("websiteWarning");
  if (warning) warning.classList.add("hidden");

  showPage("website");

  if ($("currentWebsiteTitle")) {
    $("currentWebsiteTitle").textContent = "Search: " + query;
  }

  let results = $("internalSearchResults");

  if (!results) {
    results = document.createElement("div");
    results.id = "internalSearchResults";
    $("websitePage").appendChild(results);
  }

  results.innerHTML = `
    <div class="search-results-heading">
      <h2>Search Results</h2>
      <p>Searching for: ${escapeHTML(query)}</p>
    </div>
    <div id="searchResultList">Loading results...</div>
    <button id="fullSearchButton" class="primary-button">
      Open Full Search Results
    </button>
  `;

  $("fullSearchButton").onclick = () => externalSearch(query);

  fetch("https://api.duckduckgo.com/?q=" +
    encodeURIComponent(query) +
    "&format=json&no_html=1&skip_disambig=1")
    .then(response => response.json())
    .then(data => {
      const list = $("searchResultList");
      if (!list) return;

      let items = [];

      if (data.AbstractText && data.AbstractURL) {
        items.push({
          title: data.Heading || query,
          description: data.AbstractText,
          url: data.AbstractURL
        });
      }

      function collectTopics(topics) {
        topics.forEach(item => {
          if (item.Topics) {
            collectTopics(item.Topics);
          } else if (item.FirstURL && item.Text) {
            items.push({
              title: item.Text.split(" - ")[0],
              description: item.Text,
              url: item.FirstURL
            });
          }
        });
      }

      collectTopics(data.RelatedTopics || []);

      if (!items.length) {
        list.innerHTML = `
          <p>No instant answers found for this search.</p>
          <p>Try opening the full search results.</p>
        `;
        return;
      }

      list.innerHTML = items.slice(0, 10).map(item => `
        <article class="search-result-card">
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.description)}</p>
          <a href="${safeURL(item.url)}" target="_blank" rel="noopener">
            Visit Website
          </a>
        </article>
      `).join("");
    })
    .catch(() => {
      const list = $("searchResultList");
      if (list) {
        list.innerHTML = `
          <p>Search service is temporarily unavailable.</p>
          <p>Use Open Full Search Results instead.</p>
        `;
      }
    });
}

function externalSearch(query) {
  const engine = localStorage.getItem(STORAGE.engine) || "google";

  const engines = {
    google: "https://www.google.com/search?q=",
    bing: "https://www.bing.com/search?q=",
    duckduckgo: "https://duckduckgo.com/?q="
  };

  const url = (engines[engine] || engines.google) +
    encodeURIComponent(query);

  window.open(url, "_blank", "noopener");
}

function handleSearch(value, external = false) {
  const url = normalizeUrl(value);

  if (url) {
    if (external) {
      window.open(url, "_blank", "noopener");
    } else {
      openWebsite(url);
    }
    return;
  }

  if (external) externalSearch(value);
  else internalSearch(value);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
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
    return ["http:", "https:"].includes(url.protocol)
      ? escapeHTML(url.href)
      : "#";
  } catch {
    return "#";
  }
}

/* GUEST MODE */

function openGuestMode() {
  if ($("guestPanel")) $("guestPanel").classList.remove("hidden");
}

function continueAsGuest() {
  localStorage.setItem(STORAGE.guest, "true");

  if ($("guestPanel")) $("guestPanel").classList.add("hidden");

  showPage("home");
}

function exitGuestMode() {
  if (confirm("Exit Guest Mode?")) {
    localStorage.removeItem(STORAGE.guest);
    openGuestMode();
  }
}

/* NEWS */

async function loadNews(category = "all") {
  const container = $("newsContainer");
  if (!container) return;

  container.innerHTML = "<p>Loading latest news...</p>";

  const categoryQueries = {
    all: "India OR world",
    india: "India",
    world: "world news",
    technology: "technology",
    sports: "sports",
    business: "business"
  };

  const query = categoryQueries[category] || "India OR world";

  const api =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(query) +
    "&mode=ArtList&format=json&maxrecords=15&sort=DateDesc";

  try {
    const response = await fetch(api);
    if (!response.ok) throw new Error("News request failed");

    const data = await response.json();
    const articles = data.articles || [];

    if (!articles.length) throw new Error("No articles");

    container.innerHTML = articles.map(article => `
      <article class="news-card">
        ${article.socialimage ? `
          <img src="${safeURL(article.socialimage)}"
               alt="News image"
               loading="lazy">
        ` : ""}
        <div class="news-card-content">
          <h3>${escapeHTML(article.title || "News")}</h3>
          <p>${escapeHTML(article.domain || "")}</p>
          <a href="${safeURL(article.url)}"
             target="_blank"
             rel="noopener">
            Read Full Story
          </a>
        </div>
      </article>
    `).join("");
  } catch (error) {
    container.innerHTML = `
      <div class="news-error">
        <h3>News temporarily unavailable</h3>
        <p>Please try again in a moment.</p>
        <button id="retryNewsButton">Try Again</button>
        <a href="https://news.google.com/"
           target="_blank" rel="noopener">
          Open Google News
        </a>
      </div>
    `;

    const retry = $("retryNewsButton");
    if (retry) retry.onclick = () => loadNews(category);
  }
}

/* BOOKMARKS */

function addBookmark() {
  const url = tabs[activeTab]?.url;
  if (!url) {
    alert("Open a website first.");
    return;
  }

  if (bookmarks.some(item => item.url === url)) {
    alert("Already bookmarked.");
    return;
  }

  bookmarks.unshift({
    title: url,
    url,
    date: new Date().toLocaleString()
  });

  save(STORAGE.bookmarks, bookmarks);
  alert("Bookmark saved!");
}

function renderBookmarks() {
  const container = $("bookmarksContainer");
  if (!container) return;

  container.innerHTML = bookmarks.length
    ? bookmarks.map((item, index) => `
      <div class="saved-item">
        <a href="${safeURL(item.url)}"
           target="_blank" rel="noopener">
          ${escapeHTML(item.title)}
        </a>
        <button data-delete-bookmark="${index}">Delete</button>
      </div>
    `).join("")
    : "<p>No bookmarks saved yet.</p>";

  container.querySelectorAll("[data-delete-bookmark]").forEach(button => {
    button.onclick = () => {
      bookmarks.splice(Number(button.dataset.deleteBookmark), 1);
      save(STORAGE.bookmarks, bookmarks);
      renderBookmarks();
    };
  });
}

/* HISTORY */

function renderHistory() {
  const container = $("historyContainer");
  if (!container) return;

  container.innerHTML = historyData.length
    ? historyData.map(item => `
      <div class="saved-item">
        <a href="${safeURL(item.url)}"
           target="_blank" rel="noopener">
          ${escapeHTML(item.title)}
        </a>
        <small>${escapeHTML(item.date || "")}</small>
      </div>
    `).join("")
    : "<p>No browsing history.</p>";
}

/* DOWNLOADS */

function renderDownloads() {
  const container = $("downloadsContainer");
  if (!container) return;

  container.innerHTML = `
    <p>Downloads opened through Chrome or another browser
    are managed by that browser.</p>
  `;
}

/* THEME */

function applyTheme(theme) {
  document.body.classList.toggle("dark-mode", theme === "dark");
  localStorage.setItem(STORAGE.theme, theme);

  if ($("appearanceSelect")) {
    $("appearanceSelect").value = theme;
  }
}

/* NAVIGATION */

function goHome() {
  if (tabs[activeTab]) {
    tabs[activeTab].url = "";
    tabs[activeTab].title = "New Tab";
  }

  renderTabs();
  showPage("home");
}

function goBack() {
  try {
    $("websiteFrame")?.contentWindow.history.back();
  } catch {
    alert("This website does not allow internal navigation.");
  }
}

function goForward() {
  try {
    $("websiteFrame")?.contentWindow.history.forward();
  } catch {
    alert("This website does not allow internal navigation.");
  }
}

/* EVENT LISTENERS */

function initializeEvoker() {
  if (!tabs.length) createTab();

  if (localStorage.getItem(STORAGE.guest) !== "true") {
    openGuestMode();
  }

  applyTheme(localStorage.getItem(STORAGE.theme) || "light");

  $("continueGuestButton")?.addEventListener("click", continueAsGuest);
  $("closeGuestButton")?.addEventListener("click", continueAsGuest);
  $("guestMenuButton")?.addEventListener("click", openGuestMode);

  $("newTabButton")?.addEventListener("click", createTab);
  $("homeButton")?.addEventListener("click", goHome);
  $("backButton")?.addEventListener("click", goBack);
  $("forwardButton")?.addEventListener("click", goForward);
  $("reloadButton")?.addEventListener("click", () => {
    if (tabs[activeTab]?.url) openWebsite(tabs[activeTab].url, false);
  });

  $("bookmarkButton")?.addEventListener("click", addBookmark);

  $("themeToggle")?.addEventListener("click", () => {
    const dark = document.body.classList.contains("dark-mode");
    applyTheme(dark ? "light" : "dark");
  });

  $("appearanceSelect")?.addEventListener("change", event => {
    applyTheme(event.target.value);
  });

  $("settingsSearchEngine")?.addEventListener("change", event => {
    localStorage.setItem(STORAGE.engine, event.target.value);
  });

  $("searchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    handleSearch($("addressInput").value);
  });

  $("homeSearchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    handleSearch($("homeSearchInput").value);
  });

  $("openExternalButton")?.addEventListener("click", () => {
    const url = tabs[activeTab]?.url;
    if (url) window.open(url, "_blank", "noopener");
  });

  $("address-search-button")?.addEventListener("click", () => {
    handleSearch($("addressInput").value);
  });

  $("refreshNewsButton")?.addEventListener("click", () => loadNews());

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

  document.querySelectorAll(".discover-card").forEach(card => {
    card.addEventListener("click", () => {
      const search = card.dataset.search;
      if (search) internalSearch(search);
    });
  });

  $("clearHistoryButton")?.addEventListener("click", () => {
    if (confirm("Clear all browsing history?")) {
      historyData = [];
      save(STORAGE.history, historyData);
      renderHistory();
    }
  });

  $("clearDataButton")?.addEventListener("click", () => {
    if (confirm("Clear EVOKER browsing data?")) {
      Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
      location.reload();
    }
  });

  $("menuButton")?.addEventListener("click", () => {
    $("browserMenu")?.classList.toggle("hidden");
  });

  $("clearAddressButton")?.addEventListener("click", () => {
    if ($("addressInput")) $("addressInput").value = "";
  });

  renderTabs();
}

document.addEventListener("DOMContentLoaded", initializeEvoker);
