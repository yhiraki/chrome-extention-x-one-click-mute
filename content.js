/* =============================================================================
 *  X One-Click Mute / Not Interested — content.js
 *
 *  X (Twitter) のポストのアクションバーに
 *    ・ミュート
 *    ・このポストに興味がない
 *  のワンクリックボタンを追加する。
 *
 *  仕組み:
 *    1. ポスト内の「…」ボタン（[data-testid="caret"]）をプログラム的にクリック
 *    2. 開いたドロップダウンからラベル文字列に一致する項目を探してクリック
 *  ラベルは正規化して比較し、多言語に対応する。
 *
 *  2024 年の X の DOM 変更に合わせた強化版:
 *    - 連打してもメニューを取り合わないよう、操作を直列キューで処理
 *    - ラベルの正規化（空白・記号・アポストロフィ除去）+ 完全一致 → 部分一致
 *    - 「ミュート」と「ミュート解除」を取り違えないよう除外語でガード
 *    - ボタンのスタイルを JS のインライン指定から CSS に移動
 *    - タイムラインの要素使い回し（React の再利用）を検出して再注入
 * ========================================================================== */
(() => {
  'use strict';

  if (window.__xOneClickInjected) return;
  window.__xOneClickInjected = true;

  /* =======================================================================
   * 1. セレクタ / 定数
   * ==================================================================== */

  const TWEET_SEL = 'article[data-testid="tweet"]';
  const CARET_SEL = '[data-testid="caret"]';
  const DROPDOWN_SEL = '[data-testid="Dropdown"]';
  const MENU_ITEM_SEL = '[role="menuitem"]';
  const ACTION_BAR_SEL = 'div[role="group"]';
  const OUR_CLASS = 'xoc-actions';

  const ICON_MUTE = `
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path>
</svg>`;

  const ICON_NOT_INTERESTED = `
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path fill="currentColor" d="M12 1.75c-5.66 0-10.25 4.59-10.25 10.25s4.59 10.25 10.25 10.25 10.25-4.59 10.25-10.25S17.66 1.75 12 1.75zm-8.25 10.25c0-4.56 3.69-8.25 8.25-8.25s8.25 3.69 8.25 8.25-3.69 8.25-8.25 8.25-8.25-3.69-8.25-8.25z"></path>
  <path fill="currentColor" d="M16 11H8v2h8z"></path>
</svg>`;

  /* =======================================================================
   * 2. ラベル照合（多言語 / 正規化つき）
   * ==================================================================== */

  const norm = (s) =>
    String(s == null ? '' : s)
      .toLowerCase()
      .replace(/[\u2018\u2019\u02bc'`]/g, '')
      .replace(/[\s\u3000\u00a0]+/g, '')
      .replace(/[.。,、!！?？:：;；"“”「」『』()（）\[\]{}<>・…~〜]/g, '')
      .trim();

  const spec = (testIds, exact, partial, exclude) => ({
    testIds: (testIds || []).map((s) => s.toLowerCase()),
    exact: (exact || []).map(norm),
    partial: (partial || []).map(norm),
    exclude: (exclude || []).map(norm)
  });

  const ACTIONS = [
    {
      key: 'mute',
      name: 'ミュート',
      cls: 'xoc-btn-mute',
      title: 'Mute (one click)',
      icon: ICON_MUTE,
      spec: spec(
        ['mute'],
        ['mute', 'ミュート', '음소거', '静音', 'silenciar', 'stummschalten'],
        [
          'mute', 'ミュート', '음소거', '静音',
          'silenciar', 'masquer', 'stummschalten', 'stumm',
          'bisu', 'senyapkan', 'игнорировать', 'sessize al', 'म्यूट', 'كتم'
        ],
        [
          'unmute', 'unmut',
          'ミュート解除', 'ミュートを解除', '解除',
          '음소거해제', '해제',
          '取消静音',
          'dessilenciar', 'activersonido', 'activarsonido',
          'activerson', 'activerleson',
          'stummschaltungaufheben', 'rstummschalten'
        ]
      )
    },
    {
      key: 'notInterested',
      name: 'このポストに興味がない',
      cls: 'xoc-btn-not-interested',
      title: 'Not interested in this post (one click)',
      icon: ICON_NOT_INTERESTED,
      spec: spec(
        ['uninterested', 'notinterested'],
        ['not interested', 'このポストに興味がない', '興味がない'],
        [
          'not interested', 'このポストに興味がない', 'このポストに興味がありません',
          '興味がない', '興味なし', '관심 없음',
          '不感兴趣', 'no me interesa', 'não tenho interesse',
          'pas intéressé', 'kein interesse', 'tidak tertarik',
          'не интересно', 'ilgilenmiyorum', 'मुझे दिलचस्पी नहीं है', 'غير مهتم'
        ],
        []
      )
    }
  ];

  /* =======================================================================
   * 3. ユーティリティ
   * ==================================================================== */

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const warn = (...a) => console.warn('[X-OneClick]', ...a);

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  async function waitFor(fn, timeout = 1500, interval = 50) {
    const end = Date.now() + timeout;
    for (;;) {
      let v = null;
      try { v = fn(); } catch (e) { v = null; }
      if (v) return v;
      if (Date.now() >= end) return null;
      await sleep(interval);
    }
  }

  function pressEscape() {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true
    }));
  }

  const textOf = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();

  /* =======================================================================
   * 4. メニュー操作
   * ==================================================================== */

  function visibleDropdown() {
    const list = document.querySelectorAll(DROPDOWN_SEL);
    for (let i = list.length - 1; i >= 0; i--) {
      if (isVisible(list[i])) return list[i];
    }
    return null;
  }

  async function closeOpenMenus() {
    if (!visibleDropdown()) return;
    pressEscape();
    await sleep(150);
    if (visibleDropdown()) {
      pressEscape();
      await sleep(150);
    }
  }

  function findMenuItem(items, s) {
    const texts = items.map((el) => norm(textOf(el)));
    const ids = items.map((el) => (el.getAttribute('data-testid') || '').toLowerCase());
    const bad = (t) => s.exclude.some((k) => k && t.indexOf(k) !== -1);

    // 1) data-testid の完全一致
    for (let i = 0; i < items.length; i++) {
      if (ids[i] && s.testIds.indexOf(ids[i]) !== -1 && !bad(texts[i])) return items[i];
    }
    // 2) テキストの完全一致
    for (let i = 0; i < items.length; i++) {
      if (s.exact.indexOf(texts[i]) !== -1 && !bad(texts[i])) return items[i];
    }
    // 3) テキストの部分一致
    for (let i = 0; i < items.length; i++) {
      if (bad(texts[i])) continue;
      for (const p of s.partial) {
        if (p && texts[i].indexOf(p) !== -1) return items[i];
      }
    }
    return null;
  }

  async function runAction(tweet, action) {
    const caret = tweet.querySelector(CARET_SEL);
    if (!caret) throw new Error('「…」メニューボタンが見つかりません');

    await closeOpenMenus();

    caret.click();

    const menu = await waitFor(
      () => {
        const m = visibleDropdown();
        return m && m.querySelector(MENU_ITEM_SEL) ? m : null;
      },
      1500
    );
    if (!menu) throw new Error('メニューが開きませんでした');

    const items = Array.from(menu.querySelectorAll(MENU_ITEM_SEL));
    const hit = findMenuItem(items, action.spec);
    if (!hit) {
      pressEscape();
      throw new Error(
        '「' + action.name + '」がメニューにありません [' +
        items.map((i) => textOf(i)).join(' / ') + ']'
      );
    }

    hit.click();
    return true;
  }

  /* =======================================================================
   * 5. ボタンの注入
   * ==================================================================== */

  const state = new WeakMap(); // tweetElement -> { key, container }

  function statusKey(tweet) {
    const a = tweet.querySelector('a[href*="/status/"]');
    return a ? a.getAttribute('href') : '';
  }

  function findActionBar(tweet) {
    const reply = tweet.querySelector('[data-testid="reply"]');
    if (reply) {
      const g = reply.closest(ACTION_BAR_SEL);
      if (g) return g;
    }
    const groups = tweet.querySelectorAll(ACTION_BAR_SEL);
    return groups.length ? groups[groups.length - 1] : null;
  }

  // X のアクションバーのアイコン色を流用する（ライト / ダーク対応）
  function readBaseColor(bar) {
    const ref = bar.querySelector('[data-testid="reply"]') ||
                bar.querySelector('[data-testid="like"]') ||
                bar.querySelector('[role="button"]');
    if (!ref) return '';
    let c = getComputedStyle(ref).color;
    if (!c || c === 'rgba(0, 0, 0, 0)') {
      const svg = ref.querySelector('svg');
      if (svg) c = getComputedStyle(svg).color;
    }
    return c && c !== 'rgba(0, 0, 0, 0)' ? c : '';
  }

  /* --- ボタンの実行キュー（連打してもメニューを取り合わない） --- */

  let queue = Promise.resolve();

  function enqueue(fn) {
    const next = queue.then(fn).catch((e) => warn(e));
    queue = next;
    return next;
  }

  function onButtonClick(tweet, action, btn) {
    if (btn.classList.contains('xoc-busy') || btn.classList.contains('xoc-done')) return;

    btn.classList.add('xoc-busy');
    enqueue(() =>
      runAction(tweet, action)
        .then(() => {
          btn.classList.remove('xoc-busy');
          btn.classList.add('xoc-done');
          setTimeout(() => btn.classList.remove('xoc-done'), 1500);
        })
        .catch((err) => {
          btn.classList.remove('xoc-busy');
          toast('失敗しました: ' + (err && err.message ? err.message : err), true);
        })
    );
  }

  function buildContainer(bar) {
    const container = document.createElement('div');
    container.className = OUR_CLASS;
    container.setAttribute('data-xoc', 'actions');

    const base = readBaseColor(bar);
    if (base) container.style.setProperty('--xoc-base', base);

    for (const action of ACTIONS) {
      const btn = document.createElement('div');
      btn.className = 'xoc-btn ' + action.cls;
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('title', action.title);
      btn.setAttribute('aria-label', action.title);
      btn.innerHTML = action.icon;

      btn.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onButtonClick(container.closest(TWEET_SEL), action, btn);
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onButtonClick(container.closest(TWEET_SEL), action, btn);
        }
      });

      container.appendChild(btn);
    }
    return container;
  }

  function inject(tweet) {
    if (!tweet || !tweet.isConnected) return;

    const key = statusKey(tweet);
    const st = state.get(tweet);

    // すでに注入済みで、ポストが同じままなら何もしない
    if (st && st.key === key && st.container && st.container.isConnected) return;
    if (st && st.container && st.container.isConnected) st.container.remove();

    const bar = findActionBar(tweet);
    if (!bar) return;
    if (bar.querySelector('.' + OUR_CLASS)) return; // 二重注入の保険

    const container = buildContainer(bar);
    bar.appendChild(container);
    state.set(tweet, { key, container });
  }

  /* =======================================================================
   * 6. トースト
   * ==================================================================== */

  let toastEl = null;
  let toastTimer = 0;

  function toast(msg, isError) {
    if (!document.body) return;
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'xoc-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.toggle('xoc-err', !!isError);
    toastEl.classList.add('xoc-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toastEl) toastEl.classList.remove('xoc-show');
    }, 4000);
  }

  /* =======================================================================
   * 7. 監視と起動
   * ==================================================================== */

  function sweep(root) {
    root = root || document;
    const tweets = [];
    try {
      if (root.nodeType === 1 && root.matches && root.matches(TWEET_SEL)) tweets.push(root);
      if (root.querySelectorAll) {
        for (const t of root.querySelectorAll(TWEET_SEL)) tweets.push(t);
      }
    } catch (e) { /* ignore */ }
    for (const t of tweets) inject(t);
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      sweep(document);
    }, 120);
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.id === 'xoc-toast') continue;
        if (n.classList && n.classList.contains(OUR_CLASS)) continue;
        if (n.closest && n.closest('.' + OUR_CLASS)) continue;
        if ((n.matches && n.matches(TWEET_SEL)) || (n.querySelector && n.querySelector(TWEET_SEL))) {
          schedule();
          return;
        }
      }
    }
  });

  function start() {
    observer.observe(document.documentElement, { childList: true, subtree: true });
    sweep(document);

    window.addEventListener('scroll', () => schedule(), { passive: true });
    setInterval(() => {
      if (!document.hidden) schedule();
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
