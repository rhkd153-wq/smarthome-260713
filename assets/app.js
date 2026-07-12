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

  // 앱 상태 (평가 결과 저장소)
  function blankState() {
    return {
      screen: 'intro',
      meta: { org: '', staff: '', contact: '', needs: '', date: '',
              goal: '', budget: '', scenario: '', kitOverride: '' },
      currentActivity: {},   // { itemId: 'self' | 'assisted' | 'none' }
      personal: {},          // { fieldId: value }  (controlPanel 은 배열)
      environment: {},
      performance: {}        // { 'spaceId::taskId::activityId': 0|1|2|3 }
    };
  }
  var state = blankState();

  /* ---------- 지속성 (자동 저장 / 불러오기) ---------- */
  var SAVE_KEY = 'smarthome_solution_state_v1';

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
      Object.keys(state.personal).length > 0 ||
      Object.keys(state.environment).length > 0 ||
      Object.keys(state.performance).length > 0 ||
      (state.meta.org || state.meta.needs);
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
    { id: 'screening', label: '기초 스크리닝' },
    { id: 'performance', label: '공간별 수행도' },
    { id: 'result', label: '솔루션 제안' }
  ];

  var app = document.getElementById('app');
  var stepbar = document.getElementById('stepbar');
  var actionbar = document.getElementById('actionbar');

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

  /* ---------- 진행바 ---------- */
  function renderStepbar() {
    stepbar.innerHTML = '';
    var currentIdx = STEPS.map(function (s) { return s.id; }).indexOf(state.screen);
    STEPS.forEach(function (s, i) {
      var cls = 'step' + (i === currentIdx ? ' active' : '') + (i < currentIdx ? ' done' : '');
      stepbar.appendChild(el('div', { class: cls }, [(i + 1) + '. ' + s.label]));
    });
  }

  /* ---------- 하단 액션바 ---------- */
  function renderActions(buttons) {
    actionbar.innerHTML = '';
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
      el('p', { class: 'section-guide' }, ['입력하면 솔루션 제안서 상단에 표시됩니다.']),
      el('div', { class: 'meta-grid' }, [
        textField('의뢰 기관', m.org, function (v) { m.org = v; }),
        textField('담당자', m.staff, function (v) { m.staff = v; }),
        textField('담당자 연락처', m.contact, function (v) { m.contact = v; })
      ]),
      el('div', { class: 'field', style: 'margin-top:14px' }, [
        el('label', { class: 'field-label' }, ['대상자의 주요구 (스마트 홈을 의뢰하는 이유, 기대사항)']),
        el('textarea', {
          placeholder: '예) 혼자서 현관문을 열고 닫고 싶다, 밤에 안전하게 이동하고 싶다 등',
          oninput: function (e) { m.needs = e.target.value; }
        }, [m.needs || ''])
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
          onclick: function () { go('screening'); }
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
      { label: '평가 시작 →', variant: 'btn-primary', onClick: function () { go('screening'); } }
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
   * 화면 1 : 기초 스크리닝 (양식지 1)
   *   - 현재 활동 수준을 "가장 먼저" 배치
   * =======================================================*/
  function renderScreening() {
    var container = el('div', {}, []);
    container.appendChild(el('div', {}, [
      el('h1', { class: 'page-title' }, ['1. 기초 스크리닝']),
      el('p', { class: 'page-sub' }, ['가장 먼저 현재 활동 수준을 확인한 뒤, 개인 능력과 환경을 파악합니다.'])
    ]));

    /* (1) 현재 활동 수준 — 최우선 */
    var ca = D.currentActivityLevel;
    var caCard = el('div', { class: 'card' }, [
      el('h2', {}, ['① ' + ca.title]),
      el('p', { class: 'section-guide' }, [ca.guide])
    ]);
    var matrix = el('div', { class: 'matrix' }, []);
    ca.items.forEach(function (item) {
      var row = el('div', { class: 'matrix-row' }, [
        el('div', { class: 'row-label' }, [item.label]),
        choiceGroup(ca.options, state.currentActivity[item.id], function (v) {
          state.currentActivity[item.id] = v;
          render();
        })
      ]);
      matrix.appendChild(row);
    });
    caCard.appendChild(matrix);
    container.appendChild(caCard);

    /* (2) 개인 능력 + (3) 환경 평가 */
    container.appendChild(renderFieldCard('② ' + D.personalAbility.title, D.personalAbility, state.personal));
    container.appendChild(renderFieldCard('③ ' + D.environment.title, D.environment, state.environment));

    app.innerHTML = '';
    app.appendChild(container);

    renderActions([
      { label: '← 이전', variant: 'btn-ghost', align: 'left', onClick: function () { go('intro'); } },
      { label: '공간별 수행도 →', variant: 'btn-primary', onClick: function () { go('performance'); } }
    ]);
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
  function renderPerformance() {
    var container = el('div', {}, [
      el('h1', { class: 'page-title' }, ['2. 공간별 작업수행도']),
      el('p', { class: 'page-sub' }, [D.performanceScale.guide])
    ]);

    D.spaces.forEach(function (space, si) {
      if (openSpaces[space.id] === undefined) openSpaces[space.id] = (si === 0);
      var ratedCount = countRatedInSpace(space);
      var block = el('div', { class: 'space-block' }, []);
      var head = el('button', {
        class: 'space-head', type: 'button',
        onclick: function () { openSpaces[space.id] = !openSpaces[space.id]; render(); }
      }, [
        el('span', {}, [(openSpaces[space.id] ? '▾ ' : '▸ ') + space.label]),
        el('span', { class: 'count' }, [ratedCount > 0 ? ('제한 활동 ' + ratedCount + '개' ) : '미평가'])
      ]);
      block.appendChild(head);

      var body = el('div', { class: 'space-body' + (openSpaces[space.id] ? ' open' : '') }, []);
      space.tasks.forEach(function (task) {
        body.appendChild(el('div', { class: 'task-label' }, ['· ' + task.label]));
        var matrix = el('div', { class: 'matrix' }, []);
        task.activities.forEach(function (act) {
          var key = perfKey(space.id, task.id, act.id);
          var row = el('div', { class: 'matrix-row' }, [
            el('div', { class: 'row-label' }, [act.label]),
            choiceGroup(
              D.performanceScale.options.map(function (o) { return { value: o.value, label: o.short }; }),
              state.performance[key],
              function (v) {
                state.performance[key] = (state.performance[key] === v) ? undefined : v;
                render();
              }
            )
          ]);
          matrix.appendChild(row);
        });
        body.appendChild(matrix);
      });
      block.appendChild(body);
      container.appendChild(block);
    });

    // 척도 안내
    container.appendChild(el('div', { class: 'note' }, [
      el('strong', {}, ['수행 정도 기준']), ' — ',
      '미경험(경험 없음, 체크 안 함) · 1(못함/안함) · 2(도움받아 함) · 3(독립적으로 수행함). ',
      el('br', {}, []),
      '1 또는 2 로 평가된 활동이 스마트 홈 솔루션 추천 대상이 됩니다.'
    ]));

    app.innerHTML = '';
    app.appendChild(container);

    var limited = collectLimitedActivities();
    renderActions([
      { label: '← 이전', variant: 'btn-ghost', align: 'left', onClick: function () { go('screening'); } },
      {
        label: '솔루션 도출 (' + limited.length + ') →',
        variant: 'btn-primary',
        disabled: limited.length === 0,
        onClick: function () { go('result'); }
      }
    ]);
  }

  function countRatedInSpace(space) {
    var n = 0;
    space.tasks.forEach(function (task) {
      task.activities.forEach(function (act) {
        var v = state.performance[perfKey(space.id, task.id, act.id)];
        if (v === 1 || v === 2) n++;
      });
    });
    return n;
  }

  /* 제한되는 활동(수행도 1 또는 2) 수집 */
  function collectLimitedActivities() {
    var out = [];
    D.spaces.forEach(function (space) {
      space.tasks.forEach(function (task) {
        task.activities.forEach(function (act) {
          var v = state.performance[perfKey(space.id, task.id, act.id)];
          if (v === 1 || v === 2) {
            out.push({ space: space, task: task, activity: act, level: v });
          }
        });
      });
    });
    return out;
  }

  /* =========================================================
   * 화면 3 : 솔루션 제안서 (양식지 3)
   * =======================================================*/
  function renderResult() {
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
      m.staff ? el('div', { class: 'report-meta' }, ['담당자: ', el('b', {}, [m.staff]), m.contact ? (' (' + m.contact + ')') : '']) : null,
      m.needs ? el('div', { class: 'note', style: 'margin-top:12px' }, [el('strong', {}, ['주요구: ']), m.needs]) : null
    ]);
    container.appendChild(headCard);

    /* --- 대상자 정보 요약표 (기초 스크리닝 반영) --- */
    container.appendChild(renderProfileCard());

    /* --- 권장 제어 인터페이스 (개인·환경 필터) --- */
    var recCard = el('div', { class: 'card' }, [el('h3', {}, ['권장 제어 인터페이스'])]);
    if (rec.primary) {
      recCard.appendChild(el('div', { class: 'rec-primary' }, [rec.primary]));
    }
    recCard.appendChild(el('p', { class: 'section-guide', style: 'margin-top:6px' }, [rec.reason]));
    if (rec.platform) {
      recCard.appendChild(el('div', { class: 'report-meta' }, ['권장 플랫폼: ', el('b', {}, [rec.platform])]));
    }
    if (rec.wifiWarning) {
      recCard.appendChild(el('div', { class: 'note', style: 'margin-top:10px' }, [
        el('strong', {}, ['Wi-Fi 미보유: ']),
        'Wi-Fi 기반 기기는 네트워크 구축이 선행되어야 합니다. 그 전까지는 BLE(스위치 로봇 등) 대안을 우선 적용하세요. ' +
        '아래 목록에서 Wi-Fi 옵션은 "구축 필요"로 표시됩니다.'
      ]));
    }
    container.appendChild(recCard);

    /* --- 요약 통계 --- */
    var wifiCount = 0, bleCount = 0;
    limited.forEach(function (r) {
      r.activity.tech.forEach(function (t) {
        if (t.network === 'Wi-Fi') wifiCount++; else if (t.network === 'BLE') bleCount++;
      });
    });
    container.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'result-summary' }, [
        stat(limited.length, '제한 활동'),
        stat(countSolutionSpaces(limited), '대상 공간'),
        stat(wifiCount, 'Wi-Fi 옵션'),
        stat(bleCount, 'BLE 옵션')
      ])
    ]));

    /* --- 솔루션 본문 (공간별) --- */
    var body = el('div', { class: 'card' }, [el('h3', {}, ['공간별 적정 스마트 홈 기술'])]);
    if (limited.length === 0) {
      body.appendChild(el('div', { class: 'empty-state' }, [
        '제한되는 활동(수행도 1·2)이 없습니다. 공간별 수행도를 다시 확인하세요.'
      ]));
    } else {
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
    container.appendChild(body);

    /* --- 키트 구성 + 통합 기기 목록 --- */
    if (limited.length > 0) container.appendChild(renderKitCard(limited, rec));

    /* --- 중재 계획 및 유의사항 (처리 과정 반영) --- */
    container.appendChild(renderInterventionCard());

    /* --- 근거 출처 (인쇄 시에도 표기) --- */
    container.appendChild(el('div', { class: 'report-source' }, [
      '근거: 스마트 홈 가정 환경 수정 프로그램 매뉴얼 (문광태 외, 보건복지부 2023) · 부천대학교 작업치료학과'
    ]));

    app.innerHTML = '';
    app.appendChild(container);

    // 숨은 파일 입력 (결과 화면에서도 불러오기 가능)
    app.appendChild(el('input', {
      type: 'file', accept: 'application/json,.json', id: 'import-file-result',
      style: 'display:none',
      onchange: function (e) { if (e.target.files[0]) importJSON(e.target.files[0]); }
    }, []));

    renderActions([
      { label: '← 이전', variant: 'btn-ghost', align: 'left', onClick: function () { go('performance'); } },
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
    add('나이', p.age ? (p.age + '세') : '');
    add('장애 유형', p.disabilityType);
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
      el('div', { class: 'sol-head' }, [
        el('div', {}, [
          el('div', { class: 'sol-activity' }, [r.activity.label]),
          el('div', { class: 'sol-task' }, [r.task.label])
        ]),
        levelBadge
      ]),
      techList
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

    if (p.handUse === 'operate') {
      primary = CI.touchscreen + ' / ' + CI.remote;
      reason = '손으로 리모컨·스마트폰 조작이 가능하여 앱/리모컨 기반 제어가 적합합니다.';
    } else if (p.handUse === 'fixed') {
      primary = CI.bigswitch + ' / 거치형 ' + CI.remote;
      reason = '고정된 조건에서 조작이 가능하여 큰 스위치·거치형 리모컨을 우선 검토합니다.';
    } else if (p.handUse === 'unable') {
      if (p.communication === 'good') {
        primary = CI.speaker;
        reason = '손 조작이 어려우나 대화가 가능하여 음성(스마트 스피커) 제어가 적합합니다.';
      } else if (p.communication === 'unclear') {
        primary = CI.speaker + ' + ' + CI.automation;
        reason = '음성 사용은 가능하나 발음 부정확으로 인식률 확인이 필요하여, 자동화 시나리오를 병행합니다.';
      } else if (p.communication === 'unable') {
        primary = CI.automation;
        reason = '손 조작·음성 사용이 모두 어려워 센서 기반 자동화 시나리오를 우선합니다.';
      } else {
        primary = CI.automation;
        reason = '손 조작이 어려워 자동화·음성 등 대체 인터페이스가 필요합니다. 대화 가능 여부를 입력하면 더 정밀해집니다.';
      }
    } else {
      primary = null;
      reason = '개인 능력(손의 기능적 사용)을 입력하면 권장 제어 인터페이스를 제안합니다.';
    }

    var platform = env.os ? (D.platformHint[env.os] || null) : null;
    var wifiWarning = env.wifi === 'no';

    return { primary: primary, reason: reason, platform: platform, wifiWarning: wifiWarning };
  }

  /* ---------- 렌더 디스패치 ---------- */
  function render() {
    saveState();
    renderStepbar();
    if (state.screen === 'intro') renderIntro();
    else if (state.screen === 'screening') renderScreening();
    else if (state.screen === 'performance') renderPerformance();
    else if (state.screen === 'result') renderResult();
  }

  // 시작 시 저장된 평가 복원 (있으면 이어서 진행)
  var restored = loadSavedState();
  if (restored) {
    // 저장된 화면이 유효하지 않으면 인트로로
    if (STEPS.map(function (s) { return s.id; }).indexOf(state.screen) === -1) {
      state.screen = 'intro';
    }
  }
  render();
})();
