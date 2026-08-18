/* =========================================================================
 * paper.js — 参数化 A4 纸张渲染器
 * 所有版式均以 SVG (viewBox 0 0 210 297, 单位 mm) 绘制，打印时矢量清晰、缩放无损。
 * 暴露 window.Paper.render(type, opts) -> svg 字符串
 *   opts: { color(默认 '#333'), cell(基础格子尺寸 mm, 默认 14), thumb(是否缩略图), frame(是否加外框) }
 *
 * 关键约束（解决“半格/半行/页边距”问题）：
 *   - 可打印区域必须是 cell 的整数倍，外框正好压在网格边界上 -> 无半格、无半行；
 *   - 按版式类型采用不同页边距策略：
 *       box   —— 方格/点阵/田字格等二维网格：四边对称舒适页边距(BOX_M)；
 *       ruled —— 横线/信纸/笔记等一维横线：仅上下页边距(RULED_M)，横线左右铺满(无左右留白)；
 *   - 所有内容裁剪进外框，框外绝不出现线条。
 * ========================================================================= */
(function () {
  "use strict";
  var W = 210, H = 297;
  // 两类版式采用不同页边距策略：
  //   box   —— 方格/点阵/田字格等二维网格：四边对称舒适页边距，保证整格整行；
  //   ruled —— 横线/信纸/笔记等一维横线：仅上下页边距，横线铺满左右（无左右页边距）。
  var BOX_M = 12;        // 方格类（有外框时）四周边距(mm)：舒适，让外框离纸边有呼吸感
  var BOX_M_OFF = 5;     // 方格类（无外框时）仅留打印机安全边距：网格几乎铺满整页
  var RULED_M = 12;      // 横格类（有外框时）上下边距(mm)
  var RULED_M_OFF = 5;   // 横格类（无外框时）仅留打印机安全上下边距：横线铺到纸边
  var RED_LINE = 18;     // 横格类左侧红色页边线位置(mm)

  // 每种版式对应的页边距模式
  var MODES = {
    tian: "box", mi: "box", huigong: "box", jiugong: "box",
    pinyintian: "box", pinyinmi: "box",
    fourline: "ruled", threeline: "ruled",
    grid: "box", dot: "box", coordinate: "box", sumiao: "box", bullet: "box",
    ruled: "ruled", ruled2: "ruled", cornell: "ruled", letter: "ruled",
    arithmetic: "box", shushi: "ruled",
    staff: "box", comic: "box", cuotiben: "ruled", yuedu: "ruled",
    qiangedraft: "box", blank: "ruled",
    maobimi: "box", maobijie: "box", yingbitian: "box", yingbige: "box",
    zuowen: "box", zuowenH: "ruled",
    legalCourt: "box", legalCourt2: "box", legalBilu: "box", legalDoc: "box"
  };
  var _mode = "box";   // 由 render() 按 type 设置，供各渲染器内的 geom() 读取
  var _frame = true;   // 由 render() 按是否加外框设置：决定是否采用舒适边距
  var _thumb = false;  // 由 render() 按是否缩略图设置：模板文字不在缩略图里显示

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
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function tw(str, size) {
    var w = 0;
    for (var i = 0; i < str.length; i++) w += (str.charCodeAt(i) > 255 ? size * 1.0 : size * 0.55);
    return w;
  }
  function T(x, y, str, size, color, anchor) {
    if (_thumb) return "";
    return '<text x="' + r(x) + '" y="' + r(y) + '" font-family="\'PingFang SC\',\'Microsoft YaHei\',sans-serif" ' +
      'font-size="' + size + '" fill="' + color + '" text-anchor="' + (anchor || "middle") + '">' + esc(str) + '</text>';
  }

  /* 计算“整数倍”几何（解决半格/半行/页边距问题）：
   *   box    —— 四边对称页边距，可打印区是 cell 整数倍，外框压网格边界；
   *   ruled  —— 仅上下页边距，横线左右铺满（ox=0, iw=W），避免“左右页边距”浪费。 */
  function geom(cell, thumb, mode) {
    mode = mode || _mode;
    var nX, nY, ox, oy, iw, ih;
    if (thumb) {
      // 缩略图：居中、限量，便于画廊清晰预览（无外框）
      nX = Math.min(Math.max(1, Math.floor(W / cell)), 9);
      nY = Math.min(Math.max(1, Math.floor(H / cell)), 12);
      ox = (W - nX * cell) / 2;
      oy = (H - nY * cell) / 2;
      iw = nX * cell; ih = nY * cell;
    } else if (mode === "ruled") {
      // 横格：仅上下页边距，横线铺满左右（无左右页边距）；有框舒适、无框仅安全边距
      var rm = _frame ? RULED_M : RULED_M_OFF;
      nY = Math.max(1, Math.floor((H - 2 * rm) / cell));
      nX = Math.max(1, Math.floor(W / cell)); // 仅占位，横格实际只用到 nY
      ox = 0; oy = rm; iw = W; ih = nY * cell;
    } else {
      // 方格：四边对称页边距；有框舒适(12mm)、无框仅安全边距(5mm)，框线恰好落网格边界
      var bm = _frame ? BOX_M : BOX_M_OFF;
      nX = Math.max(1, Math.floor((W - 2 * bm) / cell));
      nY = Math.max(1, Math.floor((H - 2 * bm) / cell));
      ox = (W - nX * cell) / 2;
      oy = (H - nY * cell) / 2;
      iw = nX * cell; ih = nY * cell;
    }
    return { nX: nX, nY: nY, ox: ox, oy: oy, iw: iw, ih: ih, c: cell, mode: mode };
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
    for (j = 1; j <= g.nY; j++) { y = g.oy + j * cell; s += L(g.ox + RED_LINE, y, g.ox + g.iw, y, color, sw); }
    s += L(g.ox + RED_LINE, g.oy, g.ox + RED_LINE, g.oy + g.ih, color, sw * 1.8);
    return s;
  }
  function ruled2(cell, color, sw, thumb) {
    var g = geom(cell, thumb), s = "", j, y;
    for (j = 1; j <= g.nY; j++) {
      y = g.oy + j * cell;
      s += L(g.ox + RED_LINE, y, g.ox + g.iw, y, color, sw);
      s += L(g.ox + RED_LINE, y + cell * 0.18, g.ox + g.iw, y + cell * 0.18, color, sw * 0.7);
    }
    s += L(g.ox + RED_LINE, g.oy, g.ox + RED_LINE, g.oy + g.ih, color, sw * 1.8);
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

  /* ---------- 书法（竖向排列：自右向左、自上而下） ---------- */
  function vcol(cell, color, sw, thumb, inner, heavy) {
    if (inner === "grid" && !heavy) return gridInner(cell, color, sw, thumb);
    var g = geom(cell, thumb), s = "", i, j, x, y;
    // 横向浅线（行分隔）
    for (j = 0; j <= g.nY; j++) { y = g.oy + j * cell; s += L(g.ox, y, g.ox + g.iw, y, color, sw * 0.8); }
    // 竖向界格线（毛笔/硬笔书法加粗，模拟乌丝栏）
    var vw = heavy ? sw * 1.8 : sw;
    for (i = 0; i <= g.nX; i++) { x = g.ox + i * cell; s += L(x, g.oy, x, g.oy + g.ih, color, vw); }
    // 格内辅助线（田字/米字）
    if (inner === "tian" || inner === "mi") {
      for (i = 0; i < g.nX; i++) for (j = 0; j < g.nY; j++) {
        x = g.ox + i * cell; y = g.oy + j * cell;
        s += L(x + cell / 2, y, x + cell / 2, y + cell, color, sw * 0.8);
        s += L(x, y + cell / 2, x + cell, y + cell / 2, color, sw * 0.8);
        if (inner === "mi") {
          s += L(x, y, x + cell, y + cell, color, sw * 0.8);
          s += L(x + cell, y, x, y + cell, color, sw * 0.8);
        }
      }
    }
    return s;
  }
  function maobimi(c, col, sw, t) { return vcol(c, col, sw, t, "mi", true); }
  function maobijie(c, col, sw, t) { return vcol(c, col, sw, t, "none", true); }
  function yingbitian(c, col, sw, t) { return vcol(c, col, sw, t, "tian", true); }
  function yingbige(c, col, sw, t) { return vcol(c, col, sw, t, "grid", false); }

  /* ---------- 作文纸（方格/横格 + 抬头模板） ---------- */
  function zuowenHead(g, cell, color, sw) {
    var s = T(g.ox + cell * 0.4, g.oy + cell * 0.85, "题目", 4.6, "#9aa0a6", "start");
    var labels = ["班级", "姓名", "学号", "日期"], n = 4, fw = cell * 2.1, gap = cell * 0.45;
    var totalW = n * fw + (n - 1) * gap, rx = g.ox + g.iw - totalW, ry = g.oy + cell * 0.12;
    for (var k = 0; k < n; k++) {
      var bx = rx + k * (fw + gap);
      s += R(bx, ry, fw, cell * 0.8, color, sw * 1.1);
      s += T(bx + fw / 2, ry + cell * 0.62, labels[k], 3.6, "#9aa0a6");
    }
    return s;
  }
  function zuowen(cell, color, sw, thumb) {
    var g = geom(cell, thumb), headRows = 2, headBot = g.oy + headRows * cell, s = "", i, j, x, y;
    var rows = Math.max(0, g.nY - headRows);
    for (i = 1; i < g.nX; i++) { x = g.ox + i * cell; s += L(x, headBot, x, g.oy + g.ih, color, sw); }
    for (j = 0; j <= rows; j++) { y = headBot + j * cell; s += L(g.ox, y, g.ox + g.iw, y, color, sw); }
    s += L(g.ox, headBot, g.ox + g.iw, headBot, color, sw * 1.8);
    s += zuowenHead(g, cell, color, sw);
    return s;
  }
  function zuowenH(cell, color, sw, thumb) {
    var g = geom(cell, thumb), headRows = 2, headBot = g.oy + headRows * cell, s = "", j, y;
    var rows = Math.max(1, Math.floor((g.oy + g.ih - headBot) / cell));
    for (j = 1; j <= rows; j++) { y = headBot + j * cell; s += L(g.ox, y, g.ox + g.iw, y, color, sw); }
    s += L(g.ox, headBot, g.ox + g.iw, headBot, color, sw * 1.8);
    s += zuowenHead(g, cell, color, sw);
    return s;
  }

  /* ---------- 法律文书 ----------
   * 笔录/记录(庭审一审/二审、讯问) = 横线正文 + 完整案件信息表单（当事人及代理人等）；
   * 稿纸(法律文书方格) = 方格正文，供起草文书。 */
  // 通用字段：标签 + 填空横线；boundary 为该字段横线右端上限，避免两列相互重叠
  function legalField(s, g, x, y, label, boundary, color, sw) {
    var lab = label + "：";
    s += T(x, y, lab, 4.2, "#6b7280", "start");
    var lw = tw(lab, 4.2);
    var x2 = x + lw + 1;
    var len = Math.max(18, boundary - x2);
    s += L(x2, y + 1.5, x2 + len, y + 1.5, color, sw * 0.9);
    return s;
  }
  // 笔录/记录模板：抬头为案件信息表单，正文为横线（供书写记录）
  function legalRecord(cell, color, sw, thumb, stage) {
    var g = geom(cell, thumb), s = "";
    var title = stage === "court2" ? "二 审 庭 审 笔 录"
      : stage === "bilu" ? "讯 问 笔 录" : "庭 审 笔 录";
    s += T(g.ox + g.iw / 2, g.oy + 8, title, 8, color);
    s += L(g.ox + g.iw * 0.30, g.oy + 10.5, g.ox + g.iw * 0.70, g.oy + 10.5, color, sw * 1.2);
    var rowH = 11, formTop = g.oy + 17;
    var xL = g.ox + 2, xR = g.ox + g.iw * 0.50;
    var bL = g.ox + g.iw * 0.47, bR = g.ox + g.iw - 2;
    var rows;
    if (stage === "court2") {
      rows = [["案号", "案由"], ["时间", "地点"], ["审判长（主审）", "审判员"],
        ["书记员", "陪审员"], ["上诉人", "代理人"], ["被上诉人", "代理人"],
        ["原审原告", "代理人"], ["原审被告", "代理人"], ["第三人", "代理人"]];
    } else if (stage === "bilu") {
      rows = [["案号", "案由"], ["时间", "地点"], ["讯问人", "记录人"], ["被讯问人", "单位及职务"]];
    } else {
      rows = [["案号", "案由"], ["时间", "地点"], ["审判长（主审）", "审判员"],
        ["书记员", "陪审员"], ["原告", "代理人"], ["被告", "代理人"], ["第三人", "代理人"]];
    }
    for (var ri = 0; ri < rows.length; ri++) {
      var y = formTop + ri * rowH;
      s = legalField(s, g, xL, y, rows[ri][0], bL, color, sw);
      if (rows[ri][1]) s = legalField(s, g, xR, y, rows[ri][1], bR, color, sw);
    }
    var headerBottom = formTop + rows.length * rowH + 4;
    s += L(g.ox, headerBottom, g.ox + g.iw, headerBottom, color, sw * 1.4);
    var y2 = headerBottom + cell;
    while (y2 <= g.oy + g.ih - 2) { s += L(g.ox, y2, g.ox + g.iw, y2, color, sw * 0.9); y2 += cell; }
    s += T(g.ox + g.iw / 2, g.oy + g.ih - 4, "第        页      共        页", 3.6, "#9aa0a6");
    return s;
  }
  // 法律文书稿纸（方格起草用）：方格正文 + 抬头字段
  function legalBase(cell, color, sw, thumb, variant) {
    var g = geom(cell, thumb), headRows = 3, headBot = g.oy + headRows * cell, s = "", i, j, x, y;
    var rows = Math.max(0, g.nY - headRows);
    for (i = 1; i < g.nX; i++) { x = g.ox + i * cell; s += L(x, headBot, x, g.oy + g.ih, color, sw); }
    for (j = 0; j <= rows; j++) { y = headBot + j * cell; s += L(g.ox, y, g.ox + g.iw, y, color, sw); }
    s += L(g.ox, headBot, g.ox + g.iw, headBot, color, sw * 1.8);
    s += T(g.ox + g.iw / 2, g.oy + cell * 0.9, "法 律 文 书 稿 纸", 7, color);
    s += L(g.ox + g.iw * 0.28, g.oy + cell * 1.2, g.ox + g.iw * 0.72, g.oy + cell * 1.2, color, sw * 1.2);
    var fields = [["文书名称"], ["案号"], ["当事人"], ["日期"]];
    var colW = g.iw / 2, perCol = 2;
    for (var k = 0; k < fields.length; k++) {
      var col = k < perCol ? 0 : 1, rowIdx = k % perCol;
      var lx = g.ox + col * colW + cell * 0.4;
      var ly = g.oy + cell * 0.3 + rowIdx * cell;
      var lab = fields[k][0] + "：";
      s += T(lx, ly + cell * 0.7, lab, 4.2, "#9aa0a6", "start");
      var lineEnd = g.ox + (col + 1) * colW - cell * 0.4;
      s += L(lx + tw(lab, 4.2) + 1, ly + cell * 0.78, lineEnd, ly + cell * 0.78, color, sw * 0.9);
    }
    return s;
  }
  function legalCourt(c, col, sw, t) { return legalRecord(c, col, sw, t, "court1"); }
  function legalCourt2(c, col, sw, t) { return legalRecord(c, col, sw, t, "court2"); }
  function legalBilu(c, col, sw, t) { return legalRecord(c, col, sw, t, "bilu"); }
  function legalDoc(c, col, sw, t) { return legalBase(c, col, sw, t, "doc"); }

  var RENDERERS = {
    tian: tian, mi: mi, huigong: huigong, jiugong: jiugong,
    pinyintian: pinyintian, pinyinmi: pinyinmi,
    fourline: fourline, threeline: threeline,
    grid: gridType, dot: dot, coordinate: coordinate, sumiao: sumiao, bullet: bullet,
    ruled: ruled, ruled2: ruled2, cornell: cornell, letter: letter,
    arithmetic: arithmetic, shushi: shushi,
    staff: staff, comic: comic, cuotiben: cuotiben, yuedu: yuedu,
    qiangedraft: qiangedraft, blank: blank,
    maobimi: maobimi, maobijie: maobijie, yingbitian: yingbitian, yingbige: yingbige,
    zuowen: zuowen, zuowenH: zuowenH,
    legalCourt: legalCourt, legalCourt2: legalCourt2, legalBilu: legalBilu, legalDoc: legalDoc
  };

  function render(type, opts) {
    opts = opts || {};
    var color = opts.color || "#333333";
    var cell = opts.cell || 14;
    var thumb = !!opts.thumb;
    var frame = opts.frame !== false && !thumb;   // 仅完整预览/打印加框，缩略图保持干净
    _thumb = thumb;                                // 模板文字不在缩略图里显示
    _mode = MODES[type] || "box";                 // 设定当前版式页边距模式，供渲染器内 geom() 读取
    _frame = frame;                                // 设定是否加外框，决定采用舒适边距还是最小安全边距
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
