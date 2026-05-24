import { getFavicon, rAlert } from "./utils.mjs";
import { getUV, search } from "./prxy.mjs";

const DEFAULT_PAGE_URL = "rus://search";
const DEFAULT_PAGE_SRC = "search.html";
const INTERNAL_SCHEME = "rus://";
const INTERNAL_ERROR_SRC = "error.html";
const FILE_MODE_INTERNAL_ROUTES = new Set(["search", "math", "credits", "error"]);
const INTERNAL_ROUTE_ICONS = {
  credits: "assets/credits.svg",
  error: "assets/error.svg",
  math: "assets/math.svg",
  search: "assets/search.svg",
};

const { span, iframe, button, img, div } = van.tags;
const {
  tags: { "ion-icon": ionIcon },
} = van;

var tabs = [];
var selectedTab = null;
var dragState = null;
var didDragTab = false;
var isOpeningDefaultTab = false;


const sideBar = document.querySelector("header");


const pageBack = document.getElementById("page-back");
const pageForward = document.getElementById("page-forward");
const pageRefresh = document.getElementById("page-refresh");


const urlForm = document.getElementById("url-form");
const urlInput = document.getElementById("url-input");


const newTabButton = document.getElementById("new-tab");


const tabList = document.getElementById("tab-list");


const tabView = document.getElementById("tab-view");


window.onmousemove = (e) => {
  if (e.clientX < 50) {
    sideBar.classList.add("hovered");
  } else {
    sideBar.classList.remove("hovered");
  }
};
pageBack.onclick = () => {
  selectedTab.view.contentWindow.history.back();
};

pageForward.onclick = () => {
  selectedTab.view.contentWindow.history.forward();
};

pageRefresh.onclick = () => {
  if (selectedTab?.internal) {
    navigateTab(selectedTab, selectedTab.url);
    return;
  }

  selectedTab.view.contentWindow.location.reload();
};

newTabButton.onclick = () => {
  addTab(DEFAULT_PAGE_URL);
};


const devtoolsOption = document.getElementById("devtools-option");
const abcOption = document.getElementById("abc-option");
const creditsOption = document.getElementById("credits-option");
const menuOverlay = document.getElementById("menu-overlay");

devtoolsOption.onclick = () => {
  try {
    
    selectedTab.view.contentWindow.eval(eruda);
    rAlert("Injected successfully.<br>Click the icon on the bottom right.");
  } catch (error) {
    rAlert("Failed to inject.");
  }
};

abcOption.onclick = () => {
  abCloak(selectedTab.view.src);
  rAlert("Opened in about:blank");
};

creditsOption.onclick = () => {
  menuOverlay.classList.remove("active");
  navigateTab(selectedTab, "rus://credits");
};

urlForm.onsubmit = async (e) => {
  e.preventDefault();
  await navigateTab(selectedTab, urlInput.value);
};

urlInput.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;

  e.preventDefault();
  await navigateTab(selectedTab, urlInput.value);
});

window.addEventListener("message", async (event) => {
  if (event.data?.type !== "rus:navigate") return;
  await navigateTab(selectedTab, event.data.value);
});

function saveTabs() {
  localStorage.setItem(
    "tabs",
    JSON.stringify(
      tabs.map((tab) => {
        return tab.url;
      })
    )
  );
}

function tabFromItem(item) {
  return tabs.find((tab) => tab.item === item);
}

function syncTabsFromDom() {
  tabs = Array.from(tabList.children)
    .map((item) => tabFromItem(item))
    .filter(Boolean);
  saveTabs();
}

function clearDropMarkers() {
  tabList.querySelectorAll(".drop-before, .drop-after").forEach((item) => {
    item.classList.remove("drop-before", "drop-after");
  });
}

function animateTabShift(previousRects) {
  Array.from(tabList.children).forEach((item) => {
    if (dragState && item === dragState.tab.item) return;

    const previous = previousRects.get(item);
    if (!previous) return;

    const current = item.getBoundingClientRect();
    const deltaX = previous.left - current.left;

    if (!deltaX) return;

    item.style.transition = "none";
    item.style.transform = `translateX(${deltaX}px)`;
    item.getBoundingClientRect();
    item.style.transition = "transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)";
    item.style.transform = "";

    setTimeout(() => {
      item.style.transition = "";
      item.style.transform = "";
    }, 190);
  });
}

