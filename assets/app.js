/*
 * 스마트 홈 솔루션 앱 - 화면 흐름 및 로직
 *
 * 흐름 (강의록 처리 과정: 평가 → 중재 → 결과):
 *   0. intro       : 안내 + 의뢰 정보
 *   1. screening   : 양식지 1 (기초 스크리닝) — 현재 활동 수준 먼저
 *   2. performance : 양식지 2 (공간별 작업수행도)
 *   3. result      : 양식지 3 (적정 스마트 홈 기술 = 솔루션 제안서)
 */
(function () {
  'use strict';

  var D = window.SHData;

  /* ---------- 앱 메타 정보 ---------- */
  var APP_VERSION = 'v1.0.0';
  var CONTACT_EMAIL = 'kwangtae@bc.ac.kr';
  var MAKER_CREDIT = '제작: 작치빌더(otbuilder) · ' + CONTACT_EMAIL;
  // 자세한 사용 후기(사용성평가 설문) 링크 — 받는 대로 여기에 넣으면 연결됩니다.
  var SURVEY_URL = '';

  // 앱 상태 (평가 결과 저장소)
  function blankState() {
    return {
      screen: 'splash',
      meta: { org: '', staff: '', contact: '', needsExtra: '', date: '',
              goal: '', budget: '', scenario: '', kitOverride: '',
              reviewRating: 0, reviewText: '', perfShowAll: false, recordId: '', resultTab: 'summary',
              personalStep: 0, evalSpace: '', spaceStep: 0, spacesDone: [] },
      currentActivity: {},   // { itemId: 'self' | 'assisted' | 'none' }
      needs: {},             // { itemId: true|false } 주요구 확인 결과
      personal: {},          // { fieldId: value }  (controlPanel 은 배열)
      environment: {},
      performance: {}        // { 'spaceId::taskId::activityId': 0|1|2|3 }
    };
  }
  var state = blankState();

  /* ---------- 지속성 (자동 저장 / 불러오기) ---------- */
  var SAVE_KEY = 'smarthome_solution_state_v1';
  var RECORDS_KEY = 'smarthome_solution_records_v1';

  /* ---------- 평가 기록 (지난 평가 저장/조회) ---------- */
  function loadRecords() {
    try {
      var raw = localStorage.getItem(RECORDS_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveRecords(arr) {
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function ensureRecordId() {
    if (!state.meta.recordId) {
      state.meta.recordId = 'r' + Date.now() + Math.random().toString(36).slice(2, 7);
    }
    return state.meta.recordId;
  }
  function snapshotState() {
    return JSON.parse(JSON.stringify({
      meta: state.meta, currentActivity: state.currentActivity, needs: state.needs,
      personal: state.personal, environment: state.environment, performance: state.performance
    }));
  }
  // 현재 평가를 기록에 저장(있으면 갱신)
  function upsertCurrentRecord() {
    if (!hasAnyData()) return;
    var id = ensureRecordId();
    var records = loadRecords();
    var rec = { recordId: id, savedAt: Date.now(), snapshot: snapshotState() };
    var idx = -1;
    for (var i = 0; i < records.length; i++) { if (records[i].recordId === id) { idx = i; break; } }
    if (idx > -1) records[idx] = rec; else records.push(rec);
    saveRecords(records);
  }
  function deleteRecord(id) {
    saveRecords(loadRecords().filter(function (r) { return r.recordId !== id; }));
  }
  function loadRecordIntoState(id) {
    var rec = loadRecords().filter(function (r) { return r.recordId === id; })[0];
    if (!rec) return;
    var fresh = blankState();
    var snap = rec.snapshot || {};
    ['meta', 'currentActivity', 'needs', 'personal', 'environment', 'performance'].forEach(function (k) {
      if (snap[k] != null) fresh[k] = snap[k];
    });
    var mDefaults = blankState().meta;
    Object.keys(mDefaults).forEach(function (k) { if (fresh.meta[k] == null) fresh.meta[k] = mDefaults[k]; });
    fresh.meta.recordId = id;
    state = fresh;
    state.screen = 'result';
    saveState();
    render();
  }
  // 스냅샷 요약 (기록 목록 표시용)
  function recordSummary(snap) {
    var needsN = 0, limitedN = 0;
    var needs = snap.needs || {};
    Object.keys(needs).forEach(function (k) { if (needs[k] === true) needsN++; });
    var perf = snap.performance || {};
    Object.keys(perf).forEach(function (k) { if (perf[k] === 1 || perf[k] === 2) limitedN++; });
    return { name: (snap.personal && snap.personal.name) || '', needsN: needsN, limitedN: limitedN };
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) { /* localStorage 불가 환경 무시 */ }
  }
  function loadSavedState() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return false;
      var fresh = blankState();
      Object.keys(fresh).forEach(function (k) {
        if (parsed[k] != null) fresh[k] = parsed[k];
      });
      // meta 누락 필드 보정
      var mDefaults = blankState().meta;
      Object.keys(mDefaults).forEach(function (k) {
        if (fresh.meta[k] == null) fresh.meta[k] = mDefaults[k];
      });
      state = fresh;
      return hasAnyData();
    } catch (e) { return false; }
  }
  function hasAnyData() {
    return Object.keys(state.currentActivity).length > 0 ||
      Object.keys(state.needs).length > 0 ||
      Object.keys(state.personal).length > 0 ||
      Object.keys(state.environment).length > 0 ||
      Object.keys(state.performance).length > 0 ||
      (state.meta.org || state.meta.needsExtra);
  }

  function exportJSON() {
    var payload = JSON.stringify(state, null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var who = (state.personal.name || '대상자').replace(/[\\/:*?"<>|\s]+/g, '_');
    var d = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = '스마트홈솔루션_' + who + '_' + d + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var parsed = JSON.parse(e.target.result);
        var fresh = blankState();
        Object.keys(fresh).forEach(function (k) {
          if (parsed[k] != null) fresh[k] = parsed[k];
        });
        var mDefaults = blankState().meta;
        Object.keys(mDefaults).forEach(function (k) {
          if (fresh.meta[k] == null) fresh.meta[k] = mDefaults[k];
        });
        state = fresh;
        state.screen = 'result';
        saveState();
        render();
      } catch (err) {
        window.alert('불러오기 실패: 올바른 평가 파일(JSON)이 아닙니다.');
      }
    };
    reader.readAsText(file);
  }

  var STEPS = [
    { id: 'intro', label: '시작' },
    { id: 'spaces', label: '공간 평가' },
    { id: 'personal', label: '개인 능력' },
    { id: 'result', label: '솔루션 제안' }
  ];

  var app = document.getElementById('app');
  var stepbar = document.getElementById('stepbar');
  var actionbar = document.getElementById('actionbar');
  var bottomnav = document.getElementById('bottomnav');

  /* ---------- 유틸 ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }
  function perfKey(sp, task, act) { return sp + '::' + task + '::' + act; }

  // SVG 요소 생성 (아이소메트릭 설계도용)
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, children) {
    var node = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  /* ---------- 진행바 (완료 단계 스탬프) ---------- */
  function renderStepbar() {
    stepbar.innerHTML = '';
    var sid = (state.screen === 'spaceEval') ? 'spaces' : state.screen;
    var currentIdx = STEPS.map(function (s) { return s.id; }).indexOf(sid);
    if (currentIdx === -1) { stepbar.style.display = 'none'; return; } // splash/more
    stepbar.style.display = '';
    STEPS.forEach(function (s, i) {
      var done = i < currentIdx;
      var cls = 'step' + (i === currentIdx ? ' active' : '') + (done ? ' done' : '');
      stepbar.appendChild(el('div', { class: cls }, [(done ? '⭐ ' : (i + 1) + '. ') + s.label]));
    });
  }

  /* ---------- 게임 요소: 성장하는 집 + 캐릭터 가이드(홈이) ---------- */
  var STEP_LEVEL = { intro: 0, spaces: 2, spaceEval: 2, personal: 4, result: 4 };
  var GUIDE_MSG = {
    intro: '안녕하세요! 저는 홈스예요. 딱 맞는 스마트 홈을 함께 찾아봐요 🙌',
    spaces: '어느 공간부터 볼까요? 제한되거나 바꾸고 싶은 공간을 눌러주세요.',
    personal: '마지막이에요! 몇 가지만 알려주시면 제가 바로바로 팁을 드릴게요 😊',
    result: '완성! 딱 맞는 솔루션을 찾았어요 🎉'
  };

  function buildHouseSvg(level) {
    var O = '#cb5a0f', Od = '#a5470b';
    var s = svgEl('svg', { viewBox: '0 0 130 112', width: '92', height: '80', class: 'house-svg' }, []);
    s.appendChild(svgEl('line', { x1: 6, y1: 98, x2: 124, y2: 98, stroke: '#cbb99f', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    s.appendChild(svgEl('rect', { x: 26, y: 90, width: 78, height: 8, rx: 2, fill: '#dccdb9' }));
    if (level >= 1) s.appendChild(svgEl('rect', { x: 34, y: 52, width: 62, height: 38, fill: '#fff', stroke: O, 'stroke-width': 2.5, class: 'hpart' }));
    if (level >= 2) s.appendChild(svgEl('polygon', { points: '28,54 65,26 102,54', fill: O, class: 'hpart' }));
    if (level >= 3) {
      s.appendChild(svgEl('rect', { x: 57, y: 66, width: 16, height: 24, rx: 2, fill: level >= 4 ? '#f6b23a' : Od, class: 'hpart' }));
      s.appendChild(svgEl('rect', { x: 40, y: 60, width: 13, height: 13, rx: 2, fill: level >= 4 ? '#ffe08a' : '#e8dfd1', stroke: Od, 'stroke-width': 1, class: 'hpart' }));
    }
    if (level >= 4) {
      var g = svgEl('g', { fill: 'none', stroke: O, 'stroke-linecap': 'round', 'stroke-width': 3, class: 'hpart' }, []);
      g.appendChild(svgEl('path', { d: 'M52 22 a18 18 0 0 1 26 0', opacity: '0.5' }));
      g.appendChild(svgEl('path', { d: 'M57 27 a11 11 0 0 1 16 0', opacity: '0.85' }));
      s.appendChild(g);
      s.appendChild(svgEl('circle', { cx: 65, cy: 32, r: 3, fill: O, class: 'hpart' }));
    }
    return s;
  }

  function renderProgressHero(screen) {
    var level = STEP_LEVEL[screen] || 0;
    return el('div', { class: 'card progress-hero' }, [
      buildHouseSvg(level),
      el('div', { class: 'ph-msg' }, [
        el('div', { class: 'ph-mascot' }, ['🤖']),
        el('div', { class: 'ph-bubble' }, [
          el('b', {}, ['홈스']), ' · ', GUIDE_MSG[screen] || ''
        ])
      ])
    ]);
  }

  /* ---------- 하단 탭바 (홈 / 설정) ---------- */
  function renderBottomNav() {
    if (!bottomnav) return;
    bottomnav.innerHTML = '';
    if (state.screen === 'splash') { bottomnav.style.display = 'none'; return; }
    bottomnav.style.display = '';
    var s = state.screen;
    var tabs = [
      { label: '홈', icon: '🏠', active: s !== 'more' && s !== 'records', onClick: function () { go('intro'); } },
      { label: '기록', icon: '📁', active: s === 'records', onClick: function () { go('records'); } },
      { label: '설정', icon: '⚙️', active: s === 'more', onClick: function () { go('more'); } }
    ];
    tabs.forEach(function (t) {
      bottomnav.appendChild(el('button', {
        class: 'navtab' + (t.active ? ' active' : ''), type: 'button', onclick: t.onClick
      }, [
        el('span', { class: 'navicon' }, [t.icon]),
        el('span', { class: 'navlabel' }, [t.label])
      ]));
    });
  }

  /* ---------- 하단 액션바 ---------- */
  function renderActions(buttons) {
    actionbar.innerHTML = '';
    if (!buttons || buttons.length === 0) { actionbar.style.display = 'none'; return; }
    actionbar.style.display = '';
    var inner = el('div', { class: 'inner' });
    var left = el('div', {}, []);
    var right = el('div', { class: 'no-print' }, []);
    buttons.forEach(function (b) {
      var btn = el('button', {
        class: 'btn ' + (b.variant || ''),
        onclick: b.onClick,
        disabled: b.disabled ? 'disabled' : null
      }, [b.label]);
      (b.align === 'left' ? left : right).appendChild(btn);
    });
    inner.appendChild(left);
    inner.appendChild(right);
    actionbar.appendChild(inner);
  }

  function go(screen) {
    state.screen = screen;
    window.scrollTo(0, 0);
    render();
  }

  /* =========================================================
   * 화면 : 스플래시 (시작)
   * =======================================================*/
  function renderSplash() {
    renderActions([]);
    app.innerHTML = '';
    var splash = el('div', {
      class: 'splash', role: 'button', tabindex: '0',
      onclick: function () { go('intro'); }
    }, [
      el('div', { class: 'splash-mid' }, [
        el('div', { class: 'splash-icon' }, ['🏠']),
        el('div', { class: 'splash-title' }, ['스마트 홈 솔루션']),
        el('div', { class: 'splash-sub' }, ['SMART HOME SOLUTION']),
        el('div', { class: 'splash-tagline' }, ['자립을 여는 스마트 홈 가정 환경 수정']),
        el('div', { class: 'splash-touch' }, ['화면을 터치해 주세요'])
      ]),
      el('div', { class: 'splash-ver' }, [APP_VERSION])
    ]);
    splash.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') go('intro');
    });
    app.appendChild(splash);
  }

  /* =========================================================
   * 화면 0 : 인트로
   * =======================================================*/
  function renderIntro() {
    var flow = [
      { n: 1, t: '기초 스크리닝', d: '현재 활동 수준·개인능력·환경 파악' },
      { n: 2, t: '공간별 수행도', d: '현관·침실·거실/부엌·화장실 작업 평가' },
      { n: 3, t: '솔루션 제안', d: '제한 활동에 맞는 적정 스마트 홈 기술 도출' }
    ];
    var hero = el('div', { class: 'hero' }, [
      el('div', { class: 'icon' }, ['🏠']),
      el('h1', {}, ['스마트 홈 솔루션']),
      el('p', {}, ['신체장애인의 자립과 삶의 질을 위한 가정 환경 수정 평가 도구입니다. ' +
        '평가자는 누구나 아래 순서대로 진행하여 대상자에게 맞는 스마트 홈 솔루션을 도출할 수 있습니다.'])
    ]);

    var steps = el('div', { class: 'flow-steps' }, flow.map(function (f) {
      return el('div', { class: 'flow-step' }, [
        el('span', { class: 'n' }, [String(f.n)]),
        el('div', { class: 't' }, [f.t]),
        el('div', { class: 'd' }, [f.d])
      ]);
    }));

    var m = state.meta;
    var metaCard = el('div', { class: 'card' }, [
      el('h3', {}, ['의뢰 정보 (선택)']),
      el('p', { class: 'section-guide' }, ['입력하면 솔루션 제안서 상단에 표시됩니다. 대상자의 주요구는 기초 스크리닝 후 "주요구 확인" 단계에서 함께 정합니다.']),
      el('div', { class: 'meta-grid' }, [
        textField('의뢰 기관', m.org, function (v) { m.org = v; }),
        textField('담당자', m.staff, function (v) { m.staff = v; }),
        textField('담당자 연락처', m.contact, function (v) { m.contact = v; })
      ])
    ]);

    // 저장된 평가 안내 + 불러오기
    var resumeCard = el('div', { class: 'card' }, [
      el('h3', {}, ['저장된 평가']),
      el('p', { class: 'section-guide' }, [
        hasAnyData()
          ? '이 브라우저에 진행 중인 평가가 자동 저장되어 있습니다. "이어서 진행"으로 계속하거나, 파일에서 불러올 수 있습니다.'
          : '평가 내용은 이 브라우저에 자동 저장됩니다. 이전에 내보낸 평가 파일(JSON)을 불러올 수도 있습니다.'
      ]),
      el('div', { class: 'choices' }, [
        hasAnyData() ? el('button', {
          class: 'btn', type: 'button', style: 'padding:8px 16px',
          onclick: function () { go('spaces'); }
        }, ['이어서 진행 →']) : null,
        el('button', {
          class: 'btn', type: 'button', style: 'padding:8px 16px',
          onclick: function () { document.getElementById('import-file').click(); }
        }, ['평가 파일 불러오기 (JSON)'])
      ])
    ]);

    app.innerHTML = '';
    app.appendChild(el('div', { class: 'card' }, [hero, steps]));
    app.appendChild(metaCard);
    app.appendChild(resumeCard);

    // 숨은 파일 입력
    var fileInput = el('input', {
      type: 'file', accept: 'application/json,.json', id: 'import-file',
      style: 'display:none',
      onchange: function (e) { if (e.target.files[0]) importJSON(e.target.files[0]); }
    }, []);
    app.appendChild(fileInput);

    renderActions([
      { label: '평가 시작 →', variant: 'btn-primary', onClick: function () { go('spaces'); } }
    ]);
  }

  function textField(label, value, onChange, opts) {
    opts = opts || {};
    var input = el('input', {
      type: opts.type || 'text',
      placeholder: opts.placeholder || '',
      value: value || '',
      oninput: function (e) { onChange(e.target.value); }
    }, []);
    if (opts.suffix) {
      return el('div', { class: 'field' }, [
        el('label', { class: 'field-label' }, [label]),
        el('div', { class: 'inline-suffix' }, [input, el('span', { class: 'suffix' }, [opts.suffix])])
      ]);
    }
    return el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, [label]),
      input
    ]);
  }

  /* 선택형 칩 그룹 */
  function choiceGroup(options, currentValue, onSelect, multi) {
    var wrap = el('div', { class: 'choices' }, []);
    options.forEach(function (opt) {
      var selected = multi
        ? (Array.isArray(currentValue) && currentValue.indexOf(opt.value) > -1)
        : currentValue === opt.value;
      var chip = el('button', {
        class: 'choice-chip' + (selected ? ' selected' : ''),
        type: 'button',
        onclick: function () { onSelect(opt.value); }
      }, [opt.label]);
      wrap.appendChild(chip);
    });
    return wrap;
  }

  /* =========================================================
   * 화면 : 더보기 (만든 이야기 · 사용후기 · 자세한 후기)
   * =======================================================*/
  var storyOpen = false;
  var shortcutOpen = false;
  var copyrightOpen = false;
  function renderMore() {
    var container = el('div', {}, [
      el('h1', { class: 'page-title' }, ['설정']),
      el('p', { class: 'page-sub' }, ['소개, 사용 후기, 앱 업데이트, 홈 화면 바로가기 안내입니다.'])
    ]);

    /* 소개 — 만든 사람의 이야기 (접기/펼치기) */
    container.appendChild(iconCard({
      icon: '🌳', tone: 'green', title: '만든 사람의 이야기', desc: '이 도구를 만든 이유를 소개합니다.',
      caret: true, open: storyOpen,
      onClick: function () { storyOpen = !storyOpen; render(); },
      body: storyOpen ? storyBody() : null
    }));

    /* 간단한 사용후기 (별점 + 메모 → 이메일 전송) */
    container.appendChild(renderQuickReview());

    /* 자세한 사용 후기 남기기 (설문 링크) */
    container.appendChild(iconCard({
      icon: '💬', tone: 'primary', title: '자세한 사용 후기 남기기',
      desc: SURVEY_URL ? '앱 사용성평가 설문으로 연결됩니다.' : '준비 중입니다. 곧 제공될 예정입니다.',
      onClick: openSurvey
    }));

    /* 앱 업데이트 */
    container.appendChild(iconCard({
      icon: '🔄', tone: 'gray', title: '앱 최신 버전으로 업데이트',
      desc: '화면이 예전 그대로일 때 눌러 새로고침합니다. (버전 ' + APP_VERSION + ')',
      onClick: updateApp
    }));

    /* 홈 화면에 추가 (접기/펼치기) */
    container.appendChild(iconCard({
      icon: '📲', tone: 'gray', title: '홈 화면에 추가',
      desc: '앱처럼 아이콘으로 바로 여는 방법을 안내해드립니다.',
      caret: true, open: shortcutOpen,
      onClick: function () { shortcutOpen = !shortcutOpen; render(); },
      body: shortcutOpen ? shortcutBody() : null
    }));

    /* 평가 기록 초기화 */
    container.appendChild(iconCard({
      icon: '🗑', tone: 'danger', title: '평가 기록 초기화',
      desc: '저장된 평가 내용이 모두 지워집니다. 되돌릴 수 없어요.',
      onClick: resetAll
    }));

    /* 저작권 안내 (접기/펼치기) */
    container.appendChild(iconCard({
      icon: '©', tone: 'gray', title: '저작권 안내', desc: '이용 범위와 문의처를 안내합니다.',
      caret: true, open: copyrightOpen,
      onClick: function () { copyrightOpen = !copyrightOpen; render(); },
      body: copyrightOpen ? copyrightBody() : null
    }));

    /* 하단 표기 */
    container.appendChild(el('div', { class: 'settings-foot' }, [
      el('div', { class: 'settings-foot-name' }, ['스마트 홈 솔루션 · Smart Home Solution']),
      el('div', { class: 'settings-foot-ver' }, [APP_VERSION])
    ]));

    app.innerHTML = '';
    app.appendChild(container);
    renderActions([]); // 하단 탭바로 이동
  }

  /* 아이콘 카드 (설정 항목 공통) */
  function iconCard(opts) {
    var card = el('div', { class: 'setting-card' + (opts.open ? ' open' : '') }, []);
    card.appendChild(el('button', {
      class: 'setting-head', type: 'button', onclick: opts.onClick
    }, [
      el('span', { class: 'setting-icon icon-' + (opts.tone || 'gray') }, [opts.icon]),
      el('span', { class: 'setting-main' }, [
        el('span', { class: 'setting-title' + (opts.tone === 'danger' ? ' danger' : '') }, [opts.title]),
        opts.desc ? el('span', { class: 'setting-desc' }, [opts.desc]) : null
      ]),
      el('span', { class: 'setting-arrow' }, [opts.caret ? (opts.open ? '⌃' : '⌄') : '›'])
    ]));
    if (opts.open && opts.body) card.appendChild(el('div', { class: 'setting-body' }, opts.body));
    return card;
  }

  function storyBody() {
    var nodes = [];
    [
      '“우리는 기기를 설치하는 사람이 아니라, 환경을 바꿔 ‘가능성’을 만드는 사람입니다.”',
      '스마트 홈은 하루아침에 완성되지 않습니다. 사용자의 하루를 관찰하고, 무엇이 어려운지 함께 확인하고, 작은 기기 하나로 ‘할 수 있음’을 되찾는 과정이 쌓여 자립이 됩니다.',
      '스마트 홈 솔루션은 기초 스크리닝부터 주요구 확인, 공간별 수행도, 적정 스마트 홈 기술 도출까지 평가자가 누구나 같은 흐름으로 대상자 맞춤 솔루션을 낼 수 있도록 만들었습니다.',
      '그러나 기기 도입만으로 기능이 완성되지는 않습니다. 임상가의 중재·교육과 함께 활용해 주시길 권합니다.'
    ].forEach(function (p) { nodes.push(el('p', {}, [p])); });
    nodes.push(el('div', { class: 'story-sign' }, ['— 작치빌더(otbuilder) 드림']));
    return nodes;
  }

  function shortcutBody() {
    return [
      el('p', {}, ['앱처럼 아이콘으로 바로 열 수 있어요. 기기별로 방법이 조금 다릅니다.']),
      el('p', {}, [el('strong', {}, ['아이폰(사파리): ']), '하단 공유 버튼 ⬆️ → “홈 화면에 추가” → 추가']),
      el('p', {}, [el('strong', {}, ['안드로이드(크롬): ']), '오른쪽 위 메뉴 ⋮ → “홈 화면에 추가”(또는 “앱 설치”) → 추가']),
      el('p', { class: 'section-guide' }, ['추가하면 홈 화면 아이콘으로 바로 실행되고, 주소를 매번 입력하지 않아도 됩니다.'])
    ];
  }

  /* =========================================================
   * 화면 : 기록 (지난 평가 목록)
   * =======================================================*/
  function renderRecords() {
    var records = loadRecords().sort(function (a, b) { return b.savedAt - a.savedAt; });
    var container = el('div', {}, [
      el('h1', { class: 'page-title' }, ['평가 기록']),
      el('p', { class: 'page-sub' }, ['이 기기에 저장된 지난 평가입니다. 항목을 눌러 다시 열어 보거나 삭제할 수 있습니다.'])
    ]);

    if (records.length === 0) {
      container.appendChild(el('div', { class: 'card' }, [
        el('div', { class: 'empty-state' }, [
          '저장된 평가가 없습니다.', el('br', {}, []),
          '평가를 진행해 "솔루션 제안" 단계까지 가면 자동으로 여기에 저장됩니다.'
        ])
      ]));
    } else {
      records.forEach(function (r) {
        var s = recordSummary(r.snapshot || {});
        var d = new Date(r.savedAt);
        var dateStr = d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()) +
          ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
        var isCurrent = r.recordId === state.meta.recordId;
        var card = el('div', { class: 'record-card' }, [
          el('button', {
            class: 'record-main', type: 'button',
            onclick: function () { loadRecordIntoState(r.recordId); }
          }, [
            el('div', { class: 'record-top' }, [
              el('span', { class: 'record-name' }, [s.name || '이름 미입력']),
              isCurrent ? el('span', { class: 'record-badge' }, ['현재']) : null
            ]),
            el('div', { class: 'record-meta' }, [
              dateStr + '  ·  주요구 ' + s.needsN + '  ·  제한활동 ' + s.limitedN
            ])
          ]),
          el('button', {
            class: 'record-del', type: 'button', 'aria-label': '삭제',
            onclick: function () {
              if (window.confirm('이 평가 기록을 삭제할까요? 되돌릴 수 없습니다.')) {
                deleteRecord(r.recordId); render();
              }
            }
          }, ['🗑'])
        ]);
        container.appendChild(card);
      });
    }

    app.innerHTML = '';
    app.appendChild(container);
    renderActions([]); // 하단 탭바 사용
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function copyrightBody() {
    var mail = el('a', { href: 'mailto:' + CONTACT_EMAIL }, [CONTACT_EMAIL]);
    return [
      el('p', { class: 'copyright-head' }, ['© 2026 문광태 (Kwangtae Moon) · 작치빌더(otbuilder). All rights reserved.']),
      el('p', {}, ['스마트 홈 솔루션의 소스코드, 화면 디자인, 직접 제작한 아이콘·일러스트레이션(SVG), 평가 흐름·양식 구성, 문구, 데이터 구조 등 일체의 표현물은 대한민국 저작권법의 보호를 받습니다.']),
      el('p', {}, ['저작권자의 사전 서면 동의 없이 복제·배포·전송·전시, 2차적 저작물 작성(개작·번안 포함), 상업적 이용, 유사 서비스의 제작·배포, 저작권 표시의 제거 또는 변경을 금지합니다.']),
      el('p', { class: 'section-guide' }, ['임상·교육 목적의 비영리 사용은 자유롭게 하실 수 있습니다. 그 밖의 이용이나 협업 문의는 ', mail, ' 로 연락 주세요.'])
    ];
  }

  function updateApp() {
    try {
      if (window.caches && caches.keys) {
        caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); });
      }
    } catch (e) { /* noop */ }
    // HTML은 must-revalidate 이므로 새로고침 시 최신 index + 최신 자원을 받음
    location.reload();
  }

  function renderQuickReview() {
    var m = state.meta;
    var card = el('div', { class: 'card' }, [
      el('h3', {}, ['📝 간단한 사용후기 남기기']),
      el('p', { class: 'section-guide' }, ['사용해 보신 느낌을 간단히 남겨주세요.'])
    ]);
    // 별점
    var stars = el('div', { class: 'stars' }, []);
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        stars.appendChild(el('button', {
          class: 'star' + (m.reviewRating >= n ? ' on' : ''),
          type: 'button', 'aria-label': n + '점',
          onclick: function () { m.reviewRating = (m.reviewRating === n) ? 0 : n; render(); }
        }, [m.reviewRating >= n ? '★' : '☆']));
      })(i);
    }
    card.appendChild(stars);
    card.appendChild(el('textarea', {
      placeholder: '예: 주요구 확인 단계가 편했어요, 화장실 기기도 더 추가해주세요 등',
      oninput: function (e) { m.reviewText = e.target.value; saveState(); }
    }, [m.reviewText || '']));
    card.appendChild(el('button', {
      class: 'btn btn-primary', type: 'button', style: 'width:100%;margin-top:10px',
      onclick: sendQuickReview
    }, ['후기 보내기']));
    return card;
  }

  function sendQuickReview() {
    var m = state.meta;
    var subj = '[스마트 홈 솔루션] 사용후기 ' + (m.reviewRating ? ('★' + m.reviewRating) : '');
    var lines = [
      '별점: ' + (m.reviewRating ? (m.reviewRating + ' / 5') : '(미선택)'),
      '내용: ' + (m.reviewText || '(없음)'),
      '버전: ' + APP_VERSION
    ];
    var href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subj) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    window.location.href = href;
  }

  function openSurvey() {
    if (SURVEY_URL) {
      window.open(SURVEY_URL, '_blank', 'noopener');
    } else {
      window.alert('자세한 사용 후기는 준비 중입니다. 곧 제공될 예정입니다.\n지금은 위의 "간단한 사용후기"로 의견을 보내주세요.');
    }
  }

  /* =========================================================
   * 화면 1 : 기초 스크리닝 (양식지 1)
   *   - 현재 활동 수준을 "가장 먼저" 배치
   * =======================================================*/
  function renderScreening() {
    var container = el('div', {}, []);
    container.appendChild(renderProgressHero('screening'));
    container.appendChild(el('div', {}, [
      el('h1', { class: 'page-title' }, ['1. 현재 활동 수준']),
      el('p', { class: 'page-sub' }, ['지금 집에서 각 활동을 어떻게 하고 있는지 공간별로 알려주세요. (개인 능력은 마지막에 물어봐요)'])
    ]));

    /* 현재 활동 수준 — 공간별 */
    var ca = D.currentActivityLevel;
    var caCard = el('div', { class: 'card' }, []);
    ca.groups.forEach(function (grp) {
      caCard.appendChild(el('div', { class: 'task-label' }, ['· ' + grp.space]));
      var matrix = el('div', { class: 'matrix' }, []);
      grp.items.forEach(function (item) {
        matrix.appendChild(el('div', { class: 'matrix-row' }, [
          el('div', { class: 'row-label' }, [item.label]),
          choiceGroup(ca.options, state.currentActivity[item.id], function (v) {
            state.currentActivity[item.id] = v;
            render();
          })
        ]));
      });
      caCard.appendChild(matrix);
    });
    container.appendChild(caCard);

    app.innerHTML = '';
    app.appendChild(container);

    renderActions([
      { label: '← 이전', variant: 'btn-ghost', align: 'left', onClick: function () { go('intro'); } },
      { label: '주요구 확인 →', variant: 'btn-primary', onClick: function () { go('needs'); } }
    ]);
  }

  /* =========================================================
   * 화면 : 공간 평가 허브 (집 평면에서 공간 선택)
   * =======================================================*/
  var HUB_ROOMS = [
    { id: 'living', label: '거실 / 부엌', icon: '🛋️' },
    { id: 'bedroom', label: '침실', icon: '🛏️' },
    { id: 'bathroom', label: '화장실', icon: '🚽' },
    { id: 'entrance', label: '현관', icon: '🚪' }
  ];

  // 공간 안에서 같은 활동(id)은 한 번만 (앞 작업에서 이미 확인한 활동은 중복 질문하지 않음)
  function spaceEvalItems(spaceId) {
    var space = D.spaces.filter(function (s) { return s.id === spaceId; })[0];
    var items = [], seen = {};
    if (space) space.tasks.forEach(function (t) {
      t.activities.forEach(function (a) {
        if (seen[a.id]) return;
        seen[a.id] = true;
        items.push({ task: t, activity: a });
      });
    });
    return items;
  }
  function spaceLimitedCount(spaceId) {
    var n = 0;
    spaceEvalItems(spaceId).forEach(function (it) {
      var v = state.performance[perfKey(spaceId, it.task.id, it.activity.id)];
      if (v === 1 || v === 2) n++;
    });
    return n;
  }
  function spaceIsDone(spaceId) {
    return (state.meta.spacesDone || []).indexOf(spaceId) > -1;
  }
  function markSpaceDone(spaceId) {
    var arr = state.meta.spacesDone || [];
    if (arr.indexOf(spaceId) < 0) arr.push(spaceId);
    state.meta.spacesDone = arr;
  }

  function renderSpacesHub() {
    var container = el('div', {}, []);
    // 홈스 안내
    container.appendChild(el('div', { class: 'npc-row' }, [
      el('div', { class: 'npc-face' }, ['🤖']),
      el('div', { class: 'npc-bubble' }, [el('b', {}, ['홈스']), ' · ', GUIDE_MSG.spaces])
    ]));
    container.appendChild(el('h1', { class: 'page-title', style: 'margin-top:6px' }, ['공간 평가']));
    container.appendChild(el('p', { class: 'page-sub' }, ['집 평면에서 공간을 눌러 그 공간의 활동을 하나씩 확인해요. 다 하면 개인 능력으로 넘어갑니다.']));

    // 미니 평면도 (그리드) — 공간 버튼
    var plan = el('div', { class: 'hub-plan' }, []);
    HUB_ROOMS.forEach(function (r) {
      var done = spaceIsDone(r.id);
      var lim = spaceLimitedCount(r.id);
      var statusText = done ? (lim > 0 ? ('제한 ' + lim + '개') : '제한 없음') : '미평가';
      plan.appendChild(el('button', {
        class: 'hub-room hub-' + r.id + (done ? ' done' : ''), type: 'button',
        onclick: function () {
          state.meta.evalSpace = r.id; state.meta.spaceStep = 0; go('spaceEval');
        }
      }, [
        el('span', { class: 'hub-room-icon' }, [r.icon]),
        el('span', { class: 'hub-room-name' }, [r.label]),
        el('span', { class: 'hub-room-status' + (done && lim > 0 ? ' lim' : '') }, [statusText]),
        done ? el('span', { class: 'hub-check' }, ['✓']) : null
      ]));
    });
    container.appendChild(plan);

    var doneCount = (state.meta.spacesDone || []).length;
    app.innerHTML = '';
    app.appendChild(container);
    renderActions([
      { label: '← 이전', variant: 'btn-ghost', align: 'left', onClick: function () { go('intro'); } },
      {
        label: doneCount > 0 ? '개인 능력 →' : '건너뛰고 진행 →',
        variant: 'btn-primary', onClick: function () { go('personal'); }
      }
    ]);
  }

  /* =========================================================
   * 화면 : 공간별 활동 평가 (한 활동씩, 홈스 안내)
   * =======================================================*/
  function renderSpaceEval() {
    var spaceId = state.meta.evalSpace;
    var space = D.spaces.filter(function (s) { return s.id === spaceId; })[0];
    if (!space) { go('spaces'); return; }
    var items = spaceEvalItems(spaceId);
    var total = items.length;
    var idx = Math.max(0, Math.min(state.meta.spaceStep || 0, total - 1));
    state.meta.spaceStep = idx;
    var it = items[idx];
    var key = perfKey(spaceId, it.task.id, it.activity.id);
    var value = state.performance[key];

    var container = el('div', {}, []);
    // 진행 표시
    container.appendChild(el('div', { class: 'pq-top' }, [
      el('span', { class: 'pq-count' }, [space.label + ' · ' + (idx + 1) + ' / ' + total]),
      el('div', { class: 'pq-progress' }, [
        el('div', { class: 'pq-progress-fill', style: 'width:' + Math.round((idx + 1) / total * 100) + '%' }, [])
      ])
    ]));
    // 홈스 질문
    container.appendChild(el('div', { class: 'npc-row' }, [
      el('div', { class: 'npc-face' }, ['🤖']),
      el('div', { class: 'npc-bubble' }, [
        el('b', {}, ['홈스']), ' · ',
        el('span', { class: 'se-task' }, [space.label + ' · ' + it.task.label]),
        el('br', {}, []),
        '‘' + it.activity.label + '’은(는) 어떻게 하세요?'
      ])
    ]));
    // 수행 정도 선택 (큰 버튼)
    var card = el('div', { class: 'card pq-card' }, [
      choiceGroup(
        D.performanceScale.options.map(function (o) { return { value: o.value, label: o.word }; }),
        value,
        function (v) { state.performance[key] = (state.performance[key] === v) ? undefined : v; render(); }
      )
    ]);
    container.appendChild(card);
    // 홈스 피드백 (제한이면 격려)
    if (value === 1 || value === 2) {
      container.appendChild(el('div', { class: 'npc-row npc-tip' }, [
        el('div', { class: 'npc-face' }, ['💡']),
        el('div', { class: 'npc-bubble' }, ['이 활동은 스마트 홈으로 도울 수 있어요! 마지막에 딱 맞는 기기를 찾아드릴게요.'])
      ]));
    } else if (value === 3) {
      container.appendChild(el('div', { class: 'npc-row npc-tip' }, [
        el('div', { class: 'npc-face' }, ['👍']),
        el('div', { class: 'npc-bubble' }, ['스스로 잘 하고 계시네요! 이건 그대로 두어도 좋아요.'])
      ]));
    }

    app.innerHTML = '';
    app.appendChild(container);
    renderActions([
      {
        label: '← 이전', variant: 'btn-ghost', align: 'left',
        onClick: function () {
          if (idx > 0) { state.meta.spaceStep = idx - 1; render(); }
          else go('spaces');
        }
      },
      {
        label: (idx < total - 1) ? '다음 →' : '이 공간 완료 ✓', variant: 'btn-primary',
        onClick: function () {
          if (idx < total - 1) { state.meta.spaceStep = idx + 1; render(); }
          else { markSpaceDone(spaceId); go('spaces'); }
        }
      }
    ]);
  }

  /* =========================================================
   * 화면 : 개인 능력 (한 화면에 한 질문씩 + 홈스 NPC 즉시 피드백)
   * =======================================================*/
  function personalQuestions() {
    var list = [];
    D.personalAbility.fields.forEach(function (f) { list.push({ f: f, store: 'personal' }); });
    D.environment.fields.forEach(function (f) { list.push({ f: f, store: 'environment' }); });
    return list;
  }

  // 홈스 NPC 즉시 피드백 (선택값에 따라 바로 팁 제공)
  function npcFeedback(id, value) {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
    switch (id) {
      case 'handUse':
        if (value === 'operate') return '좋아요! 리모컨·스마트폰을 조작할 수 있으니, 스마트 홈도 이 방식으로 제어하면 딱이에요. 👍';
        if (value === 'fixed') return '기기를 고정해두면 조작이 되시는군요. 거치형(고정형) 리모컨을 활용하면 좋아요.';
        if (value === 'unable') return '손 조작이 어려우면 음성(스피커)이나 자동화·AAC를 검토해요. 뒤에서 대화 여부도 확인할게요!';
        break;
      case 'communication':
        if (value === 'good') return '대화가 잘 되시니 음성(스마트 스피커) 제어가 잘 맞아요! 🎙️';
        if (value === 'unclear') return '발음이 조금 부정확하시군요. 연습해서 더 또렷하게 말해보는 것도 방법이에요. 그게 어렵다면 스마트 스피커(음성)는 사용이 어려울 수 있어요.';
        if (value === 'unable') return '음성 사용이 어려우니 스마트 스피커 대신 AAC 앱이나 자동화·센서 기반을 검토해요.';
        break;
      case 'wifi':
        if (value === 'no') return 'Wi-Fi가 없으면 블루투스(BLE) 제품을 써야 해요. BLE 제품은 건전지 형태라 주기적으로 갈아줘야 하고 멀어지면 잘 안 되지만, 별도 Wi-Fi 없이 쓸 수 있어 편리해요. 처음 스마트 홈 사용자에게 추천해요! 🔋';
        if (value === 'yes') return 'Wi-Fi가 있으니 스마트 허브와 다양한 Wi-Fi 기기를 폭넓게 쓸 수 있어요!';
        break;
      case 'os':
        if (value === 'ios') return '아이폰을 쓰시니 Apple 홈(HomeKit)·Siri와 잘 맞아요.';
        if (value === 'android') return '안드로이드니 SmartThings·Google Home 계열이 잘 맞아요.';
        break;
      case 'iotExperience':
        if (value === 'none') return 'IoT가 처음이시면 설정이 쉬운 초보자 키트부터 시작하는 걸 추천해요! 🌱';
        if (value === 'using') return '이미 IoT를 쓰고 계시니 허브·자동화까지 확장해볼 수 있어요.';
        break;
      case 'ecosystem':
        var tips = [];
        if (value.indexOf('samsung') > -1) tips.push('삼성 가전 → SmartThings로 묶으면 편해요');
        if (value.indexOf('lg') > -1) tips.push('LG 가전 → LG ThinQ가 잘 맞아요');
        if (value.indexOf('apple') > -1) tips.push('애플 기기 → Apple 홈으로 묶어요');
        if (value.indexOf('kt') > -1) tips.push('KT → 기가지니도 활용 가능');
        return tips.length ? ('보유하신 브랜드에 맞춰 추천해요: ' + tips.join(' · ') + '.') : null;
      case 'indoorMobility':
        if (value === 'unable') return '이동이 어려우면 동작·재실 센서로 자동 제어를 넣으면 편해요.';
        break;
    }
    return null;
  }

  function renderPersonalWizard() {
    var qs = personalQuestions();
    var total = qs.length;
    var qi = Math.max(0, Math.min(state.meta.personalStep || 0, total - 1));
    state.meta.personalStep = qi;
    var item = qs[qi];
    var f = item.f;
    var store = state[item.store];
    var value = store[f.id];

    var container = el('div', {}, []);
    // 진행 표시
    container.appendChild(el('div', { class: 'pq-top' }, [
      el('span', { class: 'pq-count' }, ['개인 능력 · ' + (qi + 1) + ' / ' + total]),
      el('div', { class: 'pq-progress' }, [
        el('div', { class: 'pq-progress-fill', style: 'width:' + Math.round((qi + 1) / total * 100) + '%' }, [])
      ])
    ]));

    // 홈스가 질문
    container.appendChild(el('div', { class: 'npc-row' }, [
      el('div', { class: 'npc-face' }, ['🤖']),
      el('div', { class: 'npc-bubble' }, [el('b', {}, ['홈스']), ' · ', (f.q || f.label)])
    ]));

    // 입력 카드
    var card = el('div', { class: 'card pq-card' }, []);
    if (f.type === 'text') {
      card.appendChild(el('input', {
        type: 'text', placeholder: f.placeholder || '', value: value || '',
        oninput: function (e) { store[f.id] = e.target.value; saveState(); }
      }, []));
    } else if (f.type === 'choice') {
      card.appendChild(choiceGroup(f.options, value, function (v) {
        store[f.id] = (store[f.id] === v) ? undefined : v;
        render();
      }));
      // 기타 주관식
      if (f.otherField && value === 'etc') {
        card.appendChild(el('input', {
          type: 'text', placeholder: '기타 장애 유형을 적어주세요', value: store[f.otherField] || '',
          style: 'margin-top:10px',
          oninput: function (e) { store[f.otherField] = e.target.value; saveState(); }
        }, []));
      }
    } else if (f.type === 'multi') {
      card.appendChild(choiceGroup(f.options, value || [], function (v) {
        var arr = store[f.id] || [];
        var idx = arr.indexOf(v);
        if (idx > -1) arr.splice(idx, 1); else arr.push(v);
        store[f.id] = arr;
        render();
      }, true));
    }
    container.appendChild(card);

    // 홈스 즉시 피드백
    var fb = npcFeedback(f.id, value);
    if (fb) {
      container.appendChild(el('div', { class: 'npc-row npc-tip' }, [
        el('div', { class: 'npc-face' }, ['💡']),
        el('div', { class: 'npc-bubble' }, [fb])
      ]));
    }

    app.innerHTML = '';
    app.appendChild(container);

    renderActions([
      {
        label: '← 이전', variant: 'btn-ghost', align: 'left',
        onClick: function () {
          if (qi > 0) { state.meta.personalStep = qi - 1; render(); }
          else go('spaces');
        }
      },
      {
        label: (qi < total - 1) ? '다음 →' : '솔루션 도출 →', variant: 'btn-primary',
        onClick: function () {
          if (qi < total - 1) { state.meta.personalStep = qi + 1; render(); }
          else go('result');
        }
      }
    ]);
  }

  /* =========================================================
   * 화면 1.5 : 주요구 확인
   *   - 현재 활동 수준에서 '도움받아 함' 또는 '안함/해본 적 없음'인
   *     활동에 대해, 스마트 홈으로 개선할지 대상자와 확인
   * =======================================================*/
  function pendingNeedItems() {
    var ca = D.currentActivityLevel;
    var out = [];
    ca.groups.forEach(function (grp) {
      grp.items.forEach(function (item) {
        var lvl = state.currentActivity[item.id];
        if (lvl === 'assisted' || lvl === 'none') {
          out.push({ space: grp.space, item: item, level: lvl });
        }
      });
    });
    return out;
  }

  function levelPhrase(level) {
    return level === 'assisted'
      ? '도움을 받아 하고 있습니다'
      : '하지 않거나 해본 적이 없습니다';
  }

  function renderNeeds() {
    var pending = pendingNeedItems();
    var container = el('div', {}, [
      renderProgressHero('needs'),
      el('h1', { class: 'page-title' }, ['주요구 확인']),
      el('p', { class: 'page-sub' }, ['기초 스크리닝에서 스스로 수행이 어려운 것으로 확인된 활동입니다. 각 항목을 대상자와 함께 확인하여, 스마트 홈으로 개선할지 선택하세요. "예"로 선택한 항목이 대상자의 주요구가 됩니다.'])
    ]);

    var card = el('div', { class: 'card' }, []);
    if (pending.length === 0) {
      card.appendChild(el('div', { class: 'empty-state' }, [
        '현재 활동 수준에서 "도움받아 함" 또는 "안함·해본 적 없음"으로 표시된 활동이 없습니다.',
        el('br', {}, []),
        '필요한 주요구가 있으면 아래에 직접 입력하세요.'
      ]));
    } else {
      pending.forEach(function (p) {
        var chosen = state.needs[p.item.id]; // true / false / undefined
        card.appendChild(el('div', { class: 'need-item' }, [
          el('div', { class: 'need-q' }, [
            el('span', { class: 'need-space' }, [p.space]),
            '현재 ‘' + p.item.label + '’을(를) ' + levelPhrase(p.level) + '. ',
            el('strong', {}, ['스마트 홈으로 수정하여 스스로 할 수 있게 할까요?'])
          ]),
          el('div', { class: 'choices' }, [
            el('button', {
              class: 'choice-chip' + (chosen === true ? ' selected' : ''),
              type: 'button',
              onclick: function () { state.needs[p.item.id] = (chosen === true) ? undefined : true; render(); }
            }, ['예 — 주요구로 반영']),
            el('button', {
              class: 'choice-chip' + (chosen === false ? ' selected' : ''),
              type: 'button',
              onclick: function () { state.needs[p.item.id] = (chosen === false) ? undefined : false; render(); }
            }, ['아니오'])
          ])
        ]));
      });
    }
    container.appendChild(card);

    // 기타 주요구 자유 입력
    container.appendChild(el('div', { class: 'card' }, [
      el('h3', {}, ['기타 주요구 (선택)']),
      el('p', { class: 'section-guide' }, ['위 목록 외에 대상자가 스마트 홈을 의뢰하는 이유·기대사항이 있으면 입력하세요.']),
      el('textarea', {
        placeholder: '예) 밤에 안전하게 이동하고 싶다, 손님 응대를 혼자 하고 싶다 등',
        oninput: function (e) { state.meta.needsExtra = e.target.value; saveState(); }
      }, [state.meta.needsExtra || ''])
    ]));

    var chosenCount = confirmedNeeds().length;
    app.innerHTML = '';
    app.appendChild(container);
    renderActions([
      { label: '← 이전', variant: 'btn-ghost', align: 'left', onClick: function () { go('screening'); } },
      { label: '공간별 수행도 →' + (chosenCount ? ' (' + chosenCount + ')' : ''), variant: 'btn-primary', onClick: function () { go('performance'); } }
    ]);
  }

  // '예'로 확인된 주요구 목록
  function confirmedNeeds() {
    var ca = D.currentActivityLevel;
    var out = [];
    ca.groups.forEach(function (grp) {
      grp.items.forEach(function (item) {
        if (state.needs[item.id] === true) {
          out.push({ space: grp.space, label: item.label, level: state.currentActivity[item.id] });
        }
      });
    });
    return out;
  }

  function renderFieldCard(title, group, store) {
    var card = el('div', { class: 'card' }, [el('h2', {}, [title])]);
    group.fields.forEach(function (f) {
      var field = el('div', { class: 'field' }, []);
      if (f.type === 'text' || f.type === 'number') {
        card.appendChild(textField(f.label, store[f.id], function (v) { store[f.id] = v; }, {
          type: f.type, placeholder: f.placeholder, suffix: f.suffix
        }));
        return;
      }
      field.appendChild(el('label', { class: 'field-label' }, [f.label]));
      if (f.type === 'choice') {
        field.appendChild(choiceGroup(f.options, store[f.id], function (v) {
          store[f.id] = (store[f.id] === v) ? undefined : v; // 다시 누르면 해제
          render();
        }));
      } else if (f.type === 'multi') {
        field.appendChild(choiceGroup(f.options, store[f.id] || [], function (v) {
          var arr = store[f.id] || [];
          var idx = arr.indexOf(v);
          if (idx > -1) arr.splice(idx, 1); else arr.push(v);
          store[f.id] = arr;
          render();
        }, true));
      }
      card.appendChild(field);
    });
    return card;
  }

  /* =========================================================
   * 화면 2 : 공간별 작업수행도 (양식지 2)
   * =======================================================*/
  var openSpaces = {}; // 아코디언 열림 상태

  /* 주요구 기반 필터 --------------------------------------- */
  // '예'로 확인된 주요구 → 포함 카테고리 집합
  function confirmedCategories() {
    var set = {};
    D.currentActivityLevel.groups.forEach(function (grp) {
      grp.items.forEach(function (item) {
        if (state.needs[item.id] === true) {
          (D.needCategoryMap[item.id] || []).forEach(function (c) { set[c] = true; });
        }
      });
    });
    return Object.keys(set);
  }
  function filterActive() {
    return !state.meta.perfShowAll && confirmedCategories().length > 0;
  }
  function activityVisible(act) {
    if (!filterActive()) return true;
    var cat = D.activityCategoryById[act.id] || 'other';
    return confirmedCategories().indexOf(cat) > -1;
  }

  function renderPerformance() {
    var filtered = filterActive();
    var hasNeeds = confirmedCategories().length > 0;
    var subText = hasNeeds
      ? '앞서 확인한 주요구를 바탕으로, 각 공간에서 실제로 어떻게 수행하고 있는지 조금 더 자세히 확인합니다. 이 수행 정도에 따라 공간별로 맞춤 스마트 홈 기술을 추천합니다.'
      : '각 공간에서 현재 수행 정도를 확인합니다. 이 결과에 따라 공간별로 맞춤 스마트 홈 기술을 추천합니다.';
    var container = el('div', {}, [
      renderProgressHero('performance'),
      el('h1', { class: 'page-title' }, ['2. 공간별 작업수행도']),
      el('p', { class: 'page-sub' }, [subText])
    ]);

    // 수행 정도 기준 안내 (상단)
    container.appendChild(el('div', { class: 'note' }, [
      D.performanceScale.guide,
      el('br', {}, []),
      el('strong', {}, ['수행 정도 기준']), ' — ',
      '미경험(경험 없음) · 못함·안함 · 도움받아 함 · 독립적으로 함. ',
      el('br', {}, []),
      '‘못함·안함’ 또는 ‘도움받아 함’으로 표시된 활동이 스마트 홈 솔루션 추천 대상이 됩니다.'
    ]));

    // 필터 토글 (주요구 확인 결과가 있을 때만)
    if (confirmedCategories().length > 0) {
      container.appendChild(el('div', { class: 'filter-bar' }, [
        el('span', { class: 'filter-label' }, [
          filtered ? '주요구와 관련된 활동만 표시 중입니다.' : '전체 활동을 표시 중입니다.'
        ]),
        el('button', {
          class: 'btn', type: 'button', style: 'padding:7px 14px',
          onclick: function () { state.meta.perfShowAll = !state.meta.perfShowAll; render(); }
        }, [filtered ? '전체 활동 보기' : '주요구 항목만 보기'])
      ]));
    }

    var firstVisibleOpened = false;
    D.spaces.forEach(function (space) {
      // 이 공간에 표시할 활동이 있는지 확인
      var visibleTasks = space.tasks.map(function (task) {
        return { task: task, acts: task.activities.filter(activityVisible) };
      }).filter(function (t) { return t.acts.length > 0; });
      if (visibleTasks.length === 0) return; // 관련 활동 없으면 공간 숨김

      // 처음 보이는 공간을 기본으로 펼침
      if (openSpaces[space.id] === undefined) openSpaces[space.id] = !firstVisibleOpened;
      firstVisibleOpened = true;
      var ratedCount = countRatedInSpace(space);
      var block = el('div', { class: 'space-block' }, []);
      var head = el('button', {
        class: 'space-head', type: 'button',
        onclick: function () { openSpaces[space.id] = !openSpaces[space.id]; render(); }
      }, [
        el('span', {}, [(openSpaces[space.id] ? '▾ ' : '▸ ') + space.label]),
        el('span', { class: 'count' }, [ratedCount > 0 ? ('제한 활동 ' + ratedCount + '개') : '미평가'])
      ]);
      block.appendChild(head);

      var body = el('div', { class: 'space-body' + (openSpaces[space.id] ? ' open' : '') }, []);
      visibleTasks.forEach(function (vt) {
        body.appendChild(el('div', { class: 'task-label' }, ['· ' + vt.task.label]));
        var matrix = el('div', { class: 'matrix' }, []);
        vt.acts.forEach(function (act) {
          var key = perfKey(space.id, vt.task.id, act.id);
          matrix.appendChild(el('div', { class: 'matrix-row' }, [
            el('div', { class: 'row-label' }, [act.label]),
            choiceGroup(
              D.performanceScale.options.map(function (o) { return { value: o.value, label: o.word }; }),
              state.performance[key],
              function (v) {
                state.performance[key] = (state.performance[key] === v) ? undefined : v;
                render();
              }
            )
          ]));
        });
        body.appendChild(matrix);
      });
      block.appendChild(body);
      container.appendChild(block);
    });

    app.innerHTML = '';
    app.appendChild(container);

    var limited = collectLimitedActivities();
    renderActions([
      { label: '← 이전', variant: 'btn-ghost', align: 'left', onClick: function () { go('needs'); } },
      {
        label: '개인 능력 (' + limited.length + ') →',
        variant: 'btn-primary',
        disabled: limited.length === 0,
        onClick: function () { go('personal'); }
      }
    ]);
  }

  function countRatedInSpace(space) {
    var n = 0;
    space.tasks.forEach(function (task) {
      task.activities.forEach(function (act) {
        if (!activityVisible(act)) return;
        var v = state.performance[perfKey(space.id, task.id, act.id)];
        if (v === 1 || v === 2) n++;
      });
    });
    return n;
  }

  /* 제한되는 활동(수행도 1 또는 2) 수집 — 현재 필터에 보이는 활동만 */
  function collectLimitedActivities() {
    var out = [], seen = {};
    D.spaces.forEach(function (space) {
      space.tasks.forEach(function (task) {
        task.activities.forEach(function (act) {
          if (!activityVisible(act)) return;
          var v = state.performance[perfKey(space.id, task.id, act.id)];
          if (v === 1 || v === 2) {
            var dk = space.id + '::' + act.id; // 같은 공간의 동일 활동은 한 번만
            if (seen[dk]) return;
            seen[dk] = true;
            out.push({ space: space, task: task, activity: act, level: v });
          }
        });
      });
    });
    return out;
  }

  /* =========================================================
   * 권장 플랫폼 산출 (OS·보유 브랜드 기반)
   * =======================================================*/
  function computePlatforms() {
    var env = state.environment;
    var eco = env.ecosystem || [];
    var scored = {};
    function add(id, score, reason) {
      if (!scored[id]) scored[id] = { score: 0, reasons: [] };
      scored[id].score += score;
      if (reason && scored[id].reasons.indexOf(reason) < 0) scored[id].reasons.push(reason);
    }
    if (eco.indexOf('samsung') > -1) add('smartthings', 3, '삼성 가전 보유');
    if (eco.indexOf('lg') > -1) add('thinq', 3, 'LG 가전 보유');
    if (eco.indexOf('apple') > -1) add('apple', 3, '애플 기기 보유');
    if (eco.indexOf('kt') > -1) add('gigagenie', 3, 'KT 인터넷·기가지니');
    if (eco.indexOf('google') > -1) add('google', 2, '구글 사용');
    if (env.os === 'ios') add('apple', 2, '아이폰(iOS) 사용');
    if (env.os === 'android') { add('smartthings', 2, '안드로이드 사용'); add('google', 1, '안드로이드 사용'); }
    if (env.iotExperience === 'none' || env.iotExperience === 'tried') add('hejhome', 1, 'IoT 경험이 적어 보급형으로 시작하기 좋음');

    var ids = Object.keys(scored);
    if (ids.length === 0) {
      return [
        { name: D.platforms.smartthings.name, desc: D.platforms.smartthings.desc, reason: '국내 호환성·확장성이 넓은 기본 추천' },
        { name: D.platforms.hejhome.name, desc: D.platforms.hejhome.desc, reason: '보급형으로 부담 없이 시작' }
      ];
    }
    ids.sort(function (a, b) { return scored[b].score - scored[a].score; });
    return ids.slice(0, 3).map(function (id) {
      return { name: D.platforms[id].name, desc: D.platforms[id].desc, reason: scored[id].reasons.join(' · ') };
    });
  }

  function renderPlatformCard() {
    var env = state.environment;
    var plats = computePlatforms();
    var card = el('div', { class: 'card' }, [el('h3', {}, ['권장 플랫폼 및 기존 가전 활용'])]);

    card.appendChild(el('p', { class: 'section-guide' }, ['기기들을 하나로 묶어 제어할 플랫폼(허브 앱)입니다. 개인 기기·보유 브랜드에 맞춰 아래 순서로 검토하세요.']));
    var list = el('div', { class: 'platform-list' }, plats.map(function (p) {
      return el('div', { class: 'platform-item' }, [
        el('div', { class: 'platform-name' }, [p.name]),
        el('div', { class: 'platform-desc' }, [p.desc + (p.reason ? (' — ' + p.reason) : '')])
      ]);
    }));
    card.appendChild(list);

    // 기존 가전 활용
    var appl = (env.appliancesText || '').trim();
    var applBox = el('div', { class: 'note', style: 'margin-top:14px' }, [
      el('strong', {}, ['기존 가전 활용: '])
    ]);
    if (appl) {
      applBox.appendChild(document.createTextNode('현재 보유: ' + appl + '. '));
    }
    applBox.appendChild(document.createTextNode(
      '이미 있는 기기(스마트 TV·에어컨 등)는 새로 사지 말고 위 플랫폼에 연동해 먼저 활용하세요. ' +
      '새 기기를 고를 때는 보유 플랫폼·Matter 지원 여부를 확인해 호환성을 맞추면 중복 구매를 줄일 수 있습니다.'
    ));
    card.appendChild(applBox);
    return card;
  }

  /* =========================================================
   * 스마트 홈 설계도 (아이소메트릭 2.5D 도식)
   * =======================================================*/
  function deviceEmoji(name) {
    var map = [
      ['스위치', '🔘'], ['무드등', '💡'], ['조명', '💡'], ['커튼', '🪟'], ['블라인드', '🪟'],
      ['잠금장치', '🔒'], ['자동문', '🚪'], ['초인종', '🔔'], ['카메라', '📷'], ['문 센서', '🚪'],
      ['플러그', '🔌'], ['리모컨', '📡'], ['허브', '🧩'], ['가습기', '💧'], ['온습도', '🌡️'],
      ['에어컨', '❄️'], ['공기청정기', '🌀'], ['TV', '📺'], ['체중계', '⚖️'], ['웨어러블', '⌚'],
      ['동작 감지', '🚶'], ['조도센서', '🔆'], ['사이렌', '🚨'], ['펫', '🐾'], ['로봇', '🤖']
    ];
    for (var i = 0; i < map.length; i++) { if (name.indexOf(map[i][0]) > -1) return map[i][1]; }
    return '•';
  }

  // 공간별 기기 목록(권장 경로 기준, 중복 제거)
  function spaceDeviceMap(limited, rec) {
    var preferBLE = !!(rec && rec.wifiWarning);
    var map = {};
    limited.forEach(function (r) {
      var opts = r.activity.tech;
      var pick = preferBLE ? opts.filter(function (o) { return o.network === 'BLE'; })[0] : null;
      pick = pick || opts.filter(function (o) { return o.network === 'Wi-Fi'; })[0] || opts[0];
      if (!pick) return;
      if (!map[r.space.id]) map[r.space.id] = [];
      pick.devices.forEach(function (dev) {
        if (map[r.space.id].indexOf(dev) < 0) map[r.space.id].push(dev);
      });
    });
    return map;
  }

  function renderFloorPlanCard(limited, rec) {
    var devMap = spaceDeviceMap(limited, rec);
    // 위에서 내려다본 평면 설계도. 방 크기를 현실적으로(거실 큼, 현관·화장실 작음)
    var rooms = [
      { id: 'living', x: 12, y: 12, w: 356, h: 132, label: '거실 / 부엌' },
      { id: 'bedroom', x: 12, y: 148, w: 196, h: 168, label: '침실' },
      { id: 'bathroom', x: 212, y: 148, w: 156, h: 78, label: '화장실' },
      { id: 'entrance', x: 212, y: 230, w: 156, h: 86, label: '현관' }
    ];
    var VW = 380, VH = 330;
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + VW + ' ' + VH, width: '100%',
      preserveAspectRatio: 'xMidYMid meet', class: 'floorplan-svg'
    }, []);

    rooms.forEach(function (room) {
      var devs = devMap[room.id] || [];
      var active = devs.length > 0;

      // 방 (벽)
      svg.appendChild(svgEl('rect', {
        x: room.x, y: room.y, width: room.w, height: room.h, rx: 3,
        fill: active ? '#fdeede' : '#f3efe9',
        stroke: active ? '#cb5a0f' : '#c3b8aa',
        'stroke-width': active ? 2.5 : 1.5
      }));
      // 방 이름 (+ 기기 개수)
      svg.appendChild(svgEl('text', {
        x: room.x + 12, y: room.y + 23, 'font-size': '15', 'font-weight': '700',
        fill: active ? '#a5470b' : '#a29587'
      }, [room.label + (active ? ' · ' + devs.length + '개' : ' · 해당 없음')]));

      // 방 안에는 기기 아이콘(이모지)만 콤팩트하게 (이름은 아래 목록에서)
      var COL = 28, startX = room.x + 14, startY = room.y + 46;
      var perRow = Math.max(1, Math.floor((room.w - 20) / COL));
      devs.forEach(function (dev, i) {
        var rr = Math.floor(i / perRow), cc = i % perRow;
        svg.appendChild(svgEl('text', {
          x: startX + cc * COL, y: startY + rr * COL, 'font-size': '19'
        }, [deviceEmoji(dev)]));
      });
    });

    // 현관 출입문 (스윙 아크) — 평면도 느낌
    var e = rooms[3];
    svg.appendChild(svgEl('path', {
      d: 'M ' + (e.x + e.w) + ' ' + (e.y + e.h - 12) + ' A 34 34 0 0 1 ' + (e.x + e.w - 34) + ' ' + (e.y + e.h - 46),
      fill: 'none', stroke: '#cb5a0f', 'stroke-width': '1.4', 'stroke-dasharray': '3 3'
    }));
    svg.appendChild(svgEl('rect', {
      x: e.x + e.w - 4, y: e.y + e.h - 46, width: 8, height: 34, fill: '#fff'
    }));

    // 도면 아래 방별 전체 기기 목록 (모두 표시)
    var legend = el('div', { class: 'floorplan-legend' }, []);
    rooms.forEach(function (room) {
      var devs = devMap[room.id] || [];
      if (devs.length === 0) return;
      legend.appendChild(el('div', { class: 'fp-leg-item' }, [
        el('div', { class: 'fp-leg-room' }, [room.label]),
        el('div', { class: 'fp-leg-devs' }, [devs.map(function (d) {
          return deviceEmoji(d) + ' ' + d;
        }).join('   ·   ')])
      ]));
    });

    var card = el('div', { class: 'card' }, [
      el('h3', {}, ['스마트 홈 설계도 (평면)']),
      el('p', { class: 'section-guide' }, ['위에서 내려다본 집 평면도입니다. 방 안 아이콘은 기기이며, 자세한 목록은 도면 아래에 있습니다.']),
      el('div', { class: 'floorplan-wrap' }, [svg]),
      legend
    ]);
    return card;
  }

  /* =========================================================
   * 화면 3 : 솔루션 제안서 (양식지 3)
   * =======================================================*/
  function renderResult() {
    upsertCurrentRecord(); // 결과에 도달하면 기록에 자동 저장/갱신
    var limited = collectLimitedActivities();
    var rec = computeControlRecommendation();
    var container = el('div', {}, []);
    var m = state.meta;

    /* --- 헤더 / 의뢰 정보 --- */
    var today = new Date().toISOString().slice(0, 10);
    var headCard = el('div', { class: 'card' }, [
      el('h1', { class: 'page-title' }, ['스마트 홈 솔루션 제안서']),
      el('div', { class: 'report-meta' }, ['작성일: ', el('b', {}, [today])]),
      m.org ? el('div', { class: 'report-meta' }, ['의뢰 기관: ', el('b', {}, [m.org])]) : null,
      m.staff ? el('div', { class: 'report-meta' }, ['담당자: ', el('b', {}, [m.staff]), m.contact ? (' (' + m.contact + ')') : '']) : null
    ]);
    container.appendChild(headCard);

    /* --- 결과 하위 탭 (한 화면이 너무 길지 않게 분할) --- */
    var activeTab = state.meta.resultTab || 'summary';
    var RTABS = [
      { id: 'summary', label: '📋 요약' },
      { id: 'plan', label: '🏠 설계도·솔루션' },
      { id: 'buy', label: '🛒 기기·구매' },
      { id: 'care', label: '📝 계획' }
    ];
    container.appendChild(el('div', { class: 'result-tabbar no-print' }, RTABS.map(function (t) {
      return el('button', {
        class: 'rtab-btn' + (t.id === activeTab ? ' active' : ''), type: 'button',
        onclick: function () { state.meta.resultTab = t.id; render(); }
      }, [t.label]);
    })));
    function sec(tabId, node) {
      if (!node) return;
      node.className = (node.className ? node.className + ' ' : '') +
        'rsec rsec-' + tabId + (tabId === activeTab ? '' : ' rsec-hidden');
      container.appendChild(node);
    }

    /* [요약] 완료 축하 배너 */
    if (limited.length > 0) {
      sec('summary', el('div', { class: 'card celebrate' }, [
        buildHouseSvg(4),
        el('div', {}, [
          el('div', { class: 'celebrate-title' }, ['🎉 완성! 평가 완료']),
          el('div', { class: 'celebrate-sub' }, ['제한 활동 ' + limited.length + '개에 맞는 스마트 홈 솔루션을 찾았어요. 위 탭에서 상세 내용을 확인하세요.'])
        ])
      ]));
    }

    /* [요약] 대상자의 주요구 */
    var goals = confirmedNeeds();
    if (goals.length > 0 || m.needsExtra) {
      var goalsCard = el('div', { class: 'card' }, [el('h3', {}, ['대상자의 주요구'])]);
      if (goals.length > 0) {
        goalsCard.appendChild(el('ul', { class: 'goal-list' }, goals.map(function (g) {
          return el('li', {}, [
            el('span', { class: 'goal-space' }, [g.space]),
            g.label,
            el('span', { class: 'goal-tail' }, [' — 스마트 홈으로 스스로 수행 목표'])
          ]);
        })));
      }
      if (m.needsExtra) {
        goalsCard.appendChild(el('div', { class: 'note', style: 'margin-top:10px' }, [
          el('strong', {}, ['기타: ']), m.needsExtra
        ]));
      }
      sec('summary', goalsCard);
    }

    /* [요약] 대상자 정보 */
    sec('summary', renderProfileCard());

    /* [요약] 권장 제어 인터페이스 */
    var recCard = el('div', { class: 'card' }, [el('h3', {}, ['권장 제어 인터페이스'])]);
    if (rec.primary) {
      recCard.appendChild(el('div', { class: 'rec-primary' }, [rec.primary]));
    }
    recCard.appendChild(el('p', { class: 'section-guide', style: 'margin-top:6px' }, [rec.reason]));
    if (rec.speakerBlocked) {
      recCard.appendChild(el('div', { class: 'note note-danger', style: 'margin-top:10px' }, [
        el('strong', {}, ['Wi-Fi 필요: ']),
        '권장 제어 방식인 스마트 스피커(음성)는 Wi-Fi 연결이 필수입니다. 현재 Wi-Fi가 "없음"으로 평가되어 그대로는 사용할 수 없으므로, ' +
        'Wi-Fi 구축이 선행되어야 합니다. 구축 전에는 BLE(스위치 로봇) 등 물리 기반 대안을 검토하세요.'
      ]));
    } else if (rec.wifiWarning) {
      recCard.appendChild(el('div', { class: 'note', style: 'margin-top:10px' }, [
        el('strong', {}, ['Wi-Fi 미보유: ']),
        'Wi-Fi 기반 기기는 네트워크 구축이 선행되어야 합니다. 그 전까지는 BLE(스위치 로봇 등) 대안을 우선 적용하세요. ' +
        '아래 목록에서 Wi-Fi 옵션은 "구축 필요"로 표시됩니다.'
      ]));
    }
    sec('summary', recCard);

    /* [요약] 통계 */
    var wifiCount = 0, bleCount = 0;
    limited.forEach(function (r) {
      r.activity.tech.forEach(function (t) {
        if (t.network === 'Wi-Fi') wifiCount++; else if (t.network === 'BLE') bleCount++;
      });
    });
    sec('summary', el('div', { class: 'card' }, [
      el('div', { class: 'result-summary' }, [
        stat(limited.length, '제한 활동'),
        stat(countSolutionSpaces(limited), '대상 공간'),
        stat(wifiCount, 'Wi-Fi 옵션'),
        stat(bleCount, 'BLE 옵션')
      ])
    ]));

    /* [설계도] 스마트 홈 설계도 (평면) */
    if (limited.length > 0) sec('plan', renderFloorPlanCard(limited, rec));

    /* [설계도] 솔루션 본문 (공간별) — 제한 활동(좌) → 솔루션(우) */
    var body = el('div', { class: 'card' }, [el('h3', {}, ['공간별 적정 스마트 홈 기술'])]);
    if (limited.length === 0) {
      body.appendChild(el('div', { class: 'empty-state' }, [
        '제한되는 활동(수행도 1·2)이 없습니다. 공간별 수행도를 다시 확인하세요.'
      ]));
    } else {
      body.appendChild(el('div', { class: 'sol-colhead' }, [
        el('span', {}, ['현재 제한 활동']),
        el('span', {}, ['스마트 홈 솔루션'])
      ]));
      D.spaces.forEach(function (space) {
        var rows = limited.filter(function (r) { return r.space.id === space.id; });
        if (rows.length === 0) return;
        var block = el('div', { class: 'solution-space' }, [
          el('div', { class: 'sp-title' }, [space.label + ' (' + rows.length + ')'])
        ]);
        rows.forEach(function (r) { block.appendChild(renderSolutionItem(r, rec)); });
        body.appendChild(block);
      });
    }
    sec('plan', body);

    /* [기기·구매] 키트 구성 */
    if (limited.length > 0) sec('buy', renderKitCard(limited, rec));
    /* [기기·구매] 권장 플랫폼 및 기존 가전 활용 */
    if (limited.length > 0) sec('buy', renderPlatformCard());
    /* [기기·구매] 연결 구조 및 구매 안내 */
    if (limited.length > 0) sec('buy', renderConnectivityCard(limited, rec));

    /* [계획] 중재 계획 및 유의사항 */
    sec('care', renderInterventionCard());
    /* [계획] 제작 크레딧 */
    sec('care', el('div', { class: 'report-source' }, [MAKER_CREDIT]));

    app.innerHTML = '';
    app.appendChild(container);

    // 숨은 파일 입력 (결과 화면에서도 불러오기 가능)
    app.appendChild(el('input', {
      type: 'file', accept: 'application/json,.json', id: 'import-file-result',
      style: 'display:none',
      onchange: function (e) { if (e.target.files[0]) importJSON(e.target.files[0]); }
    }, []));

    renderActions([
      { label: '← 이전', variant: 'btn-ghost', align: 'left', onClick: function () { go('personal'); } },
      { label: '불러오기', variant: '', onClick: function () { document.getElementById('import-file-result').click(); } },
      { label: '내보내기(JSON)', variant: '', onClick: exportJSON },
      { label: '인쇄 / PDF', variant: '', onClick: function () { window.print(); } },
      { label: '새 평가', variant: 'btn-primary', onClick: resetAll }
    ]);
  }

  function stat(num, lbl) {
    return el('div', { class: 'stat' }, [
      el('div', { class: 'num' }, [String(num)]),
      el('div', { class: 'lbl' }, [lbl])
    ]);
  }

  function countSolutionSpaces(limited) {
    var s = {};
    limited.forEach(function (r) { s[r.space.id] = true; });
    return Object.keys(s).length;
  }

  // 선택값 → 라벨 변환
  function labelOf(fields, id, value) {
    var f = fields.filter(function (x) { return x.id === id; })[0];
    if (!f || !f.options) return value;
    var o = f.options.filter(function (x) { return x.value === value; })[0];
    return o ? o.label : value;
  }

  function renderProfileCard() {
    var p = state.personal, env = state.environment;
    var pf = D.personalAbility.fields, ef = D.environment.fields;
    var rows = [];
    function add(label, value) { if (value != null && value !== '') rows.push({ label: label, value: value }); }

    add('이름', p.name);
    if (p.age) add('나이', labelOf(pf, 'age', p.age));
    if (p.disabilityType) add('장애 유형', labelOf(pf, 'disabilityType', p.disabilityType) +
      (p.disabilityType === 'etc' && p.disabilityTypeEtc ? (' (' + p.disabilityTypeEtc + ')') : ''));
    if (p.disabilityLevel) add('장애 정도', labelOf(pf, 'disabilityLevel', p.disabilityLevel));
    if (p.indoorMobility) add('실내 보행', labelOf(pf, 'indoorMobility', p.indoorMobility));
    if (p.handUse) add('손의 기능적 사용', labelOf(pf, 'handUse', p.handUse));
    if (p.communication) add('대화 가능 여부', labelOf(pf, 'communication', p.communication));
    if (env.smartphone) add('스마트폰', labelOf(ef, 'smartphone', env.smartphone));
    if (env.os) add('OS', labelOf(ef, 'os', env.os));
    if (env.wifi) add('Wi-Fi', labelOf(ef, 'wifi', env.wifi));
    if (env.household) add('가구 형태', labelOf(ef, 'household', env.household));
    if (env.housing) add('주거 형태', labelOf(ef, 'housing', env.housing));
    if (env.iotExperience) add('IoT 사용 경험', labelOf(ef, 'iotExperience', env.iotExperience));
    if (env.ecosystem && env.ecosystem.length) {
      add('보유 브랜드', env.ecosystem.map(function (v) { return labelOf(ef, 'ecosystem', v); }).join(', '));
    }
    if (env.appliancesText) add('현재 가전·기기', env.appliancesText);

    var card = el('div', { class: 'card' }, [el('h3', {}, ['대상자 정보'])]);
    if (rows.length === 0) {
      card.appendChild(el('p', { class: 'section-guide' }, ['기초 스크리닝 정보가 입력되지 않았습니다.']));
      return card;
    }
    var grid = el('div', { class: 'profile-grid' }, []);
    rows.forEach(function (r) {
      grid.appendChild(el('div', { class: 'profile-cell' }, [
        el('span', { class: 'pf-label' }, [r.label]),
        el('span', { class: 'pf-value' }, [String(r.value)])
      ]));
    });
    card.appendChild(grid);
    return card;
  }

  function renderInterventionCard() {
    var m = state.meta;
    var card = el('div', { class: 'card' }, [
      el('h3', {}, ['중재 계획 및 유의사항']),
      el('p', { class: 'section-guide' }, ['처리 과정(계획 → 실행 → 모니터링)에 따라 필요 항목을 기록하세요. 입력 내용은 제안서에 함께 인쇄됩니다.'])
    ]);
    card.appendChild(memoField('중재 목표', 'goal', m.goal, '예) 혼자서 현관문 개폐, 야간 안전 이동 등 목표 활동'));
    card.appendChild(memoField('예산 계획', 'budget', m.budget, '예) 장애인 보조기기 교부사업 활용, 예상 비용 등'));
    card.appendChild(memoField('자동화 시나리오', 'scenario', m.scenario, '예) 기상 시 커튼 자동 개방, 취침 시 전체 소등 등'));
    card.appendChild(el('div', { class: 'note' }, [
      el('strong', {}, ['A/S 안내: ']),
      '기기 관련 고장은 제조사 보증(예: 1년 무상)에 따르며, 설정 관련 문제는 담당자·연구자가 지원합니다. ',
      '단, 사용자의 고의 또는 주의사항을 무시한 과실로 발생한 고장은 A/S가 제한됩니다.'
    ]));
    return card;
  }

  function memoField(label, key, value, placeholder) {
    return el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, [label]),
      el('textarea', {
        class: 'no-print-empty',
        placeholder: placeholder,
        oninput: function (e) { state.meta[key] = e.target.value; saveState(); }
      }, [value || ''])
    ]);
  }

  function renderSolutionItem(r, rec) {
    var levelBadge = r.level === 1
      ? el('span', { class: 'badge badge-limited-1' }, ['수행도 1 · 못함/안함'])
      : el('span', { class: 'badge badge-limited-2' }, ['수행도 2 · 도움받아 함']);

    // Wi-Fi 미보유 시 BLE 우선 정렬
    var techs = r.activity.tech.slice();
    if (rec && rec.wifiWarning) {
      techs.sort(function (a, b) {
        return (a.network === 'BLE' ? 0 : 1) - (b.network === 'BLE' ? 0 : 1);
      });
    }

    var techList = el('div', { class: 'tech-list' }, techs.map(function (t) {
      var isWifiUnavailable = rec && rec.wifiWarning && t.network === 'Wi-Fi';
      var netCls = t.network === 'BLE' ? 'net-tag net-ble' : 'net-tag net-wifi';
      return el('div', { class: 'tech-opt' + (isWifiUnavailable ? ' tech-dim' : '') }, [
        el('span', { class: netCls }, [t.network]),
        el('span', { class: 'devices' }, [t.devices.join(', ')]),
        isWifiUnavailable ? el('span', { class: 'flag-warn' }, ['구축 필요']) : null
      ]);
    }));

    return el('div', { class: 'sol-item' }, [
      el('div', { class: 'sol-left' }, [
        el('div', { class: 'sol-activity' }, [r.activity.label]),
        el('div', { class: 'sol-task' }, [r.task.label]),
        levelBadge
      ]),
      el('div', { class: 'sol-arrow' }, ['→']),
      el('div', { class: 'sol-right' }, [techList])
    ]);
  }

  /* =========================================================
   * 키트 구성 + 통합 기기 목록
   * =======================================================*/
  // 기본 키트 등급을 IoT 사용 경험으로 판정 (사용자가 변경 가능)
  function defaultKitKey() {
    return state.environment.iotExperience === 'using' ? 'advanced' : 'beginner';
  }
  function activeKitKey() {
    return state.meta.kitOverride || defaultKitKey();
  }

  // 제한 활동 → 권장 경로(Wi-Fi/BLE) 기준으로 통합 기기 목록 산출
  function computeDeviceList(limited, rec) {
    var preferBLE = !!(rec && rec.wifiWarning);
    var map = {}; // name -> { network, tier, activities:Set-like array }
    limited.forEach(function (r) {
      var opts = r.activity.tech;
      var pick = null;
      if (preferBLE) pick = opts.filter(function (o) { return o.network === 'BLE'; })[0];
      pick = pick || opts.filter(function (o) { return o.network === 'Wi-Fi'; })[0] || opts[0];
      if (!pick) return;
      pick.devices.forEach(function (dev) {
        if (!map[dev]) {
          map[dev] = {
            name: dev,
            network: pick.network,
            tier: D.deviceTier[dev] || 'beginner',
            activities: []
          };
        }
        var lbl = r.space.label + ' · ' + r.activity.label;
        if (map[dev].activities.indexOf(lbl) === -1) map[dev].activities.push(lbl);
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.activities.length - a.activities.length; });
  }

  /* =========================================================
   * 연결 구조 및 구매 안내 (리모컨 허브 vs 스마트 허브 등)
   * =======================================================*/
  function computeConnectivity(limited, rec) {
    var devices = computeDeviceList(limited, rec); // 중복 제거된 기기 목록
    var groups = { wifi: [], smarthub: [], ir: [], ble: [] };
    devices.forEach(function (d) {
      var c = D.deviceConnectivity[d.name] || 'wifi';
      if (c === 'smarthub' || c === 'hub_zigbee') groups.smarthub.push(d.name);
      else if (c === 'ir') groups.ir.push(d.name);
      else if (c === 'ble') groups.ble.push(d.name);
      else groups.wifi.push(d.name);
    });
    return {
      groups: groups,
      needSmartHub: groups.smarthub.length > 0,
      hasSmartHubDevice: groups.smarthub.indexOf('스마트 허브') > -1,
      needIrHub: groups.ir.length > 0,
      hasBle: groups.ble.length > 0
    };
  }

  function renderConnectivityCard(limited, rec) {
    var cn = computeConnectivity(limited, rec);
    var card = el('div', { class: 'card' }, [
      el('h3', {}, ['연결 구조 및 구매 안내']),
      el('p', { class: 'section-guide' }, ['기기마다 연결 방식이 다르고, 같은 종류라도 제조사·모델에 따라 달라집니다. 아래는 일반적인 예시 분류입니다.'])
    ]);

    // 구매 전 반드시 확인 (강조)
    card.appendChild(el('div', { class: 'note note-confirm' }, [
      el('strong', {}, ['⚠️ 구매 전 꼭 확인: ']),
      '같은 잠금장치·스위치·자동문이라도 제조사·모델에 따라 Wi-Fi일 수도, Zigbee일 수도 있습니다. 실제 구매할 때는 제품 사양에서 ',
      el('b', {}, ['연결 방식(Wi-Fi·Zigbee·Thread) · Matter 지원 여부 · 호환 플랫폼']),
      ' 을 반드시 확인하세요.'
    ]));

    // 꼭 필요한 허브 요약
    var needChips = [];
    if (cn.needSmartHub) needChips.push('스마트 허브');
    if (cn.needIrHub) needChips.push('리모컨 허브(IR)');
    if (needChips.length) {
      card.appendChild(el('div', { class: 'hub-need' }, [
        el('span', { class: 'hub-need-label' }, ['필요한 허브']),
        el('div', { class: 'choices' }, needChips.map(function (h) {
          return el('span', { class: 'hub-chip' }, [h]);
        }))
      ]));
    }
    // Wi-Fi 없음 경고
    if (rec && rec.wifiWarning) {
      card.appendChild(el('div', { class: 'note note-danger' }, [
        el('strong', {}, ['Wi-Fi 필요: ']),
        '스마트 허브·리모컨 허브·Wi-Fi 기기는 모두 인터넷(공유기)이 있어야 동작합니다. 현재 Wi-Fi가 없어 네트워크 구축이 먼저 필요합니다.'
      ]));
    }

    // 연결 방식별 그룹
    var order = ['wifi', 'smarthub', 'ir', 'ble'];
    order.forEach(function (key) {
      var devs = cn.groups[key];
      if (!devs || devs.length === 0) return;
      var info = D.connectivityInfo[key];
      // 중복 제거
      var uniq = devs.filter(function (v, i) { return devs.indexOf(v) === i; });
      card.appendChild(el('div', { class: 'conn-group' }, [
        el('div', { class: 'conn-head' }, [
          el('span', { class: 'conn-icon' }, [info.icon]),
          el('span', { class: 'conn-label' }, [info.label]),
          info.needsHub ? el('span', { class: 'conn-tag' }, ['허브 필요']) : el('span', { class: 'conn-tag conn-tag-ok' }, ['허브 불필요'])
        ]),
        el('div', { class: 'conn-devs' }, [uniq.join('  ·  ')]),
        el('div', { class: 'conn-desc' }, [info.desc])
      ]));
    });

    // 스마트 허브가 필요한데 목록에 명시적 허브가 없으면 안내
    if (cn.needSmartHub && !cn.hasSmartHubDevice) {
      card.appendChild(el('div', { class: 'note' }, [
        el('strong', {}, ['확인: ']),
        '위 "스마트 허브" 그룹의 기기를 쓰려면 스마트 허브(예: SmartThings·Aqara·헤이홈 허브 등)를 함께 구매해야 합니다.'
      ]));
    }

    // 구매·설치 순서
    card.appendChild(el('div', { class: 'note' }, [
      el('strong', {}, ['구매·설치 순서: ']),
      '① Wi-Fi(공유기) 확인 → ② 허브(스마트 허브·리모컨 허브) 먼저 설치 → ③ 각 기기를 허브/앱에 페어링 → ④ 자동화 시나리오 설정. ',
      '리모컨 허브(IR)는 TV·에어컨 조작용, 스마트 허브는 센서·잠금장치 등 연결용으로 역할이 다르니 용도에 맞게 준비하세요.'
    ]));
    return card;
  }

  function renderKitCard(limited, rec) {
    var kitKey = activeKitKey();
    var kit = D.kitLevels[kitKey];
    var devices = computeDeviceList(limited, rec);
    var beginnerDevs = devices.filter(function (d) { return d.tier === 'beginner'; });
    var advancedDevs = devices.filter(function (d) { return d.tier === 'advanced'; });

    var card = el('div', { class: 'card' }, [
      el('h3', {}, ['키트 구성 및 통합 기기 목록'])
    ]);

    // 등급 선택 토글
    var toggle = el('div', { class: 'kit-toggle no-print' }, [
      el('span', { class: 'kit-toggle-label' }, ['권장 등급:']),
      kitButton('beginner', kitKey),
      kitButton('advanced', kitKey)
    ]);
    card.appendChild(toggle);

    // 등급 배지 + 설명
    card.appendChild(el('div', { class: 'kit-head' }, [
      el('span', { class: 'kit-badge kit-' + kit.key }, [kit.title]),
      state.meta.kitOverride ? null : el('span', { class: 'kit-auto' }, ['(자동 판정)'])
    ]));
    card.appendChild(el('p', { class: 'section-guide' }, [kit.desc]));

    // IoT 사용 경험 기반 권장 근거
    var iot = state.environment.iotExperience;
    if (iot === 'none') {
      card.appendChild(el('div', { class: 'note' }, [
        el('strong', {}, ['권장: ']),
        'IoT 사용 경험이 "없음"으로 평가되어, 설정이 간단한 초보자 키트부터 시작하는 것을 권장합니다. ' +
        '사용에 익숙해지면 숙련자 키트(확장 구성)로 넓혀 가세요.'
      ]));
    } else if (iot === 'tried') {
      card.appendChild(el('div', { class: 'note' }, [
        el('strong', {}, ['권장: ']),
        'IoT 사용 경험이 제한적이어서 초보자 키트를 우선 권장합니다.'
      ]));
    } else if (iot === 'using') {
      card.appendChild(el('div', { class: 'note' }, [
        el('strong', {}, ['참고: ']),
        'IoT 사용 경험이 있어 숙련자 키트(허브·자동화 확장)까지 활용할 수 있습니다.'
      ]));
    }

    if (rec && rec.wifiWarning) {
      card.appendChild(el('div', { class: 'note' }, [
        el('strong', {}, ['경로 안내: ']),
        'Wi-Fi 미보유로 BLE 우선 경로 기준의 기기 목록입니다. Wi-Fi 구축 후에는 스마트 스위치·허브 기반으로 확장할 수 있습니다.'
      ]));
    }

    // 초보자 키트 (기본 구성)
    card.appendChild(deviceTierBlock('기본 구성 (초보자 키트)', beginnerDevs, 'beginner'));
    // 숙련자 키트 (확장 구성) — 숙련자 등급일 때 강조, 초보자 등급일 때는 '확장 옵션'으로 표기
    var advTitle = kitKey === 'advanced' ? '확장 구성 (숙련자 키트)' : '확장 옵션 (숙련자 키트 · 필요 시)';
    card.appendChild(deviceTierBlock(advTitle, advancedDevs, 'advanced'));

    return card;
  }

  function kitButton(key, activeKey) {
    var kit = D.kitLevels[key];
    return el('button', {
      class: 'choice-chip' + (key === activeKey ? ' selected' : ''),
      type: 'button',
      onclick: function () {
        // 자동 판정값과 같으면 override 해제
        state.meta.kitOverride = (key === defaultKitKey()) ? '' : key;
        render();
      }
    }, [kit.title]);
  }

  function deviceTierBlock(title, devs, tier) {
    var block = el('div', { class: 'kit-block' }, [
      el('div', { class: 'kit-block-title' }, [title, el('span', { class: 'kit-count' }, [' ' + devs.length + '종'])])
    ]);
    if (devs.length === 0) {
      block.appendChild(el('div', { class: 'kit-empty' }, ['해당 구성에 필요한 기기가 없습니다.']));
      return block;
    }
    var list = el('div', { class: 'device-list' }, []);
    devs.forEach(function (d) {
      var netCls = d.network === 'BLE' ? 'net-tag net-ble' : 'net-tag net-wifi';
      list.appendChild(el('div', { class: 'device-item' }, [
        el('div', { class: 'device-top' }, [
          el('span', { class: netCls }, [d.network]),
          el('span', { class: 'device-name' }, [d.name]),
          el('span', { class: 'device-count' }, [d.activities.length + '개 활동'])
        ]),
        el('div', { class: 'device-acts' }, [d.activities.join(' · ')])
      ]));
    });
    block.appendChild(list);
    return block;
  }

  function resetAll() {
    if (!window.confirm('현재 평가 내용을 모두 지우고 새 평가를 시작할까요? (저장된 내용도 삭제됩니다)')) return;
    state = blankState();
    openSpaces = {};
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    go('intro');
  }

  /* =========================================================
   * 개인·환경 반영 필터 — 권장 제어 인터페이스 도출
   * (강의록: 손 조작 가능 → 앱/리모컨, 못함 → 음성/자동화;
   *  대화 가능성·OS·Wi-Fi 반영)
   * =======================================================*/
  function computeControlRecommendation() {
    var p = state.personal, env = state.environment;
    var CI = D.controlInterfaces;
    var primary, reason;
    var needsWifi = false; // 이 권장안이 Wi-Fi 연결을 필요로 하는가 (스피커 등)

    if (p.handUse === 'operate') {
      primary = CI.remote + ' / ' + CI.touchscreen;
      reason = '손으로 리모컨·스마트폰 조작이 가능하여 리모컨·스마트폰(앱) 기반 제어가 적합합니다.';
    } else if (p.handUse === 'fixed') {
      primary = CI.fixedRemote;
      reason = '기기를 고정한 상태에서 조작이 가능하여, 리모컨을 거치·고정하여 사용하는 방식을 권장합니다.';
    } else if (p.handUse === 'unable') {
      if (p.communication === 'good') {
        primary = CI.speaker;
        needsWifi = true;
        reason = '손 조작이 어려우나 대화가 가능하여 음성(스마트 스피커) 제어를 권장합니다. 스마트 스피커는 Wi-Fi 연결이 필요합니다.';
      } else if (p.communication === 'unclear') {
        primary = CI.aac;
        reason = '손 조작이 어렵고 발음이 부정확하여 음성 인식이 어려울 수 있습니다. AAC(보완대체의사소통) 앱을 설치하여 상징 기반으로 의사소통·제어하는 방식을 검토합니다.';
      } else if (p.communication === 'unable') {
        primary = CI.aac;
        reason = '손 조작과 발화가 모두 어려워 음성 제어가 적합하지 않습니다. AAC 앱 또는 스위치·센서 기반 대체 인터페이스를 검토합니다.';
      } else {
        primary = null;
        reason = '손 조작이 어렵습니다. 대화 가능 여부를 입력하면 음성(스마트 스피커) 또는 AAC 중 적합한 방식을 제안합니다.';
      }
    } else {
      primary = null;
      reason = '개인 능력(손의 기능적 사용)을 입력하면 권장 제어 인터페이스를 제안합니다.';
    }

    var platform = env.os ? (D.platformHint[env.os] || null) : null;
    var wifiWarning = env.wifi === 'no';
    // 스피커(음성)를 권장했는데 Wi-Fi가 없으면 사용 불가
    var speakerBlocked = needsWifi && env.wifi === 'no';

    return {
      primary: primary, reason: reason, platform: platform,
      wifiWarning: wifiWarning, needsWifi: needsWifi, speakerBlocked: speakerBlocked
    };
  }

  /* ---------- 렌더 디스패치 ---------- */
  function render() {
    saveState();
    renderStepbar();
    document.body.classList.toggle('splash-mode', state.screen === 'splash');
    if (state.screen === 'splash') renderSplash();
    else if (state.screen === 'intro') renderIntro();
    else if (state.screen === 'spaces') renderSpacesHub();
    else if (state.screen === 'spaceEval') renderSpaceEval();
    else if (state.screen === 'personal') renderPersonalWizard();
    else if (state.screen === 'result') renderResult();
    else if (state.screen === 'more') renderMore();
    else if (state.screen === 'records') renderRecords();
    // 구버전 저장 화면 안전 폴백
    else if (state.screen === 'screening' || state.screen === 'needs' || state.screen === 'performance') renderSpacesHub();
    else renderSpacesHub();
    renderBottomNav();
    // 화면 전환 페이드 애니메이션 (D)
    if (state.screen !== 'splash') {
      app.classList.remove('anim-in');
      void app.offsetWidth; // 리플로우로 애니메이션 재시작
      app.classList.add('anim-in');
    }
  }

  // 시작 시 저장된 평가 복원 (있으면 데이터 유지, 화면은 항상 스플래시부터)
  loadSavedState();
  state.screen = 'splash';
  render();
})();
