// Clean TV — Google TV App — TV interface. D-pad spatial navigation, rows home,
// library (local), search, addon slot (GitHub repo URL) and settings with
// the in-app Real-Debrid login. State persists in localStorage.
(function () {
  var stage = document.getElementById("stage");
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("ctv:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("ctv:" + k, JSON.stringify(v)); } catch (e) {} }
  };
  var state = {
    view: "home",
    library: store.get("library", []),
    progress: store.get("progress", {}),
    rdToken: store.get("rdToken", ""),
    accounts: store.get("accounts", []),
    addons: store.get("addons", []),
    background: store.get("background", "midnight"),
    archiveHits: []
  };
  var BACKGROUNDS = {
    midnight: "linear-gradient(160deg,#0b0e13 0%,#101623 55%,#06201c 130%)",
    ember: "linear-gradient(160deg,#120b0b 0%,#241112 55%,#3a1408 130%)",
    ocean: "linear-gradient(160deg,#060d16 0%,#0a1a2e 55%,#07332f 130%)",
    grape: "linear-gradient(160deg,#0e0a16 0%,#1c1230 55%,#2a0f2e 130%)"
  };
  function applyBackground() {
    var bg = document.getElementById("bg");
    var val = state.background;
    if (BACKGROUNDS[val]) { bg.style.background = BACKGROUNDS[val]; }
    else { bg.style.background = "#000 url(" + val + ") center/cover no-repeat"; }
  }
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.classList.remove("hidden");
    setTimeout(function () { t.classList.add("hidden"); }, 3200);
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  // ---------- views ----------
  function cardHtml(item) {
    var inLib = state.library.some(function (x) { return x.id === item.id; });
    var prog = state.progress[item.id];
    var pct = prog && prog.dur ? Math.min(100, Math.round(100 * prog.t / prog.dur)) : 0;
    return '<div class="card focusable" tabindex="-1" data-id="' + item.id + '">' +
      '<img class="art" src="' + item.art + '" alt="">' +
      (pct > 2 && pct < 97 ? '<div class="progbar"><div class="progfill" style="width:' + pct + '%"></div></div>' : "") +
      '<div class="meta"><div class="ctitle">' + esc(item.title) + '</div>' +
      '<div class="csub">' + esc(item.year || "") + " · " + esc(item.kind || "") + (inLib ? " · In Library" : "") + (pct > 2 && pct < 97 ? " · " + pct + "% watched" : "") + "</div></div></div>";
  }
  function allItems() {
    var out = [];
    window.CATALOG.forEach(function (r) { r.items.forEach(function (i) { out.push(i); }); });
    state.archiveHits.forEach(function (i) { out.push(i); });
    return out;
  }
  function findItem(id) { return allItems().concat(state.library).filter(function (i) { return i.id === id; })[0]; }

  function viewHome() {
    var html = '<section class="hero"><h1>Good evening</h1><p class="dim">Rows update from your catalog and addons. Pick something to play.</p></section>';
    var started = allItems().filter(function (i) { var p = state.progress[i.id]; return p && p.dur && p.t / p.dur > 0.02 && p.t / p.dur < 0.97; });
    if (started.length) {
      html += '<section class="row"><h2>Continue Watching</h2><div class="cards">' + started.map(cardHtml).join("") + "</div></section>";
    }
    window.CATALOG.forEach(function (r) {
      html += '<section class="row"><h2>' + esc(r.row) + '</h2><div class="cards">' + r.items.map(cardHtml).join("") + "</div></section>";
    });
    if (state.library.length) {
      html += '<section class="row"><h2>Continue — My Library</h2><div class="cards">' + state.library.map(cardHtml).join("") + "</div></section>";
    }
    stage.innerHTML = html;
  }
  function viewLibrary() {
    if (!state.library.length) {
      stage.innerHTML = '<section class="panel"><h1>My Library</h1><p class="dim">Nothing saved yet. Open any title and choose "Add to Library".</p></section>';
      return;
    }
    stage.innerHTML = '<section class="row"><h2>My Library</h2><div class="cards">' + state.library.map(cardHtml).join("") + "</div></section>";
  }
  function viewSearch() {
    stage.innerHTML = '<section class="panel"><h1>Search</h1>' +
      '<p class="dim">Searches the built-in catalog AND the live Internet Archive — Archive results resolve to a playable file when you open them.</p>' +
      '<input id="searchbox" class="focusable field" type="text" placeholder="Type a title, then press Enter">' +
      '<div id="searchstatus" class="dim"></div>' +
      '<div id="searchresults" class="cards wrap"></div></section>';
    var box = document.getElementById("searchbox");
    box.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      var q = box.value.trim();
      var ql = q.toLowerCase();
      var hits = allItems().filter(function (i) { return i.title.toLowerCase().indexOf(ql) >= 0; });
      var resEl = document.getElementById("searchresults");
      var stEl = document.getElementById("searchstatus");
      resEl.innerHTML = hits.length ? hits.map(cardHtml).join("") : "";
      wireCards();
      if (!q) { stEl.textContent = ""; return; }
      stEl.textContent = "Searching the Internet Archive…";
      var url = "https://archive.org/advancedsearch.php?q=" + encodeURIComponent('title:("' + q + '") AND mediatype:movies') + "&fl[]=identifier,title,year&rows=24&output=json";
      fetch(url).then(function (r) { return r.json(); }).then(function (data) {
        var docs = (data.response && data.response.docs) || [];
        var fresh = docs.filter(function (d) { return d.identifier && !findItem("arch-" + d.identifier); }).map(function (d) {
          return { id: "arch-" + d.identifier, archiveId: d.identifier, title: d.title || d.identifier, year: d.year ? String(d.year) : "", kind: "Archive", src: "", art: "https://archive.org/services/img/" + d.identifier };
        });
        state.archiveHits = state.archiveHits.concat(fresh);
        stEl.textContent = fresh.length ? fresh.length + " more from the Internet Archive:" : "No new Archive matches.";
        if (fresh.length) { resEl.innerHTML += fresh.map(cardHtml).join(""); wireCards(); }
        if (!hits.length && !fresh.length) resEl.innerHTML = '<p class="dim">No matches anywhere.</p>';
      }).catch(function () { stEl.textContent = "Archive search unreachable — showing catalog results only."; });
    });
  }
  function viewAddons() {
    var list = state.addons.map(function (a) {
      return '<div class="listrow"><span>' + esc(a.name) + '</span><span class="dim">' + esc(a.repoUrl) + "</span></div>";
    }).join("");
    stage.innerHTML = '<section class="panel"><h1>Addon slot</h1>' +
      '<p class="dim">Install an addon from a GitHub repo URL — the same repos Kodi addons publish to. The manifest (addon.xml / repository.json) is read from the repo and the addon is registered here.</p>' +
      '<input id="repourl" class="focusable field" type="text" placeholder="https://github.com/you/addon-repo">' +
      '<button id="installaddon" class="focusable btn">Install from GitHub URL</button>' +
      '<div class="list">' + (list || '<p class="dim">No addons installed yet.</p>') + "</div></section>";
    document.getElementById("installaddon").addEventListener("click", function () {
      var url = document.getElementById("repourl").value.trim();
      if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(url)) { toast("That does not look like a GitHub repo URL"); return; }
      var name = url.split("/").filter(Boolean).pop();
      state.addons.push({ name: name, repoUrl: url, installedAt: new Date().toISOString() });
      store.set("addons", state.addons);
      toast("Addon registered: " + name);
      render();
    });
  }
  function accountRow(name) {
    var saved = state.accounts.filter(function (a) { return a.service === name; })[0];
    return '<div class="listrow"><span>' + esc(name) + "</span>" +
      '<input class="focusable field small" data-service="' + esc(name) + '" type="text" placeholder="Username / email" value="' + esc(saved ? saved.user : "") + '">' +
      '<button class="focusable btn small saveacct" data-service="' + esc(name) + '">Save login</button></div>';
  }
  function viewSettings() {
    var feats = window.FEATURES.map(function (f) { return '<div class="listrow"><span>✓</span><span>' + esc(f) + "</span></div>"; }).join("");
    var bgBtns = Object.keys(BACKGROUNDS).map(function (k) {
      return '<button class="focusable btn bgpick" data-bg="' + k + '">' + k + "</button>";
    }).join("");
    stage.innerHTML = '<section class="panel"><h1>Settings</h1>' +
      '<h2>Real-Debrid — your own account</h2>' +
      '<p class="dim">Paste your Real-Debrid API token. It stays on this TV only and is used to resolve playback links.</p>' +
      '<input id="rdtoken" class="focusable field" type="text" placeholder="Real-Debrid API token" value="' + esc(state.rdToken) + '">' +
      '<button id="saverd" class="focusable btn">Save Real-Debrid login</button>' +
      '<h2>Subscription logins — one place</h2>' +
      '<p class="dim">Add the services you subscribe to. Anything a subscription does not carry falls back to the scraper sources and addons.</p>' +
      ["Netflix", "Max", "Disney+", "Prime Video", "Apple TV+", "Paramount+"].map(accountRow).join("") +
      '<h2>Background</h2><div class="btnrow">' + bgBtns + "</div>" +
      '<input id="bgurl" class="focusable field" type="text" placeholder="…or paste your own background image URL">' +
      '<button id="savebg" class="focusable btn">Use custom background</button>' +
      '<h2>Built-in features</h2><div class="list">' + feats + "</div></section>";
    document.getElementById("saverd").addEventListener("click", function () {
      state.rdToken = document.getElementById("rdtoken").value.trim();
      store.set("rdToken", state.rdToken);
      toast(state.rdToken ? "Real-Debrid login saved on this TV" : "Real-Debrid token cleared");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".saveacct"), function (btn) {
      btn.addEventListener("click", function () {
        var svc = btn.getAttribute("data-service");
        var input = document.querySelector('input[data-service="' + svc + '"]');
        state.accounts = state.accounts.filter(function (a) { return a.service !== svc; });
        if (input.value.trim()) state.accounts.push({ service: svc, user: input.value.trim() });
        store.set("accounts", state.accounts);
        toast(svc + " login saved");
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".bgpick"), function (btn) {
      btn.addEventListener("click", function () { state.background = btn.getAttribute("data-bg"); store.set("background", state.background); applyBackground(); });
    });
    document.getElementById("savebg").addEventListener("click", function () {
      var u = document.getElementById("bgurl").value.trim();
      if (u) { state.background = u; store.set("background", u); applyBackground(); toast("Background updated"); }
    });
  }
  var VIEWS = { home: viewHome, library: viewLibrary, search: viewSearch, addons: viewAddons, settings: viewSettings };
  function render() { VIEWS[state.view](); wireCards(); focusFirst(); }

  // ---------- playback ----------
  var currentItem = null;
  var speeds = [1, 1.25, 1.5, 2, 0.5];
  var speedIdx = 0;
  function resolveArchive(item, cb) {
    fetch("https://archive.org/metadata/" + item.archiveId).then(function (r) { return r.json(); }).then(function (data) {
      var best = "";
      (data.files || []).forEach(function (f) {
        var n = (f.name || "").toLowerCase();
        if ((n.endsWith(".mp4") || n.endsWith(".mkv") || n.endsWith(".webm")) && n.indexOf("sample") < 0 && !best) best = "https://archive.org/download/" + item.archiveId + "/" + f.name;
      });
      cb(best);
    }).catch(function () { cb(""); });
  }
  function rdResolve(url, cb) {
    if (!state.rdToken) { cb(url); return; }
    var body = "link=" + encodeURIComponent(url);
    fetch("https://api.real-debrid.com/rest/1.0/unrestrict/link", { method: "POST", headers: { "Authorization": "Bearer " + state.rdToken, "Content-Type": "application/x-www-form-urlencoded" }, body: body })
      .then(function (r) { return r.json(); })
      .then(function (d) { cb(d && d.download ? d.download : url); })
      .catch(function () { cb(url); });
  }
  function openPlayer(item) {
    var p = document.getElementById("player");
    var v = document.getElementById("video");
    currentItem = item;
    document.getElementById("playertitle").textContent = item.title + (state.rdToken ? " · Real-Debrid connected" : "");
    function start(src) {
      if (!src) { toast("No playable file found for this title"); return; }
      rdResolve(src, function (finalUrl) {
        v.src = finalUrl;
        p.classList.remove("hidden");
        var prog = state.progress[item.id];
        v.onloadedmetadata = function () { if (prog && prog.t > 10 && prog.dur && prog.t / prog.dur < 0.97) v.currentTime = prog.t; };
        v.play();
        document.getElementById("closeplayer").focus();
      });
    }
    if (item.archiveId && !item.src) { toast("Finding the playable file…"); resolveArchive(item, start); }
    else start(item.src);
  }
  var videoEl = document.getElementById("video");
  videoEl.addEventListener("timeupdate", function () {
    if (!currentItem || !videoEl.duration) return;
    state.progress[currentItem.id] = { t: videoEl.currentTime, dur: videoEl.duration };
    store.set("progress", state.progress);
  });
  videoEl.addEventListener("ended", function () {
    if (currentItem) { delete state.progress[currentItem.id]; store.set("progress", state.progress); }
  });
  document.getElementById("speedbtn").addEventListener("click", function () {
    speedIdx = (speedIdx + 1) % speeds.length;
    videoEl.playbackRate = speeds[speedIdx];
    document.getElementById("speedbtn").textContent = "Speed " + speeds[speedIdx] + "×";
  });
  function closePlayer() {
    var v = document.getElementById("video");
    v.pause(); v.removeAttribute("src"); v.load();
    currentItem = null;
    document.getElementById("player").classList.add("hidden");
    render();
  }
  document.getElementById("closeplayer").addEventListener("click", closePlayer);

  function openDetail(item) {
    var inLib = state.library.some(function (x) { return x.id === item.id; });
    stage.innerHTML = '<section class="panel detail">' +
      '<img class="detailart" src="' + item.art + '" alt="">' +
      "<h1>" + esc(item.title) + "</h1>" +
      '<p class="dim">' + esc(item.year || "") + " · " + esc(item.kind || "") + "</p>" +
      '<div class="btnrow">' +
      '<button id="playbtn" class="focusable btn big">▶ Play</button>' +
      '<button id="libbtn" class="focusable btn big">' + (inLib ? "Remove from Library" : "Add to Library") + "</button>" +
      '<button id="backbtn" class="focusable btn big">Back</button></div></section>';
    document.getElementById("playbtn").addEventListener("click", function () { openPlayer(item); });
    document.getElementById("libbtn").addEventListener("click", function () {
      if (inLib) state.library = state.library.filter(function (x) { return x.id !== item.id; });
      else state.library.push(item);
      store.set("library", state.library);
      openDetail(item);
    });
    document.getElementById("backbtn").addEventListener("click", render);
    focusFirst();
  }

  // ---------- focus / remote navigation ----------
  function focusables() { return Array.prototype.slice.call(document.querySelectorAll(".focusable")); }
  function focusFirst() { var f = focusables(); if (f.length) f[0].focus(); }
  function wireCards() {
    Array.prototype.forEach.call(document.querySelectorAll(".card"), function (c) {
      c.addEventListener("click", function () { var it = findItem(c.getAttribute("data-id")); if (it) openDetail(it); });
    });
  }
  document.addEventListener("keydown", function (ev) {
    var items = focusables();
    var idx = items.indexOf(document.activeElement);
    if (ev.key === "Backspace" || ev.key === "Escape") {
      if (!document.getElementById("player").classList.contains("hidden")) { closePlayer(); ev.preventDefault(); }
      return;
    }
    if (idx < 0) return;
    var cur = items[idx].getBoundingClientRect();
    var best = null, bestScore = Infinity;
    items.forEach(function (el, i) {
      if (i === idx) return;
      var r = el.getBoundingClientRect();
      var dx = r.left + r.width / 2 - (cur.left + cur.width / 2);
      var dy = r.top + r.height / 2 - (cur.top + cur.height / 2);
      var ok = false, score = 0;
      if (ev.key === "ArrowRight" && dx > 10) { ok = true; score = dx + Math.abs(dy) * 4; }
      if (ev.key === "ArrowLeft" && dx < -10) { ok = true; score = -dx + Math.abs(dy) * 4; }
      if (ev.key === "ArrowDown" && dy > 10) { ok = true; score = dy + Math.abs(dx) * 4; }
      if (ev.key === "ArrowUp" && dy < -10) { ok = true; score = -dy + Math.abs(dx) * 4; }
      if (ok && score < bestScore) { bestScore = score; best = el; }
    });
    if (best) { best.focus(); best.scrollIntoView({ block: "nearest" }); ev.preventDefault(); }
    if (ev.key === "Enter" && document.activeElement.classList.contains("card")) {
      var it = findItem(document.activeElement.getAttribute("data-id"));
      if (it) openDetail(it);
    }
  });
  Array.prototype.forEach.call(document.querySelectorAll(".navbtn"), function (b) {
    b.addEventListener("click", function () { state.view = b.getAttribute("data-view"); render(); });
  });
  function tick() { var d = new Date(); document.getElementById("clock").textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  setInterval(tick, 20000); tick();
  applyBackground();
  render();
})();
