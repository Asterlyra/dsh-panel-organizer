window.__ModuleLoader__.load({
  id: 'dsh-panel-organizer',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect } = React;

    const NS = 'panel-organizer';
    const STORAGE_KEY = 'dsh-panel-organizer:v1';
    const LOCKED_ID = 'plugins';
    const BUILTIN_IDS = ['plugins', 'dsh-market', 'schedules'];
    // While this attribute is on <html>, the rail shows every panel: the ones
    // the user hid come back through the scoped CSS rules, and the ones the
    // host keeps out of the rail (unpinned) are added as plain rail buttons.
    const EXPAND_ATTR = 'data-dsh-panels-expanded';
    // Set while the list folds: the rows that are about to disappear fade out
    // for a beat before the rail re-hides them, so collapsing reads as motion
    // rather than as a flicker.
    const COLLAPSE_ATTR = 'data-dsh-panels-collapsing';
    const COLLAPSE_GLYPH =
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13l5-5 5 5"/><path d="M7 19l5-5 5 5"/></svg>',
      );

    const DICT = {
      zh: {
        'nav': '面板整理',
        'title': '面板整理',
        'subtitle': '收起用不到的面板，左侧栏只留在用的那几个。左栏底部的「更多」用来临时展开全部面板，再点一次收起；改动即时生效，并保存在这台机器上。',
        'restoreAll': '全部显示',
        'groupBuiltin': '内置面板',
        'groupPlugin': '插件面板',
        'hideGroup': '收起整组',
        'showGroup': '展开整组',
        'lockedHint': '「插件」入口始终保留，不会被收起——它是找回其他面板的唯一入口。',
        'empty': '没有可整理的面板。',
        'conflict': '与其它面板同名，暂无法单独收起',
        'expandHint': '展开全部面板',
        'collapseHint': '收起面板',
      },
      en: {
        'nav': 'Panel Organizer',
        'title': 'Panel Organizer',
        'subtitle': 'Hide the panels you do not use so the sidebar keeps only what you need. The More button at the bottom of the rail expands the full list and folds it again; changes apply instantly and stay on this machine.',
        'restoreAll': 'Show all',
        'groupBuiltin': 'Built-in',
        'groupPlugin': 'Plugins',
        'hideGroup': 'Hide group',
        'showGroup': 'Show group',
        'lockedHint': 'The Plugins entry always stays visible — it is the only way back to the other panels.',
        'empty': 'Nothing to organize yet.',
        'conflict': 'shares a name with another panel, so it cannot be hidden separately',
        'expandHint': 'Show every panel',
        'collapseHint': 'Collapse the panel list',
      },
    };

    const CSS_TEXT = [
      '.dpo-page{display:flex;flex-direction:column;gap:14px;padding:2px 0 8px;color:var(--dsw-alias-label-primary)}',
      '.dpo-page-head{display:flex;align-items:flex-start;gap:16px;justify-content:space-between}',
      '.dpo-title{font-size:14px;font-weight:600;margin:0 0 4px}',
      '.dpo-desc{font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary);margin:0;max-width:52em}',
      '.dpo-reset{flex:0 0 auto;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;line-height:1;padding:7px 12px;border-radius:8px;cursor:pointer}',
      '.dpo-reset:hover{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l2)}',
      '.dpo-reset[disabled]{opacity:.45;cursor:default}',
      '.dpo-group{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-1)}',
      '.dpo-group-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px}',
      '.dpo-group-toggle{display:flex;align-items:center;gap:6px;border:0;background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;font-weight:600;cursor:pointer;padding:2px 0}',
      '.dpo-chev{display:inline-block;width:12px;text-align:center;color:var(--dsw-alias-label-secondary);transition:transform .15s}',
      '.dpo-chev-closed{transform:rotate(-90deg)}',
      '.dpo-count{color:var(--dsw-alias-label-secondary);font-weight:400}',
      '.dpo-link{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;padding:3px 6px;border-radius:6px}',
      '.dpo-link:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dpo-rows{list-style:none;margin:0;padding:0 6px 6px}',
      '.dpo-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 10px;border-radius:8px}',
      '.dpo-row:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dpo-name{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dpo-conflict{font-size:11px;color:var(--dsw-alias-state-warn-primary)}',
      '.dpo-extra-row{display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:36px;height:36px;min-height:36px;margin:0 auto;padding:0;border:0;border-radius:var(--dsw-radius-md, 8px);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;flex:none}',
      '.dpo-extra-row:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12));color:var(--dsw-alias-label-primary)}',
      '.dpo-extra-wide{width:100%;height:36px;min-height:36px;justify-content:flex-start;gap:8px;padding:7px 8px;margin:0 2px;color:var(--dsw-alias-label-secondary)}',
      '.dpo-extra-wide:hover{color:var(--dsw-alias-label-primary)}',
      '.dpo-extra-label{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '@keyframes dpo-glyph-in{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}',
      'html[' + EXPAND_ATTR + '] [class*="panelList"] button[aria-haspopup="menu"]{position:relative;color:var(--dsw-alias-brand-primary);transition:color .15s ease,background-color .15s ease}',
      'html[' + EXPAND_ATTR + '] [class*="panelList"] button[aria-haspopup="menu"]:after{animation:dpo-glyph-in 140ms ease}',
      'html[' + EXPAND_ATTR + '] [class*="panelList"] button[aria-haspopup="menu"]>svg{visibility:hidden}',
      'html[' + EXPAND_ATTR + '] [class*="panelList"] button[aria-haspopup="menu"]:after{content:"";position:absolute;inset:0;margin:auto;width:18px;height:18px;background-color:currentColor;-webkit-mask:url("' + COLLAPSE_GLYPH + '") center/18px 18px no-repeat;mask:url("' + COLLAPSE_GLYPH + '") center/18px 18px no-repeat}',
      '.dpo-switch{position:relative;flex:0 0 auto;width:34px;height:20px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:transparent;cursor:pointer;padding:0;transition:background .15s,border-color .15s}',
      '.dpo-switch.dpo-on{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.dpo-knob{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-secondary);transition:left .15s,background .15s}',
      '.dpo-switch.dpo-on .dpo-knob{left:16px;background:#fff}',
      '.dpo-hint{font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary);margin:0}',
      '.dpo-empty{font-size:12px;color:var(--dsw-alias-label-secondary);padding:12px}',
    ].join('\n');

    function readSaved() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { hidden: [], collapsed: [] };
        const parsed = JSON.parse(raw);
        return {
          hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter((id) => typeof id === 'string') : [],
          collapsed: Array.isArray(parsed.collapsed) ? parsed.collapsed.filter((id) => typeof id === 'string') : [],
        };
      } catch (error) {
        return { hidden: [], collapsed: [] };
      }
    }

    function createStore() {
      const saved = readSaved();
      let state = {
        hidden: saved.hidden,
        collapsed: saved.collapsed,
        panels: [],
      };
      const listeners = new Set();
      const emit = (patch) => {
        state = Object.assign({}, state, patch);
        listeners.forEach((listener) => listener());
      };
      const persist = () => {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ hidden: state.hidden, collapsed: state.collapsed }));
        } catch (error) {
          /* storage unavailable: keep the in-memory state */
        }
      };
      return {
        getSnapshot: () => state,
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        bump() {
          emit({});
        },
        setPanels(panels) {
          const previous = state.panels;
          const same = panels.length === previous.length && panels.every((panel, index) => previous[index].id === panel.id && previous[index].label === panel.label);
          if (!same) emit({ panels });
        },
        setHidden(id, hidden) {
          if (id === LOCKED_ID) return;
          if (state.hidden.includes(id) === hidden) return;
          const next = hidden ? state.hidden.concat([id]) : state.hidden.filter((entry) => entry !== id);
          emit({ hidden: next });
          persist();
        },
        setManyHidden(ids, hidden) {
          const target = ids.filter((id) => id !== LOCKED_ID);
          const next = hidden
            ? state.hidden.concat(target.filter((id) => !state.hidden.includes(id)))
            : state.hidden.filter((id) => !target.includes(id));
          if (next.length === state.hidden.length) return;
          emit({ hidden: next });
          persist();
        },
        restoreAll() {
          if (!state.hidden.length) return;
          emit({ hidden: [] });
          persist();
        },
        toggleCollapsed(group) {
          const next = state.collapsed.includes(group) ? state.collapsed.filter((entry) => entry !== group) : state.collapsed.concat([group]);
          emit({ collapsed: next });
          persist();
        },
      };
    }

    // A panel label can be a plain string, a thunk (re-read on locale change) or
    // a per-locale object. Keep every spelling the shell may project into the
    // row's aria-label, so a hide rule still lands when the owner switches
    // between them; the id is the last-resort spelling.
    function labelCandidates(label, fallback) {
      const out = [];
      const push = (value) => {
        if (typeof value !== 'string') return;
        const text = value.trim();
        if (text && !out.includes(text)) out.push(text);
      };
      try {
        if (typeof label === 'function') push(label());
        else if (typeof label === 'string') push(label);
        else if (label && typeof label === 'object') Object.keys(label).forEach((key) => push(label[key]));
      } catch (error) {
        /* fall through to the id */
      }
      if (typeof fallback === 'string') push(fallback);
      return out;
    }

    function cssString(value) {
      return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
    }

    // The row list is owned by the sidebar shell and has no "hidden" flag, so a
    // rule may only address a panel by the aria-label the shell projects. A
    // label shared by two panels is ambiguous: hiding it would take both rows
    // out, so those panels are reported as un-manageable instead of guessed at.
    // Shipped panels are the ones the Harness itself contributes; everything
    // else came with an installed plugin. An id outside the known set is
    // grouped by its registrant when the shell exposes one, and otherwise
    // treated as a plugin panel — grouping is cosmetic, hiding works either way.
    const SHIPPED_REGISTRANTS = ['Gb'];

    function isShippedPanel(panel) {
      if (BUILTIN_IDS.includes(panel.id)) return true;
      if (SHIPPED_REGISTRANTS.includes(panel.provider)) return true;
      return panel.provider.startsWith('@deepseek-ai/');
    }

    function labelOwners(panels) {
      const owners = new Map();
      panels.forEach((panel) => {
        panel.labels.forEach((label) => {
          const list = owners.get(label);
          if (list) list.push(panel.id);
          else owners.set(label, [panel.id]);
        });
      });
      return owners;
    }

    function hiddenRules(panels, hidden) {
      const owners = labelOwners(panels);
      const rules = [];
      panels.forEach((panel) => {
        if (panel.id === LOCKED_ID || !hidden.includes(panel.id)) return;
        panel.labels.forEach((label) => {
          const list = owners.get(label) || [];
          if (list.length !== 1) return;
          rules.push('html:not([' + EXPAND_ATTR + ']) [class*="panelList"] [class*="panelRow"][aria-label="' + cssString(label) + '"]:not([aria-haspopup]){display:none!important}');
        });
      });
      return rules.join('\n');
    }

    function useStore(store) {
      const [snapshot, setSnapshot] = useState(store.getSnapshot);
      useEffect(() => store.subscribe(() => setSnapshot(store.getSnapshot())), [store]);
      return snapshot;
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const store = createStore();
        let bound = () => undefined;
        try {
          bound = ctx.locale.bind(NS);
        } catch (error) {
          bound = () => undefined;
        }

        const t = (key) => {
          try {
            const value = bound(key);
            if (typeof value === 'string' && value) return value;
          } catch (error) {
            /* fall back to the built-in dictionary */
          }
          const fallback = DICT.zh[key];
          return typeof fallback === 'string' ? fallback : key;
        };

        ctx.effect(
          () =>
            ctx.locale.register(NS, {
              zh: DICT.zh,
              en: DICT.en,
            }),
          'panel-organizer: dictionaries',
        );

        ctx.effect(
          () =>
            ctx.locale.subscribe(() => {
              try {
                bound = ctx.locale.bind(NS);
              } catch (error) {
                /* keep the previous translator */
              }
              store.bump();
            }),
          'panel-organizer: locale',
        );

        // The rail's "More" launcher doubles as an expand/collapse toggle: it
        // flips a temporary view in which every panel is listed, the hidden
        // ones through the scoped CSS rules and the unpinned ones as buttons
        // we add ourselves (the host keeps those out of the rail entirely).
        const railElement = () => document.querySelector('[class*="panelList"]');
        const moreButton = () => {
          const rail = railElement();
          return rail ? rail.querySelector('button[aria-haspopup="menu"]') : null;
        };
        const expandedNow = () => document.documentElement.hasAttribute(EXPAND_ATTR);

        const hiddenLabelsOf = () => {
          const snapshot = store.getSnapshot();
          const labels = new Set();
          snapshot.panels.forEach((panel) => {
            if (!snapshot.hidden.includes(panel.id)) return;
            panel.labels.forEach((label) => labels.add(label));
          });
          return labels;
        };

        let collapseTimer = 0;


        // The launcher keeps its own icon until the list opens; from then on it
        // reads as a collapse control, with a matching tooltip and state.
        const syncToggleChrome = () => {
          const button = moreButton();
          if (!button) return;
          const open = expandedNow();
          button.title = t(open ? 'collapseHint' : 'expandHint');
          button.setAttribute('aria-expanded', open ? 'true' : 'false');
        };

        const layoutService = () => {
          try {
            const service = typeof ctx.get === 'function' ? ctx.get('layout') : null;
            if (service && typeof service.selectPanel === 'function') return service;
          } catch (error) {
            /* fall back to the bare property */
          }
          try {
            const direct = ctx.layout;
            if (direct && typeof direct.selectPanel === 'function') return direct;
          } catch (error) {
            /* no layout service in this composition */
          }
          return null;
        };

        const dropExtraRows = () => {
          const rail = railElement();
          if (!rail) return;
          const rows = rail.querySelectorAll('button[data-dpo-extra]');
          for (let index = 0; index < rows.length; index += 1) rows[index].remove();
        };

        const REVEAL_MS = 170;
        const REVEAL_STEP_MS = 9;

        const reduceMotion = () => {
          try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          } catch (error) {
            return false;
          }
        };

        const railRows = (rail) =>
          rail.querySelectorAll('button[class*="panelRow"]:not([aria-haspopup]), button.dpo-extra-row');

        const softReset = (node) => {
          node.style.transition = '';
          node.style.transitionDelay = '';
          node.style.height = '';
          node.style.minHeight = '';
          node.style.paddingTop = '';
          node.style.paddingBottom = '';
          node.style.opacity = '';
          node.style.overflow = '';
          node.style.marginTop = '';
          node.style.marginBottom = '';
        };

        const resetAllRows = () => {
          const rail = railElement();
          if (!rail) return;
          const rows = railRows(rail);
          for (let index = 0; index < rows.length; index += 1) softReset(rows[index]);
        };

        const railGap = () => {
          const rail = railElement();
          if (!rail) return 0;
          const gap = parseFloat(window.getComputedStyle(rail).rowGap);
          return Number.isFinite(gap) ? gap : 0;
        };

        const MOTION =
          'height ' + REVEAL_MS + 'ms cubic-bezier(.2,.8,.2,1), opacity 140ms ease, padding ' + REVEAL_MS + 'ms cubic-bezier(.2,.8,.2,1), margin ' + REVEAL_MS + 'ms cubic-bezier(.2,.8,.2,1)';

        // Rows animate their own box, so the list settles by itself: no fixed
        // container height, no snap when the layout shrinks or grows.
        const growRow = (node, delay) => {
          const target = node.getBoundingClientRect().height;
          if (!target) return;
          const computed = window.getComputedStyle(node);
          const paddingTop = computed.paddingTop;
          const paddingBottom = computed.paddingBottom;
          const marginTop = computed.marginTop;
          const marginBottom = computed.marginBottom;
          node.style.overflow = 'hidden';
          node.style.minHeight = '0px';
          node.style.height = '0px';
          node.style.paddingTop = '0px';
          node.style.paddingBottom = '0px';
          node.style.opacity = '0';
          void node.offsetHeight;
          node.style.transition = MOTION;
          node.style.transitionDelay = delay + 'ms';
          window.requestAnimationFrame(() => {
            node.style.height = target + 'px';
            node.style.paddingTop = paddingTop;
            node.style.paddingBottom = paddingBottom;
            node.style.marginTop = marginTop;
            node.style.marginBottom = marginBottom;
            node.style.opacity = '1';
          });
          window.setTimeout(() => softReset(node), delay + REVEAL_MS + 40);
        };

        const shrinkRow = (node, delay, gap) => {
          const height = node.getBoundingClientRect().height;
          if (!height) return;
          node.style.overflow = 'hidden';
          node.style.height = height + 'px';
          node.style.minHeight = '0px';
          void node.offsetHeight;
          node.style.transition = MOTION;
          node.style.transitionDelay = delay + 'ms';
          window.requestAnimationFrame(() => {
            node.style.height = '0px';
            node.style.paddingTop = '0px';
            node.style.paddingBottom = '0px';
            // Cancel the list gap as well, so the slot closes completely.
            node.style.marginTop = -Math.abs(gap) + 'px';
            node.style.marginBottom = '0px';
            node.style.opacity = '0';
          });
        };

        const syncExtraRows = () => {
          if (!expandedNow()) {
            dropExtraRows();
            syncToggleChrome();
            return;
          }
          const rail = railElement();
          const layout = layoutService();
          if (!rail || !layout) return;
          const present = new Set();
          const labelled = rail.querySelectorAll('[aria-label]');
          for (let index = 0; index < labelled.length; index += 1) {
            present.add(labelled[index].getAttribute('aria-label'));
          }
          const wide = rail.querySelector('[class*="panelTitle"]') !== null;
          const glyph =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="2.6"/></svg>';
          const { panels } = store.getSnapshot();
          panels.forEach((panel) => {
            if (panel.id === LOCKED_ID) return;
            if (panel.labels.some((label) => present.has(label))) return;
            const row = document.createElement('button');
            row.type = 'button';
            row.className = wide ? 'dpo-extra-row dpo-extra-wide' : 'dpo-extra-row';
            row.setAttribute('data-dpo-extra', panel.id);
            row.setAttribute('aria-label', panel.label);
            row.title = panel.label;
            row.innerHTML = glyph;
            if (wide) {
              const text = document.createElement('span');
              text.className = 'dpo-extra-label';
              text.textContent = panel.label;
              row.appendChild(text);
            }
            row.addEventListener('click', () => {
              try {
                layout.selectPanel(panel.id);
              } catch (error) {
                /* the panel may have gone away meanwhile */
              }
            });
            const more = rail.querySelector('button[aria-haspopup="menu"]');
            if (more) rail.insertBefore(row, more);
            else rail.appendChild(row);
          });
          syncToggleChrome();
        };

        const setExpanded = (next) => {
          const root = document.documentElement;
          const rail = railElement();
          window.clearTimeout(collapseTimer);
          if (next) {
            if (expandedNow()) return;
            const wasHidden = hiddenLabelsOf();
            resetAllRows();
            root.removeAttribute(COLLAPSE_ATTR);
            root.setAttribute(EXPAND_ATTR, '');
            syncExtraRows();
            if (rail && !reduceMotion()) {
              const rows = railRows(rail);
              let grown = 0;
              for (let index = 0; index < rows.length; index += 1) {
                const row = rows[index];
                const fresh = row.hasAttribute('data-dpo-extra') || wasHidden.has(row.getAttribute('aria-label'));
                if (!fresh) continue;
                growRow(row, grown * REVEAL_STEP_MS);
                grown += 1;
              }
            }
            syncToggleChrome();
            return;
          }
          if (!expandedNow()) return;
          const hiddenLabels = hiddenLabelsOf();
          let fading = 0;
          let lastDelay = 0;
          if (rail) {
            const rows = railRows(rail);
            for (let index = 0; index < rows.length; index += 1) {
              const row = rows[index];
              if (!row.hasAttribute('data-dpo-extra') && !hiddenLabels.has(row.getAttribute('aria-label'))) continue;
              const delay = reduceMotion() ? 0 : fading * REVEAL_STEP_MS;
              lastDelay = delay;
              if (reduceMotion()) {
                row.style.height = '0px';
                row.style.opacity = '0';
              } else {
                shrinkRow(row, delay, railGap());
              }
              fading += 1;
            }
          }
          root.setAttribute(COLLAPSE_ATTR, '');
          syncToggleChrome();
          collapseTimer = window.setTimeout(() => {
            root.removeAttribute(EXPAND_ATTR);
            root.removeAttribute(COLLAPSE_ATTR);
            dropExtraRows();
            resetAllRows();
            syncToggleChrome();
          }, lastDelay + REVEAL_MS + 20);
        };

        const onDocumentClick = (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const row = target.closest('button[class*="panelRow"]');
          if (!row || !row.closest('[class*="panelList"]')) return;
          if (!row.hasAttribute('aria-haspopup')) return;
          // Shift/Alt/Cmd-click keeps the official menu reachable
          // ("browse more plugins", "create your plugin").
          if (event.shiftKey || event.altKey || event.metaKey) return;
          event.preventDefault();
          event.stopPropagation();
          setExpanded(!expandedNow());
        };

        ctx.effect(
          () => {
            document.addEventListener('click', onDocumentClick, true);
            syncToggleChrome();
            const late = window.setTimeout(syncToggleChrome, 400);
            return () => {
              window.clearTimeout(late);
              document.removeEventListener('click', onDocumentClick, true);
              window.clearTimeout(collapseTimer);
              document.documentElement.removeAttribute(EXPAND_ATTR);
              document.documentElement.removeAttribute(COLLAPSE_ATTR);
              dropExtraRows();
              resetAllRows();
            };
          },
          'panel-organizer: expand toggle',
        );
        syncExtraRows();
        const syncPanels = () => {
          let entries;
          try {
            entries = ctx.slots.entriesOfSlot('sidebar.panellist');
          } catch (error) {
            // Keep the last known list: dropping every rule would flash the
            // hidden rows back into the rail for no good reason.
            return;
          }
          if (!Array.isArray(entries)) return;
          const panels = entries
            .filter((entry) => entry && entry.options && typeof entry.options.id === 'string')
            .map(({ options, registrant, locale }) => {
              const labels = labelCandidates(options.label, options.id);
              return {
                id: options.id,
                order: typeof options.order === 'number' ? options.order : 0,
                label: labels[0] || options.id,
                labels,
                provider: typeof registrant === 'string' ? registrant : '',
                locale: typeof locale === 'string' ? locale : '',
              };
            })
            .sort((a, b) => a.order - b.order);
          store.setPanels(panels);
          syncExtraRows();
        };

        ctx.effect(() => ctx.slots.subscribe('sidebar.panellist', syncPanels), 'panel-organizer: panels');
        syncPanels();

        // Always-mounted, invisible: the <style> that hides the chosen rows.
        function HiddenStyle() {
          const snapshot = useStore(store);
          return h('style', { 'data-plugin': NS }, CSS_TEXT + '\n' + hiddenRules(snapshot.panels, snapshot.hidden));
        }

        function SettingsPage() {
          const snapshot = useStore(store);
          const visiblePanels = snapshot.panels.filter((panel) => panel.id !== LOCKED_ID);
          const owners = labelOwners(snapshot.panels);
          const targetable = (panel) => panel.labels.some((label) => (owners.get(label) || []).length === 1);
          const hiddenCount = visiblePanels.filter((panel) => snapshot.hidden.includes(panel.id)).length;
          const groups = [
            { key: 'builtin', title: t('groupBuiltin'), items: visiblePanels.filter((panel) => isShippedPanel(panel)) },
            { key: 'plugin', title: t('groupPlugin'), items: visiblePanels.filter((panel) => !isShippedPanel(panel)) },
          ].filter((group) => group.items.length > 0);

          return h(
            'div',
            { className: 'dpo-page' },
            h(
              'div',
              { className: 'dpo-page-head' },
              h(
                'div',
                null,
                h('div', { className: 'dpo-title' }, t('title')),
                h('p', { className: 'dpo-desc' }, t('subtitle')),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dpo-reset',
                  disabled: hiddenCount === 0,
                  onClick: () => store.restoreAll(),
                },
                t('restoreAll'),
              ),
            ),
            groups.length === 0
              ? h('div', { className: 'dpo-empty' }, t('empty'))
              : groups.map((group) => {
                  const collapsed = snapshot.collapsed.includes(group.key);
                  const hidable = group.items.filter(targetable);
                  const everyHidden = hidable.length > 0 && hidable.every((panel) => snapshot.hidden.includes(panel.id));
                  return h(
                    'section',
                    { className: 'dpo-group', key: group.key },
                    h(
                      'div',
                      { className: 'dpo-group-head' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dpo-group-toggle',
                          'aria-expanded': !collapsed,
                          onClick: () => store.toggleCollapsed(group.key),
                        },
                        h('span', { className: 'dpo-chev' + (collapsed ? ' dpo-chev-closed' : '') }, '\u25be'),
                        h('span', null, group.title),
                        h('span', { className: 'dpo-count' }, String(group.items.length)),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dpo-link',
                          disabled: hidable.length === 0,
                          onClick: () =>
                            store.setManyHidden(
                              hidable.map((panel) => panel.id),
                              !everyHidden,
                            ),
                        },
                        everyHidden ? t('showGroup') : t('hideGroup'),
                      ),
                    ),
                    collapsed
                      ? null
                      : h(
                          'ul',
                          { className: 'dpo-rows' },
                          group.items.map((panel) => {
                            const shown = !snapshot.hidden.includes(panel.id);
                            const canHide = targetable(panel);
                            return h(
                              'li',
                              { className: 'dpo-row', key: panel.id },
                              h(
                                'span',
                                { className: 'dpo-name', title: panel.label },
                                panel.label,
                                canHide ? null : h('span', { className: 'dpo-conflict' }, ' · ' + t('conflict')),
                              ),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  role: 'switch',
                                  'aria-checked': shown,
                                  'aria-label': panel.label,
                                  title: canHide ? undefined : t('conflict'),
                                  disabled: !canHide,
                                  className: 'dpo-switch' + (shown ? ' dpo-on' : ''),
                                  onClick: canHide ? () => store.setHidden(panel.id, shown) : undefined,
                                },
                                h('span', { className: 'dpo-knob' }),
                              ),
                            );
                          }),
                        ),
                  );
                }),
            h('p', { className: 'dpo-hint' }, t('lockedHint')),
          );
        }

        // Registers one entry so the rail keeps its "More" launcher even when
        // no other plugin supplies menu rows. The launcher itself is our
        // expand/collapse toggle now, so it renders nothing.
        function MoreAnchor() {
          return null;
        }

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            {
              name: 'shell.overlay',
              id: NS + ':style',
              order: 200,
            },
            HiddenStyle,
          ),
        );

        ctx.slots.inject('settings.plugins.tab', () =>
          ctx.slots.register(
            {
              name: 'settings.plugins.tab',
              id: NS,
              order: 30,
              locale: NS,
              label: () => t('nav'),
            },
            SettingsPage,
          ),
        );

        ctx.slots.inject('sidebar.panellist.actions', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist.actions',
              id: NS + ':hidden',
              order: -10,
            },
            MoreAnchor,
          ),
        );
      },
    };
  },
});