function moveTabItem(tab, beforeItem) {
  if (beforeItem === tab.item || beforeItem === tab.item.nextSibling) return;

  const previousRects = new Map(
    Array.from(tabList.children).map((item) => [
      item,
      item.getBoundingClientRect(),
    ])
  );

  tabList.insertBefore(tab.item, beforeItem);
  animateTabShift(previousRects);
}

function getTabLayoutLeft(item) {
  return tabList.getBoundingClientRect().left + item.offsetLeft - tabList.scrollLeft;
}

function updateDraggedTabPosition(e) {
  if (!dragState) return;

  const layoutLeft = getTabLayoutLeft(dragState.tab.item);
  const deltaX = e.clientX - dragState.grabOffset - layoutLeft;

  dragState.tab.item.style.transform = `translateX(${deltaX}px) translateY(-3px) scale(0.98)`;
}

function finishTabDrag() {
  if (!dragState) return;

  const { tab, active } = dragState;

  tab.item.classList.remove("dragging");
  clearDropMarkers();
  if (active) {
    syncTabsFromDom();
  }
  document.removeEventListener("pointermove", moveDraggedTab);
  document.removeEventListener("pointerup", finishTabDrag);
  document.removeEventListener("pointercancel", finishTabDrag);

  tab.item.style.transition = "transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)";
  tab.item.style.transform = "";
  dragState = null;

  setTimeout(() => {
    tab.item.style.transition = "";
    tab.item.style.transform = "";
    didDragTab = false;
  }, active ? 190 : 0);
}

function moveDraggedTab(e) {
  if (!dragState) return;

  const { tab, startX } = dragState;
  const distance = Math.abs(e.clientX - startX);

  if (!dragState.active && distance < 6) return;

  e.preventDefault();
  didDragTab = true;
  dragState.active = true;
  tab.item.classList.add("dragging");

  const siblingItems = Array.from(tabList.children).filter((item) => item !== tab.item);
  const beforeItem = siblingItems.find((item) => {
    const rect = item.getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2;
  });

  moveTabItem(tab, beforeItem || null);
  updateDraggedTabPosition(e);

  clearDropMarkers();
  const currentIndex = Array.from(tabList.children).indexOf(tab.item);
  const previousItem = tabList.children[currentIndex - 1];
  const nextItem = tabList.children[currentIndex + 1];

  if (nextItem) nextItem.classList.add("drop-before");
  else if (previousItem) previousItem.classList.add("drop-after");
}

async function ensureDefaultTab() {
  if (tabs.length || isOpeningDefaultTab) return;

  isOpeningDefaultTab = true;
  try {
    await addTab(DEFAULT_PAGE_URL);
  } finally {
    isOpeningDefaultTab = false;
  }
}

function isInternalUrl(link) {
  return String(link || "").trim().toLowerCase().startsWith(INTERNAL_SCHEME);
}

