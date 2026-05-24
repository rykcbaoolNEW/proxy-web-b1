importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

const uv = new UVServiceWorker();
const adHosts = Array.from(new Set([
    "2mdn.net",
    "adc3-launch.adcolony.com",
    "ad.doubleclick.net",
    "adnxs.com",
    "advice-ads.s3.amazonaws.com",
    "adfstat.yandex.ru",
    "adfox.yandex.ru",
    "adm.hotjar.com",
    "ads-api.tiktok.com",
    "ads-api.twitter.com",
    "ads-sg.tiktok.com",
    "ads.linkedin.com",
    "ads.pinterest.com",
    "ads.yahoo.com",
    "ads.youtube.com",
    "ads30.adcolony.com",
    "adsafeprotected.com",
    "adsfs.oppomobile.com",
    "adsrvr.org",
    "adtago.s3.amazonaws.com",
    "adservetx.media.net",
    "adservice.google.com",
    "adtech.yahooinc.com",
    "adx.ads.oppomobile.com",
    "afs.googlesyndication.com",
    "an.facebook.com",
    "analytics-api.samsunghealthcn.com",
    "analytics.google.com",
    "analytics.pointdrive.linkedin.com",
    "analytics.query.yahoo.com",
    "analytics.s3.amazonaws.com",
    "analytics-sg.tiktok.com",
    "analytics.tiktok.com",
    "analytics.yahoo.com",
    "amazon-adsystem.com",
    "api-adservices.apple.com",
    "api.ad.xiaomi.com",
    "api.bugsnag.com",
    "api.luckyorange.com",
    "app.bugsnag.com",
    "app.getsentry.com",
    "appmetrica.yandex.ru",
    "auction.unityads.unity3d.com",
    "bdapi-ads.realmemobile.com",
    "bdapi-in-ads.realmemobile.com",
    "books-analytics-events.apple.com",
    "browser.sentry-cdn.com",
    "business-api.tiktok.com",
    "careers.hotjar.com",
    "cdn-test.mouseflow.com",
    "cdn.luckyorange.com",
    "cdn.mouseflow.com",
    "clarity.ms",
    "claritybt.freshmarketer.com",
    "click.googleanalytics.com",
    "click.oneplus.cn",
    "ck.ads.oppomobile.com",
    "config.unityads.unity3d.com",
    "cs.luckyorange.net",
    "data.ads.oppomobile.com",
    "data.mistat.india.xiaomi.com",
    "data.mistat.rus.xiaomi.com",
    "data.mistat.xiaomi.com",
    "doubleclick.net",
    "events.hotjar.io",
    "events.reddit.com",
    "events.redditmedia.com",
    "events3alt.adcolony.com",
    "extmaps-api.yandex.net",
    "facebook.net",
    "freshmarketer.com",
    "fwtracks.freshmarketer.com",
    "gemini.yahoo.com",
    "geo.yahoo.com",
    "google-analytics.com",
    "googleadservices.com",
    "googlesyndication.com",
    "googletagmanager.com",
    "grs.hicloud.com",
    "gtm.mouseflow.com",
    "hotjar.com",
    "iadsdk.apple.com",
    "identify.hotjar.com",
    "imrworldwide.com",
    "insights.hotjar.com",
    "iot-eu-logser.realme.com",
    "iot-logser.realme.com",
    "log.byteoversea.com",
    "log.fc.yahoo.com",
    "log.pinterest.com",
    "logbak.hicloud.com",
    "logservice.hicloud.com",
    "logservice1.hicloud.com",
    "luckyorange.com",
    "m.doubleclick.net",
    "media.net",
    "mediavisor.doubleclick.net",
    "metrics.data.hicloud.com",
    "metrics.icloud.com",
    "metrics.mzstatic.com",
    "metrics2.data.hicloud.com",
    "metrika.yandex.ru",
    "moatads.com",
    "mouseflow.com",
    "nmetrics.samsung.com",
    "notes-analytics-events.apple.com",
    "notify.bugsnag.com",
    "o2.mouseflow.com",
    "offerwall.yandex.net",
    "open.oneplus.net",
    "outbrain.com",
    "pagead2.googleadservices.com",
    "pagead2.googlesyndication.com",
    "partnerads.ysm.yahoo.com",
    "pixel.facebook.com",
    "samsung-com.112.2o7.net",
    "samsungads.com",
    "scorecardresearch.com",
    "script.hotjar.com",
    "sdkconfig.ad.intl.xiaomi.com",
    "sdkconfig.ad.xiaomi.com",
    "sessions.bugsnag.com",
    "settings.luckyorange.net",
    "smetrics.samsung.com",
    "ssl.google-analytics.com",
    "static.ads-twitter.com",
    "static.doubleclick.net",
    "static.media.net",
    "stats.g.doubleclick.net",
    "stats.wp.com",
    "surveys.hotjar.com",
    "taboola.com",
    "tools.mouseflow.com",
    "tracking.rus.miui.com",
    "trk.pinterest.com",
    "udcm.yahoo.com",
    "upload.luckyorange.net",
    "w1.luckyorange.com",
    "wd.adcolony.com",
    "weather-analytics-events.apple.com",
    "webview.unityads.unity3d.com"
]));

let adBlockEnabled = true;

function decodeTarget(request) {
    try {
        const current = new URL(request.url);
        const prefix = new URL(__uv$config.prefix, location.origin).pathname;
        const encoded = current.pathname.slice(prefix.length);
        return __uv$config.decodeUrl(encoded);
    } catch (error) {
        return "";
    }
}

function hostMatches(hostname, blockedHost) {
    return hostname === blockedHost || hostname.endsWith(`.${blockedHost}`);
}

function shouldBlock(request) {
    if (!adBlockEnabled) return false;

    try {
        const target = new URL(decodeTarget(request));
        const hostname = target.hostname.replace(/^www\./, "").toLowerCase();
        return adHosts.some((host) => hostMatches(hostname, host));
    } catch (error) {
        return false;
    }
}

function blockedResponse(request) {
    if (request.destination === "document" || request.destination === "iframe") {
        return new Response("<!doctype html><title>Blocked</title><body style=\"margin:0;background:#101114;color:#e8eaed;font:15px Arial,sans-serif;display:grid;place-items:center;height:100vh\"><main style=\"max-width:420px;text-align:center\"><h1 style=\"font-size:22px;margin:0 0 10px\">Blocked by RUS Web</h1><p style=\"color:#aeb4c0;margin:0\">This request matched the built-in ad blocker.</p></main></body>", {
            headers: { "content-type": "text/html" },
            status: 200
        });
    }

    return new Response("", { status: 204 });
}

async function handleRequest(event) {
    if (uv.route(event)) {
        if (shouldBlock(event.request)) {
            return blockedResponse(event.request);
        }

        return await uv.fetch(event);
    }
    
    return await fetch(event.request)
}

self.addEventListener('message', (event) => {
    if (event.data?.type === "rus:adblock") {
        rusAdBlockEnabled = event.data.value !== false;
    }
});

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(handleRequest(event));
});
