/* =========================================================================
 * paper.js — 参数化 A4 纸张渲染器
 * 所有版式均以 SVG (viewBox 0 0 210 297, 单位 mm) 绘制，打印时矢量清晰、缩放无损。
 * 暴露 window.Paper.render(type, opts) -> svg 字符串
 *   opts: { color(默认 '#333'), cell(基础格子尺寸 mm, 默认 14), thumb(是否缩略图), frame(是否加外框) }
 *
 * 关键约束（解决“半格/半行/页边距”问题）：
 *   - 可打印区域必须是 cell 的整数倍，外框正好压在网格边界上 -> 无半格、无半行；
 *   - 四周预留 MIN_M(8mm) 安全页边距，避开打印机不可打印区；
 *   - 所有内容裁剪进外框，框外绝不出现线条。
 * ========================================================================= */
(function () {
  "use strict";
  var W = 210, H = 297;
  var MIN_M = 8; // 打印机安全页边距(mm)：保证框线/内容离纸边≥此值，且可打印区是格子整数倍

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

  /* 根据格子尺寸计算“整数倍”几何：外框 = 最外网格线，框内整格整行 */
  function geom(cell, thumb) {
    var nX, nY, ox, oy;
    if (thumb) {
      // 缩略图：居中、限量，便于画廊清晰预览（无外框）
      nX = Math.min(Math.max(1, Math.floor(W / cell)), 9);
      nY = Math.min(Math.max(1, Math.floor(H / cell)), 12);
      ox = (W - nX * cell) / 2;
      oy = (H - nY * cell) / 2;
    } else {
      // 完整页：在预留安全页边距后，取能容纳的整格数，框线恰好落在网格边界
      nX = Math.max(1, Math.floor((W - 2 * MIN_M) / cell));
      nY = Math.max(1, Math.floor((H - 2 * MIN_M) / cell));
      ox = (W - nX * cell) / 2;
      oy = (H - nY * cell) / 2;
    }
    return { nX: nX, nY: nY, ox: ox, oy: oy, iw: nX * cell, ih: nY * cell, c: cell };
  }

  /* 基础方格网：只画内部线，外框由 frame 负责（即最外网格线），杜绝半格 */
  function gridInner(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", i, j, x, y;
    for (i = 1; i < g.nX; i++) { x = g.ox + i * cell; s += L(x, g.oy, x, g.oy + g.ih, color, sw); }
    for (j = 1; j < g.nY; j++) { y = g.oy + j * cell; s += L(g.ox, y, g.ox + g.iw, y, color, sw); }
    return s;
  }

  /* ---------- 汉字练习 ---------- */
  function tian(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = gridInner(cell, color, sw, thumb), i, j, x, y;
    for (i = 0; i < g.nX; i++) for (j = 0; j < g.nY; j++) {
      x = g.ox + i * cell; y = g.oy + j * cell;
      s += L(x + cell / 2, y, x + cell / 2, y + cell, color, sw);
      s += L(x, y + cell / 2, x + cell, y + cell / 2, color, sw);
    }
    return s;
  }
  function mi(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = gridInner(cell, color, sw, thumb), i, j, x, y;
    for (i = 0; i < g.nX; i++) for (j = 0; j < g.nY; j++) {
      x = g.ox + i * cell; y = g.oy + j * cell;
      s += L(x + cell / 2, y, x + cell / 2, y + cell, color, sw);
      s += L(x, y + cell / 2, x + cell, y + cell / 2, color, sw);
      s += L(x, y, x + cell, y + cell, color, sw);
      s += L(x + cell, y, x, y + cell, color, sw);
    }
    return s;
  }
  function huigong(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = gridInner(cell, color, sw, thumb), i, j, x, y;
    for (i = 0; i < g.nX; i++) for (j = 0; j < g.nY; j++) {
      x = g.ox + i * cell; y = g.oy + j * cell;
      s += R(x + cell / 3, y + cell / 3, cell / 3, cell / 3, color, sw);
    }
    return s;
  }
  function jiugong(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = gridInner(cell, color, sw, thumb), i, j, x, y;
    for (i = 0; i < g.nX; i++) for (j = 0; j < g.nY; j++) {
      x = g.ox + i * cell; y = g.oy + j * cell;
      s += L(x + cell / 3, y, x + cell / 3, y + cell, color, sw);
      s += L(x + 2 * cell / 3, y, x + 2 * cell / 3, y + cell, color, sw);
      s += L(x, y + cell / 3, x + cell, y + cell / 3, color, sw);
      s += L(x, y + 2 * cell / 3, x + cell, y + 2 * cell / 3, color, sw);
    }
    return s;
  }

  /* ---------- 拼音 / 英文（每行占一整格高度，整行无半行） ---------- */
  function pinyinGeneric(cell, color, sw, thumb, diagonals) {
    var g = geom(cell, thumb);
    var band = cell * 0.38, hh = cell - band;
    var rows = g.nY, cols = g.nX, s = "", j, i, x, y;
    for (j = 0; j < rows; j++) {
      y = g.oy + j * cell;
      s += L(g.ox, y, g.ox + g.iw, y, color, sw);
      s += Ld(g.ox, y + band / 3, g.ox + g.iw, y + band / 3, color, sw * 0.6);
      s += L(g.ox, y + 2 * band / 3, g.ox + g.iw, y + 2 * band / 3, color, sw);
      s += L(g.ox, y + band, g.ox + g.iw, y + band, color, sw * 0.6);
      var ty = y + band;
      for (i = 0; i < cols; i++) {
        x = g.ox + i * cell;
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
    var g = geom(cell, thumb), s = "", j, y;
    for (j = 0; j < g.nY; j++) {
      y = g.oy + j * cell;
      s += L(g.ox, y, g.ox + g.iw, y, color, sw);
      s += Ld(g.ox, y + cell / 3, g.ox + g.iw, y + cell / 3, color, sw * 0.6);
      s += L(g.ox, y + 2 * cell / 3, g.ox + g.iw, y + 2 * cell / 3, color, sw);
    }
    s += L(g.ox, g.oy + g.ih, g.ox + g.iw, g.oy + g.ih, color, sw);
    return s;
  }
  function threeline(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", j, y;
    for (j = 0; j < g.nY; j++) {
      y = g.oy + j * cell;
      s += L(g.ox, y, g.ox + g.iw, y, color, sw);
      s += Ld(g.ox, y + cell / 2, g.ox + g.iw, y + cell / 2, color, sw * 0.6);
      s += L(g.ox, y + cell, g.ox + g.iw, y + cell, color, sw);
    }
    return s;
  }

  /* ---------- 方格 / 坐标 / 点阵 ---------- */
  function gridType(cell, color, sw, thumb) { return gridInner(cell, color, sw, thumb); }
  function dot(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", i, j;
    for (i = 0; i <= g.nX; i++) for (j = 0; j <= g.nY; j++) {
      s += D(g.ox + i * cell, g.oy + j * cell, color, 0.45);
    }
    return s;
  }
  function coordinate(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = gridInner(cell, color, sw, thumb);
    s += L(g.ox, g.oy + g.ih / 2, g.ox + g.iw, g.oy + g.ih / 2, color, sw * 3);
    s += L(g.ox + g.iw / 2, g.oy, g.ox + g.iw / 2, g.oy + g.ih, color, sw * 3);
    return s;
  }
  function sumiao(cell, color, sw, thumb) { return gridInner(cell, color, Math.max(0.2, sw * 0.7), thumb); }
  function bullet(cell, color, sw, thumb) {
    var g = geom(cell, thumb);
    return dot(cell, color, sw, thumb) + L(g.ox, g.oy + 14, g.ox + g.iw, g.oy + 14, color, sw * 1.2);
  }

  /* ---------- 横线笔记（行距=cell，整行充满框高，无半行） ---------- */
  function ruled(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", j, y;
    for (j = 1; j <= g.nY; j++) { y = g.oy + j * cell; s += L(g.ox, y, g.ox + g.iw, y, color, sw); }
    s += L(g.ox + 18, g.oy, g.ox + 18, g.oy + g.ih, color, sw * 1.8);
    return s;
  }
  function ruled2(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", j, y;
    for (j = 1; j <= g.nY; j++) {
      y = g.oy + j * cell;
      s += L(g.ox, y, g.ox + g.iw, y, color, sw);
      s += L(g.ox, y + cell * 0.18, g.ox + g.iw, y + cell * 0.18, color, sw * 0.7);
    }
    s += L(g.ox + 18, g.oy, g.ox + 18, g.oy + g.ih, color, sw * 1.8);
    return s;
  }
  function cornell(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", j, y;
    var topH = 16, botH = 16, bodyTop = g.oy + topH, bodyBot = g.oy + g.ih - botH;
    s += L(g.ox, bodyTop, g.ox + g.iw, bodyTop, color, sw * 1.6);
    s += L(g.ox, bodyBot, g.ox + g.iw, bodyBot, color, sw * 1.6);
    s += L(g.ox + 62, bodyTop, g.ox + 62, bodyBot, color, sw * 1.6);
    var rows = Math.floor((bodyBot - bodyTop) / cell);
    for (j = 1; j <= rows; j++) { y = bodyTop + j * cell; s += L(g.ox, y, g.ox + g.iw, y, color, sw * 0.8); }
    return s;
  }
  function letter(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", j, y;
    s += L(g.ox + 18, g.oy, g.ox + 18, g.oy + g.ih, color, sw * 1.6);
    s += L(g.ox, g.oy + 18, g.ox + g.iw, g.oy + 18, color, sw * 1.4);
    var rows = Math.floor((g.ih - 18) / cell);
    for (j = 1; j <= rows; j++) { y = g.oy + 18 + j * cell; s += L(g.ox + 18, y, g.ox + g.iw, y, color, sw); }
    return s;
  }

  /* ---------- 数学专用 ---------- */
  function arithmetic(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = gridInner(cell, color, sw, thumb), i, j;
    for (i = 0; i < g.nX; i++) for (j = 0; j < g.nY; j++) {
      s += L(g.ox + i * cell, g.oy + (j + 1) * cell, g.ox + (i + 1) * cell, g.oy + j * cell, color, sw);
    }
    return s;
  }
  function shushi(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", j;
    for (j = 0; j <= g.nY; j += 5) { s += L(g.ox, g.oy + j * cell, g.ox + g.iw, g.oy + j * cell, color, sw * 2.2); }
    return s;
  }

  /* ---------- 音乐 / 绘画 / 手账（固定在框内，居中绘制） ---------- */
  function staff(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", gap = 1.8, group = gap * 4, space = 9, y = g.oy + 22, i;
    while (y < g.oy + g.ih - 12) {
      for (i = 0; i < 5; i++) s += L(g.ox + 12, y + i * gap, g.ox + g.iw - 12, y + i * gap, color, sw);
      y += group + space;
    }
    return s;
  }
  function comic(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", cols = 2, rows = 3, gap = 5;
    var cw = (g.iw - gap * (cols + 1)) / cols, ch = (g.ih - gap * (rows + 1)) / rows, i, j, x, y;
    for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
      x = g.ox + gap + i * (cw + gap); y = g.oy + gap + j * (ch + gap);
      s += R(x, y, cw, ch, color, sw * 3);
    }
    return s;
  }
  function cuotiben(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", j, y;
    s += L(g.ox, g.oy + 18, g.ox + g.iw, g.oy + 18, color, sw * 1.4);
    s += L(g.ox, g.oy + 40, g.ox + g.iw, g.oy + 40, color, sw * 0.8);
    s += L(g.ox, g.oy + 60, g.ox + g.iw, g.oy + 60, color, sw * 0.8);
    var rows = Math.floor((g.ih - 60) / cell);
    for (j = 1; j <= rows; j++) { y = g.oy + 60 + j * cell; s += L(g.ox, y, g.ox + g.iw, y, color, sw * 0.8); }
    return s;
  }
  function yuedu(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", j, y;
    s += L(g.ox, g.oy + 16, g.ox + g.iw, g.oy + 16, color, sw * 1.4);
    s += L(g.ox + 70, g.oy + 16, g.ox + 70, g.oy + g.ih, color, sw * 1.4);
    var rows = Math.floor((g.ih - 16) / cell);
    for (j = 1; j <= rows; j++) { y = g.oy + 16 + j * cell; s += L(g.ox, y, g.ox + g.iw, y, color, sw * 0.8); }
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
    var frame = opts.frame !== false && !thumb;   // 仅完整预览/打印加框，缩略图保持干净
    var sw = 0.35;
    var fn = RENDERERS[type] || gridType;
    var inner = fn(cell, color, sw, thumb);
    var frameSvg = "", defs = "", innerWrap = inner;
    if (frame) {
      var g = geom(cell, false);
      // 外框 = 最外网格线：框线正好压在整格边界上
      frameSvg = R(g.ox, g.oy, g.iw, g.ih, color, 0.7);
      // 内容裁剪进框内，框外绝不出现线条
      defs = '<clipPath id="fc"><rect x="' + r(g.ox) + '" y="' + r(g.oy) +
        '" width="' + r(g.iw) + '" height="' + r(g.ih) + '"/></clipPath>';
      innerWrap = '<g clip-path="url(#fc)">' + inner + '</g>';
    }
    return '<svg class="paper-svg" viewBox="0 0 210 297" preserveAspectRatio="xMidYMid meet" ' +
      'xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="210" height="297" fill="#ffffff"/>' +
      defs + innerWrap + frameSvg + '</svg>';
  }

  window.Paper = { render: render, geom: geom };
})();