function titleFromRoute(route) {
  if (route === "search") return "Search";
  if (route === "credits") return "Credits";
  if (route === "error") return "Not Found";

  return route
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeInternalRoute(link) {
  if (!isInternalUrl(link)) return "search";

  try {
    const withoutScheme = String(link).trim().slice(INTERNAL_SCHEME.length);
    const withoutQuery = withoutScheme.split(/[?#]/)[0];
    const route = decodeURIComponent(withoutQuery)
      .replace(/^\/+|\/+$/g, "")
      .replace(/\.html$/i, "");

    return route || "search";
  } catch (error) {
    return null;
  }
}

function isSafeInternalRoute(route) {
  return Boolean(route && /^[a-z0-9_-]+$/i.test(route));
}

function internalPageFromUrl(link) {
  const route = normalizeInternalRoute(link);
  const safe = isSafeInternalRoute(route);
  const displayUrl = safe ? `${INTERNAL_SCHEME}${route}` : String(link || DEFAULT_PAGE_URL);

  return {
    route: route || "unknown",
    file: safe ? `${route}.html` : null,
    safe,
    displayUrl,
    title: safe ? titleFromRoute(route) : "Not Found",
  };
}

function internalSource(link) {
  return internalPageFromUrl(link).file || INTERNAL_ERROR_SRC;
}

function internalDisplayUrl(link) {
  return internalPageFromUrl(link).displayUrl;
}

function isDefaultPage(link) {
  return (
    !link ||
    link === DEFAULT_PAGE_URL ||
    link === "rus://search.html" ||
    link === DEFAULT_PAGE_SRC ||
    link.endsWith("/active/search.html") ||
    link.endsWith("/search.html")
  );
}

function setTabDisplay(tab, title, url) {
  tab.title = title;
  tab.url = url;
  tab.item.children[1].textContent = title;
  tab.item.children[0].src = getTabIcon(url);

  if (tab == selectedTab) {
    urlInput.value = url;
  }

  saveTabs();
}

function getTabIcon(url) {
  if (isInternalUrl(url)) {
    const route = normalizeInternalRoute(url) || "search";
    return activeFolderUrl(INTERNAL_ROUTE_ICONS[route] || INTERNAL_ROUTE_ICONS.error);
  }

  return getFavicon(url);
}

function activeFolderUrl(fileName) {
  return new URL(fileName, window.location.href).href;
}

function escapedAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function htmlWithActiveBase(html) {
  const base = `<base href="${escapedAttribute(activeFolderUrl("."))}">`;

  if (/<head(\s[^>]*)?>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
  }

  return `${base}${html}`;
}

function showInternalError(tab, page) {
  const errorUrl = new URL(INTERNAL_ERROR_SRC, window.location.href);
  errorUrl.searchParams.set("url", page.displayUrl);
  errorUrl.searchParams.set("file", page.file || "");

  tab.internal = true;
  tab.proxiedUrl = errorUrl.href;
  tab.view.removeAttribute("srcdoc");
  tab.view.src = errorUrl.href;
  setTabDisplay(tab, "Not Found", page.displayUrl);
}

async function loadInternalPage(tab, link) {
  const page = internalPageFromUrl(link);

  tab.internal = true;

  if (!page.safe) {
    showInternalError(tab, page);
    return;
  }

  setTabDisplay(tab, page.title, page.displayUrl);

  if (window.location.protocol === "file:") {
    if (!FILE_MODE_INTERNAL_ROUTES.has(page.route)) {
      showInternalError(tab, page);
      return;
    }

    tab.proxiedUrl = activeFolderUrl(page.file);
    tab.view.removeAttribute("srcdoc");
    tab.view.src = tab.proxiedUrl;
    return;
  }

  try {
    const pageUrl = activeFolderUrl(page.file);
    const response = await fetch(pageUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Internal page not found: ${page.file}`);
    }

    const html = await response.text();

    tab.proxiedUrl = pageUrl;
    tab.view.removeAttribute("src");
    tab.view.srcdoc = htmlWithActiveBase(html);
  } catch (error) {
    showInternalError(tab, page);
  }
}

async function navigateTab(tab, link) {
  if (!tab) return;

  if (isInternalUrl(link) || isDefaultPage(link)) {
    const internalUrl = isInternalUrl(link) ? link : DEFAULT_PAGE_URL;
    await loadInternalPage(tab, internalUrl);
    return;
  }

  tab.internal = false;
  tab.url = search(link);
  tab.proxiedUrl = await getUV(link);
  tab.view.removeAttribute("srcdoc");
  tab.view.src = tab.proxiedUrl;
  setTabDisplay(tab, tab.url.replace(/^https?:\/\//, ""), tab.url);
}

function closeTab(tab) {
  const closingSelectedTab = tab === selectedTab;
  const closingIndex = tabs.indexOf(tab);
  if (closingIndex === -1) return;

  tabs.splice(closingIndex, 1);

  if (closingSelectedTab) {
    selectedTab = null;
    if (tabs.length) {
      focusTab(tabs[Math.min(closingIndex, tabs.length - 1)]);
    }
  }

  if (tabView.contains(tab.view)) tabView.removeChild(tab.view);
  tab.view.remove();
  saveTabs();

  if (!tabs.length) {
    ensureDefaultTab();
  }

  tab.item.style.animation =
    "slide-out-from-bottom 0.18s cubic-bezier(0.2, 0.8, 0.2, 1) forwards";
  setTimeout(() => {
    tab.item.remove();
  }, 170);
}

let eruda = `fetch("https://cdn.jsdelivr.net/npm/eruda")
.then((res) => res.text())
.then((data) => {
  eval(data);
  if (!window.erudaLoaded) {
    eruda.init({ defaults: { displaySize: 45, theme: "AMOLED" } });
    window.erudaLoaded = true;
  }
});`;

function abCloak(cloakUrl) {
  var win = window.open();
  var iframe = win.document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "0px";
  iframe.style.left = "0px";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.src = cloakUrl;
  win.document.body.appendChild(iframe);
}


const tabItem = (tab) => {
  return div(
    {
      onclick: (e) => {
        if (didDragTab) {
          e.preventDefault();
          return;
        }

        if (
          !e.target.classList.contains("close") &&
          !e.target.classList.contains("close-icon")
        ) {
          focusTab(tab);
        }
      },
      onkeydown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          focusTab(tab);
        }
      },
      onpointerdown: (e) => {
        if (e.button !== 0 || e.target.closest(".close")) return;
        e.preventDefault();
        const rect = tab.item.getBoundingClientRect();
        dragState = {
          tab,
          startX: e.clientX,
          grabOffset: e.clientX - rect.left,
          active: false,
        };
        document.addEventListener("pointermove", moveDraggedTab);
        document.addEventListener("pointerup", finishTabDrag);
        document.addEventListener("pointercancel", finishTabDrag);
      },
      role: "button",
      tabindex: "0",
      class: "tab-item hover-focus1",
    },
    img({ src: getTabIcon(tab.url) }),
    span(tab.title),

    button(
      {
        onclick: (e) => {
          e.stopPropagation();
          closeTab(tab);
        },
        class: "close",
      },
      ionIcon({ name: "close", class: "close-icon" })
    )
  );
};

const tabFrame = (tab) => {
  return iframe({
    class: "tab-frame",
    src: tab.proxiedUrl,
    allow: "autoplay; fullscreen; pointer-lock; gamepad",
    allowfullscreen: true,
    sandbox: "allow-scripts allow-forms allow-same-origin",
    onload: (e) => {
      if (tab.internal) {
        if (tab == selectedTab) {
          urlInput.value = tab.url;
        }
        return;
      }

      let parts = e.target.contentWindow.location.pathname.slice(1).split("/");
      let targetUrl = decodeURIComponent(
        __uv$config.decodeUrl(parts[parts.length - 1])
      );

      tab.title = tab.view.contentWindow.document.title;
      console.log(tab.title);
      tab.url = targetUrl;
      tab.item.children[1].textContent = tab.title;
      tab.item.children[0].src = getTabIcon(targetUrl);

      
      if (tab == selectedTab) {
        urlInput.value = targetUrl;
      }

      saveTabs();
    },
  });
};

function focusTab(tab) {
  if (selectedTab) {
    selectedTab.view.style.display = "none";
    selectedTab.item.classList.remove("selectedTab");
  }
  selectedTab = tab;
  tab.view.style.display = "block";

  
  urlInput.value = tab.url;

  tab.item.classList.add("selectedTab");
}

async function addTab(link) {
  const internal = isInternalUrl(link) || isDefaultPage(link);
  const internalUrl = isInternalUrl(link) ? link : DEFAULT_PAGE_URL;

  const url = internal ? "about:blank" : await getUV(link);

  let tab = {};

  tab.title = internal
    ? titleFromRoute(normalizeInternalRoute(internalUrl) || "search")
    : decodeURIComponent(
        __uv$config.decodeUrl(url.substring(url.lastIndexOf("/") + 1))
      ).replace(/^https?:\/\//, "");
  tab.url = internal ? internalDisplayUrl(internalUrl) : search(link);
  tab.proxiedUrl = url;
  tab.internal = internal;
  tab.icon = null;
  tab.view = tabFrame(tab);
  tab.item = tabItem(tab);

  tab.view.addEventListener("load", () => {
    let links = tab.view.contentWindow.document.querySelectorAll("a");
    links.forEach((element) => {
      element.addEventListener("click", (event) => {
        let isTargetTop = event.target.target === "_top";
        if (isTargetTop) {
          event.preventDefault();
          addTab(event.target.href);
        }
      });
    });
  });

  tabs.push(tab);

  tabList.appendChild(tab.item);

  tabView.appendChild(tab.view);
  focusTab(tab);
  saveTabs();

  if (internal) {
    await loadInternalPage(tab, internalUrl);
  }

  return tab;
}

const urlParams = new URLSearchParams(window.location.search);
const initialTabUrl = urlParams.get("inject") || DEFAULT_PAGE_URL;

addTab(initialTabUrl);
