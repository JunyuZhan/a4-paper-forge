/* =========================================================================
 * data.js — 版式家族、分类、颜色、格子尺寸，并展开生成数百种版式目录
 * 暴露全局：COLORS, SIZES, CATEGORIES, FAMILIES, CATALOG
 * ========================================================================= */
(function () {
  "use strict";

  var COLORS = [
    { key: "black", name: "经典黑", value: "#333333" },
    { key: "blue", name: "护眼底蓝", value: "#1f6feb" },
    { key: "red", name: "批改红", value: "#e23b3b" },
    { key: "green", name: "清新绿", value: "#2e9e5b" },
    { key: "purple", name: "优雅紫", value: "#8b5cf6" },
    { key: "pink", name: "温柔粉", value: "#e87fa8" },
    { key: "gray", name: "沉稳灰", value: "#9aa0a6" }
  ];

  var SIZES = {
    "7": { name: "超密", mm: 7 },
    "8": { name: "密", mm: 8 },
    "10": { name: "标准", mm: 10 },
    "14": { name: "宽松", mm: 14 },
    "18": { name: "标准", mm: 18 },
    "20": { name: "大格", mm: 20 },
    "25": { name: "超大", mm: 25 },
    "fx": { name: "标准", mm: 14 }
  };

  var CATEGORIES = [
    { key: "hanzi", name: "汉字练习", icon: "✍️" },
    { key: "pinyin", name: "拼音英文", icon: "🔤" },
    { key: "grid", name: "方格坐标", icon: "▦" },
    { key: "lined", name: "横线笔记", icon: "📝" },
    { key: "math", name: "数学专用", icon: "➗" },
    { key: "draft", name: "草稿空白", icon: "📄" },
    { key: "special", name: "音乐绘画", icon: "🎼" },
    { key: "journal", name: "手账特殊", icon: "📔" },
    { key: "shufa", name: "书法纸", icon: "🖌️" },
    { key: "zuowen", name: "作文纸", icon: "📃" },
    { key: "legal", name: "法律文书", icon: "⚖️" }
  ];

  /* 每个家族: id, name, cat, type, sizeKeys, desc, colorKeys(可选) */
  var FAMILIES = [
    /* 汉字练习 */
    { id: "tian", name: "田字格", cat: "hanzi", type: "tian", sizeKeys: ["10", "14", "20"], desc: "汉字基础格，十字辅助线帮助掌握间架结构。" },
    { id: "mi", name: "米字格", cat: "hanzi", type: "mi", sizeKeys: ["10", "14", "20"], desc: "米字辅助线，适合笔画定位与书法练习。" },
    { id: "huigong", name: "回宫格", cat: "hanzi", type: "huigong", sizeKeys: ["14", "20"], desc: "内外双框，帮助把握字的整体与局部比例。" },
    { id: "jiugong", name: "九宫格", cat: "hanzi", type: "jiugong", sizeKeys: ["14", "20"], desc: "九宫划分，训练中宫收紧与四周舒展。" },
    { id: "shufa", name: "毛笔米字格竖排", cat: "shufa", type: "maobimi", sizeKeys: ["20", "25"], colorKeys: ["red", "black", "gray"], desc: "竖排米字格，毛笔临帖与日常练习。" },
    { id: "miaohong", name: "描红格", cat: "hanzi", type: "tian", sizeKeys: ["14", "20"], desc: "描红临摹，初学者起步好帮手。" },

    /* 书法纸（竖向排列：自右向左、自上而下） */
    { id: "maobijie", name: "毛笔界格竖排", cat: "shufa", type: "maobijie", sizeKeys: ["20", "25"], colorKeys: ["red", "black", "gray"], desc: "宣纸/毛边纸界格（乌丝栏），竖写创作。" },
    { id: "yingbitian", name: "硬笔田字格竖排", cat: "shufa", type: "yingbitian", sizeKeys: ["14", "18", "20"], desc: "竖排田字格，硬笔书法练字。" },
    { id: "yingbige", name: "硬笔方格竖排", cat: "shufa", type: "yingbige", sizeKeys: ["14", "18", "20"], desc: "竖排方格，硬笔创作与抄写。" },

    /* 拼音英文 */
    { id: "pinyin-tian", name: "拼音田字格", cat: "pinyin", type: "pinyintian", sizeKeys: ["18"], desc: "上排拼音四线、下排田字，语文作业常用。" },
    { id: "pinyin-mi", name: "拼音米字格", cat: "pinyin", type: "pinyinmi", sizeKeys: ["18"], desc: "拼音四线加米字格，书写更规范。" },
    { id: "fourline", name: "四线三格", cat: "pinyin", type: "fourline", sizeKeys: ["8", "10"], desc: "拼音与英文书写标准三线格式。" },
    { id: "threeline", name: "三线格", cat: "pinyin", type: "threeline", sizeKeys: ["8", "10"], desc: "英文抄写与单词练习。" },

    /* 方格坐标 */
    { id: "fangge", name: "方格本", cat: "grid", type: "grid", sizeKeys: ["7", "10", "14", "20"], desc: "通用方格纸，绘图、演算两用。" },
    { id: "dianzhen", name: "点阵本", cat: "grid", type: "dot", sizeKeys: ["7", "10", "14"], desc: "隐形点阵，自由书写不显乱。" },
    { id: "zuobiao", name: "坐标纸", cat: "grid", type: "coordinate", sizeKeys: ["7", "10", "14"], desc: "带坐标轴，函数与几何作图。" },
    { id: "dianzhenda", name: "大点阵", cat: "grid", type: "dot", sizeKeys: ["14", "20"], desc: "大间距点阵，手账与排版。" },

    /* 横线笔记 */
    { id: "hengxian", name: "单横线", cat: "lined", type: "ruled", sizeKeys: ["7", "10", "14"], desc: "经典横线笔记，左侧红边距。" },
    { id: "shuangheng", name: "双横线", cat: "lined", type: "ruled2", sizeKeys: ["7", "10"], desc: "双线间距，书写更整齐。" },
    { id: "kangnai", name: "康奈尔笔记", cat: "lined", type: "cornell", sizeKeys: ["fx"], desc: "线索/笔记/总结三区，高效复习。" },
    { id: "xinzhi", name: "信纸横线", cat: "lined", type: "letter", sizeKeys: ["8", "10"], desc: "书信格式，带抬头与边距。" },

    /* 数学专用 */
    { id: "suanfa", name: "算术本", cat: "math", type: "arithmetic", sizeKeys: ["7", "10"], desc: "每格带斜线，列竖式与算术。" },
    { id: "shushi", name: "竖式计算纸", cat: "math", type: "shushi", sizeKeys: ["10", "14"], desc: "加粗基准线，多位数竖式专用。" },
    { id: "shuxue-tian", name: "数字田字格", cat: "hanzi", type: "tian", sizeKeys: ["14", "20"], desc: "数字书写田字格，规范数字笔顺与占位（原误置于数学类，实为田字格）。" },

    /* 草稿空白 */
    { id: "blank", name: "空白纸", cat: "draft", type: "blank", sizeKeys: ["fx"], colorKeys: ["black"], desc: "纯白 A4，自由发挥。" },
    { id: "qiangedraft", name: "浅格草稿", cat: "draft", type: "qiangedraft", sizeKeys: ["7", "10", "14"], desc: "浅色网格，草稿演算不刺眼。" },

    /* 音乐绘画 */
    { id: "wuxianpu", name: "五线谱", cat: "special", type: "staff", sizeKeys: ["fx"], desc: "标准五线谱，作曲与视唱。" },
    { id: "manhua", name: "漫画分镜", cat: "special", type: "comic", sizeKeys: ["fx"], desc: "分镜格，漫画创作草图。" },
    { id: "sumiao", name: "素描网格", cat: "special", type: "sumiao", sizeKeys: ["7", "10", "14"], desc: "轻网格，素描与构图参考。" },

    /* 手账特殊 */
    { id: "zidanzhang", name: "子弹笔记", cat: "journal", type: "bullet", sizeKeys: ["7", "10", "14"], desc: "点阵子弹日记，规划与清单。" },
    { id: "cuotiben", name: "错题本", cat: "journal", type: "cuotiben", sizeKeys: ["fx"], desc: "分区错题整理，分析原因。" },
    { id: "yuedu", name: "阅读笔记", cat: "journal", type: "yuedu", sizeKeys: ["fx"], desc: "左右分栏，摘录与感悟。" },

    /* 作文纸 */
    { id: "zuowen", name: "作文方格", cat: "zuowen", type: "zuowen", sizeKeys: ["14", "18"], desc: "方格作文纸，带班级/姓名/学号/日期抬头与标题行。" },
    { id: "zuowenheng", name: "作文横格", cat: "zuowen", type: "zuowenH", sizeKeys: ["10", "14"], desc: "横格作文纸，带信息抬头与标题行。" },

    /* 法律文书 */
    { id: "court", name: "庭审笔录（一审）", cat: "legal", type: "legalCourt", sizeKeys: ["10", "14"], desc: "横线正文 + 案件信息表单：时间/地点/主审/原告·被告·第三人及各自代理人。" },
    { id: "court2", name: "庭审笔录（二审）", cat: "legal", type: "legalCourt2", sizeKeys: ["10", "14"], desc: "横线正文 + 二审表单：上诉人/被上诉人、原审原告/被告及各自代理人、第三人。" },
    { id: "bilu", name: "讯问笔录", cat: "legal", type: "legalBilu", sizeKeys: ["10", "14"], desc: "横线正文 + 讯问表单：案号/案由/时间地点/讯问人/记录人/被讯问人及单位职务。" },
    { id: "legaldoc", name: "法律文书方格稿纸", cat: "legal", type: "legalDoc", sizeKeys: ["10", "14"], desc: "方格起草稿纸，带抬头（文书名称/案号/当事人/日期），用于撰写法律文书。" }
  ];

  /* 展开生成目录：家族 × 颜色 × 格子尺寸 = 数百种 */
  var CATALOG = [];
  FAMILIES.forEach(function (f) {
    var sizes = f.sizeKeys.map(function (k) { return SIZES[k]; });
    var colorKeys = f.colorKeys || COLORS.map(function (c) { return c.key; });
    colorKeys.forEach(function (ck) {
      var col = COLORS.filter(function (c) { return c.key === ck; })[0];
      if (!col) return;
      sizes.forEach(function (sz) {
        CATALOG.push({
          id: f.id + "__" + ck + "__" + sz.name,
          familyId: f.id, type: f.type, cat: f.cat,
          name: f.name + "·" + col.name + "·" + sz.name,
          color: col.value, colorName: col.name,
          cell: sz.mm, sizeName: sz.name,
          desc: f.desc
        });
      });
    });
  });

  window.COLORS = COLORS;
  window.SIZES = SIZES;
  window.CATEGORIES = CATEGORIES;
  window.FAMILIES = FAMILIES;
  window.CATALOG = CATALOG;
})();
