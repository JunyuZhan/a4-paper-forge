/* =========================================================================
 * app.js — 界面逻辑：分类导航、搜索、画廊、颜色/格子控制、预览、一键打印/下载
 * 依赖：data.js (COLORS/SIZES/CATEGORIES/FAMILIES/CATALOG), paper.js (Paper.render)
 * ========================================================================= */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };

  var state = {
    cat: "all",
    search: "",
    familyId: null,
    type: null,
    color: "#333333",
    cell: 14
  };

  function familyById(id) {
    var list = window.FAMILIES;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function markActive(sel, el) {
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove("active");
    if (el) el.classList.add("active");
  }

  /* ---------------- 侧边分类 ---------------- */
  function buildSidebar() {
    var ul = $("#cats");
    ul.innerHTML = "";
    ul.appendChild(catItem("all", "全部版式", window.CATALOG.length));
    window.CATEGORIES.forEach(function (c) {
      var n = 0;
      window.CATALOG.forEach(function (v) { if (v.cat === c.key) n++; });
      ul.appendChild(catItem(c.key, c.icon + " " + c.name, n));
    });
  }
  function catItem(key, name, n) {
    var li = document.createElement("li");
    li.className = "cat" + (state.cat === key ? " active" : "");
    li.innerHTML = '<span class="cat-name">' + name + '</span><span class="cnt">' + n + "</span>";
    li.onclick = function () { state.cat = key; buildSidebar(); renderGallery(); };
    return li;
  }

  /* ---------------- 颜色按钮 ---------------- */
  function buildColorBar() {
    var bar = $("#colors");
    bar.innerHTML = "";
    window.COLORS.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "swatch";
      b.style.background = c.value;
      b.title = c.name;
      b.dataset.color = c.value;
      b.onclick = function () {
        state.color = c.value;
        markActive("#colors .swatch", b);
        $("#customColor").value = c.value;
        renderPreview();
      };
      bar.appendChild(b);
    });
    var inp = document.createElement("input");
    inp.type = "color";
    inp.id = "customColor";
    inp.className = "custom-color";
    inp.title = "自定义颜色";
    inp.value = state.color;
    inp.oninput = function (e) {
      state.color = e.target.value;
      markActive("#colors .swatch", null);
      renderPreview();
    };
    bar.appendChild(inp);
  }

  /* ---------------- 格子尺寸按钮 ---------------- */
  function buildSizeBar() {
    var bar = $("#sizes");
    bar.innerHTML = "";
    var fam = state.familyId ? familyById(state.familyId) : null;
    var keys = fam ? fam.sizeKeys : ["14"];
    keys.forEach(function (k) {
      var sz = window.SIZES[k];
      var b = document.createElement("button");
      b.className = "size-btn";
      b.textContent = sz.name;
      b.dataset.mm = sz.mm;
      if (sz.mm === state.cell) b.classList.add("active");
      b.onclick = function () {
        state.cell = sz.mm;
        markActive("#sizes .size-btn", b);
        renderPreview();
      };
      bar.appendChild(b);
    });
  }

  /* ---------------- 选择某一种版式 ---------------- */
  function selectVariant(v) {
    state.familyId = v.familyId;
    state.type = v.type;
    state.color = v.color;
    state.cell = v.cell || 14;
    $("#curName").textContent = v.name;
    $("#curDesc").textContent = v.desc || "";
    document.querySelectorAll("#colors .swatch").forEach(function (b) {
      b.classList.toggle("active", b.dataset.color.toLowerCase() === v.color.toLowerCase());
    });
    $("#customColor").value = v.color;
    buildSizeBar();
    renderPreview();
  }

  function renderPreview() {
    $("#sheet").innerHTML = window.Paper.render(state.type, { color: state.color, cell: state.cell });
  }

  /* ---------------- 画廊 ---------------- */
  function renderGallery() {
    var grid = $("#gallery");
    grid.innerHTML = "";
    var q = state.search.trim().toLowerCase();
    var list = window.CATALOG.filter(function (v) {
      if (state.cat !== "all" && v.cat !== state.cat) return false;
      if (q) {
        var hay = (v.name + " " + (v.desc || "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    $("#galCount").textContent = list.length;
    if (!list.length) { grid.innerHTML = '<p class="empty">没有找到匹配的版式，换个关键词试试～</p>'; return; }
    list.forEach(function (v) {
      var card = document.createElement("button");
      card.className = "card";
      card.innerHTML =
        '<div class="thumb">' + window.Paper.render(v.type, { color: v.color, cell: v.cell, thumb: true }) + "</div>" +
        '<div class="cname">' + v.name + "</div>";
      card.onclick = function () { selectVariant(v); window.scrollTo({ top: 0, behavior: "smooth" }); };
      grid.appendChild(card);
    });
  }

  /* ---------------- 下载 / 打印 ---------------- */
  function saveBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function downloadSVG() {
    var svg = $("#sheet svg");
    if (!svg) return;
    var xml = new XMLSerializer().serializeToString(svg);
    saveBlob(new Blob([xml], { type: "image/svg+xml" }), (state.familyId || "paper") + ".svg");
  }
  function downloadPNG() {
    var svg = $("#sheet svg");
    if (!svg) return;
    var xml = new XMLSerializer().serializeToString(svg);
    var svg64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas");
      c.width = 210 * 4; c.height = 297 * 4;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function (b) { saveBlob(b, (state.familyId || "paper") + ".png"); }, "image/png");
    };
    img.src = svg64;
  }
  function randomPaper() {
    var list = window.CATALOG;
    selectVariant(list[Math.floor(Math.random() * list.length)]);
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    buildSidebar();
    buildColorBar();
    buildSizeBar();
    $("#search").addEventListener("input", function (e) { state.search = e.target.value; renderGallery(); });
    $("#printBtn").addEventListener("click", function () { window.print(); });
    $("#svgBtn").addEventListener("click", downloadSVG);
    $("#pngBtn").addEventListener("click", downloadPNG);
    $("#randBtn").addEventListener("click", randomPaper);
    if (window.CATALOG.length) selectVariant(window.CATALOG[0]);
    renderGallery();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
