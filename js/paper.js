/* =========================================================================
 * paper.js — 参数化 A4 纸张渲染器
 * 所有版式均以 SVG (viewBox 0 0 210 297, 单位 mm) 绘制，打印时矢量清晰、缩放无损。
 * 暴露 window.Paper.render(type, opts) -> svg 字符串
 *   opts: { color(默认 '#333'), cell(基础格子尺寸 mm, 默认 14), thumb(是否缩略图) }
 * ========================================================================= */
(function () {
  "use strict";
  var W = 210, H = 297;

  function r(n) { return Math.round(n * 100) / 100; }

  function L(x1, y1, x2, y2, c, sw) {
    return '<line x1="' + r(x1) + '" y1="' + r(y1) + '" x2="' + r(x2) + '" y2="' + r(y2) +
      '" stroke="' + c + '" stroke-width="' + sw + '"/>';
  }
  function Ld(x1, y1, x2, y2, c, sw) {
    return '<line x1="' + r(x1) + '" y1="' + r(y1) + '" x2="' + r(x2) + '" y2="' + r(y2) +
      '" stroke="' + c + '" stroke-width="' + sw + '" stroke-dasharray="1.2 1.2"/>';
  }
  function D(x, y, c, rad) {
    return '<circle cx="' + r(x) + '" cy="' + r(y) + '" r="' + rad + '" fill="' + c + '"/>';
  }
  function R(x, y, w, h, c, sw) {
    return '<rect x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) +
      '" fill="none" stroke="' + c + '" stroke-width="' + sw + '"/>';
  }

  function bounds(cell, thumb) {
    var cols = Math.floor(W / cell), rows = Math.floor(H / cell);
    if (thumb) { cols = Math.min(cols, 9); rows = Math.min(rows, 12); }
    return { cols: cols, rows: rows };
  }

  function gridInner(cell, color, sw, thumb) {
    var s = "", i, j, x, y, b = bounds(cell, thumb);
    for (i = 1; i <= b.cols; i++) { x = i * cell; s += L(x, 0, x, H, color, sw); }
    for (j = 1; j <= b.rows; j++) { y = j * cell; s += L(0, y, W, y, color, sw); }
    return s;
  }

  /* ---------- 汉字练习 ---------- */
  function tian(cell, color, sw, thumb) {
    var s = gridInner(cell, color, sw, thumb), b = bounds(cell, thumb), i, j, x, y;
    for (i = 0; i < b.cols; i++) for (j = 0; j < b.rows; j++) {
      x = i * cell; y = j * cell;
      s += L(x + cell / 2, y, x + cell / 2, y + cell, color, sw);
      s += L(x, y + cell / 2, x + cell, y + cell / 2, color, sw);
    }
    return s;
  }
  function mi(cell, color, sw, thumb) {
    var s = gridInner(cell, color, sw, thumb), b = bounds(cell, thumb), i, j, x, y;
    for (i = 0; i < b.cols; i++) for (j = 0; j < b.rows; j++) {
      x = i * cell; y = j * cell;
      s += L(x + cell / 2, y, x + cell / 2, y + cell, color, sw);
      s += L(x, y + cell / 2, x + cell, y + cell / 2, color, sw);
      s += L(x, y, x + cell, y + cell, color, sw);
      s += L(x + cell, y, x, y + cell, color, sw);
    }
    return s;
  }
  function huigong(cell, color, sw, thumb) {
    var s = gridInner(cell, color, sw, thumb), b = bounds(cell, thumb), i, j, x, y;
    for (i = 0; i < b.cols; i++) for (j = 0; j < b.rows; j++) {
      x = i * cell; y = j * cell;
      s += R(x + cell / 3, y + cell / 3, cell / 3, cell / 3, color, sw);
    }
    return s;
  }
  function jiugong(cell, color, sw, thumb) {
    var s = gridInner(cell, color, sw, thumb), b = bounds(cell, thumb), i, j, x, y;
    for (i = 0; i < b.cols; i++) for (j = 0; j < b.rows; j++) {
      x = i * cell; y = j * cell;
      s += L(x + cell / 3, y, x + cell / 3, y + cell, color, sw);
      s += L(x + 2 * cell / 3, y, x + 2 * cell / 3, y + cell, color, sw);
      s += L(x, y + cell / 3, x + cell, y + cell / 3, color, sw);
      s += L(x, y + 2 * cell / 3, x + cell, y + 2 * cell / 3, color, sw);
    }
    return s;
  }

  /* ---------- 拼音 / 英文 ---------- */
  function pinyinGeneric(cell, color, sw, thumb, diagonals) {
    var s = "", rowH = cell, band = cell * 0.38, hh = cell - band;
    var rows = Math.floor(H / rowH); if (thumb) rows = Math.min(rows, 6);
    var cols = Math.floor(W / cell); if (thumb) cols = Math.min(cols, 8);
    var j, i, y, x;
    for (j = 0; j < rows; j++) {
      y = j * rowH;
      s += L(0, y, W, y, color, sw);
      s += Ld(0, y + band / 3, W, y + band / 3, color, sw * 0.6);
      s += L(0, y + 2 * band / 3, W, y + 2 * band / 3, color, sw);
      s += L(0, y + band, W, y + band, color, sw * 0.6);
      var ty = y + band;
      for (i = 0; i < cols; i++) {
        x = i * cell;
        s += R(x, ty, cell, hh, color, sw);
        s += L(x + cell / 2, ty, x + cell / 2, ty + hh, color, sw);
        s += L(x, ty + hh / 2, x + cell, ty + hh / 2, color, sw);
        if (diagonals) {
          s += L(x, ty, x + cell, ty + hh, color, sw);
          s += L(x + cell, ty, x, ty + hh, color, sw);
        }
      }
    }
    return s;
  }
  function pinyintian(cell, color, sw, thumb) { return pinyinGeneric(cell, color, sw, thumb, false); }
  function pinyinmi(cell, color, sw, thumb) { return pinyinGeneric(cell, color, sw, thumb, true); }

  function fourline(cell, color, sw, thumb) {
    var s = "", rows = Math.floor(H / cell); if (thumb) rows = Math.min(rows, 10), rows = Math.min(rows, 10);
    var j, y;
    for (j = 0; j < rows; j++) {
      y = j * cell;
      s += L(0, y, W, y, color, sw);
      s += Ld(0, y + cell / 3, W, y + cell / 3, color, sw * 0.6);
      s += L(0, y + 2 * cell / 3, W, y + 2 * cell / 3, color, sw);
    }
    s += L(0, H, W, H, color, sw);
    return s;
  }
  function threeline(cell, color, sw, thumb) {
    var s = "", rows = Math.floor(H / cell); if (thumb) rows = Math.min(rows, 12);
    var j, y;
    for (j = 0; j < rows; j++) {
      y = j * cell;
      s += L(0, y, W, y, color, sw);
      s += Ld(0, y + cell / 2, W, y + cell / 2, color, sw * 0.6);
      s += L(0, y + cell, W, y + cell, color, sw);
    }
    return s;
  }

  /* ---------- 方格 / 坐标 / 点阵 ---------- */
  function gridType(cell, color, sw, thumb) {
    var s = gridInner(cell, color, sw, thumb);
    return s;
  }
  function dot(cell, color, sw, thumb) {
    var s = "", b = bounds(cell, thumb), i, j;
    for (i = 0; i <= b.cols; i++) for (j = 0; j <= b.rows; j++) {
      s += D(i * cell, j * cell, color, 0.45);
    }
    return s;
  }
  function coordinate(cell, color, sw, thumb) {
    var s = gridInner(cell, color, sw, thumb);
    s += L(0, H / 2, W, H / 2, color, sw * 3);
    s += L(W / 2, 0, W / 2, H, color, sw * 3);
    return s;
  }
  function sumiao(cell, color, sw, thumb) {
    return gridInner(cell, color, Math.max(0.2, sw * 0.7), thumb);
  }
  function bullet(cell, color, sw, thumb) {
    return dot(cell, color, sw, thumb) + L(0, 14, W, 14, color, sw * 1.2);
  }

  /* ---------- 横线笔记 ---------- */
  function ruled(cell, color, sw, thumb) {
    var s = "", rows = Math.floor(H / cell); if (thumb) rows = Math.min(rows, 12);
    var j, y;
    for (j = 1; j <= rows; j++) { y = j * cell; s += L(0, y, W, y, color, sw); }
    s += L(20, 0, 20, H, color, sw * 1.8);
    return s;
  }
  function ruled2(cell, color, sw, thumb) {
    var s = "", rows = Math.floor(H / cell); if (thumb) rows = Math.min(rows, 12);
    var j, y;
    for (j = 1; j <= rows; j++) {
      y = j * cell;
      s += L(0, y, W, y, color, sw);
      s += L(0, y + cell * 0.18, W, y + cell * 0.18, color, sw * 0.7);
    }
    s += L(20, 0, 20, H, color, sw * 1.8);
    return s;
  }
  function cornell(cell, color, sw, thumb) {
    var s = "", j, y;
    s += L(0, 16, W, 16, color, sw * 1.6);
    s += L(0, 258, W, 258, color, sw * 1.6);
    s += L(62, 16, 62, 258, color, sw * 1.6);
    var rows = Math.floor((258 - 16) / cell); if (thumb) rows = Math.min(rows, 10);
    for (j = 1; j <= rows; j++) { y = 16 + j * cell; s += L(0, y, W, y, color, sw * 0.8); }
    return s;
  }
  function letter(cell, color, sw, thumb) {
    var s = "", j, y;
    s += L(18, 18, W, 18, color, sw * 1.4);
    s += L(18, 0, 18, H, color, sw * 1.6);
    var rows = Math.floor((H - 18) / cell); if (thumb) rows = Math.min(rows, 12);
    for (j = 1; j <= rows; j++) { y = 18 + j * cell; s += L(18, y, W, y, color, sw); }
    return s;
  }

  /* ---------- 数学专用 ---------- */
  function arithmetic(cell, color, sw, thumb) {
    var s = gridInner(cell, color, sw, thumb), b = bounds(cell, thumb), i, j;
    for (i = 0; i < b.cols; i++) for (j = 0; j < b.rows; j++) {
      s += L(i * cell, j * cell + cell, i * cell + cell, j * cell, color, sw);
    }
    return s;
  }
  function shushi(cell, color, sw, thumb) {
    var s = gridInner(cell, color, sw, thumb), b = bounds(cell, thumb), j;
    for (j = 0; j <= b.rows; j += 5) { s += L(0, j * cell, W, j * cell, color, sw * 2.2); }
    return s;
  }

  /* ---------- 音乐 / 绘画 / 手账 ---------- */
  function staff(cell, color, sw, thumb) {
    var s = "", gap = 1.8, group = gap * 4, space = 9, y = 22, i;
    while (y < H - 12) {
      for (i = 0; i < 5; i++) s += L(12, y + i * gap, W - 12, y + i * gap, color, sw);
      y += group + space;
    }
    return s;
  }
  function comic(cell, color, sw, thumb) {
    var s = "", cols = 2, rows = 3, gap = 5;
    var cw = (W - gap * (cols + 1)) / cols, ch = (H - gap * (rows + 1)) / rows, i, j, x, y;
    for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
      x = gap + i * (cw + gap); y = gap + j * (ch + gap);
      s += R(x, y, cw, ch, color, sw * 3);
    }
    return s;
  }
  function cuotiben(cell, color, sw, thumb) {
    var s = "", j, y;
    s += L(0, 18, W, 18, color, sw * 1.4);
    s += L(0, 40, W, 40, color, sw * 0.8);
    s += L(0, 60, W, 60, color, sw * 0.8);
    var rows = Math.floor((H - 60) / cell); if (thumb) rows = Math.min(rows, 10);
    for (j = 1; j <= rows; j++) { y = 60 + j * cell; s += L(0, y, W, y, color, sw * 0.8); }
    return s;
  }
  function yuedu(cell, color, sw, thumb) {
    var s = "", j, y;
    s += L(0, 16, W, 16, color, sw * 1.4);
    s += L(70, 16, 70, H, color, sw * 1.4);
    var rows = Math.floor((H - 16) / cell); if (thumb) rows = Math.min(rows, 12);
    for (j = 1; j <= rows; j++) { y = 16 + j * cell; s += L(0, y, W, y, color, sw * 0.8); }
    return s;
  }
  function qiangedraft(cell, color, sw, thumb) {
    return '<g opacity="0.3">' + gridInner(cell, color, sw, thumb) + '</g>';
  }
  function blank() { return ''; }

  var RENDERERS = {
    tian: tian, mi: mi, huigong: huigong, jiugong: jiugong,
    pinyintian: pinyintian, pinyinmi: pinyinmi,
    fourline: fourline, threeline: threeline,
    grid: gridType, dot: dot, coordinate: coordinate, sumiao: sumiao, bullet: bullet,
    ruled: ruled, ruled2: ruled2, cornell: cornell, letter: letter,
    arithmetic: arithmetic, shushi: shushi,
    staff: staff, comic: comic, cuotiben: cuotiben, yuedu: yuedu,
    qiangedraft: qiangedraft, blank: blank
  };

  function render(type, opts) {
    opts = opts || {};
    var color = opts.color || "#333333";
    var cell = opts.cell || 14;
    var thumb = !!opts.thumb;
    var sw = 0.35;
    var fn = RENDERERS[type] || gridType;
    var inner = fn(cell, color, sw, thumb);
    return '<svg class="paper-svg" viewBox="0 0 210 297" preserveAspectRatio="xMidYMid meet" ' +
      'xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="210" height="297" fill="#ffffff"/>' +
      inner + '</svg>';
  }

  window.Paper = { render: render };
})();
