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
  var state = {
    screen: 'intro',
    meta: { org: '', staff: '', contact: '', needs: '' },
    currentActivity: {},   // { itemId: 'self' | 'assisted' | 'none' }
    personal: {},          // { fieldId: value }  (controlPanel 은 배열)
    environment: {},
    performance: {}        // { 'spaceId::taskId::activityId': 0|1|2|3 }
  };

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

    app.innerHTML = '';
    app.appendChild(el('div', { class: 'card' }, [hero, steps]));
    app.appendChild(metaCard);

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
    var container = el('div', {}, []);

    // 헤더 / 의뢰 정보
    var m = state.meta;
    var headCard = el('div', { class: 'card' }, [
      el('h1', { class: 'page-title' }, ['스마트 홈 솔루션 제안서']),
      m.org ? el('div', { class: 'report-meta' }, ['의뢰 기관: ', el('b', {}, [m.org])]) : null,
      m.staff ? el('div', { class: 'report-meta' }, ['담당자: ', el('b', {}, [m.staff]), m.contact ? (' (' + m.contact + ')') : '']) : null,
      state.personal.name ? el('div', { class: 'report-meta' }, ['대상자: ', el('b', {}, [state.personal.name]),
        state.personal.age ? (' · ' + state.personal.age + '세') : '']) : null,
      m.needs ? el('div', { class: 'note', style: 'margin-top:12px' }, [el('strong', {}, ['주요구: ']), m.needs]) : null
    ]);
    container.appendChild(headCard);

    // 요약 통계
    var wifiCount = 0, bleCount = 0;
    limited.forEach(function (r) {
      r.activity.tech.forEach(function (t) {
        if (t.network === 'Wi-Fi') wifiCount++; else if (t.network === 'BLE') bleCount++;
      });
    });
    var summaryCard = el('div', { class: 'card' }, [
      el('div', { class: 'result-summary' }, [
        stat(limited.length, '제한 활동'),
        stat(countSolutionSpaces(limited), '대상 공간'),
        stat(wifiCount, 'Wi-Fi 옵션'),
        stat(bleCount, 'BLE 옵션')
      ])
    ]);
    container.appendChild(summaryCard);

    // Wi-Fi 없음 경고 (환경 평가 반영)
    if (state.environment.wifi === 'no' && wifiCount > 0) {
      container.appendChild(el('div', { class: 'card' }, [
        el('div', { class: 'note' }, [
          el('strong', {}, ['환경 확인 필요: ']),
          'Wi-Fi가 "없음"으로 평가되었습니다. Wi-Fi 기반 기기를 적용하려면 네트워크 구축이 선행되어야 하며, ' +
          '그 전까지는 BLE(스위치 로봇 등) 기반 대안을 우선 검토하세요.'
        ])
      ]));
    }

    // 솔루션 본문
    var body = el('div', { class: 'card' }, []);
    if (limited.length === 0) {
      body.appendChild(el('div', { class: 'empty-state' }, [
        '제한되는 활동(수행도 1·2)이 없습니다. 공간별 수행도를 다시 확인하세요.'
      ]));
    } else {
      // 공간별 그룹핑
      D.spaces.forEach(function (space) {
        var rows = limited.filter(function (r) { return r.space.id === space.id; });
        if (rows.length === 0) return;
        var block = el('div', { class: 'solution-space' }, [
          el('div', { class: 'sp-title' }, [space.label + ' (' + rows.length + ')'])
        ]);
        rows.forEach(function (r) {
          block.appendChild(renderSolutionItem(r));
        });
        body.appendChild(block);
      });
    }
    container.appendChild(body);

    app.innerHTML = '';
    app.appendChild(container);

    renderActions([
      { label: '← 이전', variant: 'btn-ghost', align: 'left', onClick: function () { go('performance'); } },
      { label: '인쇄 / PDF 저장', variant: '', onClick: function () { window.print(); } },
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

  function renderSolutionItem(r) {
    var levelBadge = r.level === 1
      ? el('span', { class: 'badge badge-limited-1' }, ['수행도 1 · 못함/안함'])
      : el('span', { class: 'badge badge-limited-2' }, ['수행도 2 · 도움받아 함']);

    var techList = el('div', { class: 'tech-list' }, r.activity.tech.map(function (t) {
      var netCls = t.network === 'BLE' ? 'net-tag net-ble' : 'net-tag net-wifi';
      return el('div', { class: 'tech-opt' }, [
        el('span', { class: netCls }, [t.network]),
        el('span', { class: 'devices' }, [t.devices.join(', ')])
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

  function resetAll() {
    if (!window.confirm('현재 평가 내용을 모두 지우고 새 평가를 시작할까요?')) return;
    state.meta = { org: '', staff: '', contact: '', needs: '' };
    state.currentActivity = {};
    state.personal = {};
    state.environment = {};
    state.performance = {};
    openSpaces = {};
    go('intro');
  }

  /* ---------- 렌더 디스패치 ---------- */
  function render() {
    renderStepbar();
    if (state.screen === 'intro') renderIntro();
    else if (state.screen === 'screening') renderScreening();
    else if (state.screen === 'performance') renderPerformance();
    else if (state.screen === 'result') renderResult();
  }

  render();
})();
