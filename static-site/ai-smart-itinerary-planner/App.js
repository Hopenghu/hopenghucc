import * as En from "react";
import mt, { useLayoutEffect as fo, useEffect as B, useRef as j, useMemo as W, useCallback as lt, useState as L, createContext as Lt, memo as Pl, useReducer as Rl, useContext as q, useId as $s, useInsertionEffect as po, Children as Ml, isValidElement as El, Fragment as mo, createElement as Vl, forwardRef as Nl, Component as kl } from "react";
import { unstable_batchedUpdates as ln, createPortal as Il } from "react-dom";
var _n = { exports: {} }, Ie = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ii;
function jl() {
  if (Ii) return Ie;
  Ii = 1;
  var t = Symbol.for("react.transitional.element"), e = Symbol.for("react.fragment");
  function n(s, i, r) {
    var o = null;
    if (r !== void 0 && (o = "" + r), i.key !== void 0 && (o = "" + i.key), "key" in i) {
      r = {};
      for (var a in i)
        a !== "key" && (r[a] = i[a]);
    } else r = i;
    return i = r.ref, {
      $$typeof: t,
      type: s,
      key: o,
      ref: i !== void 0 ? i : null,
      props: r
    };
  }
  return Ie.Fragment = e, Ie.jsx = n, Ie.jsxs = n, Ie;
}
var ji;
function Ll() {
  return ji || (ji = 1, _n.exports = jl()), _n.exports;
}
var p = Ll();
function Ol() {
  for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
    e[n] = arguments[n];
  return W(
    () => (s) => {
      e.forEach((i) => i(s));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    e
  );
}
const Vn = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u";
function De(t) {
  const e = Object.prototype.toString.call(t);
  return e === "[object Window]" || // In Electron context the Window object serializes to [object global]
  e === "[object global]";
}
function _s(t) {
  return "nodeType" in t;
}
function vt(t) {
  var e, n;
  return t ? De(t) ? t : _s(t) && (e = (n = t.ownerDocument) == null ? void 0 : n.defaultView) != null ? e : window : window;
}
function Us(t) {
  const {
    Document: e
  } = vt(t);
  return t instanceof e;
}
function Qe(t) {
  return De(t) ? !1 : t instanceof vt(t).HTMLElement;
}
function go(t) {
  return t instanceof vt(t).SVGElement;
}
function Ce(t) {
  return t ? De(t) ? t.document : _s(t) ? Us(t) ? t : Qe(t) || go(t) ? t.ownerDocument : document : document : document;
}
const Wt = Vn ? fo : B;
function zs(t) {
  const e = j(t);
  return Wt(() => {
    e.current = t;
  }), lt(function() {
    for (var n = arguments.length, s = new Array(n), i = 0; i < n; i++)
      s[i] = arguments[i];
    return e.current == null ? void 0 : e.current(...s);
  }, []);
}
function Fl() {
  const t = j(null), e = lt((s, i) => {
    t.current = setInterval(s, i);
  }, []), n = lt(() => {
    t.current !== null && (clearInterval(t.current), t.current = null);
  }, []);
  return [e, n];
}
function We(t, e) {
  e === void 0 && (e = [t]);
  const n = j(t);
  return Wt(() => {
    n.current !== t && (n.current = t);
  }, e), n;
}
function tn(t, e) {
  const n = j();
  return W(
    () => {
      const s = t(n.current);
      return n.current = s, s;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...e]
  );
}
function bn(t) {
  const e = zs(t), n = j(null), s = lt(
    (i) => {
      i !== n.current && e?.(i, n.current), n.current = i;
    },
    //eslint-disable-next-line
    []
  );
  return [n, s];
}
function fs(t) {
  const e = j();
  return B(() => {
    e.current = t;
  }, [t]), e.current;
}
let Un = {};
function en(t, e) {
  return W(() => {
    if (e)
      return e;
    const n = Un[t] == null ? 0 : Un[t] + 1;
    return Un[t] = n, t + "-" + n;
  }, [t, e]);
}
function yo(t) {
  return function(e) {
    for (var n = arguments.length, s = new Array(n > 1 ? n - 1 : 0), i = 1; i < n; i++)
      s[i - 1] = arguments[i];
    return s.reduce((r, o) => {
      const a = Object.entries(o);
      for (const [l, u] of a) {
        const c = r[l];
        c != null && (r[l] = c + t * u);
      }
      return r;
    }, {
      ...e
    });
  };
}
const be = /* @__PURE__ */ yo(1), Ke = /* @__PURE__ */ yo(-1);
function Bl(t) {
  return "clientX" in t && "clientY" in t;
}
function Ws(t) {
  if (!t)
    return !1;
  const {
    KeyboardEvent: e
  } = vt(t.target);
  return e && t instanceof e;
}
function $l(t) {
  if (!t)
    return !1;
  const {
    TouchEvent: e
  } = vt(t.target);
  return e && t instanceof e;
}
function ps(t) {
  if ($l(t)) {
    if (t.touches && t.touches.length) {
      const {
        clientX: e,
        clientY: n
      } = t.touches[0];
      return {
        x: e,
        y: n
      };
    } else if (t.changedTouches && t.changedTouches.length) {
      const {
        clientX: e,
        clientY: n
      } = t.changedTouches[0];
      return {
        x: e,
        y: n
      };
    }
  }
  return Bl(t) ? {
    x: t.clientX,
    y: t.clientY
  } : null;
}
const Ge = /* @__PURE__ */ Object.freeze({
  Translate: {
    toString(t) {
      if (!t)
        return;
      const {
        x: e,
        y: n
      } = t;
      return "translate3d(" + (e ? Math.round(e) : 0) + "px, " + (n ? Math.round(n) : 0) + "px, 0)";
    }
  },
  Scale: {
    toString(t) {
      if (!t)
        return;
      const {
        scaleX: e,
        scaleY: n
      } = t;
      return "scaleX(" + e + ") scaleY(" + n + ")";
    }
  },
  Transform: {
    toString(t) {
      if (t)
        return [Ge.Translate.toString(t), Ge.Scale.toString(t)].join(" ");
    }
  },
  Transition: {
    toString(t) {
      let {
        property: e,
        duration: n,
        easing: s
      } = t;
      return e + " " + n + "ms " + s;
    }
  }
}), Li = "a,frame,iframe,input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),*[tabindex]";
function _l(t) {
  return t.matches(Li) ? t : t.querySelector(Li);
}
const Ul = {
  display: "none"
};
function zl(t) {
  let {
    id: e,
    value: n
  } = t;
  return mt.createElement("div", {
    id: e,
    style: Ul
  }, n);
}
function Wl(t) {
  let {
    id: e,
    announcement: n,
    ariaLiveType: s = "assertive"
  } = t;
  const i = {
    position: "fixed",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    margin: -1,
    border: 0,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    clipPath: "inset(100%)",
    whiteSpace: "nowrap"
  };
  return mt.createElement("div", {
    id: e,
    style: i,
    role: "status",
    "aria-live": s,
    "aria-atomic": !0
  }, n);
}
function Kl() {
  const [t, e] = L("");
  return {
    announce: lt((s) => {
      s != null && e(s);
    }, []),
    announcement: t
  };
}
const vo = /* @__PURE__ */ Lt(null);
function Gl(t) {
  const e = q(vo);
  B(() => {
    if (!e)
      throw new Error("useDndMonitor must be used within a children of <DndContext>");
    return e(t);
  }, [t, e]);
}
function Hl() {
  const [t] = L(() => /* @__PURE__ */ new Set()), e = lt((s) => (t.add(s), () => t.delete(s)), [t]);
  return [lt((s) => {
    let {
      type: i,
      event: r
    } = s;
    t.forEach((o) => {
      var a;
      return (a = o[i]) == null ? void 0 : a.call(o, r);
    });
  }, [t]), e];
}
const Xl = {
  draggable: `
    To pick up a draggable item, press the space bar.
    While dragging, use the arrow keys to move the item.
    Press space again to drop the item in its new position, or press escape to cancel.
  `
}, Yl = {
  onDragStart(t) {
    let {
      active: e
    } = t;
    return "Picked up draggable item " + e.id + ".";
  },
  onDragOver(t) {
    let {
      active: e,
      over: n
    } = t;
    return n ? "Draggable item " + e.id + " was moved over droppable area " + n.id + "." : "Draggable item " + e.id + " is no longer over a droppable area.";
  },
  onDragEnd(t) {
    let {
      active: e,
      over: n
    } = t;
    return n ? "Draggable item " + e.id + " was dropped over droppable area " + n.id : "Draggable item " + e.id + " was dropped.";
  },
  onDragCancel(t) {
    let {
      active: e
    } = t;
    return "Dragging was cancelled. Draggable item " + e.id + " was dropped.";
  }
};
function ql(t) {
  let {
    announcements: e = Yl,
    container: n,
    hiddenTextDescribedById: s,
    screenReaderInstructions: i = Xl
  } = t;
  const {
    announce: r,
    announcement: o
  } = Kl(), a = en("DndLiveRegion"), [l, u] = L(!1);
  if (B(() => {
    u(!0);
  }, []), Gl(W(() => ({
    onDragStart(d) {
      let {
        active: h
      } = d;
      r(e.onDragStart({
        active: h
      }));
    },
    onDragMove(d) {
      let {
        active: h,
        over: f
      } = d;
      e.onDragMove && r(e.onDragMove({
        active: h,
        over: f
      }));
    },
    onDragOver(d) {
      let {
        active: h,
        over: f
      } = d;
      r(e.onDragOver({
        active: h,
        over: f
      }));
    },
    onDragEnd(d) {
      let {
        active: h,
        over: f
      } = d;
      r(e.onDragEnd({
        active: h,
        over: f
      }));
    },
    onDragCancel(d) {
      let {
        active: h,
        over: f
      } = d;
      r(e.onDragCancel({
        active: h,
        over: f
      }));
    }
  }), [r, e])), !l)
    return null;
  const c = mt.createElement(mt.Fragment, null, mt.createElement(zl, {
    id: s,
    value: i.draggable
  }), mt.createElement(Wl, {
    id: a,
    announcement: o
  }));
  return n ? Il(c, n) : c;
}
var it;
(function(t) {
  t.DragStart = "dragStart", t.DragMove = "dragMove", t.DragEnd = "dragEnd", t.DragCancel = "dragCancel", t.DragOver = "dragOver", t.RegisterDroppable = "registerDroppable", t.SetDroppableDisabled = "setDroppableDisabled", t.UnregisterDroppable = "unregisterDroppable";
})(it || (it = {}));
function wn() {
}
function Oi(t, e) {
  return W(
    () => ({
      sensor: t,
      options: e ?? {}
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, e]
  );
}
function Jl() {
  for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
    e[n] = arguments[n];
  return W(
    () => [...e].filter((s) => s != null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...e]
  );
}
const jt = /* @__PURE__ */ Object.freeze({
  x: 0,
  y: 0
});
function xo(t, e) {
  return Math.sqrt(Math.pow(t.x - e.x, 2) + Math.pow(t.y - e.y, 2));
}
function bo(t, e) {
  let {
    data: {
      value: n
    }
  } = t, {
    data: {
      value: s
    }
  } = e;
  return n - s;
}
function Zl(t, e) {
  let {
    data: {
      value: n
    }
  } = t, {
    data: {
      value: s
    }
  } = e;
  return s - n;
}
function Fi(t) {
  let {
    left: e,
    top: n,
    height: s,
    width: i
  } = t;
  return [{
    x: e,
    y: n
  }, {
    x: e + i,
    y: n
  }, {
    x: e,
    y: n + s
  }, {
    x: e + i,
    y: n + s
  }];
}
function wo(t, e) {
  if (!t || t.length === 0)
    return null;
  const [n] = t;
  return n[e];
}
function Bi(t, e, n) {
  return e === void 0 && (e = t.left), n === void 0 && (n = t.top), {
    x: e + t.width * 0.5,
    y: n + t.height * 0.5
  };
}
const Ql = (t) => {
  let {
    collisionRect: e,
    droppableRects: n,
    droppableContainers: s
  } = t;
  const i = Bi(e, e.left, e.top), r = [];
  for (const o of s) {
    const {
      id: a
    } = o, l = n.get(a);
    if (l) {
      const u = xo(Bi(l), i);
      r.push({
        id: a,
        data: {
          droppableContainer: o,
          value: u
        }
      });
    }
  }
  return r.sort(bo);
}, tc = (t) => {
  let {
    collisionRect: e,
    droppableRects: n,
    droppableContainers: s
  } = t;
  const i = Fi(e), r = [];
  for (const o of s) {
    const {
      id: a
    } = o, l = n.get(a);
    if (l) {
      const u = Fi(l), c = i.reduce((h, f, g) => h + xo(u[g], f), 0), d = Number((c / 4).toFixed(4));
      r.push({
        id: a,
        data: {
          droppableContainer: o,
          value: d
        }
      });
    }
  }
  return r.sort(bo);
};
function ec(t, e) {
  const n = Math.max(e.top, t.top), s = Math.max(e.left, t.left), i = Math.min(e.left + e.width, t.left + t.width), r = Math.min(e.top + e.height, t.top + t.height), o = i - s, a = r - n;
  if (s < i && n < r) {
    const l = e.width * e.height, u = t.width * t.height, c = o * a, d = c / (l + u - c);
    return Number(d.toFixed(4));
  }
  return 0;
}
const nc = (t) => {
  let {
    collisionRect: e,
    droppableRects: n,
    droppableContainers: s
  } = t;
  const i = [];
  for (const r of s) {
    const {
      id: o
    } = r, a = n.get(o);
    if (a) {
      const l = ec(a, e);
      l > 0 && i.push({
        id: o,
        data: {
          droppableContainer: r,
          value: l
        }
      });
    }
  }
  return i.sort(Zl);
};
function sc(t, e, n) {
  return {
    ...t,
    scaleX: e && n ? e.width / n.width : 1,
    scaleY: e && n ? e.height / n.height : 1
  };
}
function To(t, e) {
  return t && e ? {
    x: t.left - e.left,
    y: t.top - e.top
  } : jt;
}
function ic(t) {
  return function(n) {
    for (var s = arguments.length, i = new Array(s > 1 ? s - 1 : 0), r = 1; r < s; r++)
      i[r - 1] = arguments[r];
    return i.reduce((o, a) => ({
      ...o,
      top: o.top + t * a.y,
      bottom: o.bottom + t * a.y,
      left: o.left + t * a.x,
      right: o.right + t * a.x
    }), {
      ...n
    });
  };
}
const rc = /* @__PURE__ */ ic(1);
function oc(t) {
  if (t.startsWith("matrix3d(")) {
    const e = t.slice(9, -1).split(/, /);
    return {
      x: +e[12],
      y: +e[13],
      scaleX: +e[0],
      scaleY: +e[5]
    };
  } else if (t.startsWith("matrix(")) {
    const e = t.slice(7, -1).split(/, /);
    return {
      x: +e[4],
      y: +e[5],
      scaleX: +e[0],
      scaleY: +e[3]
    };
  }
  return null;
}
function ac(t, e, n) {
  const s = oc(e);
  if (!s)
    return t;
  const {
    scaleX: i,
    scaleY: r,
    x: o,
    y: a
  } = s, l = t.left - o - (1 - i) * parseFloat(n), u = t.top - a - (1 - r) * parseFloat(n.slice(n.indexOf(" ") + 1)), c = i ? t.width / i : t.width, d = r ? t.height / r : t.height;
  return {
    width: c,
    height: d,
    top: u,
    right: l + c,
    bottom: u + d,
    left: l
  };
}
const lc = {
  ignoreTransform: !1
};
function Ae(t, e) {
  e === void 0 && (e = lc);
  let n = t.getBoundingClientRect();
  if (e.ignoreTransform) {
    const {
      transform: u,
      transformOrigin: c
    } = vt(t).getComputedStyle(t);
    u && (n = ac(n, u, c));
  }
  const {
    top: s,
    left: i,
    width: r,
    height: o,
    bottom: a,
    right: l
  } = n;
  return {
    top: s,
    left: i,
    width: r,
    height: o,
    bottom: a,
    right: l
  };
}
function $i(t) {
  return Ae(t, {
    ignoreTransform: !0
  });
}
function cc(t) {
  const e = t.innerWidth, n = t.innerHeight;
  return {
    top: 0,
    left: 0,
    right: e,
    bottom: n,
    width: e,
    height: n
  };
}
function uc(t, e) {
  return e === void 0 && (e = vt(t).getComputedStyle(t)), e.position === "fixed";
}
function dc(t, e) {
  e === void 0 && (e = vt(t).getComputedStyle(t));
  const n = /(auto|scroll|overlay)/;
  return ["overflow", "overflowX", "overflowY"].some((i) => {
    const r = e[i];
    return typeof r == "string" ? n.test(r) : !1;
  });
}
function Nn(t, e) {
  const n = [];
  function s(i) {
    if (e != null && n.length >= e || !i)
      return n;
    if (Us(i) && i.scrollingElement != null && !n.includes(i.scrollingElement))
      return n.push(i.scrollingElement), n;
    if (!Qe(i) || go(i) || n.includes(i))
      return n;
    const r = vt(t).getComputedStyle(i);
    return i !== t && dc(i, r) && n.push(i), uc(i, r) ? n : s(i.parentNode);
  }
  return t ? s(t) : n;
}
function So(t) {
  const [e] = Nn(t, 1);
  return e ?? null;
}
function zn(t) {
  return !Vn || !t ? null : De(t) ? t : _s(t) ? Us(t) || t === Ce(t).scrollingElement ? window : Qe(t) ? t : null : null;
}
function Do(t) {
  return De(t) ? t.scrollX : t.scrollLeft;
}
function Co(t) {
  return De(t) ? t.scrollY : t.scrollTop;
}
function ms(t) {
  return {
    x: Do(t),
    y: Co(t)
  };
}
var at;
(function(t) {
  t[t.Forward = 1] = "Forward", t[t.Backward = -1] = "Backward";
})(at || (at = {}));
function Ao(t) {
  return !Vn || !t ? !1 : t === document.scrollingElement;
}
function Po(t) {
  const e = {
    x: 0,
    y: 0
  }, n = Ao(t) ? {
    height: window.innerHeight,
    width: window.innerWidth
  } : {
    height: t.clientHeight,
    width: t.clientWidth
  }, s = {
    x: t.scrollWidth - n.width,
    y: t.scrollHeight - n.height
  }, i = t.scrollTop <= e.y, r = t.scrollLeft <= e.x, o = t.scrollTop >= s.y, a = t.scrollLeft >= s.x;
  return {
    isTop: i,
    isLeft: r,
    isBottom: o,
    isRight: a,
    maxScroll: s,
    minScroll: e
  };
}
const hc = {
  x: 0.2,
  y: 0.2
};
function fc(t, e, n, s, i) {
  let {
    top: r,
    left: o,
    right: a,
    bottom: l
  } = n;
  s === void 0 && (s = 10), i === void 0 && (i = hc);
  const {
    isTop: u,
    isBottom: c,
    isLeft: d,
    isRight: h
  } = Po(t), f = {
    x: 0,
    y: 0
  }, g = {
    x: 0,
    y: 0
  }, v = {
    height: e.height * i.y,
    width: e.width * i.x
  };
  return !u && r <= e.top + v.height ? (f.y = at.Backward, g.y = s * Math.abs((e.top + v.height - r) / v.height)) : !c && l >= e.bottom - v.height && (f.y = at.Forward, g.y = s * Math.abs((e.bottom - v.height - l) / v.height)), !h && a >= e.right - v.width ? (f.x = at.Forward, g.x = s * Math.abs((e.right - v.width - a) / v.width)) : !d && o <= e.left + v.width && (f.x = at.Backward, g.x = s * Math.abs((e.left + v.width - o) / v.width)), {
    direction: f,
    speed: g
  };
}
function pc(t) {
  if (t === document.scrollingElement) {
    const {
      innerWidth: r,
      innerHeight: o
    } = window;
    return {
      top: 0,
      left: 0,
      right: r,
      bottom: o,
      width: r,
      height: o
    };
  }
  const {
    top: e,
    left: n,
    right: s,
    bottom: i
  } = t.getBoundingClientRect();
  return {
    top: e,
    left: n,
    right: s,
    bottom: i,
    width: t.clientWidth,
    height: t.clientHeight
  };
}
function Ro(t) {
  return t.reduce((e, n) => be(e, ms(n)), jt);
}
function mc(t) {
  return t.reduce((e, n) => e + Do(n), 0);
}
function gc(t) {
  return t.reduce((e, n) => e + Co(n), 0);
}
function yc(t, e) {
  if (e === void 0 && (e = Ae), !t)
    return;
  const {
    top: n,
    left: s,
    bottom: i,
    right: r
  } = e(t);
  So(t) && (i <= 0 || r <= 0 || n >= window.innerHeight || s >= window.innerWidth) && t.scrollIntoView({
    block: "center",
    inline: "center"
  });
}
const vc = [["x", ["left", "right"], mc], ["y", ["top", "bottom"], gc]];
class Ks {
  constructor(e, n) {
    this.rect = void 0, this.width = void 0, this.height = void 0, this.top = void 0, this.bottom = void 0, this.right = void 0, this.left = void 0;
    const s = Nn(n), i = Ro(s);
    this.rect = {
      ...e
    }, this.width = e.width, this.height = e.height;
    for (const [r, o, a] of vc)
      for (const l of o)
        Object.defineProperty(this, l, {
          get: () => {
            const u = a(s), c = i[r] - u;
            return this.rect[l] + c;
          },
          enumerable: !0
        });
    Object.defineProperty(this, "rect", {
      enumerable: !1
    });
  }
}
class Oe {
  constructor(e) {
    this.target = void 0, this.listeners = [], this.removeAll = () => {
      this.listeners.forEach((n) => {
        var s;
        return (s = this.target) == null ? void 0 : s.removeEventListener(...n);
      });
    }, this.target = e;
  }
  add(e, n, s) {
    var i;
    (i = this.target) == null || i.addEventListener(e, n, s), this.listeners.push([e, n, s]);
  }
}
function xc(t) {
  const {
    EventTarget: e
  } = vt(t);
  return t instanceof e ? t : Ce(t);
}
function Wn(t, e) {
  const n = Math.abs(t.x), s = Math.abs(t.y);
  return typeof e == "number" ? Math.sqrt(n ** 2 + s ** 2) > e : "x" in e && "y" in e ? n > e.x && s > e.y : "x" in e ? n > e.x : "y" in e ? s > e.y : !1;
}
var Pt;
(function(t) {
  t.Click = "click", t.DragStart = "dragstart", t.Keydown = "keydown", t.ContextMenu = "contextmenu", t.Resize = "resize", t.SelectionChange = "selectionchange", t.VisibilityChange = "visibilitychange";
})(Pt || (Pt = {}));
function _i(t) {
  t.preventDefault();
}
function bc(t) {
  t.stopPropagation();
}
var $;
(function(t) {
  t.Space = "Space", t.Down = "ArrowDown", t.Right = "ArrowRight", t.Left = "ArrowLeft", t.Up = "ArrowUp", t.Esc = "Escape", t.Enter = "Enter", t.Tab = "Tab";
})($ || ($ = {}));
const Mo = {
  start: [$.Space, $.Enter],
  cancel: [$.Esc],
  end: [$.Space, $.Enter, $.Tab]
}, wc = (t, e) => {
  let {
    currentCoordinates: n
  } = e;
  switch (t.code) {
    case $.Right:
      return {
        ...n,
        x: n.x + 25
      };
    case $.Left:
      return {
        ...n,
        x: n.x - 25
      };
    case $.Down:
      return {
        ...n,
        y: n.y + 25
      };
    case $.Up:
      return {
        ...n,
        y: n.y - 25
      };
  }
};
class Gs {
  constructor(e) {
    this.props = void 0, this.autoScrollEnabled = !1, this.referenceCoordinates = void 0, this.listeners = void 0, this.windowListeners = void 0, this.props = e;
    const {
      event: {
        target: n
      }
    } = e;
    this.props = e, this.listeners = new Oe(Ce(n)), this.windowListeners = new Oe(vt(n)), this.handleKeyDown = this.handleKeyDown.bind(this), this.handleCancel = this.handleCancel.bind(this), this.attach();
  }
  attach() {
    this.handleStart(), this.windowListeners.add(Pt.Resize, this.handleCancel), this.windowListeners.add(Pt.VisibilityChange, this.handleCancel), setTimeout(() => this.listeners.add(Pt.Keydown, this.handleKeyDown));
  }
  handleStart() {
    const {
      activeNode: e,
      onStart: n
    } = this.props, s = e.node.current;
    s && yc(s), n(jt);
  }
  handleKeyDown(e) {
    if (Ws(e)) {
      const {
        active: n,
        context: s,
        options: i
      } = this.props, {
        keyboardCodes: r = Mo,
        coordinateGetter: o = wc,
        scrollBehavior: a = "smooth"
      } = i, {
        code: l
      } = e;
      if (r.end.includes(l)) {
        this.handleEnd(e);
        return;
      }
      if (r.cancel.includes(l)) {
        this.handleCancel(e);
        return;
      }
      const {
        collisionRect: u
      } = s.current, c = u ? {
        x: u.left,
        y: u.top
      } : jt;
      this.referenceCoordinates || (this.referenceCoordinates = c);
      const d = o(e, {
        active: n,
        context: s.current,
        currentCoordinates: c
      });
      if (d) {
        const h = Ke(d, c), f = {
          x: 0,
          y: 0
        }, {
          scrollableAncestors: g
        } = s.current;
        for (const v of g) {
          const y = e.code, {
            isTop: x,
            isRight: T,
            isLeft: b,
            isBottom: P,
            maxScroll: D,
            minScroll: R
          } = Po(v), m = pc(v), w = {
            x: Math.min(y === $.Right ? m.right - m.width / 2 : m.right, Math.max(y === $.Right ? m.left : m.left + m.width / 2, d.x)),
            y: Math.min(y === $.Down ? m.bottom - m.height / 2 : m.bottom, Math.max(y === $.Down ? m.top : m.top + m.height / 2, d.y))
          }, C = y === $.Right && !T || y === $.Left && !b, M = y === $.Down && !P || y === $.Up && !x;
          if (C && w.x !== d.x) {
            const S = v.scrollLeft + h.x, N = y === $.Right && S <= D.x || y === $.Left && S >= R.x;
            if (N && !h.y) {
              v.scrollTo({
                left: S,
                behavior: a
              });
              return;
            }
            N ? f.x = v.scrollLeft - S : f.x = y === $.Right ? v.scrollLeft - D.x : v.scrollLeft - R.x, f.x && v.scrollBy({
              left: -f.x,
              behavior: a
            });
            break;
          } else if (M && w.y !== d.y) {
            const S = v.scrollTop + h.y, N = y === $.Down && S <= D.y || y === $.Up && S >= R.y;
            if (N && !h.x) {
              v.scrollTo({
                top: S,
                behavior: a
              });
              return;
            }
            N ? f.y = v.scrollTop - S : f.y = y === $.Down ? v.scrollTop - D.y : v.scrollTop - R.y, f.y && v.scrollBy({
              top: -f.y,
              behavior: a
            });
            break;
          }
        }
        this.handleMove(e, be(Ke(d, this.referenceCoordinates), f));
      }
    }
  }
  handleMove(e, n) {
    const {
      onMove: s
    } = this.props;
    e.preventDefault(), s(n);
  }
  handleEnd(e) {
    const {
      onEnd: n
    } = this.props;
    e.preventDefault(), this.detach(), n();
  }
  handleCancel(e) {
    const {
      onCancel: n
    } = this.props;
    e.preventDefault(), this.detach(), n();
  }
  detach() {
    this.listeners.removeAll(), this.windowListeners.removeAll();
  }
}
Gs.activators = [{
  eventName: "onKeyDown",
  handler: (t, e, n) => {
    let {
      keyboardCodes: s = Mo,
      onActivation: i
    } = e, {
      active: r
    } = n;
    const {
      code: o
    } = t.nativeEvent;
    if (s.start.includes(o)) {
      const a = r.activatorNode.current;
      return a && t.target !== a ? !1 : (t.preventDefault(), i?.({
        event: t.nativeEvent
      }), !0);
    }
    return !1;
  }
}];
function Ui(t) {
  return !!(t && "distance" in t);
}
function zi(t) {
  return !!(t && "delay" in t);
}
class Hs {
  constructor(e, n, s) {
    var i;
    s === void 0 && (s = xc(e.event.target)), this.props = void 0, this.events = void 0, this.autoScrollEnabled = !0, this.document = void 0, this.activated = !1, this.initialCoordinates = void 0, this.timeoutId = null, this.listeners = void 0, this.documentListeners = void 0, this.windowListeners = void 0, this.props = e, this.events = n;
    const {
      event: r
    } = e, {
      target: o
    } = r;
    this.props = e, this.events = n, this.document = Ce(o), this.documentListeners = new Oe(this.document), this.listeners = new Oe(s), this.windowListeners = new Oe(vt(o)), this.initialCoordinates = (i = ps(r)) != null ? i : jt, this.handleStart = this.handleStart.bind(this), this.handleMove = this.handleMove.bind(this), this.handleEnd = this.handleEnd.bind(this), this.handleCancel = this.handleCancel.bind(this), this.handleKeydown = this.handleKeydown.bind(this), this.removeTextSelection = this.removeTextSelection.bind(this), this.attach();
  }
  attach() {
    const {
      events: e,
      props: {
        options: {
          activationConstraint: n,
          bypassActivationConstraint: s
        }
      }
    } = this;
    if (this.listeners.add(e.move.name, this.handleMove, {
      passive: !1
    }), this.listeners.add(e.end.name, this.handleEnd), e.cancel && this.listeners.add(e.cancel.name, this.handleCancel), this.windowListeners.add(Pt.Resize, this.handleCancel), this.windowListeners.add(Pt.DragStart, _i), this.windowListeners.add(Pt.VisibilityChange, this.handleCancel), this.windowListeners.add(Pt.ContextMenu, _i), this.documentListeners.add(Pt.Keydown, this.handleKeydown), n) {
      if (s != null && s({
        event: this.props.event,
        activeNode: this.props.activeNode,
        options: this.props.options
      }))
        return this.handleStart();
      if (zi(n)) {
        this.timeoutId = setTimeout(this.handleStart, n.delay), this.handlePending(n);
        return;
      }
      if (Ui(n)) {
        this.handlePending(n);
        return;
      }
    }
    this.handleStart();
  }
  detach() {
    this.listeners.removeAll(), this.windowListeners.removeAll(), setTimeout(this.documentListeners.removeAll, 50), this.timeoutId !== null && (clearTimeout(this.timeoutId), this.timeoutId = null);
  }
  handlePending(e, n) {
    const {
      active: s,
      onPending: i
    } = this.props;
    i(s, e, this.initialCoordinates, n);
  }
  handleStart() {
    const {
      initialCoordinates: e
    } = this, {
      onStart: n
    } = this.props;
    e && (this.activated = !0, this.documentListeners.add(Pt.Click, bc, {
      capture: !0
    }), this.removeTextSelection(), this.documentListeners.add(Pt.SelectionChange, this.removeTextSelection), n(e));
  }
  handleMove(e) {
    var n;
    const {
      activated: s,
      initialCoordinates: i,
      props: r
    } = this, {
      onMove: o,
      options: {
        activationConstraint: a
      }
    } = r;
    if (!i)
      return;
    const l = (n = ps(e)) != null ? n : jt, u = Ke(i, l);
    if (!s && a) {
      if (Ui(a)) {
        if (a.tolerance != null && Wn(u, a.tolerance))
          return this.handleCancel();
        if (Wn(u, a.distance))
          return this.handleStart();
      }
      if (zi(a) && Wn(u, a.tolerance))
        return this.handleCancel();
      this.handlePending(a, u);
      return;
    }
    e.cancelable && e.preventDefault(), o(l);
  }
  handleEnd() {
    const {
      onAbort: e,
      onEnd: n
    } = this.props;
    this.detach(), this.activated || e(this.props.active), n();
  }
  handleCancel() {
    const {
      onAbort: e,
      onCancel: n
    } = this.props;
    this.detach(), this.activated || e(this.props.active), n();
  }
  handleKeydown(e) {
    e.code === $.Esc && this.handleCancel();
  }
  removeTextSelection() {
    var e;
    (e = this.document.getSelection()) == null || e.removeAllRanges();
  }
}
const Tc = {
  cancel: {
    name: "pointercancel"
  },
  move: {
    name: "pointermove"
  },
  end: {
    name: "pointerup"
  }
};
class Xs extends Hs {
  constructor(e) {
    const {
      event: n
    } = e, s = Ce(n.target);
    super(e, Tc, s);
  }
}
Xs.activators = [{
  eventName: "onPointerDown",
  handler: (t, e) => {
    let {
      nativeEvent: n
    } = t, {
      onActivation: s
    } = e;
    return !n.isPrimary || n.button !== 0 ? !1 : (s?.({
      event: n
    }), !0);
  }
}];
const Sc = {
  move: {
    name: "mousemove"
  },
  end: {
    name: "mouseup"
  }
};
var gs;
(function(t) {
  t[t.RightClick = 2] = "RightClick";
})(gs || (gs = {}));
class Dc extends Hs {
  constructor(e) {
    super(e, Sc, Ce(e.event.target));
  }
}
Dc.activators = [{
  eventName: "onMouseDown",
  handler: (t, e) => {
    let {
      nativeEvent: n
    } = t, {
      onActivation: s
    } = e;
    return n.button === gs.RightClick ? !1 : (s?.({
      event: n
    }), !0);
  }
}];
const Kn = {
  cancel: {
    name: "touchcancel"
  },
  move: {
    name: "touchmove"
  },
  end: {
    name: "touchend"
  }
};
class Cc extends Hs {
  constructor(e) {
    super(e, Kn);
  }
  static setup() {
    return window.addEventListener(Kn.move.name, e, {
      capture: !1,
      passive: !1
    }), function() {
      window.removeEventListener(Kn.move.name, e);
    };
    function e() {
    }
  }
}
Cc.activators = [{
  eventName: "onTouchStart",
  handler: (t, e) => {
    let {
      nativeEvent: n
    } = t, {
      onActivation: s
    } = e;
    const {
      touches: i
    } = n;
    return i.length > 1 ? !1 : (s?.({
      event: n
    }), !0);
  }
}];
var Fe;
(function(t) {
  t[t.Pointer = 0] = "Pointer", t[t.DraggableRect = 1] = "DraggableRect";
})(Fe || (Fe = {}));
var Tn;
(function(t) {
  t[t.TreeOrder = 0] = "TreeOrder", t[t.ReversedTreeOrder = 1] = "ReversedTreeOrder";
})(Tn || (Tn = {}));
function Ac(t) {
  let {
    acceleration: e,
    activator: n = Fe.Pointer,
    canScroll: s,
    draggingRect: i,
    enabled: r,
    interval: o = 5,
    order: a = Tn.TreeOrder,
    pointerCoordinates: l,
    scrollableAncestors: u,
    scrollableAncestorRects: c,
    delta: d,
    threshold: h
  } = t;
  const f = Rc({
    delta: d,
    disabled: !r
  }), [g, v] = Fl(), y = j({
    x: 0,
    y: 0
  }), x = j({
    x: 0,
    y: 0
  }), T = W(() => {
    switch (n) {
      case Fe.Pointer:
        return l ? {
          top: l.y,
          bottom: l.y,
          left: l.x,
          right: l.x
        } : null;
      case Fe.DraggableRect:
        return i;
    }
  }, [n, i, l]), b = j(null), P = lt(() => {
    const R = b.current;
    if (!R)
      return;
    const m = y.current.x * x.current.x, w = y.current.y * x.current.y;
    R.scrollBy(m, w);
  }, []), D = W(() => a === Tn.TreeOrder ? [...u].reverse() : u, [a, u]);
  B(
    () => {
      if (!r || !u.length || !T) {
        v();
        return;
      }
      for (const R of D) {
        if (s?.(R) === !1)
          continue;
        const m = u.indexOf(R), w = c[m];
        if (!w)
          continue;
        const {
          direction: C,
          speed: M
        } = fc(R, w, T, e, h);
        for (const S of ["x", "y"])
          f[S][C[S]] || (M[S] = 0, C[S] = 0);
        if (M.x > 0 || M.y > 0) {
          v(), b.current = R, g(P, o), y.current = M, x.current = C;
          return;
        }
      }
      y.current = {
        x: 0,
        y: 0
      }, x.current = {
        x: 0,
        y: 0
      }, v();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      e,
      P,
      s,
      v,
      r,
      o,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(T),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(f),
      g,
      u,
      D,
      c,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(h)
    ]
  );
}
const Pc = {
  x: {
    [at.Backward]: !1,
    [at.Forward]: !1
  },
  y: {
    [at.Backward]: !1,
    [at.Forward]: !1
  }
};
function Rc(t) {
  let {
    delta: e,
    disabled: n
  } = t;
  const s = fs(e);
  return tn((i) => {
    if (n || !s || !i)
      return Pc;
    const r = {
      x: Math.sign(e.x - s.x),
      y: Math.sign(e.y - s.y)
    };
    return {
      x: {
        [at.Backward]: i.x[at.Backward] || r.x === -1,
        [at.Forward]: i.x[at.Forward] || r.x === 1
      },
      y: {
        [at.Backward]: i.y[at.Backward] || r.y === -1,
        [at.Forward]: i.y[at.Forward] || r.y === 1
      }
    };
  }, [n, e, s]);
}
function Mc(t, e) {
  const n = e != null ? t.get(e) : void 0, s = n ? n.node.current : null;
  return tn((i) => {
    var r;
    return e == null ? null : (r = s ?? i) != null ? r : null;
  }, [s, e]);
}
function Ec(t, e) {
  return W(() => t.reduce((n, s) => {
    const {
      sensor: i
    } = s, r = i.activators.map((o) => ({
      eventName: o.eventName,
      handler: e(o.handler, s)
    }));
    return [...n, ...r];
  }, []), [t, e]);
}
var He;
(function(t) {
  t[t.Always = 0] = "Always", t[t.BeforeDragging = 1] = "BeforeDragging", t[t.WhileDragging = 2] = "WhileDragging";
})(He || (He = {}));
var ys;
(function(t) {
  t.Optimized = "optimized";
})(ys || (ys = {}));
const Wi = /* @__PURE__ */ new Map();
function Vc(t, e) {
  let {
    dragging: n,
    dependencies: s,
    config: i
  } = e;
  const [r, o] = L(null), {
    frequency: a,
    measure: l,
    strategy: u
  } = i, c = j(t), d = y(), h = We(d), f = lt(function(x) {
    x === void 0 && (x = []), !h.current && o((T) => T === null ? x : T.concat(x.filter((b) => !T.includes(b))));
  }, [h]), g = j(null), v = tn((x) => {
    if (d && !n)
      return Wi;
    if (!x || x === Wi || c.current !== t || r != null) {
      const T = /* @__PURE__ */ new Map();
      for (let b of t) {
        if (!b)
          continue;
        if (r && r.length > 0 && !r.includes(b.id) && b.rect.current) {
          T.set(b.id, b.rect.current);
          continue;
        }
        const P = b.node.current, D = P ? new Ks(l(P), P) : null;
        b.rect.current = D, D && T.set(b.id, D);
      }
      return T;
    }
    return x;
  }, [t, r, n, d, l]);
  return B(() => {
    c.current = t;
  }, [t]), B(
    () => {
      d || f();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [n, d]
  ), B(
    () => {
      r && r.length > 0 && o(null);
    },
    //eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(r)]
  ), B(
    () => {
      d || typeof a != "number" || g.current !== null || (g.current = setTimeout(() => {
        f(), g.current = null;
      }, a));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, d, f, ...s]
  ), {
    droppableRects: v,
    measureDroppableContainers: f,
    measuringScheduled: r != null
  };
  function y() {
    switch (u) {
      case He.Always:
        return !1;
      case He.BeforeDragging:
        return n;
      default:
        return !n;
    }
  }
}
function Eo(t, e) {
  return tn((n) => t ? n || (typeof e == "function" ? e(t) : t) : null, [e, t]);
}
function Nc(t, e) {
  return Eo(t, e);
}
function kc(t) {
  let {
    callback: e,
    disabled: n
  } = t;
  const s = zs(e), i = W(() => {
    if (n || typeof window > "u" || typeof window.MutationObserver > "u")
      return;
    const {
      MutationObserver: r
    } = window;
    return new r(s);
  }, [s, n]);
  return B(() => () => i?.disconnect(), [i]), i;
}
function kn(t) {
  let {
    callback: e,
    disabled: n
  } = t;
  const s = zs(e), i = W(
    () => {
      if (n || typeof window > "u" || typeof window.ResizeObserver > "u")
        return;
      const {
        ResizeObserver: r
      } = window;
      return new r(s);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [n]
  );
  return B(() => () => i?.disconnect(), [i]), i;
}
function Ic(t) {
  return new Ks(Ae(t), t);
}
function Ki(t, e, n) {
  e === void 0 && (e = Ic);
  const [s, i] = L(null);
  function r() {
    i((l) => {
      if (!t)
        return null;
      if (t.isConnected === !1) {
        var u;
        return (u = l ?? n) != null ? u : null;
      }
      const c = e(t);
      return JSON.stringify(l) === JSON.stringify(c) ? l : c;
    });
  }
  const o = kc({
    callback(l) {
      if (t)
        for (const u of l) {
          const {
            type: c,
            target: d
          } = u;
          if (c === "childList" && d instanceof HTMLElement && d.contains(t)) {
            r();
            break;
          }
        }
    }
  }), a = kn({
    callback: r
  });
  return Wt(() => {
    r(), t ? (a?.observe(t), o?.observe(document.body, {
      childList: !0,
      subtree: !0
    })) : (a?.disconnect(), o?.disconnect());
  }, [t]), s;
}
function jc(t) {
  const e = Eo(t);
  return To(t, e);
}
const Gi = [];
function Lc(t) {
  const e = j(t), n = tn((s) => t ? s && s !== Gi && t && e.current && t.parentNode === e.current.parentNode ? s : Nn(t) : Gi, [t]);
  return B(() => {
    e.current = t;
  }, [t]), n;
}
function Oc(t) {
  const [e, n] = L(null), s = j(t), i = lt((r) => {
    const o = zn(r.target);
    o && n((a) => a ? (a.set(o, ms(o)), new Map(a)) : null);
  }, []);
  return B(() => {
    const r = s.current;
    if (t !== r) {
      o(r);
      const a = t.map((l) => {
        const u = zn(l);
        return u ? (u.addEventListener("scroll", i, {
          passive: !0
        }), [u, ms(u)]) : null;
      }).filter((l) => l != null);
      n(a.length ? new Map(a) : null), s.current = t;
    }
    return () => {
      o(t), o(r);
    };
    function o(a) {
      a.forEach((l) => {
        const u = zn(l);
        u?.removeEventListener("scroll", i);
      });
    }
  }, [i, t]), W(() => t.length ? e ? Array.from(e.values()).reduce((r, o) => be(r, o), jt) : Ro(t) : jt, [t, e]);
}
function Hi(t, e) {
  e === void 0 && (e = []);
  const n = j(null);
  return B(
    () => {
      n.current = null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    e
  ), B(() => {
    const s = t !== jt;
    s && !n.current && (n.current = t), !s && n.current && (n.current = null);
  }, [t]), n.current ? Ke(t, n.current) : jt;
}
function Fc(t) {
  B(
    () => {
      if (!Vn)
        return;
      const e = t.map((n) => {
        let {
          sensor: s
        } = n;
        return s.setup == null ? void 0 : s.setup();
      });
      return () => {
        for (const n of e)
          n?.();
      };
    },
    // TO-DO: Sensors length could theoretically change which would not be a valid dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t.map((e) => {
      let {
        sensor: n
      } = e;
      return n;
    })
  );
}
function Bc(t, e) {
  return W(() => t.reduce((n, s) => {
    let {
      eventName: i,
      handler: r
    } = s;
    return n[i] = (o) => {
      r(o, e);
    }, n;
  }, {}), [t, e]);
}
function Vo(t) {
  return W(() => t ? cc(t) : null, [t]);
}
const Xi = [];
function $c(t, e) {
  e === void 0 && (e = Ae);
  const [n] = t, s = Vo(n ? vt(n) : null), [i, r] = L(Xi);
  function o() {
    r(() => t.length ? t.map((l) => Ao(l) ? s : new Ks(e(l), l)) : Xi);
  }
  const a = kn({
    callback: o
  });
  return Wt(() => {
    a?.disconnect(), o(), t.forEach((l) => a?.observe(l));
  }, [t]), i;
}
function _c(t) {
  if (!t)
    return null;
  if (t.children.length > 1)
    return t;
  const e = t.children[0];
  return Qe(e) ? e : t;
}
function Uc(t) {
  let {
    measure: e
  } = t;
  const [n, s] = L(null), i = lt((u) => {
    for (const {
      target: c
    } of u)
      if (Qe(c)) {
        s((d) => {
          const h = e(c);
          return d ? {
            ...d,
            width: h.width,
            height: h.height
          } : h;
        });
        break;
      }
  }, [e]), r = kn({
    callback: i
  }), o = lt((u) => {
    const c = _c(u);
    r?.disconnect(), c && r?.observe(c), s(c ? e(c) : null);
  }, [e, r]), [a, l] = bn(o);
  return W(() => ({
    nodeRef: a,
    rect: n,
    setRef: l
  }), [n, a, l]);
}
const zc = [{
  sensor: Xs,
  options: {}
}, {
  sensor: Gs,
  options: {}
}], Wc = {
  current: {}
}, mn = {
  draggable: {
    measure: $i
  },
  droppable: {
    measure: $i,
    strategy: He.WhileDragging,
    frequency: ys.Optimized
  },
  dragOverlay: {
    measure: Ae
  }
};
class Be extends Map {
  get(e) {
    var n;
    return e != null && (n = super.get(e)) != null ? n : void 0;
  }
  toArray() {
    return Array.from(this.values());
  }
  getEnabled() {
    return this.toArray().filter((e) => {
      let {
        disabled: n
      } = e;
      return !n;
    });
  }
  getNodeFor(e) {
    var n, s;
    return (n = (s = this.get(e)) == null ? void 0 : s.node.current) != null ? n : void 0;
  }
}
const Kc = {
  activatorEvent: null,
  active: null,
  activeNode: null,
  activeNodeRect: null,
  collisions: null,
  containerNodeRect: null,
  draggableNodes: /* @__PURE__ */ new Map(),
  droppableRects: /* @__PURE__ */ new Map(),
  droppableContainers: /* @__PURE__ */ new Be(),
  over: null,
  dragOverlay: {
    nodeRef: {
      current: null
    },
    rect: null,
    setRef: wn
  },
  scrollableAncestors: [],
  scrollableAncestorRects: [],
  measuringConfiguration: mn,
  measureDroppableContainers: wn,
  windowRect: null,
  measuringScheduled: !1
}, Gc = {
  activatorEvent: null,
  activators: [],
  active: null,
  activeNodeRect: null,
  ariaDescribedById: {
    draggable: ""
  },
  dispatch: wn,
  draggableNodes: /* @__PURE__ */ new Map(),
  over: null,
  measureDroppableContainers: wn
}, In = /* @__PURE__ */ Lt(Gc), No = /* @__PURE__ */ Lt(Kc);
function Hc() {
  return {
    draggable: {
      active: null,
      initialCoordinates: {
        x: 0,
        y: 0
      },
      nodes: /* @__PURE__ */ new Map(),
      translate: {
        x: 0,
        y: 0
      }
    },
    droppable: {
      containers: new Be()
    }
  };
}
function Xc(t, e) {
  switch (e.type) {
    case it.DragStart:
      return {
        ...t,
        draggable: {
          ...t.draggable,
          initialCoordinates: e.initialCoordinates,
          active: e.active
        }
      };
    case it.DragMove:
      return t.draggable.active == null ? t : {
        ...t,
        draggable: {
          ...t.draggable,
          translate: {
            x: e.coordinates.x - t.draggable.initialCoordinates.x,
            y: e.coordinates.y - t.draggable.initialCoordinates.y
          }
        }
      };
    case it.DragEnd:
    case it.DragCancel:
      return {
        ...t,
        draggable: {
          ...t.draggable,
          active: null,
          initialCoordinates: {
            x: 0,
            y: 0
          },
          translate: {
            x: 0,
            y: 0
          }
        }
      };
    case it.RegisterDroppable: {
      const {
        element: n
      } = e, {
        id: s
      } = n, i = new Be(t.droppable.containers);
      return i.set(s, n), {
        ...t,
        droppable: {
          ...t.droppable,
          containers: i
        }
      };
    }
    case it.SetDroppableDisabled: {
      const {
        id: n,
        key: s,
        disabled: i
      } = e, r = t.droppable.containers.get(n);
      if (!r || s !== r.key)
        return t;
      const o = new Be(t.droppable.containers);
      return o.set(n, {
        ...r,
        disabled: i
      }), {
        ...t,
        droppable: {
          ...t.droppable,
          containers: o
        }
      };
    }
    case it.UnregisterDroppable: {
      const {
        id: n,
        key: s
      } = e, i = t.droppable.containers.get(n);
      if (!i || s !== i.key)
        return t;
      const r = new Be(t.droppable.containers);
      return r.delete(n), {
        ...t,
        droppable: {
          ...t.droppable,
          containers: r
        }
      };
    }
    default:
      return t;
  }
}
function Yc(t) {
  let {
    disabled: e
  } = t;
  const {
    active: n,
    activatorEvent: s,
    draggableNodes: i
  } = q(In), r = fs(s), o = fs(n?.id);
  return B(() => {
    if (!e && !s && r && o != null) {
      if (!Ws(r) || document.activeElement === r.target)
        return;
      const a = i.get(o);
      if (!a)
        return;
      const {
        activatorNode: l,
        node: u
      } = a;
      if (!l.current && !u.current)
        return;
      requestAnimationFrame(() => {
        for (const c of [l.current, u.current]) {
          if (!c)
            continue;
          const d = _l(c);
          if (d) {
            d.focus();
            break;
          }
        }
      });
    }
  }, [s, e, i, o, r]), null;
}
function qc(t, e) {
  let {
    transform: n,
    ...s
  } = e;
  return t != null && t.length ? t.reduce((i, r) => r({
    transform: i,
    ...s
  }), n) : n;
}
function Jc(t) {
  return W(
    () => ({
      draggable: {
        ...mn.draggable,
        ...t?.draggable
      },
      droppable: {
        ...mn.droppable,
        ...t?.droppable
      },
      dragOverlay: {
        ...mn.dragOverlay,
        ...t?.dragOverlay
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t?.draggable, t?.droppable, t?.dragOverlay]
  );
}
function Zc(t) {
  let {
    activeNode: e,
    measure: n,
    initialRect: s,
    config: i = !0
  } = t;
  const r = j(!1), {
    x: o,
    y: a
  } = typeof i == "boolean" ? {
    x: i,
    y: i
  } : i;
  Wt(() => {
    if (!o && !a || !e) {
      r.current = !1;
      return;
    }
    if (r.current || !s)
      return;
    const u = e?.node.current;
    if (!u || u.isConnected === !1)
      return;
    const c = n(u), d = To(c, s);
    if (o || (d.x = 0), a || (d.y = 0), r.current = !0, Math.abs(d.x) > 0 || Math.abs(d.y) > 0) {
      const h = So(u);
      h && h.scrollBy({
        top: d.y,
        left: d.x
      });
    }
  }, [e, o, a, s, n]);
}
const ko = /* @__PURE__ */ Lt({
  ...jt,
  scaleX: 1,
  scaleY: 1
});
var te;
(function(t) {
  t[t.Uninitialized = 0] = "Uninitialized", t[t.Initializing = 1] = "Initializing", t[t.Initialized = 2] = "Initialized";
})(te || (te = {}));
const Qc = /* @__PURE__ */ Pl(function(e) {
  var n, s, i, r;
  let {
    id: o,
    accessibility: a,
    autoScroll: l = !0,
    children: u,
    sensors: c = zc,
    collisionDetection: d = nc,
    measuring: h,
    modifiers: f,
    ...g
  } = e;
  const v = Rl(Xc, void 0, Hc), [y, x] = v, [T, b] = Hl(), [P, D] = L(te.Uninitialized), R = P === te.Initialized, {
    draggable: {
      active: m,
      nodes: w,
      translate: C
    },
    droppable: {
      containers: M
    }
  } = y, S = m != null ? w.get(m) : null, N = j({
    initial: null,
    translated: null
  }), O = W(() => {
    var ht;
    return m != null ? {
      id: m,
      // It's possible for the active node to unmount while dragging
      data: (ht = S?.data) != null ? ht : Wc,
      rect: N
    } : null;
  }, [m, S]), F = j(null), [G, _] = L(null), [k, U] = L(null), H = We(g, Object.values(g)), tt = en("DndDescribedBy", o), et = W(() => M.getEnabled(), [M]), X = Jc(h), {
    droppableRects: dt,
    measureDroppableContainers: xt,
    measuringScheduled: Ot
  } = Vc(et, {
    dragging: R,
    dependencies: [C.x, C.y],
    config: X.droppable
  }), pt = Mc(w, m), ie = W(() => k ? ps(k) : null, [k]), Ft = Al(), Et = Nc(pt, X.draggable.measure);
  Zc({
    activeNode: m != null ? w.get(m) : null,
    config: Ft.layoutShiftCompensation,
    initialRect: Et,
    measure: X.draggable.measure
  });
  const K = Ki(pt, X.draggable.measure, Et), re = Ki(pt ? pt.parentElement : null), St = j({
    activatorEvent: null,
    active: null,
    activeNode: pt,
    collisionRect: null,
    collisions: null,
    droppableRects: dt,
    draggableNodes: w,
    draggingNode: null,
    draggingNodeRect: null,
    droppableContainers: M,
    over: null,
    scrollableAncestors: [],
    scrollAdjustedTranslate: null
  }), Xt = M.getNodeFor((n = St.current.over) == null ? void 0 : n.id), A = Uc({
    measure: X.dragOverlay.measure
  }), V = (s = A.nodeRef.current) != null ? s : pt, E = R ? (i = A.rect) != null ? i : K : null, z = !!(A.nodeRef.current && A.rect), Z = jc(z ? null : K), rt = Vo(V ? vt(V) : null), ot = Lc(R ? Xt ?? pt : null), Vt = $c(ot), Dt = qc(f, {
    transform: {
      x: C.x - Z.x,
      y: C.y - Z.y,
      scaleX: 1,
      scaleY: 1
    },
    activatorEvent: k,
    active: O,
    activeNodeRect: K,
    containerNodeRect: re,
    draggingNodeRect: E,
    over: St.current.over,
    overlayNodeRect: A.rect,
    scrollableAncestors: ot,
    scrollableAncestorRects: Vt,
    windowRect: rt
  }), Nt = ie ? be(ie, C) : null, an = Oc(ot), xl = Hi(an), bl = Hi(an, [K]), he = be(Dt, xl), fe = E ? rc(E, Dt) : null, Ee = O && fe ? d({
    active: O,
    collisionRect: fe,
    droppableRects: dt,
    droppableContainers: et,
    pointerCoordinates: Nt
  }) : null, Ei = wo(Ee, "id"), [Yt, Vi] = L(null), wl = z ? Dt : be(Dt, bl), Tl = sc(wl, (r = Yt?.rect) != null ? r : null, K), Bn = j(null), Ni = lt(
    (ht, bt) => {
      let {
        sensor: wt,
        options: qt
      } = bt;
      if (F.current == null)
        return;
      const Ct = w.get(F.current);
      if (!Ct)
        return;
      const Tt = ht.nativeEvent, Bt = new wt({
        active: F.current,
        activeNode: Ct,
        event: Tt,
        options: qt,
        // Sensors need to be instantiated with refs for arguments that change over time
        // otherwise they are frozen in time with the stale arguments
        context: St,
        onAbort(ct) {
          if (!w.get(ct))
            return;
          const {
            onDragAbort: $t
          } = H.current, Kt = {
            id: ct
          };
          $t?.(Kt), T({
            type: "onDragAbort",
            event: Kt
          });
        },
        onPending(ct, Jt, $t, Kt) {
          if (!w.get(ct))
            return;
          const {
            onDragPending: Ne
          } = H.current, Zt = {
            id: ct,
            constraint: Jt,
            initialCoordinates: $t,
            offset: Kt
          };
          Ne?.(Zt), T({
            type: "onDragPending",
            event: Zt
          });
        },
        onStart(ct) {
          const Jt = F.current;
          if (Jt == null)
            return;
          const $t = w.get(Jt);
          if (!$t)
            return;
          const {
            onDragStart: Kt
          } = H.current, Ve = {
            activatorEvent: Tt,
            active: {
              id: Jt,
              data: $t.data,
              rect: N
            }
          };
          ln(() => {
            Kt?.(Ve), D(te.Initializing), x({
              type: it.DragStart,
              initialCoordinates: ct,
              active: Jt
            }), T({
              type: "onDragStart",
              event: Ve
            }), _(Bn.current), U(Tt);
          });
        },
        onMove(ct) {
          x({
            type: it.DragMove,
            coordinates: ct
          });
        },
        onEnd: pe(it.DragEnd),
        onCancel: pe(it.DragCancel)
      });
      Bn.current = Bt;
      function pe(ct) {
        return async function() {
          const {
            active: $t,
            collisions: Kt,
            over: Ve,
            scrollAdjustedTranslate: Ne
          } = St.current;
          let Zt = null;
          if ($t && Ne) {
            const {
              cancelDrop: ke
            } = H.current;
            Zt = {
              activatorEvent: Tt,
              active: $t,
              collisions: Kt,
              delta: Ne,
              over: Ve
            }, ct === it.DragEnd && typeof ke == "function" && await Promise.resolve(ke(Zt)) && (ct = it.DragCancel);
          }
          F.current = null, ln(() => {
            x({
              type: ct
            }), D(te.Uninitialized), Vi(null), _(null), U(null), Bn.current = null;
            const ke = ct === it.DragEnd ? "onDragEnd" : "onDragCancel";
            if (Zt) {
              const $n = H.current[ke];
              $n?.(Zt), T({
                type: ke,
                event: Zt
              });
            }
          });
        };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w]
  ), Sl = lt((ht, bt) => (wt, qt) => {
    const Ct = wt.nativeEvent, Tt = w.get(qt);
    if (
      // Another sensor is already instantiating
      F.current !== null || // No active draggable
      !Tt || // Event has already been captured
      Ct.dndKit || Ct.defaultPrevented
    )
      return;
    const Bt = {
      active: Tt
    };
    ht(wt, bt.options, Bt) === !0 && (Ct.dndKit = {
      capturedBy: bt.sensor
    }, F.current = qt, Ni(wt, bt));
  }, [w, Ni]), ki = Ec(c, Sl);
  Fc(c), Wt(() => {
    K && P === te.Initializing && D(te.Initialized);
  }, [K, P]), B(
    () => {
      const {
        onDragMove: ht
      } = H.current, {
        active: bt,
        activatorEvent: wt,
        collisions: qt,
        over: Ct
      } = St.current;
      if (!bt || !wt)
        return;
      const Tt = {
        active: bt,
        activatorEvent: wt,
        collisions: qt,
        delta: {
          x: he.x,
          y: he.y
        },
        over: Ct
      };
      ln(() => {
        ht?.(Tt), T({
          type: "onDragMove",
          event: Tt
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [he.x, he.y]
  ), B(
    () => {
      const {
        active: ht,
        activatorEvent: bt,
        collisions: wt,
        droppableContainers: qt,
        scrollAdjustedTranslate: Ct
      } = St.current;
      if (!ht || F.current == null || !bt || !Ct)
        return;
      const {
        onDragOver: Tt
      } = H.current, Bt = qt.get(Ei), pe = Bt && Bt.rect.current ? {
        id: Bt.id,
        rect: Bt.rect.current,
        data: Bt.data,
        disabled: Bt.disabled
      } : null, ct = {
        active: ht,
        activatorEvent: bt,
        collisions: wt,
        delta: {
          x: Ct.x,
          y: Ct.y
        },
        over: pe
      };
      ln(() => {
        Vi(pe), Tt?.(ct), T({
          type: "onDragOver",
          event: ct
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Ei]
  ), Wt(() => {
    St.current = {
      activatorEvent: k,
      active: O,
      activeNode: pt,
      collisionRect: fe,
      collisions: Ee,
      droppableRects: dt,
      draggableNodes: w,
      draggingNode: V,
      draggingNodeRect: E,
      droppableContainers: M,
      over: Yt,
      scrollableAncestors: ot,
      scrollAdjustedTranslate: he
    }, N.current = {
      initial: E,
      translated: fe
    };
  }, [O, pt, Ee, fe, w, V, E, dt, M, Yt, ot, he]), Ac({
    ...Ft,
    delta: C,
    draggingRect: fe,
    pointerCoordinates: Nt,
    scrollableAncestors: ot,
    scrollableAncestorRects: Vt
  });
  const Dl = W(() => ({
    active: O,
    activeNode: pt,
    activeNodeRect: K,
    activatorEvent: k,
    collisions: Ee,
    containerNodeRect: re,
    dragOverlay: A,
    draggableNodes: w,
    droppableContainers: M,
    droppableRects: dt,
    over: Yt,
    measureDroppableContainers: xt,
    scrollableAncestors: ot,
    scrollableAncestorRects: Vt,
    measuringConfiguration: X,
    measuringScheduled: Ot,
    windowRect: rt
  }), [O, pt, K, k, Ee, re, A, w, M, dt, Yt, xt, ot, Vt, X, Ot, rt]), Cl = W(() => ({
    activatorEvent: k,
    activators: ki,
    active: O,
    activeNodeRect: K,
    ariaDescribedById: {
      draggable: tt
    },
    dispatch: x,
    draggableNodes: w,
    over: Yt,
    measureDroppableContainers: xt
  }), [k, ki, O, K, x, tt, w, Yt, xt]);
  return mt.createElement(vo.Provider, {
    value: b
  }, mt.createElement(In.Provider, {
    value: Cl
  }, mt.createElement(No.Provider, {
    value: Dl
  }, mt.createElement(ko.Provider, {
    value: Tl
  }, u)), mt.createElement(Yc, {
    disabled: a?.restoreFocus === !1
  })), mt.createElement(ql, {
    ...a,
    hiddenTextDescribedById: tt
  }));
  function Al() {
    const ht = G?.autoScrollEnabled === !1, bt = typeof l == "object" ? l.enabled === !1 : l === !1, wt = R && !ht && !bt;
    return typeof l == "object" ? {
      ...l,
      enabled: wt
    } : {
      enabled: wt
    };
  }
}), tu = /* @__PURE__ */ Lt(null), Yi = "button", eu = "Draggable";
function nu(t) {
  let {
    id: e,
    data: n,
    disabled: s = !1,
    attributes: i
  } = t;
  const r = en(eu), {
    activators: o,
    activatorEvent: a,
    active: l,
    activeNodeRect: u,
    ariaDescribedById: c,
    draggableNodes: d,
    over: h
  } = q(In), {
    role: f = Yi,
    roleDescription: g = "draggable",
    tabIndex: v = 0
  } = i ?? {}, y = l?.id === e, x = q(y ? ko : tu), [T, b] = bn(), [P, D] = bn(), R = Bc(o, e), m = We(n);
  Wt(
    () => (d.set(e, {
      id: e,
      key: r,
      node: T,
      activatorNode: P,
      data: m
    }), () => {
      const C = d.get(e);
      C && C.key === r && d.delete(e);
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d, e]
  );
  const w = W(() => ({
    role: f,
    tabIndex: v,
    "aria-disabled": s,
    "aria-pressed": y && f === Yi ? !0 : void 0,
    "aria-roledescription": g,
    "aria-describedby": c.draggable
  }), [s, f, v, y, g, c.draggable]);
  return {
    active: l,
    activatorEvent: a,
    activeNodeRect: u,
    attributes: w,
    isDragging: y,
    listeners: s ? void 0 : R,
    node: T,
    over: h,
    setNodeRef: b,
    setActivatorNodeRef: D,
    transform: x
  };
}
function su() {
  return q(No);
}
const iu = "Droppable", ru = {
  timeout: 25
};
function ou(t) {
  let {
    data: e,
    disabled: n = !1,
    id: s,
    resizeObserverConfig: i
  } = t;
  const r = en(iu), {
    active: o,
    dispatch: a,
    over: l,
    measureDroppableContainers: u
  } = q(In), c = j({
    disabled: n
  }), d = j(!1), h = j(null), f = j(null), {
    disabled: g,
    updateMeasurementsFor: v,
    timeout: y
  } = {
    ...ru,
    ...i
  }, x = We(v ?? s), T = lt(
    () => {
      if (!d.current) {
        d.current = !0;
        return;
      }
      f.current != null && clearTimeout(f.current), f.current = setTimeout(() => {
        u(Array.isArray(x.current) ? x.current : [x.current]), f.current = null;
      }, y);
    },
    //eslint-disable-next-line react-hooks/exhaustive-deps
    [y]
  ), b = kn({
    callback: T,
    disabled: g || !o
  }), P = lt((w, C) => {
    b && (C && (b.unobserve(C), d.current = !1), w && b.observe(w));
  }, [b]), [D, R] = bn(P), m = We(e);
  return B(() => {
    !b || !D.current || (b.disconnect(), d.current = !1, b.observe(D.current));
  }, [D, b]), B(
    () => (a({
      type: it.RegisterDroppable,
      element: {
        id: s,
        key: r,
        disabled: n,
        node: D,
        rect: h,
        data: m
      }
    }), () => a({
      type: it.UnregisterDroppable,
      key: r,
      id: s
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s]
  ), B(() => {
    n !== c.current.disabled && (a({
      type: it.SetDroppableDisabled,
      id: s,
      key: r,
      disabled: n
    }), c.current.disabled = n);
  }, [s, r, n, a]), {
    active: o,
    rect: h,
    isOver: l?.id === s,
    node: D,
    over: l,
    setNodeRef: R
  };
}
function Ys(t, e, n) {
  const s = t.slice();
  return s.splice(n < 0 ? s.length + n : n, 0, s.splice(e, 1)[0]), s;
}
function au(t, e) {
  return t.reduce((n, s, i) => {
    const r = e.get(s);
    return r && (n[i] = r), n;
  }, Array(t.length));
}
function cn(t) {
  return t !== null && t >= 0;
}
function lu(t, e) {
  if (t === e)
    return !0;
  if (t.length !== e.length)
    return !1;
  for (let n = 0; n < t.length; n++)
    if (t[n] !== e[n])
      return !1;
  return !0;
}
function cu(t) {
  return typeof t == "boolean" ? {
    draggable: t,
    droppable: t
  } : t;
}
const Io = (t) => {
  let {
    rects: e,
    activeIndex: n,
    overIndex: s,
    index: i
  } = t;
  const r = Ys(e, s, n), o = e[i], a = r[i];
  return !a || !o ? null : {
    x: a.left - o.left,
    y: a.top - o.top,
    scaleX: a.width / o.width,
    scaleY: a.height / o.height
  };
}, un = {
  scaleX: 1,
  scaleY: 1
}, uu = (t) => {
  var e;
  let {
    activeIndex: n,
    activeNodeRect: s,
    index: i,
    rects: r,
    overIndex: o
  } = t;
  const a = (e = r[n]) != null ? e : s;
  if (!a)
    return null;
  if (i === n) {
    const u = r[o];
    return u ? {
      x: 0,
      y: n < o ? u.top + u.height - (a.top + a.height) : u.top - a.top,
      ...un
    } : null;
  }
  const l = du(r, i, n);
  return i > n && i <= o ? {
    x: 0,
    y: -a.height - l,
    ...un
  } : i < n && i >= o ? {
    x: 0,
    y: a.height + l,
    ...un
  } : {
    x: 0,
    y: 0,
    ...un
  };
};
function du(t, e, n) {
  const s = t[e], i = t[e - 1], r = t[e + 1];
  return s ? n < e ? i ? s.top - (i.top + i.height) : r ? r.top - (s.top + s.height) : 0 : r ? r.top - (s.top + s.height) : i ? s.top - (i.top + i.height) : 0 : 0;
}
const jo = "Sortable", Lo = /* @__PURE__ */ mt.createContext({
  activeIndex: -1,
  containerId: jo,
  disableTransforms: !1,
  items: [],
  overIndex: -1,
  useDragOverlay: !1,
  sortedRects: [],
  strategy: Io,
  disabled: {
    draggable: !1,
    droppable: !1
  }
});
function hu(t) {
  let {
    children: e,
    id: n,
    items: s,
    strategy: i = Io,
    disabled: r = !1
  } = t;
  const {
    active: o,
    dragOverlay: a,
    droppableRects: l,
    over: u,
    measureDroppableContainers: c
  } = su(), d = en(jo, n), h = a.rect !== null, f = W(() => s.map((R) => typeof R == "object" && "id" in R ? R.id : R), [s]), g = o != null, v = o ? f.indexOf(o.id) : -1, y = u ? f.indexOf(u.id) : -1, x = j(f), T = !lu(f, x.current), b = y !== -1 && v === -1 || T, P = cu(r);
  Wt(() => {
    T && g && c(f);
  }, [T, f, g, c]), B(() => {
    x.current = f;
  }, [f]);
  const D = W(
    () => ({
      activeIndex: v,
      containerId: d,
      disabled: P,
      disableTransforms: b,
      items: f,
      overIndex: y,
      useDragOverlay: h,
      sortedRects: au(f, l),
      strategy: i
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [v, d, P.draggable, P.droppable, b, f, y, l, h, i]
  );
  return mt.createElement(Lo.Provider, {
    value: D
  }, e);
}
const fu = (t) => {
  let {
    id: e,
    items: n,
    activeIndex: s,
    overIndex: i
  } = t;
  return Ys(n, s, i).indexOf(e);
}, pu = (t) => {
  let {
    containerId: e,
    isSorting: n,
    wasDragging: s,
    index: i,
    items: r,
    newIndex: o,
    previousItems: a,
    previousContainerId: l,
    transition: u
  } = t;
  return !u || !s || a !== r && i === o ? !1 : n ? !0 : o !== i && e === l;
}, mu = {
  duration: 200,
  easing: "ease"
}, Oo = "transform", gu = /* @__PURE__ */ Ge.Transition.toString({
  property: Oo,
  duration: 0,
  easing: "linear"
}), yu = {
  roleDescription: "sortable"
};
function vu(t) {
  let {
    disabled: e,
    index: n,
    node: s,
    rect: i
  } = t;
  const [r, o] = L(null), a = j(n);
  return Wt(() => {
    if (!e && n !== a.current && s.current) {
      const l = i.current;
      if (l) {
        const u = Ae(s.current, {
          ignoreTransform: !0
        }), c = {
          x: l.left - u.left,
          y: l.top - u.top,
          scaleX: l.width / u.width,
          scaleY: l.height / u.height
        };
        (c.x || c.y) && o(c);
      }
    }
    n !== a.current && (a.current = n);
  }, [e, n, s, i]), B(() => {
    r && o(null);
  }, [r]), r;
}
function xu(t) {
  let {
    animateLayoutChanges: e = pu,
    attributes: n,
    disabled: s,
    data: i,
    getNewIndex: r = fu,
    id: o,
    strategy: a,
    resizeObserverConfig: l,
    transition: u = mu
  } = t;
  const {
    items: c,
    containerId: d,
    activeIndex: h,
    disabled: f,
    disableTransforms: g,
    sortedRects: v,
    overIndex: y,
    useDragOverlay: x,
    strategy: T
  } = q(Lo), b = bu(s, f), P = c.indexOf(o), D = W(() => ({
    sortable: {
      containerId: d,
      index: P,
      items: c
    },
    ...i
  }), [d, i, P, c]), R = W(() => c.slice(c.indexOf(o)), [c, o]), {
    rect: m,
    node: w,
    isOver: C,
    setNodeRef: M
  } = ou({
    id: o,
    data: D,
    disabled: b.droppable,
    resizeObserverConfig: {
      updateMeasurementsFor: R,
      ...l
    }
  }), {
    active: S,
    activatorEvent: N,
    activeNodeRect: O,
    attributes: F,
    setNodeRef: G,
    listeners: _,
    isDragging: k,
    over: U,
    setActivatorNodeRef: H,
    transform: tt
  } = nu({
    id: o,
    data: D,
    attributes: {
      ...yu,
      ...n
    },
    disabled: b.draggable
  }), et = Ol(M, G), X = !!S, dt = X && !g && cn(h) && cn(y), xt = !x && k, Ot = xt && dt ? tt : null, ie = dt ? Ot ?? (a ?? T)({
    rects: v,
    activeNodeRect: O,
    activeIndex: h,
    overIndex: y,
    index: P
  }) : null, Ft = cn(h) && cn(y) ? r({
    id: o,
    items: c,
    activeIndex: h,
    overIndex: y
  }) : P, Et = S?.id, K = j({
    activeId: Et,
    items: c,
    newIndex: Ft,
    containerId: d
  }), re = c !== K.current.items, St = e({
    active: S,
    containerId: d,
    isDragging: k,
    isSorting: X,
    id: o,
    index: P,
    items: c,
    newIndex: K.current.newIndex,
    previousItems: K.current.items,
    previousContainerId: K.current.containerId,
    transition: u,
    wasDragging: K.current.activeId != null
  }), Xt = vu({
    disabled: !St,
    index: P,
    node: w,
    rect: m
  });
  return B(() => {
    X && K.current.newIndex !== Ft && (K.current.newIndex = Ft), d !== K.current.containerId && (K.current.containerId = d), c !== K.current.items && (K.current.items = c);
  }, [X, Ft, d, c]), B(() => {
    if (Et === K.current.activeId)
      return;
    if (Et != null && K.current.activeId == null) {
      K.current.activeId = Et;
      return;
    }
    const V = setTimeout(() => {
      K.current.activeId = Et;
    }, 50);
    return () => clearTimeout(V);
  }, [Et]), {
    active: S,
    activeIndex: h,
    attributes: F,
    data: D,
    rect: m,
    index: P,
    newIndex: Ft,
    items: c,
    isOver: C,
    isSorting: X,
    isDragging: k,
    listeners: _,
    node: w,
    overIndex: y,
    over: U,
    setNodeRef: et,
    setActivatorNodeRef: H,
    setDroppableNodeRef: M,
    setDraggableNodeRef: G,
    transform: Xt ?? ie,
    transition: A()
  };
  function A() {
    if (
      // Temporarily disable transitions for a single frame to set up derived transforms
      Xt || // Or to prevent items jumping to back to their "new" position when items change
      re && K.current.newIndex === P
    )
      return gu;
    if (!(xt && !Ws(N) || !u) && (X || St))
      return Ge.Transition.toString({
        ...u,
        property: Oo
      });
  }
}
function bu(t, e) {
  var n, s;
  return typeof t == "boolean" ? {
    draggable: t,
    // Backwards compatibility
    droppable: !1
  } : {
    draggable: (n = t?.draggable) != null ? n : e.draggable,
    droppable: (s = t?.droppable) != null ? s : e.droppable
  };
}
function Sn(t) {
  if (!t)
    return !1;
  const e = t.data.current;
  return !!(e && "sortable" in e && typeof e.sortable == "object" && "containerId" in e.sortable && "items" in e.sortable && "index" in e.sortable);
}
const wu = [$.Down, $.Right, $.Up, $.Left], Tu = (t, e) => {
  let {
    context: {
      active: n,
      collisionRect: s,
      droppableRects: i,
      droppableContainers: r,
      over: o,
      scrollableAncestors: a
    }
  } = e;
  if (wu.includes(t.code)) {
    if (t.preventDefault(), !n || !s)
      return;
    const l = [];
    r.getEnabled().forEach((d) => {
      if (!d || d != null && d.disabled)
        return;
      const h = i.get(d.id);
      if (h)
        switch (t.code) {
          case $.Down:
            s.top < h.top && l.push(d);
            break;
          case $.Up:
            s.top > h.top && l.push(d);
            break;
          case $.Left:
            s.left > h.left && l.push(d);
            break;
          case $.Right:
            s.left < h.left && l.push(d);
            break;
        }
    });
    const u = tc({
      collisionRect: s,
      droppableRects: i,
      droppableContainers: l
    });
    let c = wo(u, "id");
    if (c === o?.id && u.length > 1 && (c = u[1].id), c != null) {
      const d = r.get(n.id), h = r.get(c), f = h ? i.get(h.id) : null, g = h?.node.current;
      if (g && f && d && h) {
        const y = Nn(g).some((R, m) => a[m] !== R), x = Fo(d, h), T = Su(d, h), b = y || !x ? {
          x: 0,
          y: 0
        } : {
          x: T ? s.width - f.width : 0,
          y: T ? s.height - f.height : 0
        }, P = {
          x: f.left,
          y: f.top
        };
        return b.x && b.y ? P : Ke(P, b);
      }
    }
  }
};
function Fo(t, e) {
  return !Sn(t) || !Sn(e) ? !1 : t.data.current.sortable.containerId === e.data.current.sortable.containerId;
}
function Su(t, e) {
  return !Sn(t) || !Sn(e) || !Fo(t, e) ? !1 : t.data.current.sortable.index < e.data.current.sortable.index;
}
const qs = Lt({});
function Js(t) {
  const e = j(null);
  return e.current === null && (e.current = t()), e.current;
}
const Zs = typeof window < "u", Bo = Zs ? fo : B, jn = /* @__PURE__ */ Lt(null);
function Qs(t, e) {
  t.indexOf(e) === -1 && t.push(e);
}
function ti(t, e) {
  const n = t.indexOf(e);
  n > -1 && t.splice(n, 1);
}
const Gt = (t, e, n) => n > e ? e : n < t ? t : n;
let ei = () => {
};
const Ht = {}, $o = (t) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(t);
function _o(t) {
  return typeof t == "object" && t !== null;
}
const Uo = (t) => /^0[^.\s]+$/u.test(t);
// @__NO_SIDE_EFFECTS__
function ni(t) {
  let e;
  return () => (e === void 0 && (e = t()), e);
}
const Mt = /* @__NO_SIDE_EFFECTS__ */ (t) => t, Du = (t, e) => (n) => e(t(n)), nn = (...t) => t.reduce(Du), Xe = /* @__NO_SIDE_EFFECTS__ */ (t, e, n) => {
  const s = e - t;
  return s === 0 ? 1 : (n - t) / s;
};
class si {
  constructor() {
    this.subscriptions = [];
  }
  add(e) {
    return Qs(this.subscriptions, e), () => ti(this.subscriptions, e);
  }
  notify(e, n, s) {
    const i = this.subscriptions.length;
    if (i)
      if (i === 1)
        this.subscriptions[0](e, n, s);
      else
        for (let r = 0; r < i; r++) {
          const o = this.subscriptions[r];
          o && o(e, n, s);
        }
  }
  getSize() {
    return this.subscriptions.length;
  }
  clear() {
    this.subscriptions.length = 0;
  }
}
const Ut = /* @__NO_SIDE_EFFECTS__ */ (t) => t * 1e3, Rt = /* @__NO_SIDE_EFFECTS__ */ (t) => t / 1e3;
function zo(t, e) {
  return e ? t * (1e3 / e) : 0;
}
const Wo = (t, e, n) => (((1 - 3 * n + 3 * e) * t + (3 * n - 6 * e)) * t + 3 * e) * t, Cu = 1e-7, Au = 12;
function Pu(t, e, n, s, i) {
  let r, o, a = 0;
  do
    o = e + (n - e) / 2, r = Wo(o, s, i) - t, r > 0 ? n = o : e = o;
  while (Math.abs(r) > Cu && ++a < Au);
  return o;
}
function sn(t, e, n, s) {
  if (t === e && n === s)
    return Mt;
  const i = (r) => Pu(r, 0, 1, t, n);
  return (r) => r === 0 || r === 1 ? r : Wo(i(r), e, s);
}
const Ko = (t) => (e) => e <= 0.5 ? t(2 * e) / 2 : (2 - t(2 * (1 - e))) / 2, Go = (t) => (e) => 1 - t(1 - e), Ho = /* @__PURE__ */ sn(0.33, 1.53, 0.69, 0.99), ii = /* @__PURE__ */ Go(Ho), Xo = /* @__PURE__ */ Ko(ii), Yo = (t) => (t *= 2) < 1 ? 0.5 * ii(t) : 0.5 * (2 - Math.pow(2, -10 * (t - 1))), ri = (t) => 1 - Math.sin(Math.acos(t)), qo = Go(ri), Jo = Ko(ri), Ru = /* @__PURE__ */ sn(0.42, 0, 1, 1), Mu = /* @__PURE__ */ sn(0, 0, 0.58, 1), Zo = /* @__PURE__ */ sn(0.42, 0, 0.58, 1), Eu = (t) => Array.isArray(t) && typeof t[0] != "number", Qo = (t) => Array.isArray(t) && typeof t[0] == "number", Vu = {
  linear: Mt,
  easeIn: Ru,
  easeInOut: Zo,
  easeOut: Mu,
  circIn: ri,
  circInOut: Jo,
  circOut: qo,
  backIn: ii,
  backInOut: Xo,
  backOut: Ho,
  anticipate: Yo
}, Nu = (t) => typeof t == "string", qi = (t) => {
  if (Qo(t)) {
    ei(t.length === 4);
    const [e, n, s, i] = t;
    return sn(e, n, s, i);
  } else if (Nu(t))
    return Vu[t];
  return t;
}, dn = [
  "setup",
  // Compute
  "read",
  // Read
  "resolveKeyframes",
  // Write/Read/Write/Read
  "preUpdate",
  // Compute
  "update",
  // Compute
  "preRender",
  // Compute
  "render",
  // Write
  "postRender"
  // Compute
];
function ku(t, e) {
  let n = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), i = !1, r = !1;
  const o = /* @__PURE__ */ new WeakSet();
  let a = {
    delta: 0,
    timestamp: 0,
    isProcessing: !1
  };
  function l(c) {
    o.has(c) && (u.schedule(c), t()), c(a);
  }
  const u = {
    /**
     * Schedule a process to run on the next frame.
     */
    schedule: (c, d = !1, h = !1) => {
      const g = h && i ? n : s;
      return d && o.add(c), g.has(c) || g.add(c), c;
    },
    /**
     * Cancel the provided callback from running on the next frame.
     */
    cancel: (c) => {
      s.delete(c), o.delete(c);
    },
    /**
     * Execute all schedule callbacks.
     */
    process: (c) => {
      if (a = c, i) {
        r = !0;
        return;
      }
      i = !0, [n, s] = [s, n], n.forEach(l), n.clear(), i = !1, r && (r = !1, u.process(c));
    }
  };
  return u;
}
const Iu = 40;
function ta(t, e) {
  let n = !1, s = !0;
  const i = {
    delta: 0,
    timestamp: 0,
    isProcessing: !1
  }, r = () => n = !0, o = dn.reduce((b, P) => (b[P] = ku(r), b), {}), { setup: a, read: l, resolveKeyframes: u, preUpdate: c, update: d, preRender: h, render: f, postRender: g } = o, v = () => {
    const b = Ht.useManualTiming ? i.timestamp : performance.now();
    n = !1, Ht.useManualTiming || (i.delta = s ? 1e3 / 60 : Math.max(Math.min(b - i.timestamp, Iu), 1)), i.timestamp = b, i.isProcessing = !0, a.process(i), l.process(i), u.process(i), c.process(i), d.process(i), h.process(i), f.process(i), g.process(i), i.isProcessing = !1, n && e && (s = !1, t(v));
  }, y = () => {
    n = !0, s = !0, i.isProcessing || t(v);
  };
  return { schedule: dn.reduce((b, P) => {
    const D = o[P];
    return b[P] = (R, m = !1, w = !1) => (n || y(), D.schedule(R, m, w)), b;
  }, {}), cancel: (b) => {
    for (let P = 0; P < dn.length; P++)
      o[dn[P]].cancel(b);
  }, state: i, steps: o };
}
const { schedule: Y, cancel: ee, state: ut, steps: Gn } = /* @__PURE__ */ ta(typeof requestAnimationFrame < "u" ? requestAnimationFrame : Mt, !0);
let gn;
function ju() {
  gn = void 0;
}
const yt = {
  now: () => (gn === void 0 && yt.set(ut.isProcessing || Ht.useManualTiming ? ut.timestamp : performance.now()), gn),
  set: (t) => {
    gn = t, queueMicrotask(ju);
  }
}, ea = (t) => (e) => typeof e == "string" && e.startsWith(t), na = /* @__PURE__ */ ea("--"), Lu = /* @__PURE__ */ ea("var(--"), oi = (t) => Lu(t) ? Ou.test(t.split("/*")[0].trim()) : !1, Ou = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu, Pe = {
  test: (t) => typeof t == "number",
  parse: parseFloat,
  transform: (t) => t
}, Ye = {
  ...Pe,
  transform: (t) => Gt(0, 1, t)
}, hn = {
  ...Pe,
  default: 1
}, $e = (t) => Math.round(t * 1e5) / 1e5, ai = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function Fu(t) {
  return t == null;
}
const Bu = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu, li = (t, e) => (n) => !!(typeof n == "string" && Bu.test(n) && n.startsWith(t) || e && !Fu(n) && Object.prototype.hasOwnProperty.call(n, e)), sa = (t, e, n) => (s) => {
  if (typeof s != "string")
    return s;
  const [i, r, o, a] = s.match(ai);
  return {
    [t]: parseFloat(i),
    [e]: parseFloat(r),
    [n]: parseFloat(o),
    alpha: a !== void 0 ? parseFloat(a) : 1
  };
}, $u = (t) => Gt(0, 255, t), Hn = {
  ...Pe,
  transform: (t) => Math.round($u(t))
}, le = {
  test: /* @__PURE__ */ li("rgb", "red"),
  parse: /* @__PURE__ */ sa("red", "green", "blue"),
  transform: ({ red: t, green: e, blue: n, alpha: s = 1 }) => "rgba(" + Hn.transform(t) + ", " + Hn.transform(e) + ", " + Hn.transform(n) + ", " + $e(Ye.transform(s)) + ")"
};
function _u(t) {
  let e = "", n = "", s = "", i = "";
  return t.length > 5 ? (e = t.substring(1, 3), n = t.substring(3, 5), s = t.substring(5, 7), i = t.substring(7, 9)) : (e = t.substring(1, 2), n = t.substring(2, 3), s = t.substring(3, 4), i = t.substring(4, 5), e += e, n += n, s += s, i += i), {
    red: parseInt(e, 16),
    green: parseInt(n, 16),
    blue: parseInt(s, 16),
    alpha: i ? parseInt(i, 16) / 255 : 1
  };
}
const vs = {
  test: /* @__PURE__ */ li("#"),
  parse: _u,
  transform: le.transform
}, rn = /* @__NO_SIDE_EFFECTS__ */ (t) => ({
  test: (e) => typeof e == "string" && e.endsWith(t) && e.split(" ").length === 1,
  parse: parseFloat,
  transform: (e) => `${e}${t}`
}), Qt = /* @__PURE__ */ rn("deg"), zt = /* @__PURE__ */ rn("%"), I = /* @__PURE__ */ rn("px"), Uu = /* @__PURE__ */ rn("vh"), zu = /* @__PURE__ */ rn("vw"), Ji = {
  ...zt,
  parse: (t) => zt.parse(t) / 100,
  transform: (t) => zt.transform(t * 100)
}, me = {
  test: /* @__PURE__ */ li("hsl", "hue"),
  parse: /* @__PURE__ */ sa("hue", "saturation", "lightness"),
  transform: ({ hue: t, saturation: e, lightness: n, alpha: s = 1 }) => "hsla(" + Math.round(t) + ", " + zt.transform($e(e)) + ", " + zt.transform($e(n)) + ", " + $e(Ye.transform(s)) + ")"
}, nt = {
  test: (t) => le.test(t) || vs.test(t) || me.test(t),
  parse: (t) => le.test(t) ? le.parse(t) : me.test(t) ? me.parse(t) : vs.parse(t),
  transform: (t) => typeof t == "string" ? t : t.hasOwnProperty("red") ? le.transform(t) : me.transform(t),
  getAnimatableNone: (t) => {
    const e = nt.parse(t);
    return e.alpha = 0, nt.transform(e);
  }
}, Wu = /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
function Ku(t) {
  return isNaN(t) && typeof t == "string" && (t.match(ai)?.length || 0) + (t.match(Wu)?.length || 0) > 0;
}
const ia = "number", ra = "color", Gu = "var", Hu = "var(", Zi = "${}", Xu = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function qe(t) {
  const e = t.toString(), n = [], s = {
    color: [],
    number: [],
    var: []
  }, i = [];
  let r = 0;
  const a = e.replace(Xu, (l) => (nt.test(l) ? (s.color.push(r), i.push(ra), n.push(nt.parse(l))) : l.startsWith(Hu) ? (s.var.push(r), i.push(Gu), n.push(l)) : (s.number.push(r), i.push(ia), n.push(parseFloat(l))), ++r, Zi)).split(Zi);
  return { values: n, split: a, indexes: s, types: i };
}
function oa(t) {
  return qe(t).values;
}
function aa(t) {
  const { split: e, types: n } = qe(t), s = e.length;
  return (i) => {
    let r = "";
    for (let o = 0; o < s; o++)
      if (r += e[o], i[o] !== void 0) {
        const a = n[o];
        a === ia ? r += $e(i[o]) : a === ra ? r += nt.transform(i[o]) : r += i[o];
      }
    return r;
  };
}
const Yu = (t) => typeof t == "number" ? 0 : nt.test(t) ? nt.getAnimatableNone(t) : t;
function qu(t) {
  const e = oa(t);
  return aa(t)(e.map(Yu));
}
const ne = {
  test: Ku,
  parse: oa,
  createTransformer: aa,
  getAnimatableNone: qu
};
function Xn(t, e, n) {
  return n < 0 && (n += 1), n > 1 && (n -= 1), n < 1 / 6 ? t + (e - t) * 6 * n : n < 1 / 2 ? e : n < 2 / 3 ? t + (e - t) * (2 / 3 - n) * 6 : t;
}
function Ju({ hue: t, saturation: e, lightness: n, alpha: s }) {
  t /= 360, e /= 100, n /= 100;
  let i = 0, r = 0, o = 0;
  if (!e)
    i = r = o = n;
  else {
    const a = n < 0.5 ? n * (1 + e) : n + e - n * e, l = 2 * n - a;
    i = Xn(l, a, t + 1 / 3), r = Xn(l, a, t), o = Xn(l, a, t - 1 / 3);
  }
  return {
    red: Math.round(i * 255),
    green: Math.round(r * 255),
    blue: Math.round(o * 255),
    alpha: s
  };
}
function Dn(t, e) {
  return (n) => n > 0 ? e : t;
}
const J = (t, e, n) => t + (e - t) * n, Yn = (t, e, n) => {
  const s = t * t, i = n * (e * e - s) + s;
  return i < 0 ? 0 : Math.sqrt(i);
}, Zu = [vs, le, me], Qu = (t) => Zu.find((e) => e.test(t));
function Qi(t) {
  const e = Qu(t);
  if (!e)
    return !1;
  let n = e.parse(t);
  return e === me && (n = Ju(n)), n;
}
const tr = (t, e) => {
  const n = Qi(t), s = Qi(e);
  if (!n || !s)
    return Dn(t, e);
  const i = { ...n };
  return (r) => (i.red = Yn(n.red, s.red, r), i.green = Yn(n.green, s.green, r), i.blue = Yn(n.blue, s.blue, r), i.alpha = J(n.alpha, s.alpha, r), le.transform(i));
}, xs = /* @__PURE__ */ new Set(["none", "hidden"]);
function td(t, e) {
  return xs.has(t) ? (n) => n <= 0 ? t : e : (n) => n >= 1 ? e : t;
}
function ed(t, e) {
  return (n) => J(t, e, n);
}
function ci(t) {
  return typeof t == "number" ? ed : typeof t == "string" ? oi(t) ? Dn : nt.test(t) ? tr : id : Array.isArray(t) ? la : typeof t == "object" ? nt.test(t) ? tr : nd : Dn;
}
function la(t, e) {
  const n = [...t], s = n.length, i = t.map((r, o) => ci(r)(r, e[o]));
  return (r) => {
    for (let o = 0; o < s; o++)
      n[o] = i[o](r);
    return n;
  };
}
function nd(t, e) {
  const n = { ...t, ...e }, s = {};
  for (const i in n)
    t[i] !== void 0 && e[i] !== void 0 && (s[i] = ci(t[i])(t[i], e[i]));
  return (i) => {
    for (const r in s)
      n[r] = s[r](i);
    return n;
  };
}
function sd(t, e) {
  const n = [], s = { color: 0, var: 0, number: 0 };
  for (let i = 0; i < e.values.length; i++) {
    const r = e.types[i], o = t.indexes[r][s[r]], a = t.values[o] ?? 0;
    n[i] = a, s[r]++;
  }
  return n;
}
const id = (t, e) => {
  const n = ne.createTransformer(e), s = qe(t), i = qe(e);
  return s.indexes.var.length === i.indexes.var.length && s.indexes.color.length === i.indexes.color.length && s.indexes.number.length >= i.indexes.number.length ? xs.has(t) && !i.values.length || xs.has(e) && !s.values.length ? td(t, e) : nn(la(sd(s, i), i.values), n) : Dn(t, e);
};
function ca(t, e, n) {
  return typeof t == "number" && typeof e == "number" && typeof n == "number" ? J(t, e, n) : ci(t)(t, e);
}
const rd = (t) => {
  const e = ({ timestamp: n }) => t(n);
  return {
    start: (n = !0) => Y.update(e, n),
    stop: () => ee(e),
    /**
     * If we're processing this frame we can use the
     * framelocked timestamp to keep things in sync.
     */
    now: () => ut.isProcessing ? ut.timestamp : yt.now()
  };
}, ua = (t, e, n = 10) => {
  let s = "";
  const i = Math.max(Math.round(e / n), 2);
  for (let r = 0; r < i; r++)
    s += Math.round(t(r / (i - 1)) * 1e4) / 1e4 + ", ";
  return `linear(${s.substring(0, s.length - 2)})`;
}, Cn = 2e4;
function ui(t) {
  let e = 0;
  const n = 50;
  let s = t.next(e);
  for (; !s.done && e < Cn; )
    e += n, s = t.next(e);
  return e >= Cn ? 1 / 0 : e;
}
function od(t, e = 100, n) {
  const s = n({ ...t, keyframes: [0, e] }), i = Math.min(ui(s), Cn);
  return {
    type: "keyframes",
    ease: (r) => s.next(i * r).value / e,
    duration: /* @__PURE__ */ Rt(i)
  };
}
const ad = 5;
function da(t, e, n) {
  const s = Math.max(e - ad, 0);
  return zo(n - t(s), e - s);
}
const Q = {
  // Default spring physics
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
  // Default duration/bounce-based options
  duration: 800,
  // in ms
  bounce: 0.3,
  visualDuration: 0.3,
  // in seconds
  // Rest thresholds
  restSpeed: {
    granular: 0.01,
    default: 2
  },
  restDelta: {
    granular: 5e-3,
    default: 0.5
  },
  // Limits
  minDuration: 0.01,
  // in seconds
  maxDuration: 10,
  // in seconds
  minDamping: 0.05,
  maxDamping: 1
}, qn = 1e-3;
function ld({ duration: t = Q.duration, bounce: e = Q.bounce, velocity: n = Q.velocity, mass: s = Q.mass }) {
  let i, r, o = 1 - e;
  o = Gt(Q.minDamping, Q.maxDamping, o), t = Gt(Q.minDuration, Q.maxDuration, /* @__PURE__ */ Rt(t)), o < 1 ? (i = (u) => {
    const c = u * o, d = c * t, h = c - n, f = bs(u, o), g = Math.exp(-d);
    return qn - h / f * g;
  }, r = (u) => {
    const d = u * o * t, h = d * n + n, f = Math.pow(o, 2) * Math.pow(u, 2) * t, g = Math.exp(-d), v = bs(Math.pow(u, 2), o);
    return (-i(u) + qn > 0 ? -1 : 1) * ((h - f) * g) / v;
  }) : (i = (u) => {
    const c = Math.exp(-u * t), d = (u - n) * t + 1;
    return -qn + c * d;
  }, r = (u) => {
    const c = Math.exp(-u * t), d = (n - u) * (t * t);
    return c * d;
  });
  const a = 5 / t, l = ud(i, r, a);
  if (t = /* @__PURE__ */ Ut(t), isNaN(l))
    return {
      stiffness: Q.stiffness,
      damping: Q.damping,
      duration: t
    };
  {
    const u = Math.pow(l, 2) * s;
    return {
      stiffness: u,
      damping: o * 2 * Math.sqrt(s * u),
      duration: t
    };
  }
}
const cd = 12;
function ud(t, e, n) {
  let s = n;
  for (let i = 1; i < cd; i++)
    s = s - t(s) / e(s);
  return s;
}
function bs(t, e) {
  return t * Math.sqrt(1 - e * e);
}
const dd = ["duration", "bounce"], hd = ["stiffness", "damping", "mass"];
function er(t, e) {
  return e.some((n) => t[n] !== void 0);
}
function fd(t) {
  let e = {
    velocity: Q.velocity,
    stiffness: Q.stiffness,
    damping: Q.damping,
    mass: Q.mass,
    isResolvedFromDuration: !1,
    ...t
  };
  if (!er(t, hd) && er(t, dd))
    if (t.visualDuration) {
      const n = t.visualDuration, s = 2 * Math.PI / (n * 1.2), i = s * s, r = 2 * Gt(0.05, 1, 1 - (t.bounce || 0)) * Math.sqrt(i);
      e = {
        ...e,
        mass: Q.mass,
        stiffness: i,
        damping: r
      };
    } else {
      const n = ld(t);
      e = {
        ...e,
        ...n,
        mass: Q.mass
      }, e.isResolvedFromDuration = !0;
    }
  return e;
}
function An(t = Q.visualDuration, e = Q.bounce) {
  const n = typeof t != "object" ? {
    visualDuration: t,
    keyframes: [0, 1],
    bounce: e
  } : t;
  let { restSpeed: s, restDelta: i } = n;
  const r = n.keyframes[0], o = n.keyframes[n.keyframes.length - 1], a = { done: !1, value: r }, { stiffness: l, damping: u, mass: c, duration: d, velocity: h, isResolvedFromDuration: f } = fd({
    ...n,
    velocity: -/* @__PURE__ */ Rt(n.velocity || 0)
  }), g = h || 0, v = u / (2 * Math.sqrt(l * c)), y = o - r, x = /* @__PURE__ */ Rt(Math.sqrt(l / c)), T = Math.abs(y) < 5;
  s || (s = T ? Q.restSpeed.granular : Q.restSpeed.default), i || (i = T ? Q.restDelta.granular : Q.restDelta.default);
  let b;
  if (v < 1) {
    const D = bs(x, v);
    b = (R) => {
      const m = Math.exp(-v * x * R);
      return o - m * ((g + v * x * y) / D * Math.sin(D * R) + y * Math.cos(D * R));
    };
  } else if (v === 1)
    b = (D) => o - Math.exp(-x * D) * (y + (g + x * y) * D);
  else {
    const D = x * Math.sqrt(v * v - 1);
    b = (R) => {
      const m = Math.exp(-v * x * R), w = Math.min(D * R, 300);
      return o - m * ((g + v * x * y) * Math.sinh(w) + D * y * Math.cosh(w)) / D;
    };
  }
  const P = {
    calculatedDuration: f && d || null,
    next: (D) => {
      const R = b(D);
      if (f)
        a.done = D >= d;
      else {
        let m = D === 0 ? g : 0;
        v < 1 && (m = D === 0 ? /* @__PURE__ */ Ut(g) : da(b, D, R));
        const w = Math.abs(m) <= s, C = Math.abs(o - R) <= i;
        a.done = w && C;
      }
      return a.value = a.done ? o : R, a;
    },
    toString: () => {
      const D = Math.min(ui(P), Cn), R = ua((m) => P.next(D * m).value, D, 30);
      return D + "ms " + R;
    },
    toTransition: () => {
    }
  };
  return P;
}
An.applyToOptions = (t) => {
  const e = od(t, 100, An);
  return t.ease = e.ease, t.duration = /* @__PURE__ */ Ut(e.duration), t.type = "keyframes", t;
};
function ws({ keyframes: t, velocity: e = 0, power: n = 0.8, timeConstant: s = 325, bounceDamping: i = 10, bounceStiffness: r = 500, modifyTarget: o, min: a, max: l, restDelta: u = 0.5, restSpeed: c }) {
  const d = t[0], h = {
    done: !1,
    value: d
  }, f = (w) => a !== void 0 && w < a || l !== void 0 && w > l, g = (w) => a === void 0 ? l : l === void 0 || Math.abs(a - w) < Math.abs(l - w) ? a : l;
  let v = n * e;
  const y = d + v, x = o === void 0 ? y : o(y);
  x !== y && (v = x - d);
  const T = (w) => -v * Math.exp(-w / s), b = (w) => x + T(w), P = (w) => {
    const C = T(w), M = b(w);
    h.done = Math.abs(C) <= u, h.value = h.done ? x : M;
  };
  let D, R;
  const m = (w) => {
    f(h.value) && (D = w, R = An({
      keyframes: [h.value, g(h.value)],
      velocity: da(b, w, h.value),
      // TODO: This should be passing * 1000
      damping: i,
      stiffness: r,
      restDelta: u,
      restSpeed: c
    }));
  };
  return m(0), {
    calculatedDuration: null,
    next: (w) => {
      let C = !1;
      return !R && D === void 0 && (C = !0, P(w), m(w)), D !== void 0 && w >= D ? R.next(w - D) : (!C && P(w), h);
    }
  };
}
function pd(t, e, n) {
  const s = [], i = n || Ht.mix || ca, r = t.length - 1;
  for (let o = 0; o < r; o++) {
    let a = i(t[o], t[o + 1]);
    if (e) {
      const l = Array.isArray(e) ? e[o] || Mt : e;
      a = nn(l, a);
    }
    s.push(a);
  }
  return s;
}
function md(t, e, { clamp: n = !0, ease: s, mixer: i } = {}) {
  const r = t.length;
  if (ei(r === e.length), r === 1)
    return () => e[0];
  if (r === 2 && e[0] === e[1])
    return () => e[1];
  const o = t[0] === t[1];
  t[0] > t[r - 1] && (t = [...t].reverse(), e = [...e].reverse());
  const a = pd(e, s, i), l = a.length, u = (c) => {
    if (o && c < t[0])
      return e[0];
    let d = 0;
    if (l > 1)
      for (; d < t.length - 2 && !(c < t[d + 1]); d++)
        ;
    const h = /* @__PURE__ */ Xe(t[d], t[d + 1], c);
    return a[d](h);
  };
  return n ? (c) => u(Gt(t[0], t[r - 1], c)) : u;
}
function gd(t, e) {
  const n = t[t.length - 1];
  for (let s = 1; s <= e; s++) {
    const i = /* @__PURE__ */ Xe(0, e, s);
    t.push(J(n, 1, i));
  }
}
function yd(t) {
  const e = [0];
  return gd(e, t.length - 1), e;
}
function vd(t, e) {
  return t.map((n) => n * e);
}
function xd(t, e) {
  return t.map(() => e || Zo).splice(0, t.length - 1);
}
function _e({ duration: t = 300, keyframes: e, times: n, ease: s = "easeInOut" }) {
  const i = Eu(s) ? s.map(qi) : qi(s), r = {
    done: !1,
    value: e[0]
  }, o = vd(
    // Only use the provided offsets if they're the correct length
    // TODO Maybe we should warn here if there's a length mismatch
    n && n.length === e.length ? n : yd(e),
    t
  ), a = md(o, e, {
    ease: Array.isArray(i) ? i : xd(e, i)
  });
  return {
    calculatedDuration: t,
    next: (l) => (r.value = a(l), r.done = l >= t, r)
  };
}
const bd = (t) => t !== null;
function di(t, { repeat: e, repeatType: n = "loop" }, s, i = 1) {
  const r = t.filter(bd), a = i < 0 || e && n !== "loop" && e % 2 === 1 ? 0 : r.length - 1;
  return !a || s === void 0 ? r[a] : s;
}
const wd = {
  decay: ws,
  inertia: ws,
  tween: _e,
  keyframes: _e,
  spring: An
};
function ha(t) {
  typeof t.type == "string" && (t.type = wd[t.type]);
}
class hi {
  constructor() {
    this.updateFinished();
  }
  get finished() {
    return this._finished;
  }
  updateFinished() {
    this._finished = new Promise((e) => {
      this.resolve = e;
    });
  }
  notifyFinished() {
    this.resolve();
  }
  /**
   * Allows the animation to be awaited.
   *
   * @deprecated Use `finished` instead.
   */
  then(e, n) {
    return this.finished.then(e, n);
  }
}
const Td = (t) => t / 100;
class fi extends hi {
  constructor(e) {
    super(), this.state = "idle", this.startTime = null, this.isStopped = !1, this.currentTime = 0, this.holdTime = null, this.playbackSpeed = 1, this.stop = () => {
      const { motionValue: n } = this.options;
      n && n.updatedAt !== yt.now() && this.tick(yt.now()), this.isStopped = !0, this.state !== "idle" && (this.teardown(), this.options.onStop?.());
    }, this.options = e, this.initAnimation(), this.play(), e.autoplay === !1 && this.pause();
  }
  initAnimation() {
    const { options: e } = this;
    ha(e);
    const { type: n = _e, repeat: s = 0, repeatDelay: i = 0, repeatType: r, velocity: o = 0 } = e;
    let { keyframes: a } = e;
    const l = n || _e;
    l !== _e && typeof a[0] != "number" && (this.mixKeyframes = nn(Td, ca(a[0], a[1])), a = [0, 100]);
    const u = l({ ...e, keyframes: a });
    r === "mirror" && (this.mirroredGenerator = l({
      ...e,
      keyframes: [...a].reverse(),
      velocity: -o
    })), u.calculatedDuration === null && (u.calculatedDuration = ui(u));
    const { calculatedDuration: c } = u;
    this.calculatedDuration = c, this.resolvedDuration = c + i, this.totalDuration = this.resolvedDuration * (s + 1) - i, this.generator = u;
  }
  updateTime(e) {
    const n = Math.round(e - this.startTime) * this.playbackSpeed;
    this.holdTime !== null ? this.currentTime = this.holdTime : this.currentTime = n;
  }
  tick(e, n = !1) {
    const { generator: s, totalDuration: i, mixKeyframes: r, mirroredGenerator: o, resolvedDuration: a, calculatedDuration: l } = this;
    if (this.startTime === null)
      return s.next(0);
    const { delay: u = 0, keyframes: c, repeat: d, repeatType: h, repeatDelay: f, type: g, onUpdate: v, finalKeyframe: y } = this.options;
    this.speed > 0 ? this.startTime = Math.min(this.startTime, e) : this.speed < 0 && (this.startTime = Math.min(e - i / this.speed, this.startTime)), n ? this.currentTime = e : this.updateTime(e);
    const x = this.currentTime - u * (this.playbackSpeed >= 0 ? 1 : -1), T = this.playbackSpeed >= 0 ? x < 0 : x > i;
    this.currentTime = Math.max(x, 0), this.state === "finished" && this.holdTime === null && (this.currentTime = i);
    let b = this.currentTime, P = s;
    if (d) {
      const w = Math.min(this.currentTime, i) / a;
      let C = Math.floor(w), M = w % 1;
      !M && w >= 1 && (M = 1), M === 1 && C--, C = Math.min(C, d + 1), !!(C % 2) && (h === "reverse" ? (M = 1 - M, f && (M -= f / a)) : h === "mirror" && (P = o)), b = Gt(0, 1, M) * a;
    }
    const D = T ? { done: !1, value: c[0] } : P.next(b);
    r && (D.value = r(D.value));
    let { done: R } = D;
    !T && l !== null && (R = this.playbackSpeed >= 0 ? this.currentTime >= i : this.currentTime <= 0);
    const m = this.holdTime === null && (this.state === "finished" || this.state === "running" && R);
    return m && g !== ws && (D.value = di(c, this.options, y, this.speed)), v && v(D.value), m && this.finish(), D;
  }
  /**
   * Allows the returned animation to be awaited or promise-chained. Currently
   * resolves when the animation finishes at all but in a future update could/should
   * reject if its cancels.
   */
  then(e, n) {
    return this.finished.then(e, n);
  }
  get duration() {
    return /* @__PURE__ */ Rt(this.calculatedDuration);
  }
  get iterationDuration() {
    const { delay: e = 0 } = this.options || {};
    return this.duration + /* @__PURE__ */ Rt(e);
  }
  get time() {
    return /* @__PURE__ */ Rt(this.currentTime);
  }
  set time(e) {
    e = /* @__PURE__ */ Ut(e), this.currentTime = e, this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0 ? this.holdTime = e : this.driver && (this.startTime = this.driver.now() - e / this.playbackSpeed), this.driver?.start(!1);
  }
  get speed() {
    return this.playbackSpeed;
  }
  set speed(e) {
    this.updateTime(yt.now());
    const n = this.playbackSpeed !== e;
    this.playbackSpeed = e, n && (this.time = /* @__PURE__ */ Rt(this.currentTime));
  }
  play() {
    if (this.isStopped)
      return;
    const { driver: e = rd, startTime: n } = this.options;
    this.driver || (this.driver = e((i) => this.tick(i))), this.options.onPlay?.();
    const s = this.driver.now();
    this.state === "finished" ? (this.updateFinished(), this.startTime = s) : this.holdTime !== null ? this.startTime = s - this.holdTime : this.startTime || (this.startTime = n ?? s), this.state === "finished" && this.speed < 0 && (this.startTime += this.calculatedDuration), this.holdTime = null, this.state = "running", this.driver.start();
  }
  pause() {
    this.state = "paused", this.updateTime(yt.now()), this.holdTime = this.currentTime;
  }
  complete() {
    this.state !== "running" && this.play(), this.state = "finished", this.holdTime = null;
  }
  finish() {
    this.notifyFinished(), this.teardown(), this.state = "finished", this.options.onComplete?.();
  }
  cancel() {
    this.holdTime = null, this.startTime = 0, this.tick(0), this.teardown(), this.options.onCancel?.();
  }
  teardown() {
    this.state = "idle", this.stopDriver(), this.startTime = this.holdTime = null;
  }
  stopDriver() {
    this.driver && (this.driver.stop(), this.driver = void 0);
  }
  sample(e) {
    return this.startTime = 0, this.tick(e, !0);
  }
  attachTimeline(e) {
    return this.options.allowFlatten && (this.options.type = "keyframes", this.options.ease = "linear", this.initAnimation()), this.driver?.stop(), e.observe(this);
  }
}
function Sd(t) {
  for (let e = 1; e < t.length; e++)
    t[e] ?? (t[e] = t[e - 1]);
}
const ce = (t) => t * 180 / Math.PI, Ts = (t) => {
  const e = ce(Math.atan2(t[1], t[0]));
  return Ss(e);
}, Dd = {
  x: 4,
  y: 5,
  translateX: 4,
  translateY: 5,
  scaleX: 0,
  scaleY: 3,
  scale: (t) => (Math.abs(t[0]) + Math.abs(t[3])) / 2,
  rotate: Ts,
  rotateZ: Ts,
  skewX: (t) => ce(Math.atan(t[1])),
  skewY: (t) => ce(Math.atan(t[2])),
  skew: (t) => (Math.abs(t[1]) + Math.abs(t[2])) / 2
}, Ss = (t) => (t = t % 360, t < 0 && (t += 360), t), nr = Ts, sr = (t) => Math.sqrt(t[0] * t[0] + t[1] * t[1]), ir = (t) => Math.sqrt(t[4] * t[4] + t[5] * t[5]), Cd = {
  x: 12,
  y: 13,
  z: 14,
  translateX: 12,
  translateY: 13,
  translateZ: 14,
  scaleX: sr,
  scaleY: ir,
  scale: (t) => (sr(t) + ir(t)) / 2,
  rotateX: (t) => Ss(ce(Math.atan2(t[6], t[5]))),
  rotateY: (t) => Ss(ce(Math.atan2(-t[2], t[0]))),
  rotateZ: nr,
  rotate: nr,
  skewX: (t) => ce(Math.atan(t[4])),
  skewY: (t) => ce(Math.atan(t[1])),
  skew: (t) => (Math.abs(t[1]) + Math.abs(t[4])) / 2
};
function Ds(t) {
  return t.includes("scale") ? 1 : 0;
}
function Cs(t, e) {
  if (!t || t === "none")
    return Ds(e);
  const n = t.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
  let s, i;
  if (n)
    s = Cd, i = n;
  else {
    const a = t.match(/^matrix\(([-\d.e\s,]+)\)$/u);
    s = Dd, i = a;
  }
  if (!i)
    return Ds(e);
  const r = s[e], o = i[1].split(",").map(Pd);
  return typeof r == "function" ? r(o) : o[r];
}
const Ad = (t, e) => {
  const { transform: n = "none" } = getComputedStyle(t);
  return Cs(n, e);
};
function Pd(t) {
  return parseFloat(t.trim());
}
const Re = [
  "transformPerspective",
  "x",
  "y",
  "z",
  "translateX",
  "translateY",
  "translateZ",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skew",
  "skewX",
  "skewY"
], Me = new Set(Re), rr = (t) => t === Pe || t === I, Rd = /* @__PURE__ */ new Set(["x", "y", "z"]), Md = Re.filter((t) => !Rd.has(t));
function Ed(t) {
  const e = [];
  return Md.forEach((n) => {
    const s = t.getValue(n);
    s !== void 0 && (e.push([n, s.get()]), s.set(n.startsWith("scale") ? 1 : 0));
  }), e;
}
const ue = {
  // Dimensions
  width: ({ x: t }, { paddingLeft: e = "0", paddingRight: n = "0" }) => t.max - t.min - parseFloat(e) - parseFloat(n),
  height: ({ y: t }, { paddingTop: e = "0", paddingBottom: n = "0" }) => t.max - t.min - parseFloat(e) - parseFloat(n),
  top: (t, { top: e }) => parseFloat(e),
  left: (t, { left: e }) => parseFloat(e),
  bottom: ({ y: t }, { top: e }) => parseFloat(e) + (t.max - t.min),
  right: ({ x: t }, { left: e }) => parseFloat(e) + (t.max - t.min),
  // Transform
  x: (t, { transform: e }) => Cs(e, "x"),
  y: (t, { transform: e }) => Cs(e, "y")
};
ue.translateX = ue.x;
ue.translateY = ue.y;
const de = /* @__PURE__ */ new Set();
let As = !1, Ps = !1, Rs = !1;
function fa() {
  if (Ps) {
    const t = Array.from(de).filter((s) => s.needsMeasurement), e = new Set(t.map((s) => s.element)), n = /* @__PURE__ */ new Map();
    e.forEach((s) => {
      const i = Ed(s);
      i.length && (n.set(s, i), s.render());
    }), t.forEach((s) => s.measureInitialState()), e.forEach((s) => {
      s.render();
      const i = n.get(s);
      i && i.forEach(([r, o]) => {
        s.getValue(r)?.set(o);
      });
    }), t.forEach((s) => s.measureEndState()), t.forEach((s) => {
      s.suspendedScrollY !== void 0 && window.scrollTo(0, s.suspendedScrollY);
    });
  }
  Ps = !1, As = !1, de.forEach((t) => t.complete(Rs)), de.clear();
}
function pa() {
  de.forEach((t) => {
    t.readKeyframes(), t.needsMeasurement && (Ps = !0);
  });
}
function Vd() {
  Rs = !0, pa(), fa(), Rs = !1;
}
class pi {
  constructor(e, n, s, i, r, o = !1) {
    this.state = "pending", this.isAsync = !1, this.needsMeasurement = !1, this.unresolvedKeyframes = [...e], this.onComplete = n, this.name = s, this.motionValue = i, this.element = r, this.isAsync = o;
  }
  scheduleResolve() {
    this.state = "scheduled", this.isAsync ? (de.add(this), As || (As = !0, Y.read(pa), Y.resolveKeyframes(fa))) : (this.readKeyframes(), this.complete());
  }
  readKeyframes() {
    const { unresolvedKeyframes: e, name: n, element: s, motionValue: i } = this;
    if (e[0] === null) {
      const r = i?.get(), o = e[e.length - 1];
      if (r !== void 0)
        e[0] = r;
      else if (s && n) {
        const a = s.readValue(n, o);
        a != null && (e[0] = a);
      }
      e[0] === void 0 && (e[0] = o), i && r === void 0 && i.set(e[0]);
    }
    Sd(e);
  }
  setFinalKeyframe() {
  }
  measureInitialState() {
  }
  renderEndStyles() {
  }
  measureEndState() {
  }
  complete(e = !1) {
    this.state = "complete", this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, e), de.delete(this);
  }
  cancel() {
    this.state === "scheduled" && (de.delete(this), this.state = "pending");
  }
  resume() {
    this.state === "pending" && this.scheduleResolve();
  }
}
const Nd = (t) => t.startsWith("--");
function kd(t, e, n) {
  Nd(e) ? t.style.setProperty(e, n) : t.style[e] = n;
}
const Id = /* @__PURE__ */ ni(() => window.ScrollTimeline !== void 0), jd = {};
function Ld(t, e) {
  const n = /* @__PURE__ */ ni(t);
  return () => jd[e] ?? n();
}
const ma = /* @__PURE__ */ Ld(() => {
  try {
    document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
  } catch {
    return !1;
  }
  return !0;
}, "linearEasing"), Le = ([t, e, n, s]) => `cubic-bezier(${t}, ${e}, ${n}, ${s})`, or = {
  linear: "linear",
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  circIn: /* @__PURE__ */ Le([0, 0.65, 0.55, 1]),
  circOut: /* @__PURE__ */ Le([0.55, 0, 1, 0.45]),
  backIn: /* @__PURE__ */ Le([0.31, 0.01, 0.66, -0.59]),
  backOut: /* @__PURE__ */ Le([0.33, 1.53, 0.69, 0.99])
};
function ga(t, e) {
  if (t)
    return typeof t == "function" ? ma() ? ua(t, e) : "ease-out" : Qo(t) ? Le(t) : Array.isArray(t) ? t.map((n) => ga(n, e) || or.easeOut) : or[t];
}
function Od(t, e, n, { delay: s = 0, duration: i = 300, repeat: r = 0, repeatType: o = "loop", ease: a = "easeOut", times: l } = {}, u = void 0) {
  const c = {
    [e]: n
  };
  l && (c.offset = l);
  const d = ga(a, i);
  Array.isArray(d) && (c.easing = d);
  const h = {
    delay: s,
    duration: i,
    easing: Array.isArray(d) ? "linear" : d,
    fill: "both",
    iterations: r + 1,
    direction: o === "reverse" ? "alternate" : "normal"
  };
  return u && (h.pseudoElement = u), t.animate(c, h);
}
function ya(t) {
  return typeof t == "function" && "applyToOptions" in t;
}
function Fd({ type: t, ...e }) {
  return ya(t) && ma() ? t.applyToOptions(e) : (e.duration ?? (e.duration = 300), e.ease ?? (e.ease = "easeOut"), e);
}
class Bd extends hi {
  constructor(e) {
    if (super(), this.finishedTime = null, this.isStopped = !1, !e)
      return;
    const { element: n, name: s, keyframes: i, pseudoElement: r, allowFlatten: o = !1, finalKeyframe: a, onComplete: l } = e;
    this.isPseudoElement = !!r, this.allowFlatten = o, this.options = e, ei(typeof e.type != "string");
    const u = Fd(e);
    this.animation = Od(n, s, i, u, r), u.autoplay === !1 && this.animation.pause(), this.animation.onfinish = () => {
      if (this.finishedTime = this.time, !r) {
        const c = di(i, this.options, a, this.speed);
        this.updateMotionValue ? this.updateMotionValue(c) : kd(n, s, c), this.animation.cancel();
      }
      l?.(), this.notifyFinished();
    };
  }
  play() {
    this.isStopped || (this.animation.play(), this.state === "finished" && this.updateFinished());
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.finish?.();
  }
  cancel() {
    try {
      this.animation.cancel();
    } catch {
    }
  }
  stop() {
    if (this.isStopped)
      return;
    this.isStopped = !0;
    const { state: e } = this;
    e === "idle" || e === "finished" || (this.updateMotionValue ? this.updateMotionValue() : this.commitStyles(), this.isPseudoElement || this.cancel());
  }
  /**
   * WAAPI doesn't natively have any interruption capabilities.
   *
   * In this method, we commit styles back to the DOM before cancelling
   * the animation.
   *
   * This is designed to be overridden by NativeAnimationExtended, which
   * will create a renderless JS animation and sample it twice to calculate
   * its current value, "previous" value, and therefore allow
   * Motion to also correctly calculate velocity for any subsequent animation
   * while deferring the commit until the next animation frame.
   */
  commitStyles() {
    this.isPseudoElement || this.animation.commitStyles?.();
  }
  get duration() {
    const e = this.animation.effect?.getComputedTiming?.().duration || 0;
    return /* @__PURE__ */ Rt(Number(e));
  }
  get iterationDuration() {
    const { delay: e = 0 } = this.options || {};
    return this.duration + /* @__PURE__ */ Rt(e);
  }
  get time() {
    return /* @__PURE__ */ Rt(Number(this.animation.currentTime) || 0);
  }
  set time(e) {
    this.finishedTime = null, this.animation.currentTime = /* @__PURE__ */ Ut(e);
  }
  /**
   * The playback speed of the animation.
   * 1 = normal speed, 2 = double speed, 0.5 = half speed.
   */
  get speed() {
    return this.animation.playbackRate;
  }
  set speed(e) {
    e < 0 && (this.finishedTime = null), this.animation.playbackRate = e;
  }
  get state() {
    return this.finishedTime !== null ? "finished" : this.animation.playState;
  }
  get startTime() {
    return Number(this.animation.startTime);
  }
  set startTime(e) {
    this.animation.startTime = e;
  }
  /**
   * Attaches a timeline to the animation, for instance the `ScrollTimeline`.
   */
  attachTimeline({ timeline: e, observe: n }) {
    return this.allowFlatten && this.animation.effect?.updateTiming({ easing: "linear" }), this.animation.onfinish = null, e && Id() ? (this.animation.timeline = e, Mt) : n(this);
  }
}
const va = {
  anticipate: Yo,
  backInOut: Xo,
  circInOut: Jo
};
function $d(t) {
  return t in va;
}
function _d(t) {
  typeof t.ease == "string" && $d(t.ease) && (t.ease = va[t.ease]);
}
const ar = 10;
class Ud extends Bd {
  constructor(e) {
    _d(e), ha(e), super(e), e.startTime && (this.startTime = e.startTime), this.options = e;
  }
  /**
   * WAAPI doesn't natively have any interruption capabilities.
   *
   * Rather than read commited styles back out of the DOM, we can
   * create a renderless JS animation and sample it twice to calculate
   * its current value, "previous" value, and therefore allow
   * Motion to calculate velocity for any subsequent animation.
   */
  updateMotionValue(e) {
    const { motionValue: n, onUpdate: s, onComplete: i, element: r, ...o } = this.options;
    if (!n)
      return;
    if (e !== void 0) {
      n.set(e);
      return;
    }
    const a = new fi({
      ...o,
      autoplay: !1
    }), l = /* @__PURE__ */ Ut(this.finishedTime ?? this.time);
    n.setWithVelocity(a.sample(l - ar).value, a.sample(l).value, ar), a.stop();
  }
}
const lr = (t, e) => e === "zIndex" ? !1 : !!(typeof t == "number" || Array.isArray(t) || typeof t == "string" && // It's animatable if we have a string
(ne.test(t) || t === "0") && // And it contains numbers and/or colors
!t.startsWith("url("));
function zd(t) {
  const e = t[0];
  if (t.length === 1)
    return !0;
  for (let n = 0; n < t.length; n++)
    if (t[n] !== e)
      return !0;
}
function Wd(t, e, n, s) {
  const i = t[0];
  if (i === null)
    return !1;
  if (e === "display" || e === "visibility")
    return !0;
  const r = t[t.length - 1], o = lr(i, e), a = lr(r, e);
  return !o || !a ? !1 : zd(t) || (n === "spring" || ya(n)) && s;
}
function Ms(t) {
  t.duration = 0, t.type = "keyframes";
}
const Kd = /* @__PURE__ */ new Set([
  "opacity",
  "clipPath",
  "filter",
  "transform"
  // TODO: Could be re-enabled now we have support for linear() easing
  // "background-color"
]), Gd = /* @__PURE__ */ ni(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
function Hd(t) {
  const { motionValue: e, name: n, repeatDelay: s, repeatType: i, damping: r, type: o } = t;
  if (!(e?.owner?.current instanceof HTMLElement))
    return !1;
  const { onUpdate: l, transformTemplate: u } = e.owner.getProps();
  return Gd() && n && Kd.has(n) && (n !== "transform" || !u) && /**
   * If we're outputting values to onUpdate then we can't use WAAPI as there's
   * no way to read the value from WAAPI every frame.
   */
  !l && !s && i !== "mirror" && r !== 0 && o !== "inertia";
}
const Xd = 40;
class Yd extends hi {
  constructor({ autoplay: e = !0, delay: n = 0, type: s = "keyframes", repeat: i = 0, repeatDelay: r = 0, repeatType: o = "loop", keyframes: a, name: l, motionValue: u, element: c, ...d }) {
    super(), this.stop = () => {
      this._animation && (this._animation.stop(), this.stopTimeline?.()), this.keyframeResolver?.cancel();
    }, this.createdAt = yt.now();
    const h = {
      autoplay: e,
      delay: n,
      type: s,
      repeat: i,
      repeatDelay: r,
      repeatType: o,
      name: l,
      motionValue: u,
      element: c,
      ...d
    }, f = c?.KeyframeResolver || pi;
    this.keyframeResolver = new f(a, (g, v, y) => this.onKeyframesResolved(g, v, h, !y), l, u, c), this.keyframeResolver?.scheduleResolve();
  }
  onKeyframesResolved(e, n, s, i) {
    this.keyframeResolver = void 0;
    const { name: r, type: o, velocity: a, delay: l, isHandoff: u, onUpdate: c } = s;
    this.resolvedAt = yt.now(), Wd(e, r, o, a) || ((Ht.instantAnimations || !l) && c?.(di(e, s, n)), e[0] = e[e.length - 1], Ms(s), s.repeat = 0);
    const h = {
      startTime: i ? this.resolvedAt ? this.resolvedAt - this.createdAt > Xd ? this.resolvedAt : this.createdAt : this.createdAt : void 0,
      finalKeyframe: n,
      ...s,
      keyframes: e
    }, f = !u && Hd(h) ? new Ud({
      ...h,
      element: h.motionValue.owner.current
    }) : new fi(h);
    f.finished.then(() => this.notifyFinished()).catch(Mt), this.pendingTimeline && (this.stopTimeline = f.attachTimeline(this.pendingTimeline), this.pendingTimeline = void 0), this._animation = f;
  }
  get finished() {
    return this._animation ? this.animation.finished : this._finished;
  }
  then(e, n) {
    return this.finished.finally(e).then(() => {
    });
  }
  get animation() {
    return this._animation || (this.keyframeResolver?.resume(), Vd()), this._animation;
  }
  get duration() {
    return this.animation.duration;
  }
  get iterationDuration() {
    return this.animation.iterationDuration;
  }
  get time() {
    return this.animation.time;
  }
  set time(e) {
    this.animation.time = e;
  }
  get speed() {
    return this.animation.speed;
  }
  get state() {
    return this.animation.state;
  }
  set speed(e) {
    this.animation.speed = e;
  }
  get startTime() {
    return this.animation.startTime;
  }
  attachTimeline(e) {
    return this._animation ? this.stopTimeline = this.animation.attachTimeline(e) : this.pendingTimeline = e, () => this.stop();
  }
  play() {
    this.animation.play();
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.complete();
  }
  cancel() {
    this._animation && this.animation.cancel(), this.keyframeResolver?.cancel();
  }
}
const qd = (
  // eslint-disable-next-line redos-detector/no-unsafe-regex -- false positive, as it can match a lot of words
  /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u
);
function Jd(t) {
  const e = qd.exec(t);
  if (!e)
    return [,];
  const [, n, s, i] = e;
  return [`--${n ?? s}`, i];
}
function xa(t, e, n = 1) {
  const [s, i] = Jd(t);
  if (!s)
    return;
  const r = window.getComputedStyle(e).getPropertyValue(s);
  if (r) {
    const o = r.trim();
    return $o(o) ? parseFloat(o) : o;
  }
  return oi(i) ? xa(i, e, n + 1) : i;
}
function mi(t, e) {
  return t?.[e] ?? t?.default ?? t;
}
const ba = /* @__PURE__ */ new Set([
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  ...Re
]), Zd = {
  test: (t) => t === "auto",
  parse: (t) => t
}, wa = (t) => (e) => e.test(t), Ta = [Pe, I, zt, Qt, zu, Uu, Zd], cr = (t) => Ta.find(wa(t));
function Qd(t) {
  return typeof t == "number" ? t === 0 : t !== null ? t === "none" || t === "0" || Uo(t) : !0;
}
const th = /* @__PURE__ */ new Set(["brightness", "contrast", "saturate", "opacity"]);
function eh(t) {
  const [e, n] = t.slice(0, -1).split("(");
  if (e === "drop-shadow")
    return t;
  const [s] = n.match(ai) || [];
  if (!s)
    return t;
  const i = n.replace(s, "");
  let r = th.has(e) ? 1 : 0;
  return s !== n && (r *= 100), e + "(" + r + i + ")";
}
const nh = /\b([a-z-]*)\(.*?\)/gu, Es = {
  ...ne,
  getAnimatableNone: (t) => {
    const e = t.match(nh);
    return e ? e.map(eh).join(" ") : t;
  }
}, ur = {
  ...Pe,
  transform: Math.round
}, sh = {
  rotate: Qt,
  rotateX: Qt,
  rotateY: Qt,
  rotateZ: Qt,
  scale: hn,
  scaleX: hn,
  scaleY: hn,
  scaleZ: hn,
  skew: Qt,
  skewX: Qt,
  skewY: Qt,
  distance: I,
  translateX: I,
  translateY: I,
  translateZ: I,
  x: I,
  y: I,
  z: I,
  perspective: I,
  transformPerspective: I,
  opacity: Ye,
  originX: Ji,
  originY: Ji,
  originZ: I
}, gi = {
  // Border props
  borderWidth: I,
  borderTopWidth: I,
  borderRightWidth: I,
  borderBottomWidth: I,
  borderLeftWidth: I,
  borderRadius: I,
  radius: I,
  borderTopLeftRadius: I,
  borderTopRightRadius: I,
  borderBottomRightRadius: I,
  borderBottomLeftRadius: I,
  // Positioning props
  width: I,
  maxWidth: I,
  height: I,
  maxHeight: I,
  top: I,
  right: I,
  bottom: I,
  left: I,
  // Spacing props
  padding: I,
  paddingTop: I,
  paddingRight: I,
  paddingBottom: I,
  paddingLeft: I,
  margin: I,
  marginTop: I,
  marginRight: I,
  marginBottom: I,
  marginLeft: I,
  // Misc
  backgroundPositionX: I,
  backgroundPositionY: I,
  ...sh,
  zIndex: ur,
  // SVG
  fillOpacity: Ye,
  strokeOpacity: Ye,
  numOctaves: ur
}, ih = {
  ...gi,
  // Color props
  color: nt,
  backgroundColor: nt,
  outlineColor: nt,
  fill: nt,
  stroke: nt,
  // Border props
  borderColor: nt,
  borderTopColor: nt,
  borderRightColor: nt,
  borderBottomColor: nt,
  borderLeftColor: nt,
  filter: Es,
  WebkitFilter: Es
}, Sa = (t) => ih[t];
function Da(t, e) {
  let n = Sa(t);
  return n !== Es && (n = ne), n.getAnimatableNone ? n.getAnimatableNone(e) : void 0;
}
const rh = /* @__PURE__ */ new Set(["auto", "none", "0"]);
function oh(t, e, n) {
  let s = 0, i;
  for (; s < t.length && !i; ) {
    const r = t[s];
    typeof r == "string" && !rh.has(r) && qe(r).values.length && (i = t[s]), s++;
  }
  if (i && n)
    for (const r of e)
      t[r] = Da(n, i);
}
class ah extends pi {
  constructor(e, n, s, i, r) {
    super(e, n, s, i, r, !0);
  }
  readKeyframes() {
    const { unresolvedKeyframes: e, element: n, name: s } = this;
    if (!n || !n.current)
      return;
    super.readKeyframes();
    for (let l = 0; l < e.length; l++) {
      let u = e[l];
      if (typeof u == "string" && (u = u.trim(), oi(u))) {
        const c = xa(u, n.current);
        c !== void 0 && (e[l] = c), l === e.length - 1 && (this.finalKeyframe = u);
      }
    }
    if (this.resolveNoneKeyframes(), !ba.has(s) || e.length !== 2)
      return;
    const [i, r] = e, o = cr(i), a = cr(r);
    if (o !== a)
      if (rr(o) && rr(a))
        for (let l = 0; l < e.length; l++) {
          const u = e[l];
          typeof u == "string" && (e[l] = parseFloat(u));
        }
      else ue[s] && (this.needsMeasurement = !0);
  }
  resolveNoneKeyframes() {
    const { unresolvedKeyframes: e, name: n } = this, s = [];
    for (let i = 0; i < e.length; i++)
      (e[i] === null || Qd(e[i])) && s.push(i);
    s.length && oh(e, s, n);
  }
  measureInitialState() {
    const { element: e, unresolvedKeyframes: n, name: s } = this;
    if (!e || !e.current)
      return;
    s === "height" && (this.suspendedScrollY = window.pageYOffset), this.measuredOrigin = ue[s](e.measureViewportBox(), window.getComputedStyle(e.current)), n[0] = this.measuredOrigin;
    const i = n[n.length - 1];
    i !== void 0 && e.getValue(s, i).jump(i, !1);
  }
  measureEndState() {
    const { element: e, name: n, unresolvedKeyframes: s } = this;
    if (!e || !e.current)
      return;
    const i = e.getValue(n);
    i && i.jump(this.measuredOrigin, !1);
    const r = s.length - 1, o = s[r];
    s[r] = ue[n](e.measureViewportBox(), window.getComputedStyle(e.current)), o !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = o), this.removedTransforms?.length && this.removedTransforms.forEach(([a, l]) => {
      e.getValue(a).set(l);
    }), this.resolveNoneKeyframes();
  }
}
function lh(t, e, n) {
  if (t instanceof EventTarget)
    return [t];
  if (typeof t == "string") {
    let s = document;
    const i = n?.[t] ?? s.querySelectorAll(t);
    return i ? Array.from(i) : [];
  }
  return Array.from(t);
}
const Ca = (t, e) => e && typeof t == "number" ? e.transform(t) : t;
function Aa(t) {
  return _o(t) && "offsetHeight" in t;
}
const dr = 30, ch = (t) => !isNaN(parseFloat(t));
class uh {
  /**
   * @param init - The initiating value
   * @param config - Optional configuration options
   *
   * -  `transformer`: A function to transform incoming values with.
   */
  constructor(e, n = {}) {
    this.canTrackVelocity = null, this.events = {}, this.updateAndNotify = (s) => {
      const i = yt.now();
      if (this.updatedAt !== i && this.setPrevFrameValue(), this.prev = this.current, this.setCurrent(s), this.current !== this.prev && (this.events.change?.notify(this.current), this.dependents))
        for (const r of this.dependents)
          r.dirty();
    }, this.hasAnimated = !1, this.setCurrent(e), this.owner = n.owner;
  }
  setCurrent(e) {
    this.current = e, this.updatedAt = yt.now(), this.canTrackVelocity === null && e !== void 0 && (this.canTrackVelocity = ch(this.current));
  }
  setPrevFrameValue(e = this.current) {
    this.prevFrameValue = e, this.prevUpdatedAt = this.updatedAt;
  }
  /**
   * Adds a function that will be notified when the `MotionValue` is updated.
   *
   * It returns a function that, when called, will cancel the subscription.
   *
   * When calling `onChange` inside a React component, it should be wrapped with the
   * `useEffect` hook. As it returns an unsubscribe function, this should be returned
   * from the `useEffect` function to ensure you don't add duplicate subscribers..
   *
   * ```jsx
   * export const MyComponent = () => {
   *   const x = useMotionValue(0)
   *   const y = useMotionValue(0)
   *   const opacity = useMotionValue(1)
   *
   *   useEffect(() => {
   *     function updateOpacity() {
   *       const maxXY = Math.max(x.get(), y.get())
   *       const newOpacity = transform(maxXY, [0, 100], [1, 0])
   *       opacity.set(newOpacity)
   *     }
   *
   *     const unsubscribeX = x.on("change", updateOpacity)
   *     const unsubscribeY = y.on("change", updateOpacity)
   *
   *     return () => {
   *       unsubscribeX()
   *       unsubscribeY()
   *     }
   *   }, [])
   *
   *   return <motion.div style={{ x }} />
   * }
   * ```
   *
   * @param subscriber - A function that receives the latest value.
   * @returns A function that, when called, will cancel this subscription.
   *
   * @deprecated
   */
  onChange(e) {
    return this.on("change", e);
  }
  on(e, n) {
    this.events[e] || (this.events[e] = new si());
    const s = this.events[e].add(n);
    return e === "change" ? () => {
      s(), Y.read(() => {
        this.events.change.getSize() || this.stop();
      });
    } : s;
  }
  clearListeners() {
    for (const e in this.events)
      this.events[e].clear();
  }
  /**
   * Attaches a passive effect to the `MotionValue`.
   */
  attach(e, n) {
    this.passiveEffect = e, this.stopPassiveEffect = n;
  }
  /**
   * Sets the state of the `MotionValue`.
   *
   * @remarks
   *
   * ```jsx
   * const x = useMotionValue(0)
   * x.set(10)
   * ```
   *
   * @param latest - Latest value to set.
   * @param render - Whether to notify render subscribers. Defaults to `true`
   *
   * @public
   */
  set(e) {
    this.passiveEffect ? this.passiveEffect(e, this.updateAndNotify) : this.updateAndNotify(e);
  }
  setWithVelocity(e, n, s) {
    this.set(n), this.prev = void 0, this.prevFrameValue = e, this.prevUpdatedAt = this.updatedAt - s;
  }
  /**
   * Set the state of the `MotionValue`, stopping any active animations,
   * effects, and resets velocity to `0`.
   */
  jump(e, n = !0) {
    this.updateAndNotify(e), this.prev = e, this.prevUpdatedAt = this.prevFrameValue = void 0, n && this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
  dirty() {
    this.events.change?.notify(this.current);
  }
  addDependent(e) {
    this.dependents || (this.dependents = /* @__PURE__ */ new Set()), this.dependents.add(e);
  }
  removeDependent(e) {
    this.dependents && this.dependents.delete(e);
  }
  /**
   * Returns the latest state of `MotionValue`
   *
   * @returns - The latest state of `MotionValue`
   *
   * @public
   */
  get() {
    return this.current;
  }
  /**
   * @public
   */
  getPrevious() {
    return this.prev;
  }
  /**
   * Returns the latest velocity of `MotionValue`
   *
   * @returns - The latest velocity of `MotionValue`. Returns `0` if the state is non-numerical.
   *
   * @public
   */
  getVelocity() {
    const e = yt.now();
    if (!this.canTrackVelocity || this.prevFrameValue === void 0 || e - this.updatedAt > dr)
      return 0;
    const n = Math.min(this.updatedAt - this.prevUpdatedAt, dr);
    return zo(parseFloat(this.current) - parseFloat(this.prevFrameValue), n);
  }
  /**
   * Registers a new animation to control this `MotionValue`. Only one
   * animation can drive a `MotionValue` at one time.
   *
   * ```jsx
   * value.start()
   * ```
   *
   * @param animation - A function that starts the provided animation
   */
  start(e) {
    return this.stop(), new Promise((n) => {
      this.hasAnimated = !0, this.animation = e(n), this.events.animationStart && this.events.animationStart.notify();
    }).then(() => {
      this.events.animationComplete && this.events.animationComplete.notify(), this.clearAnimation();
    });
  }
  /**
   * Stop the currently active animation.
   *
   * @public
   */
  stop() {
    this.animation && (this.animation.stop(), this.events.animationCancel && this.events.animationCancel.notify()), this.clearAnimation();
  }
  /**
   * Returns `true` if this value is currently animating.
   *
   * @public
   */
  isAnimating() {
    return !!this.animation;
  }
  clearAnimation() {
    delete this.animation;
  }
  /**
   * Destroy and clean up subscribers to this `MotionValue`.
   *
   * The `MotionValue` hooks like `useMotionValue` and `useTransform` automatically
   * handle the lifecycle of the returned `MotionValue`, so this method is only necessary if you've manually
   * created a `MotionValue` via the `motionValue` function.
   *
   * @public
   */
  destroy() {
    this.dependents?.clear(), this.events.destroy?.notify(), this.clearListeners(), this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
}
function Te(t, e) {
  return new uh(t, e);
}
const { schedule: yi } = /* @__PURE__ */ ta(queueMicrotask, !1), It = {
  x: !1,
  y: !1
};
function Pa() {
  return It.x || It.y;
}
function dh(t) {
  return t === "x" || t === "y" ? It[t] ? null : (It[t] = !0, () => {
    It[t] = !1;
  }) : It.x || It.y ? null : (It.x = It.y = !0, () => {
    It.x = It.y = !1;
  });
}
function Ra(t, e) {
  const n = lh(t), s = new AbortController(), i = {
    passive: !0,
    ...e,
    signal: s.signal
  };
  return [n, i, () => s.abort()];
}
function hr(t) {
  return !(t.pointerType === "touch" || Pa());
}
function hh(t, e, n = {}) {
  const [s, i, r] = Ra(t, n), o = (a) => {
    if (!hr(a))
      return;
    const { target: l } = a, u = e(l, a);
    if (typeof u != "function" || !l)
      return;
    const c = (d) => {
      hr(d) && (u(d), l.removeEventListener("pointerleave", c));
    };
    l.addEventListener("pointerleave", c, i);
  };
  return s.forEach((a) => {
    a.addEventListener("pointerenter", o, i);
  }), r;
}
const Ma = (t, e) => e ? t === e ? !0 : Ma(t, e.parentElement) : !1, vi = (t) => t.pointerType === "mouse" ? typeof t.button != "number" || t.button <= 0 : t.isPrimary !== !1, fh = /* @__PURE__ */ new Set([
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "A"
]);
function ph(t) {
  return fh.has(t.tagName) || t.tabIndex !== -1;
}
const yn = /* @__PURE__ */ new WeakSet();
function fr(t) {
  return (e) => {
    e.key === "Enter" && t(e);
  };
}
function Jn(t, e) {
  t.dispatchEvent(new PointerEvent("pointer" + e, { isPrimary: !0, bubbles: !0 }));
}
const mh = (t, e) => {
  const n = t.currentTarget;
  if (!n)
    return;
  const s = fr(() => {
    if (yn.has(n))
      return;
    Jn(n, "down");
    const i = fr(() => {
      Jn(n, "up");
    }), r = () => Jn(n, "cancel");
    n.addEventListener("keyup", i, e), n.addEventListener("blur", r, e);
  });
  n.addEventListener("keydown", s, e), n.addEventListener("blur", () => n.removeEventListener("keydown", s), e);
};
function pr(t) {
  return vi(t) && !Pa();
}
function gh(t, e, n = {}) {
  const [s, i, r] = Ra(t, n), o = (a) => {
    const l = a.currentTarget;
    if (!pr(a))
      return;
    yn.add(l);
    const u = e(l, a), c = (f, g) => {
      window.removeEventListener("pointerup", d), window.removeEventListener("pointercancel", h), yn.has(l) && yn.delete(l), pr(f) && typeof u == "function" && u(f, { success: g });
    }, d = (f) => {
      c(f, l === window || l === document || n.useGlobalTarget || Ma(l, f.target));
    }, h = (f) => {
      c(f, !1);
    };
    window.addEventListener("pointerup", d, i), window.addEventListener("pointercancel", h, i);
  };
  return s.forEach((a) => {
    (n.useGlobalTarget ? window : a).addEventListener("pointerdown", o, i), Aa(a) && (a.addEventListener("focus", (u) => mh(u, i)), !ph(a) && !a.hasAttribute("tabindex") && (a.tabIndex = 0));
  }), r;
}
function Ea(t) {
  return _o(t) && "ownerSVGElement" in t;
}
function yh(t) {
  return Ea(t) && t.tagName === "svg";
}
const ft = (t) => !!(t && t.getVelocity), vh = [...Ta, nt, ne], xh = (t) => vh.find(wa(t)), xi = Lt({
  transformPagePoint: (t) => t,
  isStatic: !1,
  reducedMotion: "never"
});
function mr(t, e) {
  if (typeof t == "function")
    return t(e);
  t != null && (t.current = e);
}
function bh(...t) {
  return (e) => {
    let n = !1;
    const s = t.map((i) => {
      const r = mr(i, e);
      return !n && typeof r == "function" && (n = !0), r;
    });
    if (n)
      return () => {
        for (let i = 0; i < s.length; i++) {
          const r = s[i];
          typeof r == "function" ? r() : mr(t[i], null);
        }
      };
  };
}
function wh(...t) {
  return En.useCallback(bh(...t), t);
}
class Th extends En.Component {
  getSnapshotBeforeUpdate(e) {
    const n = this.props.childRef.current;
    if (n && e.isPresent && !this.props.isPresent) {
      const s = n.offsetParent, i = Aa(s) && s.offsetWidth || 0, r = this.props.sizeRef.current;
      r.height = n.offsetHeight || 0, r.width = n.offsetWidth || 0, r.top = n.offsetTop, r.left = n.offsetLeft, r.right = i - r.width - r.left;
    }
    return null;
  }
  /**
   * Required with getSnapshotBeforeUpdate to stop React complaining.
   */
  componentDidUpdate() {
  }
  render() {
    return this.props.children;
  }
}
function Sh({ children: t, isPresent: e, anchorX: n, root: s }) {
  const i = $s(), r = j(null), o = j({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0
  }), { nonce: a } = q(xi), l = wh(r, t?.ref);
  return po(() => {
    const { width: u, height: c, top: d, left: h, right: f } = o.current;
    if (e || !r.current || !u || !c)
      return;
    const g = n === "left" ? `left: ${h}` : `right: ${f}`;
    r.current.dataset.motionPopId = i;
    const v = document.createElement("style");
    a && (v.nonce = a);
    const y = s ?? document.head;
    return y.appendChild(v), v.sheet && v.sheet.insertRule(`
          [data-motion-pop-id="${i}"] {
            position: absolute !important;
            width: ${u}px !important;
            height: ${c}px !important;
            ${g}px !important;
            top: ${d}px !important;
          }
        `), () => {
      y.contains(v) && y.removeChild(v);
    };
  }, [e]), p.jsx(Th, { isPresent: e, childRef: r, sizeRef: o, children: En.cloneElement(t, { ref: l }) });
}
const Dh = ({ children: t, initial: e, isPresent: n, onExitComplete: s, custom: i, presenceAffectsLayout: r, mode: o, anchorX: a, root: l }) => {
  const u = Js(Ch), c = $s();
  let d = !0, h = W(() => (d = !1, {
    id: c,
    initial: e,
    isPresent: n,
    custom: i,
    onExitComplete: (f) => {
      u.set(f, !0);
      for (const g of u.values())
        if (!g)
          return;
      s && s();
    },
    register: (f) => (u.set(f, !1), () => u.delete(f))
  }), [n, u, s]);
  return r && d && (h = { ...h }), W(() => {
    u.forEach((f, g) => u.set(g, !1));
  }, [n]), En.useEffect(() => {
    !n && !u.size && s && s();
  }, [n]), o === "popLayout" && (t = p.jsx(Sh, { isPresent: n, anchorX: a, root: l, children: t })), p.jsx(jn.Provider, { value: h, children: t });
};
function Ch() {
  return /* @__PURE__ */ new Map();
}
function Va(t = !0) {
  const e = q(jn);
  if (e === null)
    return [!0, null];
  const { isPresent: n, onExitComplete: s, register: i } = e, r = $s();
  B(() => {
    if (t)
      return i(r);
  }, [t]);
  const o = lt(() => t && s && s(r), [r, s, t]);
  return !n && s ? [!1, o] : [!0];
}
const fn = (t) => t.key || "";
function gr(t) {
  const e = [];
  return Ml.forEach(t, (n) => {
    El(n) && e.push(n);
  }), e;
}
const Ah = ({ children: t, custom: e, initial: n = !0, onExitComplete: s, presenceAffectsLayout: i = !0, mode: r = "sync", propagate: o = !1, anchorX: a = "left", root: l }) => {
  const [u, c] = Va(o), d = W(() => gr(t), [t]), h = o && !u ? [] : d.map(fn), f = j(!0), g = j(d), v = Js(() => /* @__PURE__ */ new Map()), [y, x] = L(d), [T, b] = L(d);
  Bo(() => {
    f.current = !1, g.current = d;
    for (let R = 0; R < T.length; R++) {
      const m = fn(T[R]);
      h.includes(m) ? v.delete(m) : v.get(m) !== !0 && v.set(m, !1);
    }
  }, [T, h.length, h.join("-")]);
  const P = [];
  if (d !== y) {
    let R = [...d];
    for (let m = 0; m < T.length; m++) {
      const w = T[m], C = fn(w);
      h.includes(C) || (R.splice(m, 0, w), P.push(w));
    }
    return r === "wait" && P.length && (R = P), b(gr(R)), x(d), null;
  }
  const { forceRender: D } = q(qs);
  return p.jsx(p.Fragment, { children: T.map((R) => {
    const m = fn(R), w = o && !u ? !1 : d === T || h.includes(m), C = () => {
      if (v.has(m))
        v.set(m, !0);
      else
        return;
      let M = !0;
      v.forEach((S) => {
        S || (M = !1);
      }), M && (D?.(), b(g.current), o && c?.(), s && s());
    };
    return p.jsx(Dh, { isPresent: w, initial: !f.current || n ? void 0 : !1, custom: e, presenceAffectsLayout: i, mode: r, root: l, onExitComplete: w ? void 0 : C, anchorX: a, children: R }, m);
  }) });
}, Na = Lt({ strict: !1 }), yr = {
  animation: [
    "animate",
    "variants",
    "whileHover",
    "whileTap",
    "exit",
    "whileInView",
    "whileFocus",
    "whileDrag"
  ],
  exit: ["exit"],
  drag: ["drag", "dragControls"],
  focus: ["whileFocus"],
  hover: ["whileHover", "onHoverStart", "onHoverEnd"],
  tap: ["whileTap", "onTap", "onTapStart", "onTapCancel"],
  pan: ["onPan", "onPanStart", "onPanSessionStart", "onPanEnd"],
  inView: ["whileInView", "onViewportEnter", "onViewportLeave"],
  layout: ["layout", "layoutId"]
}, Se = {};
for (const t in yr)
  Se[t] = {
    isEnabled: (e) => yr[t].some((n) => !!e[n])
  };
function Ph(t) {
  for (const e in t)
    Se[e] = {
      ...Se[e],
      ...t[e]
    };
}
const Rh = /* @__PURE__ */ new Set([
  "animate",
  "exit",
  "variants",
  "initial",
  "style",
  "values",
  "variants",
  "transition",
  "transformTemplate",
  "custom",
  "inherit",
  "onBeforeLayoutMeasure",
  "onAnimationStart",
  "onAnimationComplete",
  "onUpdate",
  "onDragStart",
  "onDrag",
  "onDragEnd",
  "onMeasureDragConstraints",
  "onDirectionLock",
  "onDragTransitionEnd",
  "_dragX",
  "_dragY",
  "onHoverStart",
  "onHoverEnd",
  "onViewportEnter",
  "onViewportLeave",
  "globalTapTarget",
  "ignoreStrict",
  "viewport"
]);
function Pn(t) {
  return t.startsWith("while") || t.startsWith("drag") && t !== "draggable" || t.startsWith("layout") || t.startsWith("onTap") || t.startsWith("onPan") || t.startsWith("onLayout") || Rh.has(t);
}
let ka = (t) => !Pn(t);
function Mh(t) {
  typeof t == "function" && (ka = (e) => e.startsWith("on") ? !Pn(e) : t(e));
}
try {
  Mh(require("@emotion/is-prop-valid").default);
} catch {
}
function Eh(t, e, n) {
  const s = {};
  for (const i in t)
    i === "values" && typeof t.values == "object" || (ka(i) || n === !0 && Pn(i) || !e && !Pn(i) || // If trying to use native HTML drag events, forward drag listeners
    t.draggable && i.startsWith("onDrag")) && (s[i] = t[i]);
  return s;
}
const Ln = /* @__PURE__ */ Lt({});
function On(t) {
  return t !== null && typeof t == "object" && typeof t.start == "function";
}
function Je(t) {
  return typeof t == "string" || Array.isArray(t);
}
const bi = [
  "animate",
  "whileInView",
  "whileFocus",
  "whileHover",
  "whileTap",
  "whileDrag",
  "exit"
], wi = ["initial", ...bi];
function Fn(t) {
  return On(t.animate) || wi.some((e) => Je(t[e]));
}
function Ia(t) {
  return !!(Fn(t) || t.variants);
}
function Vh(t, e) {
  if (Fn(t)) {
    const { initial: n, animate: s } = t;
    return {
      initial: n === !1 || Je(n) ? n : void 0,
      animate: Je(s) ? s : void 0
    };
  }
  return t.inherit !== !1 ? e : {};
}
function Nh(t) {
  const { initial: e, animate: n } = Vh(t, q(Ln));
  return W(() => ({ initial: e, animate: n }), [vr(e), vr(n)]);
}
function vr(t) {
  return Array.isArray(t) ? t.join(" ") : t;
}
function xr(t, e) {
  return e.max === e.min ? 0 : t / (e.max - e.min) * 100;
}
const je = {
  correct: (t, e) => {
    if (!e.target)
      return t;
    if (typeof t == "string")
      if (I.test(t))
        t = parseFloat(t);
      else
        return t;
    const n = xr(t, e.target.x), s = xr(t, e.target.y);
    return `${n}% ${s}%`;
  }
}, kh = {
  correct: (t, { treeScale: e, projectionDelta: n }) => {
    const s = t, i = ne.parse(t);
    if (i.length > 5)
      return s;
    const r = ne.createTransformer(t), o = typeof i[0] != "number" ? 1 : 0, a = n.x.scale * e.x, l = n.y.scale * e.y;
    i[0 + o] /= a, i[1 + o] /= l;
    const u = J(a, l, 0.5);
    return typeof i[2 + o] == "number" && (i[2 + o] /= u), typeof i[3 + o] == "number" && (i[3 + o] /= u), r(i);
  }
}, Vs = {
  borderRadius: {
    ...je,
    applyTo: [
      "borderTopLeftRadius",
      "borderTopRightRadius",
      "borderBottomLeftRadius",
      "borderBottomRightRadius"
    ]
  },
  borderTopLeftRadius: je,
  borderTopRightRadius: je,
  borderBottomLeftRadius: je,
  borderBottomRightRadius: je,
  boxShadow: kh
};
function ja(t, { layout: e, layoutId: n }) {
  return Me.has(t) || t.startsWith("origin") || (e || n !== void 0) && (!!Vs[t] || t === "opacity");
}
const Ih = {
  x: "translateX",
  y: "translateY",
  z: "translateZ",
  transformPerspective: "perspective"
}, jh = Re.length;
function Lh(t, e, n) {
  let s = "", i = !0;
  for (let r = 0; r < jh; r++) {
    const o = Re[r], a = t[o];
    if (a === void 0)
      continue;
    let l = !0;
    if (typeof a == "number" ? l = a === (o.startsWith("scale") ? 1 : 0) : l = parseFloat(a) === 0, !l || n) {
      const u = Ca(a, gi[o]);
      if (!l) {
        i = !1;
        const c = Ih[o] || o;
        s += `${c}(${u}) `;
      }
      n && (e[o] = u);
    }
  }
  return s = s.trim(), n ? s = n(e, i ? "" : s) : i && (s = "none"), s;
}
function Ti(t, e, n) {
  const { style: s, vars: i, transformOrigin: r } = t;
  let o = !1, a = !1;
  for (const l in e) {
    const u = e[l];
    if (Me.has(l)) {
      o = !0;
      continue;
    } else if (na(l)) {
      i[l] = u;
      continue;
    } else {
      const c = Ca(u, gi[l]);
      l.startsWith("origin") ? (a = !0, r[l] = c) : s[l] = c;
    }
  }
  if (e.transform || (o || n ? s.transform = Lh(e, t.transform, n) : s.transform && (s.transform = "none")), a) {
    const { originX: l = "50%", originY: u = "50%", originZ: c = 0 } = r;
    s.transformOrigin = `${l} ${u} ${c}`;
  }
}
const Si = () => ({
  style: {},
  transform: {},
  transformOrigin: {},
  vars: {}
});
function La(t, e, n) {
  for (const s in e)
    !ft(e[s]) && !ja(s, n) && (t[s] = e[s]);
}
function Oh({ transformTemplate: t }, e) {
  return W(() => {
    const n = Si();
    return Ti(n, e, t), Object.assign({}, n.vars, n.style);
  }, [e]);
}
function Fh(t, e) {
  const n = t.style || {}, s = {};
  return La(s, n, t), Object.assign(s, Oh(t, e)), s;
}
function Bh(t, e) {
  const n = {}, s = Fh(t, e);
  return t.drag && t.dragListener !== !1 && (n.draggable = !1, s.userSelect = s.WebkitUserSelect = s.WebkitTouchCallout = "none", s.touchAction = t.drag === !0 ? "none" : `pan-${t.drag === "x" ? "y" : "x"}`), t.tabIndex === void 0 && (t.onTap || t.onTapStart || t.whileTap) && (n.tabIndex = 0), n.style = s, n;
}
const $h = {
  offset: "stroke-dashoffset",
  array: "stroke-dasharray"
}, _h = {
  offset: "strokeDashoffset",
  array: "strokeDasharray"
};
function Uh(t, e, n = 1, s = 0, i = !0) {
  t.pathLength = 1;
  const r = i ? $h : _h;
  t[r.offset] = I.transform(-s);
  const o = I.transform(e), a = I.transform(n);
  t[r.array] = `${o} ${a}`;
}
function Oa(t, {
  attrX: e,
  attrY: n,
  attrScale: s,
  pathLength: i,
  pathSpacing: r = 1,
  pathOffset: o = 0,
  // This is object creation, which we try to avoid per-frame.
  ...a
}, l, u, c) {
  if (Ti(t, a, u), l) {
    t.style.viewBox && (t.attrs.viewBox = t.style.viewBox);
    return;
  }
  t.attrs = t.style, t.style = {};
  const { attrs: d, style: h } = t;
  d.transform && (h.transform = d.transform, delete d.transform), (h.transform || d.transformOrigin) && (h.transformOrigin = d.transformOrigin ?? "50% 50%", delete d.transformOrigin), h.transform && (h.transformBox = c?.transformBox ?? "fill-box", delete d.transformBox), e !== void 0 && (d.x = e), n !== void 0 && (d.y = n), s !== void 0 && (d.scale = s), i !== void 0 && Uh(d, i, r, o, !1);
}
const Fa = () => ({
  ...Si(),
  attrs: {}
}), Ba = (t) => typeof t == "string" && t.toLowerCase() === "svg";
function zh(t, e, n, s) {
  const i = W(() => {
    const r = Fa();
    return Oa(r, e, Ba(s), t.transformTemplate, t.style), {
      ...r.attrs,
      style: { ...r.style }
    };
  }, [e]);
  if (t.style) {
    const r = {};
    La(r, t.style, t), i.style = { ...r, ...i.style };
  }
  return i;
}
const Wh = [
  "animate",
  "circle",
  "defs",
  "desc",
  "ellipse",
  "g",
  "image",
  "line",
  "filter",
  "marker",
  "mask",
  "metadata",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "rect",
  "stop",
  "switch",
  "symbol",
  "svg",
  "text",
  "tspan",
  "use",
  "view"
];
function Di(t) {
  return (
    /**
     * If it's not a string, it's a custom React component. Currently we only support
     * HTML custom React components.
     */
    typeof t != "string" || /**
     * If it contains a dash, the element is a custom HTML webcomponent.
     */
    t.includes("-") ? !1 : (
      /**
       * If it's in our list of lowercase SVG tags, it's an SVG component
       */
      !!(Wh.indexOf(t) > -1 || /**
       * If it contains a capital letter, it's an SVG component
       */
      /[A-Z]/u.test(t))
    )
  );
}
function Kh(t, e, n, { latestValues: s }, i, r = !1) {
  const a = (Di(t) ? zh : Bh)(e, s, i, t), l = Eh(e, typeof t == "string", r), u = t !== mo ? { ...l, ...a, ref: n } : {}, { children: c } = e, d = W(() => ft(c) ? c.get() : c, [c]);
  return Vl(t, {
    ...u,
    children: d
  });
}
function br(t) {
  const e = [{}, {}];
  return t?.values.forEach((n, s) => {
    e[0][s] = n.get(), e[1][s] = n.getVelocity();
  }), e;
}
function Ci(t, e, n, s) {
  if (typeof e == "function") {
    const [i, r] = br(s);
    e = e(n !== void 0 ? n : t.custom, i, r);
  }
  if (typeof e == "string" && (e = t.variants && t.variants[e]), typeof e == "function") {
    const [i, r] = br(s);
    e = e(n !== void 0 ? n : t.custom, i, r);
  }
  return e;
}
function vn(t) {
  return ft(t) ? t.get() : t;
}
function Gh({ scrapeMotionValuesFromProps: t, createRenderState: e }, n, s, i) {
  return {
    latestValues: Hh(n, s, i, t),
    renderState: e()
  };
}
function Hh(t, e, n, s) {
  const i = {}, r = s(t, {});
  for (const h in r)
    i[h] = vn(r[h]);
  let { initial: o, animate: a } = t;
  const l = Fn(t), u = Ia(t);
  e && u && !l && t.inherit !== !1 && (o === void 0 && (o = e.initial), a === void 0 && (a = e.animate));
  let c = n ? n.initial === !1 : !1;
  c = c || o === !1;
  const d = c ? a : o;
  if (d && typeof d != "boolean" && !On(d)) {
    const h = Array.isArray(d) ? d : [d];
    for (let f = 0; f < h.length; f++) {
      const g = Ci(t, h[f]);
      if (g) {
        const { transitionEnd: v, transition: y, ...x } = g;
        for (const T in x) {
          let b = x[T];
          if (Array.isArray(b)) {
            const P = c ? b.length - 1 : 0;
            b = b[P];
          }
          b !== null && (i[T] = b);
        }
        for (const T in v)
          i[T] = v[T];
      }
    }
  }
  return i;
}
const $a = (t) => (e, n) => {
  const s = q(Ln), i = q(jn), r = () => Gh(t, e, s, i);
  return n ? r() : Js(r);
};
function Ai(t, e, n) {
  const { style: s } = t, i = {};
  for (const r in s)
    (ft(s[r]) || e.style && ft(e.style[r]) || ja(r, t) || n?.getValue(r)?.liveStyle !== void 0) && (i[r] = s[r]);
  return i;
}
const Xh = /* @__PURE__ */ $a({
  scrapeMotionValuesFromProps: Ai,
  createRenderState: Si
});
function _a(t, e, n) {
  const s = Ai(t, e, n);
  for (const i in t)
    if (ft(t[i]) || ft(e[i])) {
      const r = Re.indexOf(i) !== -1 ? "attr" + i.charAt(0).toUpperCase() + i.substring(1) : i;
      s[r] = t[i];
    }
  return s;
}
const Yh = /* @__PURE__ */ $a({
  scrapeMotionValuesFromProps: _a,
  createRenderState: Fa
}), qh = Symbol.for("motionComponentSymbol");
function ge(t) {
  return t && typeof t == "object" && Object.prototype.hasOwnProperty.call(t, "current");
}
function Jh(t, e, n) {
  return lt(
    (s) => {
      s && t.onMount && t.onMount(s), e && (s ? e.mount(s) : e.unmount()), n && (typeof n == "function" ? n(s) : ge(n) && (n.current = s));
    },
    /**
     * Include externalRef in dependencies to ensure the callback updates
     * when the ref changes, allowing proper ref forwarding.
     */
    [e]
  );
}
const Pi = (t) => t.replace(/([a-z])([A-Z])/gu, "$1-$2").toLowerCase(), Zh = "framerAppearId", Ua = "data-" + Pi(Zh), za = Lt({});
function Qh(t, e, n, s, i) {
  const { visualElement: r } = q(Ln), o = q(Na), a = q(jn), l = q(xi).reducedMotion, u = j(null);
  s = s || o.renderer, !u.current && s && (u.current = s(t, {
    visualState: e,
    parent: r,
    props: n,
    presenceContext: a,
    blockInitialAnimation: a ? a.initial === !1 : !1,
    reducedMotionConfig: l
  }));
  const c = u.current, d = q(za);
  c && !c.projection && i && (c.type === "html" || c.type === "svg") && tf(u.current, n, i, d);
  const h = j(!1);
  po(() => {
    c && h.current && c.update(n, a);
  });
  const f = n[Ua], g = j(!!f && !window.MotionHandoffIsComplete?.(f) && window.MotionHasOptimisedAnimation?.(f));
  return Bo(() => {
    c && (h.current = !0, window.MotionIsMounted = !0, c.updateFeatures(), c.scheduleRenderMicrotask(), g.current && c.animationState && c.animationState.animateChanges());
  }), B(() => {
    c && (!g.current && c.animationState && c.animationState.animateChanges(), g.current && (queueMicrotask(() => {
      window.MotionHandoffMarkAsComplete?.(f);
    }), g.current = !1), c.enteringChildren = void 0);
  }), c;
}
function tf(t, e, n, s) {
  const { layoutId: i, layout: r, drag: o, dragConstraints: a, layoutScroll: l, layoutRoot: u, layoutCrossfade: c } = e;
  t.projection = new n(t.latestValues, e["data-framer-portal-id"] ? void 0 : Wa(t.parent)), t.projection.setOptions({
    layoutId: i,
    layout: r,
    alwaysMeasureLayout: !!o || a && ge(a),
    visualElement: t,
    /**
     * TODO: Update options in an effect. This could be tricky as it'll be too late
     * to update by the time layout animations run.
     * We also need to fix this safeToRemove by linking it up to the one returned by usePresence,
     * ensuring it gets called if there's no potential layout animations.
     *
     */
    animationType: typeof r == "string" ? r : "both",
    initialPromotionConfig: s,
    crossfade: c,
    layoutScroll: l,
    layoutRoot: u
  });
}
function Wa(t) {
  if (t)
    return t.options.allowProjection !== !1 ? t.projection : Wa(t.parent);
}
function Zn(t, { forwardMotionProps: e = !1 } = {}, n, s) {
  n && Ph(n);
  const i = Di(t) ? Yh : Xh;
  function r(a, l) {
    let u;
    const c = {
      ...q(xi),
      ...a,
      layoutId: ef(a)
    }, { isStatic: d } = c, h = Nh(a), f = i(a, d);
    if (!d && Zs) {
      nf();
      const g = sf(c);
      u = g.MeasureLayout, h.visualElement = Qh(t, f, c, s, g.ProjectionNode);
    }
    return p.jsxs(Ln.Provider, { value: h, children: [u && h.visualElement ? p.jsx(u, { visualElement: h.visualElement, ...c }) : null, Kh(t, a, Jh(f, h.visualElement, l), f, d, e)] });
  }
  r.displayName = `motion.${typeof t == "string" ? t : `create(${t.displayName ?? t.name ?? ""})`}`;
  const o = Nl(r);
  return o[qh] = t, o;
}
function ef({ layoutId: t }) {
  const e = q(qs).id;
  return e && t !== void 0 ? e + "-" + t : t;
}
function nf(t, e) {
  q(Na).strict;
}
function sf(t) {
  const { drag: e, layout: n } = Se;
  if (!e && !n)
    return {};
  const s = { ...e, ...n };
  return {
    MeasureLayout: e?.isEnabled(t) || n?.isEnabled(t) ? s.MeasureLayout : void 0,
    ProjectionNode: s.ProjectionNode
  };
}
function rf(t, e) {
  if (typeof Proxy > "u")
    return Zn;
  const n = /* @__PURE__ */ new Map(), s = (r, o) => Zn(r, o, t, e), i = (r, o) => s(r, o);
  return new Proxy(i, {
    /**
     * Called when `motion` is referenced with a prop: `motion.div`, `motion.input` etc.
     * The prop name is passed through as `key` and we can use that to generate a `motion`
     * DOM component with that name.
     */
    get: (r, o) => o === "create" ? s : (n.has(o) || n.set(o, Zn(o, void 0, t, e)), n.get(o))
  });
}
function Ka({ top: t, left: e, right: n, bottom: s }) {
  return {
    x: { min: e, max: n },
    y: { min: t, max: s }
  };
}
function of({ x: t, y: e }) {
  return { top: e.min, right: t.max, bottom: e.max, left: t.min };
}
function af(t, e) {
  if (!e)
    return t;
  const n = e({ x: t.left, y: t.top }), s = e({ x: t.right, y: t.bottom });
  return {
    top: n.y,
    left: n.x,
    bottom: s.y,
    right: s.x
  };
}
function Qn(t) {
  return t === void 0 || t === 1;
}
function Ns({ scale: t, scaleX: e, scaleY: n }) {
  return !Qn(t) || !Qn(e) || !Qn(n);
}
function ae(t) {
  return Ns(t) || Ga(t) || t.z || t.rotate || t.rotateX || t.rotateY || t.skewX || t.skewY;
}
function Ga(t) {
  return wr(t.x) || wr(t.y);
}
function wr(t) {
  return t && t !== "0%";
}
function Rn(t, e, n) {
  const s = t - n, i = e * s;
  return n + i;
}
function Tr(t, e, n, s, i) {
  return i !== void 0 && (t = Rn(t, i, s)), Rn(t, n, s) + e;
}
function ks(t, e = 0, n = 1, s, i) {
  t.min = Tr(t.min, e, n, s, i), t.max = Tr(t.max, e, n, s, i);
}
function Ha(t, { x: e, y: n }) {
  ks(t.x, e.translate, e.scale, e.originPoint), ks(t.y, n.translate, n.scale, n.originPoint);
}
const Sr = 0.999999999999, Dr = 1.0000000000001;
function lf(t, e, n, s = !1) {
  const i = n.length;
  if (!i)
    return;
  e.x = e.y = 1;
  let r, o;
  for (let a = 0; a < i; a++) {
    r = n[a], o = r.projectionDelta;
    const { visualElement: l } = r.options;
    l && l.props.style && l.props.style.display === "contents" || (s && r.options.layoutScroll && r.scroll && r !== r.root && ve(t, {
      x: -r.scroll.offset.x,
      y: -r.scroll.offset.y
    }), o && (e.x *= o.x.scale, e.y *= o.y.scale, Ha(t, o)), s && ae(r.latestValues) && ve(t, r.latestValues));
  }
  e.x < Dr && e.x > Sr && (e.x = 1), e.y < Dr && e.y > Sr && (e.y = 1);
}
function ye(t, e) {
  t.min = t.min + e, t.max = t.max + e;
}
function Cr(t, e, n, s, i = 0.5) {
  const r = J(t.min, t.max, i);
  ks(t, e, n, r, s);
}
function ve(t, e) {
  Cr(t.x, e.x, e.scaleX, e.scale, e.originX), Cr(t.y, e.y, e.scaleY, e.scale, e.originY);
}
function Xa(t, e) {
  return Ka(af(t.getBoundingClientRect(), e));
}
function cf(t, e, n) {
  const s = Xa(t, n), { scroll: i } = e;
  return i && (ye(s.x, i.offset.x), ye(s.y, i.offset.y)), s;
}
const Ar = () => ({
  translate: 0,
  scale: 1,
  origin: 0,
  originPoint: 0
}), xe = () => ({
  x: Ar(),
  y: Ar()
}), Pr = () => ({ min: 0, max: 0 }), st = () => ({
  x: Pr(),
  y: Pr()
}), Is = { current: null }, Ya = { current: !1 };
function uf() {
  if (Ya.current = !0, !!Zs)
    if (window.matchMedia) {
      const t = window.matchMedia("(prefers-reduced-motion)"), e = () => Is.current = t.matches;
      t.addEventListener("change", e), e();
    } else
      Is.current = !1;
}
const df = /* @__PURE__ */ new WeakMap();
function hf(t, e, n) {
  for (const s in e) {
    const i = e[s], r = n[s];
    if (ft(i))
      t.addValue(s, i);
    else if (ft(r))
      t.addValue(s, Te(i, { owner: t }));
    else if (r !== i)
      if (t.hasValue(s)) {
        const o = t.getValue(s);
        o.liveStyle === !0 ? o.jump(i) : o.hasAnimated || o.set(i);
      } else {
        const o = t.getStaticValue(s);
        t.addValue(s, Te(o !== void 0 ? o : i, { owner: t }));
      }
  }
  for (const s in n)
    e[s] === void 0 && t.removeValue(s);
  return e;
}
const Rr = [
  "AnimationStart",
  "AnimationComplete",
  "Update",
  "BeforeLayoutMeasure",
  "LayoutMeasure",
  "LayoutAnimationStart",
  "LayoutAnimationComplete"
];
class ff {
  /**
   * This method takes React props and returns found MotionValues. For example, HTML
   * MotionValues will be found within the style prop, whereas for Three.js within attribute arrays.
   *
   * This isn't an abstract method as it needs calling in the constructor, but it is
   * intended to be one.
   */
  scrapeMotionValuesFromProps(e, n, s) {
    return {};
  }
  constructor({ parent: e, props: n, presenceContext: s, reducedMotionConfig: i, blockInitialAnimation: r, visualState: o }, a = {}) {
    this.current = null, this.children = /* @__PURE__ */ new Set(), this.isVariantNode = !1, this.isControllingVariants = !1, this.shouldReduceMotion = null, this.values = /* @__PURE__ */ new Map(), this.KeyframeResolver = pi, this.features = {}, this.valueSubscriptions = /* @__PURE__ */ new Map(), this.prevMotionValues = {}, this.events = {}, this.propEventSubscriptions = {}, this.notifyUpdate = () => this.notify("Update", this.latestValues), this.render = () => {
      this.current && (this.triggerBuild(), this.renderInstance(this.current, this.renderState, this.props.style, this.projection));
    }, this.renderScheduledAt = 0, this.scheduleRender = () => {
      const h = yt.now();
      this.renderScheduledAt < h && (this.renderScheduledAt = h, Y.render(this.render, !1, !0));
    };
    const { latestValues: l, renderState: u } = o;
    this.latestValues = l, this.baseTarget = { ...l }, this.initialValues = n.initial ? { ...l } : {}, this.renderState = u, this.parent = e, this.props = n, this.presenceContext = s, this.depth = e ? e.depth + 1 : 0, this.reducedMotionConfig = i, this.options = a, this.blockInitialAnimation = !!r, this.isControllingVariants = Fn(n), this.isVariantNode = Ia(n), this.isVariantNode && (this.variantChildren = /* @__PURE__ */ new Set()), this.manuallyAnimateOnMount = !!(e && e.current);
    const { willChange: c, ...d } = this.scrapeMotionValuesFromProps(n, {}, this);
    for (const h in d) {
      const f = d[h];
      l[h] !== void 0 && ft(f) && f.set(l[h]);
    }
  }
  mount(e) {
    this.current = e, df.set(e, this), this.projection && !this.projection.instance && this.projection.mount(e), this.parent && this.isVariantNode && !this.isControllingVariants && (this.removeFromVariantTree = this.parent.addVariantChild(this)), this.values.forEach((n, s) => this.bindToMotionValue(s, n)), Ya.current || uf(), this.shouldReduceMotion = this.reducedMotionConfig === "never" ? !1 : this.reducedMotionConfig === "always" ? !0 : Is.current, this.parent?.addChild(this), this.update(this.props, this.presenceContext);
  }
  unmount() {
    this.projection && this.projection.unmount(), ee(this.notifyUpdate), ee(this.render), this.valueSubscriptions.forEach((e) => e()), this.valueSubscriptions.clear(), this.removeFromVariantTree && this.removeFromVariantTree(), this.parent?.removeChild(this);
    for (const e in this.events)
      this.events[e].clear();
    for (const e in this.features) {
      const n = this.features[e];
      n && (n.unmount(), n.isMounted = !1);
    }
    this.current = null;
  }
  addChild(e) {
    this.children.add(e), this.enteringChildren ?? (this.enteringChildren = /* @__PURE__ */ new Set()), this.enteringChildren.add(e);
  }
  removeChild(e) {
    this.children.delete(e), this.enteringChildren && this.enteringChildren.delete(e);
  }
  bindToMotionValue(e, n) {
    this.valueSubscriptions.has(e) && this.valueSubscriptions.get(e)();
    const s = Me.has(e);
    s && this.onBindTransform && this.onBindTransform();
    const i = n.on("change", (o) => {
      this.latestValues[e] = o, this.props.onUpdate && Y.preRender(this.notifyUpdate), s && this.projection && (this.projection.isTransformDirty = !0), this.scheduleRender();
    });
    let r;
    window.MotionCheckAppearSync && (r = window.MotionCheckAppearSync(this, e, n)), this.valueSubscriptions.set(e, () => {
      i(), r && r(), n.owner && n.stop();
    });
  }
  sortNodePosition(e) {
    return !this.current || !this.sortInstanceNodePosition || this.type !== e.type ? 0 : this.sortInstanceNodePosition(this.current, e.current);
  }
  updateFeatures() {
    let e = "animation";
    for (e in Se) {
      const n = Se[e];
      if (!n)
        continue;
      const { isEnabled: s, Feature: i } = n;
      if (!this.features[e] && i && s(this.props) && (this.features[e] = new i(this)), this.features[e]) {
        const r = this.features[e];
        r.isMounted ? r.update() : (r.mount(), r.isMounted = !0);
      }
    }
  }
  triggerBuild() {
    this.build(this.renderState, this.latestValues, this.props);
  }
  /**
   * Measure the current viewport box with or without transforms.
   * Only measures axis-aligned boxes, rotate and skew must be manually
   * removed with a re-render to work.
   */
  measureViewportBox() {
    return this.current ? this.measureInstanceViewportBox(this.current, this.props) : st();
  }
  getStaticValue(e) {
    return this.latestValues[e];
  }
  setStaticValue(e, n) {
    this.latestValues[e] = n;
  }
  /**
   * Update the provided props. Ensure any newly-added motion values are
   * added to our map, old ones removed, and listeners updated.
   */
  update(e, n) {
    (e.transformTemplate || this.props.transformTemplate) && this.scheduleRender(), this.prevProps = this.props, this.props = e, this.prevPresenceContext = this.presenceContext, this.presenceContext = n;
    for (let s = 0; s < Rr.length; s++) {
      const i = Rr[s];
      this.propEventSubscriptions[i] && (this.propEventSubscriptions[i](), delete this.propEventSubscriptions[i]);
      const r = "on" + i, o = e[r];
      o && (this.propEventSubscriptions[i] = this.on(i, o));
    }
    this.prevMotionValues = hf(this, this.scrapeMotionValuesFromProps(e, this.prevProps, this), this.prevMotionValues), this.handleChildMotionValue && this.handleChildMotionValue();
  }
  getProps() {
    return this.props;
  }
  /**
   * Returns the variant definition with a given name.
   */
  getVariant(e) {
    return this.props.variants ? this.props.variants[e] : void 0;
  }
  /**
   * Returns the defined default transition on this component.
   */
  getDefaultTransition() {
    return this.props.transition;
  }
  getTransformPagePoint() {
    return this.props.transformPagePoint;
  }
  getClosestVariantNode() {
    return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : void 0;
  }
  /**
   * Add a child visual element to our set of children.
   */
  addVariantChild(e) {
    const n = this.getClosestVariantNode();
    if (n)
      return n.variantChildren && n.variantChildren.add(e), () => n.variantChildren.delete(e);
  }
  /**
   * Add a motion value and bind it to this visual element.
   */
  addValue(e, n) {
    const s = this.values.get(e);
    n !== s && (s && this.removeValue(e), this.bindToMotionValue(e, n), this.values.set(e, n), this.latestValues[e] = n.get());
  }
  /**
   * Remove a motion value and unbind any active subscriptions.
   */
  removeValue(e) {
    this.values.delete(e);
    const n = this.valueSubscriptions.get(e);
    n && (n(), this.valueSubscriptions.delete(e)), delete this.latestValues[e], this.removeValueFromRenderState(e, this.renderState);
  }
  /**
   * Check whether we have a motion value for this key
   */
  hasValue(e) {
    return this.values.has(e);
  }
  getValue(e, n) {
    if (this.props.values && this.props.values[e])
      return this.props.values[e];
    let s = this.values.get(e);
    return s === void 0 && n !== void 0 && (s = Te(n === null ? void 0 : n, { owner: this }), this.addValue(e, s)), s;
  }
  /**
   * If we're trying to animate to a previously unencountered value,
   * we need to check for it in our state and as a last resort read it
   * directly from the instance (which might have performance implications).
   */
  readValue(e, n) {
    let s = this.latestValues[e] !== void 0 || !this.current ? this.latestValues[e] : this.getBaseTargetFromProps(this.props, e) ?? this.readValueFromInstance(this.current, e, this.options);
    return s != null && (typeof s == "string" && ($o(s) || Uo(s)) ? s = parseFloat(s) : !xh(s) && ne.test(n) && (s = Da(e, n)), this.setBaseTarget(e, ft(s) ? s.get() : s)), ft(s) ? s.get() : s;
  }
  /**
   * Set the base target to later animate back to. This is currently
   * only hydrated on creation and when we first read a value.
   */
  setBaseTarget(e, n) {
    this.baseTarget[e] = n;
  }
  /**
   * Find the base target for a value thats been removed from all animation
   * props.
   */
  getBaseTarget(e) {
    const { initial: n } = this.props;
    let s;
    if (typeof n == "string" || typeof n == "object") {
      const r = Ci(this.props, n, this.presenceContext?.custom);
      r && (s = r[e]);
    }
    if (n && s !== void 0)
      return s;
    const i = this.getBaseTargetFromProps(this.props, e);
    return i !== void 0 && !ft(i) ? i : this.initialValues[e] !== void 0 && s === void 0 ? void 0 : this.baseTarget[e];
  }
  on(e, n) {
    return this.events[e] || (this.events[e] = new si()), this.events[e].add(n);
  }
  notify(e, ...n) {
    this.events[e] && this.events[e].notify(...n);
  }
  scheduleRenderMicrotask() {
    yi.render(this.render);
  }
}
class qa extends ff {
  constructor() {
    super(...arguments), this.KeyframeResolver = ah;
  }
  sortInstanceNodePosition(e, n) {
    return e.compareDocumentPosition(n) & 2 ? 1 : -1;
  }
  getBaseTargetFromProps(e, n) {
    return e.style ? e.style[n] : void 0;
  }
  removeValueFromRenderState(e, { vars: n, style: s }) {
    delete n[e], delete s[e];
  }
  handleChildMotionValue() {
    this.childSubscription && (this.childSubscription(), delete this.childSubscription);
    const { children: e } = this.props;
    ft(e) && (this.childSubscription = e.on("change", (n) => {
      this.current && (this.current.textContent = `${n}`);
    }));
  }
}
function Ja(t, { style: e, vars: n }, s, i) {
  const r = t.style;
  let o;
  for (o in e)
    r[o] = e[o];
  i?.applyProjectionStyles(r, s);
  for (o in n)
    r.setProperty(o, n[o]);
}
function pf(t) {
  return window.getComputedStyle(t);
}
class mf extends qa {
  constructor() {
    super(...arguments), this.type = "html", this.renderInstance = Ja;
  }
  readValueFromInstance(e, n) {
    if (Me.has(n))
      return this.projection?.isProjecting ? Ds(n) : Ad(e, n);
    {
      const s = pf(e), i = (na(n) ? s.getPropertyValue(n) : s[n]) || 0;
      return typeof i == "string" ? i.trim() : i;
    }
  }
  measureInstanceViewportBox(e, { transformPagePoint: n }) {
    return Xa(e, n);
  }
  build(e, n, s) {
    Ti(e, n, s.transformTemplate);
  }
  scrapeMotionValuesFromProps(e, n, s) {
    return Ai(e, n, s);
  }
}
const Za = /* @__PURE__ */ new Set([
  "baseFrequency",
  "diffuseConstant",
  "kernelMatrix",
  "kernelUnitLength",
  "keySplines",
  "keyTimes",
  "limitingConeAngle",
  "markerHeight",
  "markerWidth",
  "numOctaves",
  "targetX",
  "targetY",
  "surfaceScale",
  "specularConstant",
  "specularExponent",
  "stdDeviation",
  "tableValues",
  "viewBox",
  "gradientTransform",
  "pathLength",
  "startOffset",
  "textLength",
  "lengthAdjust"
]);
function gf(t, e, n, s) {
  Ja(t, e, void 0, s);
  for (const i in e.attrs)
    t.setAttribute(Za.has(i) ? i : Pi(i), e.attrs[i]);
}
class yf extends qa {
  constructor() {
    super(...arguments), this.type = "svg", this.isSVGTag = !1, this.measureInstanceViewportBox = st;
  }
  getBaseTargetFromProps(e, n) {
    return e[n];
  }
  readValueFromInstance(e, n) {
    if (Me.has(n)) {
      const s = Sa(n);
      return s && s.default || 0;
    }
    return n = Za.has(n) ? n : Pi(n), e.getAttribute(n);
  }
  scrapeMotionValuesFromProps(e, n, s) {
    return _a(e, n, s);
  }
  build(e, n, s) {
    Oa(e, n, this.isSVGTag, s.transformTemplate, s.style);
  }
  renderInstance(e, n, s, i) {
    gf(e, n, s, i);
  }
  mount(e) {
    this.isSVGTag = Ba(e.tagName), super.mount(e);
  }
}
const vf = (t, e) => Di(t) ? new yf(e) : new mf(e, {
  allowProjection: t !== mo
});
function we(t, e, n) {
  const s = t.getProps();
  return Ci(s, e, n !== void 0 ? n : s.custom, t);
}
const js = (t) => Array.isArray(t);
function xf(t, e, n) {
  t.hasValue(e) ? t.getValue(e).set(n) : t.addValue(e, Te(n));
}
function bf(t) {
  return js(t) ? t[t.length - 1] || 0 : t;
}
function wf(t, e) {
  const n = we(t, e);
  let { transitionEnd: s = {}, transition: i = {}, ...r } = n || {};
  r = { ...r, ...s };
  for (const o in r) {
    const a = bf(r[o]);
    xf(t, o, a);
  }
}
function Tf(t) {
  return !!(ft(t) && t.add);
}
function Ls(t, e) {
  const n = t.getValue("willChange");
  if (Tf(n))
    return n.add(e);
  if (!n && Ht.WillChange) {
    const s = new Ht.WillChange("auto");
    t.addValue("willChange", s), s.add(e);
  }
}
function Qa(t) {
  return t.props[Ua];
}
const Sf = (t) => t !== null;
function Df(t, { repeat: e, repeatType: n = "loop" }, s) {
  const i = t.filter(Sf), r = e && n !== "loop" && e % 2 === 1 ? 0 : i.length - 1;
  return i[r];
}
const Cf = {
  type: "spring",
  stiffness: 500,
  damping: 25,
  restSpeed: 10
}, Af = (t) => ({
  type: "spring",
  stiffness: 550,
  damping: t === 0 ? 2 * Math.sqrt(550) : 30,
  restSpeed: 10
}), Pf = {
  type: "keyframes",
  duration: 0.8
}, Rf = {
  type: "keyframes",
  ease: [0.25, 0.1, 0.35, 1],
  duration: 0.3
}, Mf = (t, { keyframes: e }) => e.length > 2 ? Pf : Me.has(t) ? t.startsWith("scale") ? Af(e[1]) : Cf : Rf;
function Ef({ when: t, delay: e, delayChildren: n, staggerChildren: s, staggerDirection: i, repeat: r, repeatType: o, repeatDelay: a, from: l, elapsed: u, ...c }) {
  return !!Object.keys(c).length;
}
const Ri = (t, e, n, s = {}, i, r) => (o) => {
  const a = mi(s, t) || {}, l = a.delay || s.delay || 0;
  let { elapsed: u = 0 } = s;
  u = u - /* @__PURE__ */ Ut(l);
  const c = {
    keyframes: Array.isArray(n) ? n : [null, n],
    ease: "easeOut",
    velocity: e.getVelocity(),
    ...a,
    delay: -u,
    onUpdate: (h) => {
      e.set(h), a.onUpdate && a.onUpdate(h);
    },
    onComplete: () => {
      o(), a.onComplete && a.onComplete();
    },
    name: t,
    motionValue: e,
    element: r ? void 0 : i
  };
  Ef(a) || Object.assign(c, Mf(t, c)), c.duration && (c.duration = /* @__PURE__ */ Ut(c.duration)), c.repeatDelay && (c.repeatDelay = /* @__PURE__ */ Ut(c.repeatDelay)), c.from !== void 0 && (c.keyframes[0] = c.from);
  let d = !1;
  if ((c.type === !1 || c.duration === 0 && !c.repeatDelay) && (Ms(c), c.delay === 0 && (d = !0)), (Ht.instantAnimations || Ht.skipAnimations) && (d = !0, Ms(c), c.delay = 0), c.allowFlatten = !a.type && !a.ease, d && !r && e.get() !== void 0) {
    const h = Df(c.keyframes, a);
    if (h !== void 0) {
      Y.update(() => {
        c.onUpdate(h), c.onComplete();
      });
      return;
    }
  }
  return a.isSync ? new fi(c) : new Yd(c);
};
function Vf({ protectedKeys: t, needsAnimating: e }, n) {
  const s = t.hasOwnProperty(n) && e[n] !== !0;
  return e[n] = !1, s;
}
function tl(t, e, { delay: n = 0, transitionOverride: s, type: i } = {}) {
  let { transition: r = t.getDefaultTransition(), transitionEnd: o, ...a } = e;
  s && (r = s);
  const l = [], u = i && t.animationState && t.animationState.getState()[i];
  for (const c in a) {
    const d = t.getValue(c, t.latestValues[c] ?? null), h = a[c];
    if (h === void 0 || u && Vf(u, c))
      continue;
    const f = {
      delay: n,
      ...mi(r || {}, c)
    }, g = d.get();
    if (g !== void 0 && !d.isAnimating && !Array.isArray(h) && h === g && !f.velocity)
      continue;
    let v = !1;
    if (window.MotionHandoffAnimation) {
      const x = Qa(t);
      if (x) {
        const T = window.MotionHandoffAnimation(x, c, Y);
        T !== null && (f.startTime = T, v = !0);
      }
    }
    Ls(t, c), d.start(Ri(c, d, h, t.shouldReduceMotion && ba.has(c) ? { type: !1 } : f, t, v));
    const y = d.animation;
    y && l.push(y);
  }
  return o && Promise.all(l).then(() => {
    Y.update(() => {
      o && wf(t, o);
    });
  }), l;
}
function el(t, e, n, s = 0, i = 1) {
  const r = Array.from(t).sort((u, c) => u.sortNodePosition(c)).indexOf(e), o = t.size, a = (o - 1) * s;
  return typeof n == "function" ? n(r, o) : i === 1 ? r * s : a - r * s;
}
function Os(t, e, n = {}) {
  const s = we(t, e, n.type === "exit" ? t.presenceContext?.custom : void 0);
  let { transition: i = t.getDefaultTransition() || {} } = s || {};
  n.transitionOverride && (i = n.transitionOverride);
  const r = s ? () => Promise.all(tl(t, s, n)) : () => Promise.resolve(), o = t.variantChildren && t.variantChildren.size ? (l = 0) => {
    const { delayChildren: u = 0, staggerChildren: c, staggerDirection: d } = i;
    return Nf(t, e, l, u, c, d, n);
  } : () => Promise.resolve(), { when: a } = i;
  if (a) {
    const [l, u] = a === "beforeChildren" ? [r, o] : [o, r];
    return l().then(() => u());
  } else
    return Promise.all([r(), o(n.delay)]);
}
function Nf(t, e, n = 0, s = 0, i = 0, r = 1, o) {
  const a = [];
  for (const l of t.variantChildren)
    l.notify("AnimationStart", e), a.push(Os(l, e, {
      ...o,
      delay: n + (typeof s == "function" ? 0 : s) + el(t.variantChildren, l, s, i, r)
    }).then(() => l.notify("AnimationComplete", e)));
  return Promise.all(a);
}
function kf(t, e, n = {}) {
  t.notify("AnimationStart", e);
  let s;
  if (Array.isArray(e)) {
    const i = e.map((r) => Os(t, r, n));
    s = Promise.all(i);
  } else if (typeof e == "string")
    s = Os(t, e, n);
  else {
    const i = typeof e == "function" ? we(t, e, n.custom) : e;
    s = Promise.all(tl(t, i, n));
  }
  return s.then(() => {
    t.notify("AnimationComplete", e);
  });
}
function nl(t, e) {
  if (!Array.isArray(e))
    return !1;
  const n = e.length;
  if (n !== t.length)
    return !1;
  for (let s = 0; s < n; s++)
    if (e[s] !== t[s])
      return !1;
  return !0;
}
const If = wi.length;
function sl(t) {
  if (!t)
    return;
  if (!t.isControllingVariants) {
    const n = t.parent ? sl(t.parent) || {} : {};
    return t.props.initial !== void 0 && (n.initial = t.props.initial), n;
  }
  const e = {};
  for (let n = 0; n < If; n++) {
    const s = wi[n], i = t.props[s];
    (Je(i) || i === !1) && (e[s] = i);
  }
  return e;
}
const jf = [...bi].reverse(), Lf = bi.length;
function Of(t) {
  return (e) => Promise.all(e.map(({ animation: n, options: s }) => kf(t, n, s)));
}
function Ff(t) {
  let e = Of(t), n = Mr(), s = !0;
  const i = (l) => (u, c) => {
    const d = we(t, c, l === "exit" ? t.presenceContext?.custom : void 0);
    if (d) {
      const { transition: h, transitionEnd: f, ...g } = d;
      u = { ...u, ...g, ...f };
    }
    return u;
  };
  function r(l) {
    e = l(t);
  }
  function o(l) {
    const { props: u } = t, c = sl(t.parent) || {}, d = [], h = /* @__PURE__ */ new Set();
    let f = {}, g = 1 / 0;
    for (let y = 0; y < Lf; y++) {
      const x = jf[y], T = n[x], b = u[x] !== void 0 ? u[x] : c[x], P = Je(b), D = x === l ? T.isActive : null;
      D === !1 && (g = y);
      let R = b === c[x] && b !== u[x] && P;
      if (R && s && t.manuallyAnimateOnMount && (R = !1), T.protectedKeys = { ...f }, // If it isn't active and hasn't *just* been set as inactive
      !T.isActive && D === null || // If we didn't and don't have any defined prop for this animation type
      !b && !T.prevProp || // Or if the prop doesn't define an animation
      On(b) || typeof b == "boolean")
        continue;
      const m = Bf(T.prevProp, b);
      let w = m || // If we're making this variant active, we want to always make it active
      x === l && T.isActive && !R && P || // If we removed a higher-priority variant (i is in reverse order)
      y > g && P, C = !1;
      const M = Array.isArray(b) ? b : [b];
      let S = M.reduce(i(x), {});
      D === !1 && (S = {});
      const { prevResolvedValues: N = {} } = T, O = {
        ...N,
        ...S
      }, F = (k) => {
        w = !0, h.has(k) && (C = !0, h.delete(k)), T.needsAnimating[k] = !0;
        const U = t.getValue(k);
        U && (U.liveStyle = !1);
      };
      for (const k in O) {
        const U = S[k], H = N[k];
        if (f.hasOwnProperty(k))
          continue;
        let tt = !1;
        js(U) && js(H) ? tt = !nl(U, H) : tt = U !== H, tt ? U != null ? F(k) : h.add(k) : U !== void 0 && h.has(k) ? F(k) : T.protectedKeys[k] = !0;
      }
      T.prevProp = b, T.prevResolvedValues = S, T.isActive && (f = { ...f, ...S }), s && t.blockInitialAnimation && (w = !1);
      const G = R && m;
      w && (!G || C) && d.push(...M.map((k) => {
        const U = { type: x };
        if (typeof k == "string" && s && !G && t.manuallyAnimateOnMount && t.parent) {
          const { parent: H } = t, tt = we(H, k);
          if (H.enteringChildren && tt) {
            const { delayChildren: et } = tt.transition || {};
            U.delay = el(H.enteringChildren, t, et);
          }
        }
        return {
          animation: k,
          options: U
        };
      }));
    }
    if (h.size) {
      const y = {};
      if (typeof u.initial != "boolean") {
        const x = we(t, Array.isArray(u.initial) ? u.initial[0] : u.initial);
        x && x.transition && (y.transition = x.transition);
      }
      h.forEach((x) => {
        const T = t.getBaseTarget(x), b = t.getValue(x);
        b && (b.liveStyle = !0), y[x] = T ?? null;
      }), d.push({ animation: y });
    }
    let v = !!d.length;
    return s && (u.initial === !1 || u.initial === u.animate) && !t.manuallyAnimateOnMount && (v = !1), s = !1, v ? e(d) : Promise.resolve();
  }
  function a(l, u) {
    if (n[l].isActive === u)
      return Promise.resolve();
    t.variantChildren?.forEach((d) => d.animationState?.setActive(l, u)), n[l].isActive = u;
    const c = o(l);
    for (const d in n)
      n[d].protectedKeys = {};
    return c;
  }
  return {
    animateChanges: o,
    setActive: a,
    setAnimateFunction: r,
    getState: () => n,
    reset: () => {
      n = Mr();
    }
  };
}
function Bf(t, e) {
  return typeof e == "string" ? e !== t : Array.isArray(e) ? !nl(e, t) : !1;
}
function oe(t = !1) {
  return {
    isActive: t,
    protectedKeys: {},
    needsAnimating: {},
    prevResolvedValues: {}
  };
}
function Mr() {
  return {
    animate: oe(!0),
    whileInView: oe(),
    whileHover: oe(),
    whileTap: oe(),
    whileDrag: oe(),
    whileFocus: oe(),
    exit: oe()
  };
}
class se {
  constructor(e) {
    this.isMounted = !1, this.node = e;
  }
  update() {
  }
}
class $f extends se {
  /**
   * We dynamically generate the AnimationState manager as it contains a reference
   * to the underlying animation library. We only want to load that if we load this,
   * so people can optionally code split it out using the `m` component.
   */
  constructor(e) {
    super(e), e.animationState || (e.animationState = Ff(e));
  }
  updateAnimationControlsSubscription() {
    const { animate: e } = this.node.getProps();
    On(e) && (this.unmountControls = e.subscribe(this.node));
  }
  /**
   * Subscribe any provided AnimationControls to the component's VisualElement
   */
  mount() {
    this.updateAnimationControlsSubscription();
  }
  update() {
    const { animate: e } = this.node.getProps(), { animate: n } = this.node.prevProps || {};
    e !== n && this.updateAnimationControlsSubscription();
  }
  unmount() {
    this.node.animationState.reset(), this.unmountControls?.();
  }
}
let _f = 0;
class Uf extends se {
  constructor() {
    super(...arguments), this.id = _f++;
  }
  update() {
    if (!this.node.presenceContext)
      return;
    const { isPresent: e, onExitComplete: n } = this.node.presenceContext, { isPresent: s } = this.node.prevPresenceContext || {};
    if (!this.node.animationState || e === s)
      return;
    const i = this.node.animationState.setActive("exit", !e);
    n && !e && i.then(() => {
      n(this.id);
    });
  }
  mount() {
    const { register: e, onExitComplete: n } = this.node.presenceContext || {};
    n && n(this.id), e && (this.unmount = e(this.id));
  }
  unmount() {
  }
}
const zf = {
  animation: {
    Feature: $f
  },
  exit: {
    Feature: Uf
  }
};
function Ze(t, e, n, s = { passive: !0 }) {
  return t.addEventListener(e, n, s), () => t.removeEventListener(e, n);
}
function on(t) {
  return {
    point: {
      x: t.pageX,
      y: t.pageY
    }
  };
}
const Wf = (t) => (e) => vi(e) && t(e, on(e));
function Ue(t, e, n, s) {
  return Ze(t, e, Wf(n), s);
}
const il = 1e-4, Kf = 1 - il, Gf = 1 + il, rl = 0.01, Hf = 0 - rl, Xf = 0 + rl;
function gt(t) {
  return t.max - t.min;
}
function Yf(t, e, n) {
  return Math.abs(t - e) <= n;
}
function Er(t, e, n, s = 0.5) {
  t.origin = s, t.originPoint = J(e.min, e.max, t.origin), t.scale = gt(n) / gt(e), t.translate = J(n.min, n.max, t.origin) - t.originPoint, (t.scale >= Kf && t.scale <= Gf || isNaN(t.scale)) && (t.scale = 1), (t.translate >= Hf && t.translate <= Xf || isNaN(t.translate)) && (t.translate = 0);
}
function ze(t, e, n, s) {
  Er(t.x, e.x, n.x, s ? s.originX : void 0), Er(t.y, e.y, n.y, s ? s.originY : void 0);
}
function Vr(t, e, n) {
  t.min = n.min + e.min, t.max = t.min + gt(e);
}
function qf(t, e, n) {
  Vr(t.x, e.x, n.x), Vr(t.y, e.y, n.y);
}
function Nr(t, e, n) {
  t.min = e.min - n.min, t.max = t.min + gt(e);
}
function Mn(t, e, n) {
  Nr(t.x, e.x, n.x), Nr(t.y, e.y, n.y);
}
function At(t) {
  return [t("x"), t("y")];
}
const ol = ({ current: t }) => t ? t.ownerDocument.defaultView : null, kr = (t, e) => Math.abs(t - e);
function Jf(t, e) {
  const n = kr(t.x, e.x), s = kr(t.y, e.y);
  return Math.sqrt(n ** 2 + s ** 2);
}
class al {
  constructor(e, n, { transformPagePoint: s, contextWindow: i = window, dragSnapToOrigin: r = !1, distanceThreshold: o = 3 } = {}) {
    if (this.startEvent = null, this.lastMoveEvent = null, this.lastMoveEventInfo = null, this.handlers = {}, this.contextWindow = window, this.updatePoint = () => {
      if (!(this.lastMoveEvent && this.lastMoveEventInfo))
        return;
      const h = es(this.lastMoveEventInfo, this.history), f = this.startEvent !== null, g = Jf(h.offset, { x: 0, y: 0 }) >= this.distanceThreshold;
      if (!f && !g)
        return;
      const { point: v } = h, { timestamp: y } = ut;
      this.history.push({ ...v, timestamp: y });
      const { onStart: x, onMove: T } = this.handlers;
      f || (x && x(this.lastMoveEvent, h), this.startEvent = this.lastMoveEvent), T && T(this.lastMoveEvent, h);
    }, this.handlePointerMove = (h, f) => {
      this.lastMoveEvent = h, this.lastMoveEventInfo = ts(f, this.transformPagePoint), Y.update(this.updatePoint, !0);
    }, this.handlePointerUp = (h, f) => {
      this.end();
      const { onEnd: g, onSessionEnd: v, resumeAnimation: y } = this.handlers;
      if (this.dragSnapToOrigin && y && y(), !(this.lastMoveEvent && this.lastMoveEventInfo))
        return;
      const x = es(h.type === "pointercancel" ? this.lastMoveEventInfo : ts(f, this.transformPagePoint), this.history);
      this.startEvent && g && g(h, x), v && v(h, x);
    }, !vi(e))
      return;
    this.dragSnapToOrigin = r, this.handlers = n, this.transformPagePoint = s, this.distanceThreshold = o, this.contextWindow = i || window;
    const a = on(e), l = ts(a, this.transformPagePoint), { point: u } = l, { timestamp: c } = ut;
    this.history = [{ ...u, timestamp: c }];
    const { onSessionStart: d } = n;
    d && d(e, es(l, this.history)), this.removeListeners = nn(Ue(this.contextWindow, "pointermove", this.handlePointerMove), Ue(this.contextWindow, "pointerup", this.handlePointerUp), Ue(this.contextWindow, "pointercancel", this.handlePointerUp));
  }
  updateHandlers(e) {
    this.handlers = e;
  }
  end() {
    this.removeListeners && this.removeListeners(), ee(this.updatePoint);
  }
}
function ts(t, e) {
  return e ? { point: e(t.point) } : t;
}
function Ir(t, e) {
  return { x: t.x - e.x, y: t.y - e.y };
}
function es({ point: t }, e) {
  return {
    point: t,
    delta: Ir(t, ll(e)),
    offset: Ir(t, Zf(e)),
    velocity: Qf(e, 0.1)
  };
}
function Zf(t) {
  return t[0];
}
function ll(t) {
  return t[t.length - 1];
}
function Qf(t, e) {
  if (t.length < 2)
    return { x: 0, y: 0 };
  let n = t.length - 1, s = null;
  const i = ll(t);
  for (; n >= 0 && (s = t[n], !(i.timestamp - s.timestamp > /* @__PURE__ */ Ut(e))); )
    n--;
  if (!s)
    return { x: 0, y: 0 };
  const r = /* @__PURE__ */ Rt(i.timestamp - s.timestamp);
  if (r === 0)
    return { x: 0, y: 0 };
  const o = {
    x: (i.x - s.x) / r,
    y: (i.y - s.y) / r
  };
  return o.x === 1 / 0 && (o.x = 0), o.y === 1 / 0 && (o.y = 0), o;
}
function tp(t, { min: e, max: n }, s) {
  return e !== void 0 && t < e ? t = s ? J(e, t, s.min) : Math.max(t, e) : n !== void 0 && t > n && (t = s ? J(n, t, s.max) : Math.min(t, n)), t;
}
function jr(t, e, n) {
  return {
    min: e !== void 0 ? t.min + e : void 0,
    max: n !== void 0 ? t.max + n - (t.max - t.min) : void 0
  };
}
function ep(t, { top: e, left: n, bottom: s, right: i }) {
  return {
    x: jr(t.x, n, i),
    y: jr(t.y, e, s)
  };
}
function Lr(t, e) {
  let n = e.min - t.min, s = e.max - t.max;
  return e.max - e.min < t.max - t.min && ([n, s] = [s, n]), { min: n, max: s };
}
function np(t, e) {
  return {
    x: Lr(t.x, e.x),
    y: Lr(t.y, e.y)
  };
}
function sp(t, e) {
  let n = 0.5;
  const s = gt(t), i = gt(e);
  return i > s ? n = /* @__PURE__ */ Xe(e.min, e.max - s, t.min) : s > i && (n = /* @__PURE__ */ Xe(t.min, t.max - i, e.min)), Gt(0, 1, n);
}
function ip(t, e) {
  const n = {};
  return e.min !== void 0 && (n.min = e.min - t.min), e.max !== void 0 && (n.max = e.max - t.min), n;
}
const Fs = 0.35;
function rp(t = Fs) {
  return t === !1 ? t = 0 : t === !0 && (t = Fs), {
    x: Or(t, "left", "right"),
    y: Or(t, "top", "bottom")
  };
}
function Or(t, e, n) {
  return {
    min: Fr(t, e),
    max: Fr(t, n)
  };
}
function Fr(t, e) {
  return typeof t == "number" ? t : t[e] || 0;
}
const op = /* @__PURE__ */ new WeakMap();
class ap {
  constructor(e) {
    this.openDragLock = null, this.isDragging = !1, this.currentDirection = null, this.originPoint = { x: 0, y: 0 }, this.constraints = !1, this.hasMutatedConstraints = !1, this.elastic = st(), this.latestPointerEvent = null, this.latestPanInfo = null, this.visualElement = e;
  }
  start(e, { snapToCursor: n = !1, distanceThreshold: s } = {}) {
    const { presenceContext: i } = this.visualElement;
    if (i && i.isPresent === !1)
      return;
    const r = (d) => {
      const { dragSnapToOrigin: h } = this.getProps();
      h ? this.pauseAnimation() : this.stopAnimation(), n && this.snapToCursor(on(d).point);
    }, o = (d, h) => {
      const { drag: f, dragPropagation: g, onDragStart: v } = this.getProps();
      if (f && !g && (this.openDragLock && this.openDragLock(), this.openDragLock = dh(f), !this.openDragLock))
        return;
      this.latestPointerEvent = d, this.latestPanInfo = h, this.isDragging = !0, this.currentDirection = null, this.resolveConstraints(), this.visualElement.projection && (this.visualElement.projection.isAnimationBlocked = !0, this.visualElement.projection.target = void 0), At((x) => {
        let T = this.getAxisMotionValue(x).get() || 0;
        if (zt.test(T)) {
          const { projection: b } = this.visualElement;
          if (b && b.layout) {
            const P = b.layout.layoutBox[x];
            P && (T = gt(P) * (parseFloat(T) / 100));
          }
        }
        this.originPoint[x] = T;
      }), v && Y.postRender(() => v(d, h)), Ls(this.visualElement, "transform");
      const { animationState: y } = this.visualElement;
      y && y.setActive("whileDrag", !0);
    }, a = (d, h) => {
      this.latestPointerEvent = d, this.latestPanInfo = h;
      const { dragPropagation: f, dragDirectionLock: g, onDirectionLock: v, onDrag: y } = this.getProps();
      if (!f && !this.openDragLock)
        return;
      const { offset: x } = h;
      if (g && this.currentDirection === null) {
        this.currentDirection = lp(x), this.currentDirection !== null && v && v(this.currentDirection);
        return;
      }
      this.updateAxis("x", h.point, x), this.updateAxis("y", h.point, x), this.visualElement.render(), y && y(d, h);
    }, l = (d, h) => {
      this.latestPointerEvent = d, this.latestPanInfo = h, this.stop(d, h), this.latestPointerEvent = null, this.latestPanInfo = null;
    }, u = () => At((d) => this.getAnimationState(d) === "paused" && this.getAxisMotionValue(d).animation?.play()), { dragSnapToOrigin: c } = this.getProps();
    this.panSession = new al(e, {
      onSessionStart: r,
      onStart: o,
      onMove: a,
      onSessionEnd: l,
      resumeAnimation: u
    }, {
      transformPagePoint: this.visualElement.getTransformPagePoint(),
      dragSnapToOrigin: c,
      distanceThreshold: s,
      contextWindow: ol(this.visualElement)
    });
  }
  /**
   * @internal
   */
  stop(e, n) {
    const s = e || this.latestPointerEvent, i = n || this.latestPanInfo, r = this.isDragging;
    if (this.cancel(), !r || !i || !s)
      return;
    const { velocity: o } = i;
    this.startAnimation(o);
    const { onDragEnd: a } = this.getProps();
    a && Y.postRender(() => a(s, i));
  }
  /**
   * @internal
   */
  cancel() {
    this.isDragging = !1;
    const { projection: e, animationState: n } = this.visualElement;
    e && (e.isAnimationBlocked = !1), this.panSession && this.panSession.end(), this.panSession = void 0;
    const { dragPropagation: s } = this.getProps();
    !s && this.openDragLock && (this.openDragLock(), this.openDragLock = null), n && n.setActive("whileDrag", !1);
  }
  updateAxis(e, n, s) {
    const { drag: i } = this.getProps();
    if (!s || !pn(e, i, this.currentDirection))
      return;
    const r = this.getAxisMotionValue(e);
    let o = this.originPoint[e] + s[e];
    this.constraints && this.constraints[e] && (o = tp(o, this.constraints[e], this.elastic[e])), r.set(o);
  }
  resolveConstraints() {
    const { dragConstraints: e, dragElastic: n } = this.getProps(), s = this.visualElement.projection && !this.visualElement.projection.layout ? this.visualElement.projection.measure(!1) : this.visualElement.projection?.layout, i = this.constraints;
    e && ge(e) ? this.constraints || (this.constraints = this.resolveRefConstraints()) : e && s ? this.constraints = ep(s.layoutBox, e) : this.constraints = !1, this.elastic = rp(n), i !== this.constraints && s && this.constraints && !this.hasMutatedConstraints && At((r) => {
      this.constraints !== !1 && this.getAxisMotionValue(r) && (this.constraints[r] = ip(s.layoutBox[r], this.constraints[r]));
    });
  }
  resolveRefConstraints() {
    const { dragConstraints: e, onMeasureDragConstraints: n } = this.getProps();
    if (!e || !ge(e))
      return !1;
    const s = e.current, { projection: i } = this.visualElement;
    if (!i || !i.layout)
      return !1;
    const r = cf(s, i.root, this.visualElement.getTransformPagePoint());
    let o = np(i.layout.layoutBox, r);
    if (n) {
      const a = n(of(o));
      this.hasMutatedConstraints = !!a, a && (o = Ka(a));
    }
    return o;
  }
  startAnimation(e) {
    const { drag: n, dragMomentum: s, dragElastic: i, dragTransition: r, dragSnapToOrigin: o, onDragTransitionEnd: a } = this.getProps(), l = this.constraints || {}, u = At((c) => {
      if (!pn(c, n, this.currentDirection))
        return;
      let d = l && l[c] || {};
      o && (d = { min: 0, max: 0 });
      const h = i ? 200 : 1e6, f = i ? 40 : 1e7, g = {
        type: "inertia",
        velocity: s ? e[c] : 0,
        bounceStiffness: h,
        bounceDamping: f,
        timeConstant: 750,
        restDelta: 1,
        restSpeed: 10,
        ...r,
        ...d
      };
      return this.startAxisValueAnimation(c, g);
    });
    return Promise.all(u).then(a);
  }
  startAxisValueAnimation(e, n) {
    const s = this.getAxisMotionValue(e);
    return Ls(this.visualElement, e), s.start(Ri(e, s, 0, n, this.visualElement, !1));
  }
  stopAnimation() {
    At((e) => this.getAxisMotionValue(e).stop());
  }
  pauseAnimation() {
    At((e) => this.getAxisMotionValue(e).animation?.pause());
  }
  getAnimationState(e) {
    return this.getAxisMotionValue(e).animation?.state;
  }
  /**
   * Drag works differently depending on which props are provided.
   *
   * - If _dragX and _dragY are provided, we output the gesture delta directly to those motion values.
   * - Otherwise, we apply the delta to the x/y motion values.
   */
  getAxisMotionValue(e) {
    const n = `_drag${e.toUpperCase()}`, s = this.visualElement.getProps(), i = s[n];
    return i || this.visualElement.getValue(e, (s.initial ? s.initial[e] : void 0) || 0);
  }
  snapToCursor(e) {
    At((n) => {
      const { drag: s } = this.getProps();
      if (!pn(n, s, this.currentDirection))
        return;
      const { projection: i } = this.visualElement, r = this.getAxisMotionValue(n);
      if (i && i.layout) {
        const { min: o, max: a } = i.layout.layoutBox[n];
        r.set(e[n] - J(o, a, 0.5));
      }
    });
  }
  /**
   * When the viewport resizes we want to check if the measured constraints
   * have changed and, if so, reposition the element within those new constraints
   * relative to where it was before the resize.
   */
  scalePositionWithinConstraints() {
    if (!this.visualElement.current)
      return;
    const { drag: e, dragConstraints: n } = this.getProps(), { projection: s } = this.visualElement;
    if (!ge(n) || !s || !this.constraints)
      return;
    this.stopAnimation();
    const i = { x: 0, y: 0 };
    At((o) => {
      const a = this.getAxisMotionValue(o);
      if (a && this.constraints !== !1) {
        const l = a.get();
        i[o] = sp({ min: l, max: l }, this.constraints[o]);
      }
    });
    const { transformTemplate: r } = this.visualElement.getProps();
    this.visualElement.current.style.transform = r ? r({}, "") : "none", s.root && s.root.updateScroll(), s.updateLayout(), this.resolveConstraints(), At((o) => {
      if (!pn(o, e, null))
        return;
      const a = this.getAxisMotionValue(o), { min: l, max: u } = this.constraints[o];
      a.set(J(l, u, i[o]));
    });
  }
  addListeners() {
    if (!this.visualElement.current)
      return;
    op.set(this.visualElement, this);
    const e = this.visualElement.current, n = Ue(e, "pointerdown", (l) => {
      const { drag: u, dragListener: c = !0 } = this.getProps();
      u && c && this.start(l);
    }), s = () => {
      const { dragConstraints: l } = this.getProps();
      ge(l) && l.current && (this.constraints = this.resolveRefConstraints());
    }, { projection: i } = this.visualElement, r = i.addEventListener("measure", s);
    i && !i.layout && (i.root && i.root.updateScroll(), i.updateLayout()), Y.read(s);
    const o = Ze(window, "resize", () => this.scalePositionWithinConstraints()), a = i.addEventListener("didUpdate", (({ delta: l, hasLayoutChanged: u }) => {
      this.isDragging && u && (At((c) => {
        const d = this.getAxisMotionValue(c);
        d && (this.originPoint[c] += l[c].translate, d.set(d.get() + l[c].translate));
      }), this.visualElement.render());
    }));
    return () => {
      o(), n(), r(), a && a();
    };
  }
  getProps() {
    const e = this.visualElement.getProps(), { drag: n = !1, dragDirectionLock: s = !1, dragPropagation: i = !1, dragConstraints: r = !1, dragElastic: o = Fs, dragMomentum: a = !0 } = e;
    return {
      ...e,
      drag: n,
      dragDirectionLock: s,
      dragPropagation: i,
      dragConstraints: r,
      dragElastic: o,
      dragMomentum: a
    };
  }
}
function pn(t, e, n) {
  return (e === !0 || e === t) && (n === null || n === t);
}
function lp(t, e = 10) {
  let n = null;
  return Math.abs(t.y) > e ? n = "y" : Math.abs(t.x) > e && (n = "x"), n;
}
class cp extends se {
  constructor(e) {
    super(e), this.removeGroupControls = Mt, this.removeListeners = Mt, this.controls = new ap(e);
  }
  mount() {
    const { dragControls: e } = this.node.getProps();
    e && (this.removeGroupControls = e.subscribe(this.controls)), this.removeListeners = this.controls.addListeners() || Mt;
  }
  unmount() {
    this.removeGroupControls(), this.removeListeners();
  }
}
const Br = (t) => (e, n) => {
  t && Y.postRender(() => t(e, n));
};
class up extends se {
  constructor() {
    super(...arguments), this.removePointerDownListener = Mt;
  }
  onPointerDown(e) {
    this.session = new al(e, this.createPanHandlers(), {
      transformPagePoint: this.node.getTransformPagePoint(),
      contextWindow: ol(this.node)
    });
  }
  createPanHandlers() {
    const { onPanSessionStart: e, onPanStart: n, onPan: s, onPanEnd: i } = this.node.getProps();
    return {
      onSessionStart: Br(e),
      onStart: Br(n),
      onMove: s,
      onEnd: (r, o) => {
        delete this.session, i && Y.postRender(() => i(r, o));
      }
    };
  }
  mount() {
    this.removePointerDownListener = Ue(this.node.current, "pointerdown", (e) => this.onPointerDown(e));
  }
  update() {
    this.session && this.session.updateHandlers(this.createPanHandlers());
  }
  unmount() {
    this.removePointerDownListener(), this.session && this.session.end();
  }
}
const xn = {
  /**
   * Global flag as to whether the tree has animated since the last time
   * we resized the window
   */
  hasAnimatedSinceResize: !0,
  /**
   * We set this to true once, on the first update. Any nodes added to the tree beyond that
   * update will be given a `data-projection-id` attribute.
   */
  hasEverUpdated: !1
};
let ns = !1;
class dp extends kl {
  /**
   * This only mounts projection nodes for components that
   * need measuring, we might want to do it for all components
   * in order to incorporate transforms
   */
  componentDidMount() {
    const { visualElement: e, layoutGroup: n, switchLayoutGroup: s, layoutId: i } = this.props, { projection: r } = e;
    r && (n.group && n.group.add(r), s && s.register && i && s.register(r), ns && r.root.didUpdate(), r.addEventListener("animationComplete", () => {
      this.safeToRemove();
    }), r.setOptions({
      ...r.options,
      onExitComplete: () => this.safeToRemove()
    })), xn.hasEverUpdated = !0;
  }
  getSnapshotBeforeUpdate(e) {
    const { layoutDependency: n, visualElement: s, drag: i, isPresent: r } = this.props, { projection: o } = s;
    return o && (o.isPresent = r, ns = !0, i || e.layoutDependency !== n || n === void 0 || e.isPresent !== r ? o.willUpdate() : this.safeToRemove(), e.isPresent !== r && (r ? o.promote() : o.relegate() || Y.postRender(() => {
      const a = o.getStack();
      (!a || !a.members.length) && this.safeToRemove();
    }))), null;
  }
  componentDidUpdate() {
    const { projection: e } = this.props.visualElement;
    e && (e.root.didUpdate(), yi.postRender(() => {
      !e.currentAnimation && e.isLead() && this.safeToRemove();
    }));
  }
  componentWillUnmount() {
    const { visualElement: e, layoutGroup: n, switchLayoutGroup: s } = this.props, { projection: i } = e;
    ns = !0, i && (i.scheduleCheckAfterUnmount(), n && n.group && n.group.remove(i), s && s.deregister && s.deregister(i));
  }
  safeToRemove() {
    const { safeToRemove: e } = this.props;
    e && e();
  }
  render() {
    return null;
  }
}
function cl(t) {
  const [e, n] = Va(), s = q(qs);
  return p.jsx(dp, { ...t, layoutGroup: s, switchLayoutGroup: q(za), isPresent: e, safeToRemove: n });
}
function hp(t, e, n) {
  const s = ft(t) ? t : Te(t);
  return s.start(Ri("", s, e, n)), s.animation;
}
const fp = (t, e) => t.depth - e.depth;
class pp {
  constructor() {
    this.children = [], this.isDirty = !1;
  }
  add(e) {
    Qs(this.children, e), this.isDirty = !0;
  }
  remove(e) {
    ti(this.children, e), this.isDirty = !0;
  }
  forEach(e) {
    this.isDirty && this.children.sort(fp), this.isDirty = !1, this.children.forEach(e);
  }
}
function mp(t, e) {
  const n = yt.now(), s = ({ timestamp: i }) => {
    const r = i - n;
    r >= e && (ee(s), t(r - e));
  };
  return Y.setup(s, !0), () => ee(s);
}
const ul = ["TopLeft", "TopRight", "BottomLeft", "BottomRight"], gp = ul.length, $r = (t) => typeof t == "string" ? parseFloat(t) : t, _r = (t) => typeof t == "number" || I.test(t);
function yp(t, e, n, s, i, r) {
  i ? (t.opacity = J(0, n.opacity ?? 1, vp(s)), t.opacityExit = J(e.opacity ?? 1, 0, xp(s))) : r && (t.opacity = J(e.opacity ?? 1, n.opacity ?? 1, s));
  for (let o = 0; o < gp; o++) {
    const a = `border${ul[o]}Radius`;
    let l = Ur(e, a), u = Ur(n, a);
    if (l === void 0 && u === void 0)
      continue;
    l || (l = 0), u || (u = 0), l === 0 || u === 0 || _r(l) === _r(u) ? (t[a] = Math.max(J($r(l), $r(u), s), 0), (zt.test(u) || zt.test(l)) && (t[a] += "%")) : t[a] = u;
  }
  (e.rotate || n.rotate) && (t.rotate = J(e.rotate || 0, n.rotate || 0, s));
}
function Ur(t, e) {
  return t[e] !== void 0 ? t[e] : t.borderRadius;
}
const vp = /* @__PURE__ */ dl(0, 0.5, qo), xp = /* @__PURE__ */ dl(0.5, 0.95, Mt);
function dl(t, e, n) {
  return (s) => s < t ? 0 : s > e ? 1 : n(/* @__PURE__ */ Xe(t, e, s));
}
function zr(t, e) {
  t.min = e.min, t.max = e.max;
}
function kt(t, e) {
  zr(t.x, e.x), zr(t.y, e.y);
}
function Wr(t, e) {
  t.translate = e.translate, t.scale = e.scale, t.originPoint = e.originPoint, t.origin = e.origin;
}
function Kr(t, e, n, s, i) {
  return t -= e, t = Rn(t, 1 / n, s), i !== void 0 && (t = Rn(t, 1 / i, s)), t;
}
function bp(t, e = 0, n = 1, s = 0.5, i, r = t, o = t) {
  if (zt.test(e) && (e = parseFloat(e), e = J(o.min, o.max, e / 100) - o.min), typeof e != "number")
    return;
  let a = J(r.min, r.max, s);
  t === r && (a -= e), t.min = Kr(t.min, e, n, a, i), t.max = Kr(t.max, e, n, a, i);
}
function Gr(t, e, [n, s, i], r, o) {
  bp(t, e[n], e[s], e[i], e.scale, r, o);
}
const wp = ["x", "scaleX", "originX"], Tp = ["y", "scaleY", "originY"];
function Hr(t, e, n, s) {
  Gr(t.x, e, wp, n ? n.x : void 0, s ? s.x : void 0), Gr(t.y, e, Tp, n ? n.y : void 0, s ? s.y : void 0);
}
function Xr(t) {
  return t.translate === 0 && t.scale === 1;
}
function hl(t) {
  return Xr(t.x) && Xr(t.y);
}
function Yr(t, e) {
  return t.min === e.min && t.max === e.max;
}
function Sp(t, e) {
  return Yr(t.x, e.x) && Yr(t.y, e.y);
}
function qr(t, e) {
  return Math.round(t.min) === Math.round(e.min) && Math.round(t.max) === Math.round(e.max);
}
function fl(t, e) {
  return qr(t.x, e.x) && qr(t.y, e.y);
}
function Jr(t) {
  return gt(t.x) / gt(t.y);
}
function Zr(t, e) {
  return t.translate === e.translate && t.scale === e.scale && t.originPoint === e.originPoint;
}
class Dp {
  constructor() {
    this.members = [];
  }
  add(e) {
    Qs(this.members, e), e.scheduleRender();
  }
  remove(e) {
    if (ti(this.members, e), e === this.prevLead && (this.prevLead = void 0), e === this.lead) {
      const n = this.members[this.members.length - 1];
      n && this.promote(n);
    }
  }
  relegate(e) {
    const n = this.members.findIndex((i) => e === i);
    if (n === 0)
      return !1;
    let s;
    for (let i = n; i >= 0; i--) {
      const r = this.members[i];
      if (r.isPresent !== !1) {
        s = r;
        break;
      }
    }
    return s ? (this.promote(s), !0) : !1;
  }
  promote(e, n) {
    const s = this.lead;
    if (e !== s && (this.prevLead = s, this.lead = e, e.show(), s)) {
      s.instance && s.scheduleRender(), e.scheduleRender(), e.resumeFrom = s, n && (e.resumeFrom.preserveOpacity = !0), s.snapshot && (e.snapshot = s.snapshot, e.snapshot.latestValues = s.animationValues || s.latestValues), e.root && e.root.isUpdating && (e.isLayoutDirty = !0);
      const { crossfade: i } = e.options;
      i === !1 && s.hide();
    }
  }
  exitAnimationComplete() {
    this.members.forEach((e) => {
      const { options: n, resumingFrom: s } = e;
      n.onExitComplete && n.onExitComplete(), s && s.options.onExitComplete && s.options.onExitComplete();
    });
  }
  scheduleRender() {
    this.members.forEach((e) => {
      e.instance && e.scheduleRender(!1);
    });
  }
  /**
   * Clear any leads that have been removed this render to prevent them from being
   * used in future animations and to prevent memory leaks
   */
  removeLeadSnapshot() {
    this.lead && this.lead.snapshot && (this.lead.snapshot = void 0);
  }
}
function Cp(t, e, n) {
  let s = "";
  const i = t.x.translate / e.x, r = t.y.translate / e.y, o = n?.z || 0;
  if ((i || r || o) && (s = `translate3d(${i}px, ${r}px, ${o}px) `), (e.x !== 1 || e.y !== 1) && (s += `scale(${1 / e.x}, ${1 / e.y}) `), n) {
    const { transformPerspective: u, rotate: c, rotateX: d, rotateY: h, skewX: f, skewY: g } = n;
    u && (s = `perspective(${u}px) ${s}`), c && (s += `rotate(${c}deg) `), d && (s += `rotateX(${d}deg) `), h && (s += `rotateY(${h}deg) `), f && (s += `skewX(${f}deg) `), g && (s += `skewY(${g}deg) `);
  }
  const a = t.x.scale * e.x, l = t.y.scale * e.y;
  return (a !== 1 || l !== 1) && (s += `scale(${a}, ${l})`), s || "none";
}
const ss = ["", "X", "Y", "Z"], Ap = 1e3;
let Pp = 0;
function is(t, e, n, s) {
  const { latestValues: i } = e;
  i[t] && (n[t] = i[t], e.setStaticValue(t, 0), s && (s[t] = 0));
}
function pl(t) {
  if (t.hasCheckedOptimisedAppear = !0, t.root === t)
    return;
  const { visualElement: e } = t.options;
  if (!e)
    return;
  const n = Qa(e);
  if (window.MotionHasOptimisedAnimation(n, "transform")) {
    const { layout: i, layoutId: r } = t.options;
    window.MotionCancelOptimisedAnimation(n, "transform", Y, !(i || r));
  }
  const { parent: s } = t;
  s && !s.hasCheckedOptimisedAppear && pl(s);
}
function ml({ attachResizeListener: t, defaultParent: e, measureScroll: n, checkIsScrollRoot: s, resetTransform: i }) {
  return class {
    constructor(o = {}, a = e?.()) {
      this.id = Pp++, this.animationId = 0, this.animationCommitId = 0, this.children = /* @__PURE__ */ new Set(), this.options = {}, this.isTreeAnimating = !1, this.isAnimationBlocked = !1, this.isLayoutDirty = !1, this.isProjectionDirty = !1, this.isSharedProjectionDirty = !1, this.isTransformDirty = !1, this.updateManuallyBlocked = !1, this.updateBlockedByResize = !1, this.isUpdating = !1, this.isSVG = !1, this.needsReset = !1, this.shouldResetTransform = !1, this.hasCheckedOptimisedAppear = !1, this.treeScale = { x: 1, y: 1 }, this.eventHandlers = /* @__PURE__ */ new Map(), this.hasTreeAnimated = !1, this.layoutVersion = 0, this.updateScheduled = !1, this.scheduleUpdate = () => this.update(), this.projectionUpdateScheduled = !1, this.checkUpdateFailed = () => {
        this.isUpdating && (this.isUpdating = !1, this.clearAllSnapshots());
      }, this.updateProjection = () => {
        this.projectionUpdateScheduled = !1, this.nodes.forEach(Ep), this.nodes.forEach(Ip), this.nodes.forEach(jp), this.nodes.forEach(Vp);
      }, this.resolvedRelativeTargetAt = 0, this.linkedParentVersion = 0, this.hasProjected = !1, this.isVisible = !0, this.animationProgress = 0, this.sharedNodes = /* @__PURE__ */ new Map(), this.latestValues = o, this.root = a ? a.root || a : this, this.path = a ? [...a.path, a] : [], this.parent = a, this.depth = a ? a.depth + 1 : 0;
      for (let l = 0; l < this.path.length; l++)
        this.path[l].shouldResetTransform = !0;
      this.root === this && (this.nodes = new pp());
    }
    addEventListener(o, a) {
      return this.eventHandlers.has(o) || this.eventHandlers.set(o, new si()), this.eventHandlers.get(o).add(a);
    }
    notifyListeners(o, ...a) {
      const l = this.eventHandlers.get(o);
      l && l.notify(...a);
    }
    hasListeners(o) {
      return this.eventHandlers.has(o);
    }
    /**
     * Lifecycles
     */
    mount(o) {
      if (this.instance)
        return;
      this.isSVG = Ea(o) && !yh(o), this.instance = o;
      const { layoutId: a, layout: l, visualElement: u } = this.options;
      if (u && !u.current && u.mount(o), this.root.nodes.add(this), this.parent && this.parent.children.add(this), this.root.hasTreeAnimated && (l || a) && (this.isLayoutDirty = !0), t) {
        let c, d = 0;
        const h = () => this.root.updateBlockedByResize = !1;
        Y.read(() => {
          d = window.innerWidth;
        }), t(o, () => {
          const f = window.innerWidth;
          f !== d && (d = f, this.root.updateBlockedByResize = !0, c && c(), c = mp(h, 250), xn.hasAnimatedSinceResize && (xn.hasAnimatedSinceResize = !1, this.nodes.forEach(eo)));
        });
      }
      a && this.root.registerSharedNode(a, this), this.options.animate !== !1 && u && (a || l) && this.addEventListener("didUpdate", ({ delta: c, hasLayoutChanged: d, hasRelativeLayoutChanged: h, layout: f }) => {
        if (this.isTreeAnimationBlocked()) {
          this.target = void 0, this.relativeTarget = void 0;
          return;
        }
        const g = this.options.transition || u.getDefaultTransition() || $p, { onLayoutAnimationStart: v, onLayoutAnimationComplete: y } = u.getProps(), x = !this.targetLayout || !fl(this.targetLayout, f), T = !d && h;
        if (this.options.layoutRoot || this.resumeFrom || T || d && (x || !this.currentAnimation)) {
          this.resumeFrom && (this.resumingFrom = this.resumeFrom, this.resumingFrom.resumingFrom = void 0);
          const b = {
            ...mi(g, "layout"),
            onPlay: v,
            onComplete: y
          };
          (u.shouldReduceMotion || this.options.layoutRoot) && (b.delay = 0, b.type = !1), this.startAnimation(b), this.setAnimationOrigin(c, T);
        } else
          d || eo(this), this.isLead() && this.options.onExitComplete && this.options.onExitComplete();
        this.targetLayout = f;
      });
    }
    unmount() {
      this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this);
      const o = this.getStack();
      o && o.remove(this), this.parent && this.parent.children.delete(this), this.instance = void 0, this.eventHandlers.clear(), ee(this.updateProjection);
    }
    // only on the root
    blockUpdate() {
      this.updateManuallyBlocked = !0;
    }
    unblockUpdate() {
      this.updateManuallyBlocked = !1;
    }
    isUpdateBlocked() {
      return this.updateManuallyBlocked || this.updateBlockedByResize;
    }
    isTreeAnimationBlocked() {
      return this.isAnimationBlocked || this.parent && this.parent.isTreeAnimationBlocked() || !1;
    }
    // Note: currently only running on root node
    startUpdate() {
      this.isUpdateBlocked() || (this.isUpdating = !0, this.nodes && this.nodes.forEach(Lp), this.animationId++);
    }
    getTransformTemplate() {
      const { visualElement: o } = this.options;
      return o && o.getProps().transformTemplate;
    }
    willUpdate(o = !0) {
      if (this.root.hasTreeAnimated = !0, this.root.isUpdateBlocked()) {
        this.options.onExitComplete && this.options.onExitComplete();
        return;
      }
      if (window.MotionCancelOptimisedAnimation && !this.hasCheckedOptimisedAppear && pl(this), !this.root.isUpdating && this.root.startUpdate(), this.isLayoutDirty)
        return;
      this.isLayoutDirty = !0;
      for (let c = 0; c < this.path.length; c++) {
        const d = this.path[c];
        d.shouldResetTransform = !0, d.updateScroll("snapshot"), d.options.layoutRoot && d.willUpdate(!1);
      }
      const { layoutId: a, layout: l } = this.options;
      if (a === void 0 && !l)
        return;
      const u = this.getTransformTemplate();
      this.prevTransformTemplateValue = u ? u(this.latestValues, "") : void 0, this.updateSnapshot(), o && this.notifyListeners("willUpdate");
    }
    update() {
      if (this.updateScheduled = !1, this.isUpdateBlocked()) {
        this.unblockUpdate(), this.clearAllSnapshots(), this.nodes.forEach(Qr);
        return;
      }
      if (this.animationId <= this.animationCommitId) {
        this.nodes.forEach(to);
        return;
      }
      this.animationCommitId = this.animationId, this.isUpdating ? (this.isUpdating = !1, this.nodes.forEach(kp), this.nodes.forEach(Rp), this.nodes.forEach(Mp)) : this.nodes.forEach(to), this.clearAllSnapshots();
      const a = yt.now();
      ut.delta = Gt(0, 1e3 / 60, a - ut.timestamp), ut.timestamp = a, ut.isProcessing = !0, Gn.update.process(ut), Gn.preRender.process(ut), Gn.render.process(ut), ut.isProcessing = !1;
    }
    didUpdate() {
      this.updateScheduled || (this.updateScheduled = !0, yi.read(this.scheduleUpdate));
    }
    clearAllSnapshots() {
      this.nodes.forEach(Np), this.sharedNodes.forEach(Op);
    }
    scheduleUpdateProjection() {
      this.projectionUpdateScheduled || (this.projectionUpdateScheduled = !0, Y.preRender(this.updateProjection, !1, !0));
    }
    scheduleCheckAfterUnmount() {
      Y.postRender(() => {
        this.isLayoutDirty ? this.root.didUpdate() : this.root.checkUpdateFailed();
      });
    }
    /**
     * Update measurements
     */
    updateSnapshot() {
      this.snapshot || !this.instance || (this.snapshot = this.measure(), this.snapshot && !gt(this.snapshot.measuredBox.x) && !gt(this.snapshot.measuredBox.y) && (this.snapshot = void 0));
    }
    updateLayout() {
      if (!this.instance || (this.updateScroll(), !(this.options.alwaysMeasureLayout && this.isLead()) && !this.isLayoutDirty))
        return;
      if (this.resumeFrom && !this.resumeFrom.instance)
        for (let l = 0; l < this.path.length; l++)
          this.path[l].updateScroll();
      const o = this.layout;
      this.layout = this.measure(!1), this.layoutVersion++, this.layoutCorrected = st(), this.isLayoutDirty = !1, this.projectionDelta = void 0, this.notifyListeners("measure", this.layout.layoutBox);
      const { visualElement: a } = this.options;
      a && a.notify("LayoutMeasure", this.layout.layoutBox, o ? o.layoutBox : void 0);
    }
    updateScroll(o = "measure") {
      let a = !!(this.options.layoutScroll && this.instance);
      if (this.scroll && this.scroll.animationId === this.root.animationId && this.scroll.phase === o && (a = !1), a && this.instance) {
        const l = s(this.instance);
        this.scroll = {
          animationId: this.root.animationId,
          phase: o,
          isRoot: l,
          offset: n(this.instance),
          wasRoot: this.scroll ? this.scroll.isRoot : l
        };
      }
    }
    resetTransform() {
      if (!i)
        return;
      const o = this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout, a = this.projectionDelta && !hl(this.projectionDelta), l = this.getTransformTemplate(), u = l ? l(this.latestValues, "") : void 0, c = u !== this.prevTransformTemplateValue;
      o && this.instance && (a || ae(this.latestValues) || c) && (i(this.instance, u), this.shouldResetTransform = !1, this.scheduleRender());
    }
    measure(o = !0) {
      const a = this.measurePageBox();
      let l = this.removeElementScroll(a);
      return o && (l = this.removeTransform(l)), _p(l), {
        animationId: this.root.animationId,
        measuredBox: a,
        layoutBox: l,
        latestValues: {},
        source: this.id
      };
    }
    measurePageBox() {
      const { visualElement: o } = this.options;
      if (!o)
        return st();
      const a = o.measureViewportBox();
      if (!(this.scroll?.wasRoot || this.path.some(Up))) {
        const { scroll: u } = this.root;
        u && (ye(a.x, u.offset.x), ye(a.y, u.offset.y));
      }
      return a;
    }
    removeElementScroll(o) {
      const a = st();
      if (kt(a, o), this.scroll?.wasRoot)
        return a;
      for (let l = 0; l < this.path.length; l++) {
        const u = this.path[l], { scroll: c, options: d } = u;
        u !== this.root && c && d.layoutScroll && (c.wasRoot && kt(a, o), ye(a.x, c.offset.x), ye(a.y, c.offset.y));
      }
      return a;
    }
    applyTransform(o, a = !1) {
      const l = st();
      kt(l, o);
      for (let u = 0; u < this.path.length; u++) {
        const c = this.path[u];
        !a && c.options.layoutScroll && c.scroll && c !== c.root && ve(l, {
          x: -c.scroll.offset.x,
          y: -c.scroll.offset.y
        }), ae(c.latestValues) && ve(l, c.latestValues);
      }
      return ae(this.latestValues) && ve(l, this.latestValues), l;
    }
    removeTransform(o) {
      const a = st();
      kt(a, o);
      for (let l = 0; l < this.path.length; l++) {
        const u = this.path[l];
        if (!u.instance || !ae(u.latestValues))
          continue;
        Ns(u.latestValues) && u.updateSnapshot();
        const c = st(), d = u.measurePageBox();
        kt(c, d), Hr(a, u.latestValues, u.snapshot ? u.snapshot.layoutBox : void 0, c);
      }
      return ae(this.latestValues) && Hr(a, this.latestValues), a;
    }
    setTargetDelta(o) {
      this.targetDelta = o, this.root.scheduleUpdateProjection(), this.isProjectionDirty = !0;
    }
    setOptions(o) {
      this.options = {
        ...this.options,
        ...o,
        crossfade: o.crossfade !== void 0 ? o.crossfade : !0
      };
    }
    clearMeasurements() {
      this.scroll = void 0, this.layout = void 0, this.snapshot = void 0, this.prevTransformTemplateValue = void 0, this.targetDelta = void 0, this.target = void 0, this.isLayoutDirty = !1;
    }
    forceRelativeParentToResolveTarget() {
      this.relativeParent && this.relativeParent.resolvedRelativeTargetAt !== ut.timestamp && this.relativeParent.resolveTargetDelta(!0);
    }
    resolveTargetDelta(o = !1) {
      const a = this.getLead();
      this.isProjectionDirty || (this.isProjectionDirty = a.isProjectionDirty), this.isTransformDirty || (this.isTransformDirty = a.isTransformDirty), this.isSharedProjectionDirty || (this.isSharedProjectionDirty = a.isSharedProjectionDirty);
      const l = !!this.resumingFrom || this !== a;
      if (!(o || l && this.isSharedProjectionDirty || this.isProjectionDirty || this.parent?.isProjectionDirty || this.attemptToResolveRelativeTarget || this.root.updateBlockedByResize))
        return;
      const { layout: c, layoutId: d } = this.options;
      if (!this.layout || !(c || d))
        return;
      this.resolvedRelativeTargetAt = ut.timestamp;
      const h = this.getClosestProjectingParent();
      h && this.linkedParentVersion !== h.layoutVersion && !h.options.layoutRoot && this.removeRelativeTarget(), !this.targetDelta && !this.relativeTarget && (h && h.layout ? this.createRelativeTarget(h, this.layout.layoutBox, h.layout.layoutBox) : this.removeRelativeTarget()), !(!this.relativeTarget && !this.targetDelta) && (this.target || (this.target = st(), this.targetWithTransforms = st()), this.relativeTarget && this.relativeTargetOrigin && this.relativeParent && this.relativeParent.target ? (this.forceRelativeParentToResolveTarget(), qf(this.target, this.relativeTarget, this.relativeParent.target)) : this.targetDelta ? (this.resumingFrom ? this.target = this.applyTransform(this.layout.layoutBox) : kt(this.target, this.layout.layoutBox), Ha(this.target, this.targetDelta)) : kt(this.target, this.layout.layoutBox), this.attemptToResolveRelativeTarget && (this.attemptToResolveRelativeTarget = !1, h && !!h.resumingFrom == !!this.resumingFrom && !h.options.layoutScroll && h.target && this.animationProgress !== 1 ? this.createRelativeTarget(h, this.target, h.target) : this.relativeParent = this.relativeTarget = void 0));
    }
    getClosestProjectingParent() {
      if (!(!this.parent || Ns(this.parent.latestValues) || Ga(this.parent.latestValues)))
        return this.parent.isProjecting() ? this.parent : this.parent.getClosestProjectingParent();
    }
    isProjecting() {
      return !!((this.relativeTarget || this.targetDelta || this.options.layoutRoot) && this.layout);
    }
    createRelativeTarget(o, a, l) {
      this.relativeParent = o, this.linkedParentVersion = o.layoutVersion, this.forceRelativeParentToResolveTarget(), this.relativeTarget = st(), this.relativeTargetOrigin = st(), Mn(this.relativeTargetOrigin, a, l), kt(this.relativeTarget, this.relativeTargetOrigin);
    }
    removeRelativeTarget() {
      this.relativeParent = this.relativeTarget = void 0;
    }
    calcProjection() {
      const o = this.getLead(), a = !!this.resumingFrom || this !== o;
      let l = !0;
      if ((this.isProjectionDirty || this.parent?.isProjectionDirty) && (l = !1), a && (this.isSharedProjectionDirty || this.isTransformDirty) && (l = !1), this.resolvedRelativeTargetAt === ut.timestamp && (l = !1), l)
        return;
      const { layout: u, layoutId: c } = this.options;
      if (this.isTreeAnimating = !!(this.parent && this.parent.isTreeAnimating || this.currentAnimation || this.pendingAnimation), this.isTreeAnimating || (this.targetDelta = this.relativeTarget = void 0), !this.layout || !(u || c))
        return;
      kt(this.layoutCorrected, this.layout.layoutBox);
      const d = this.treeScale.x, h = this.treeScale.y;
      lf(this.layoutCorrected, this.treeScale, this.path, a), o.layout && !o.target && (this.treeScale.x !== 1 || this.treeScale.y !== 1) && (o.target = o.layout.layoutBox, o.targetWithTransforms = st());
      const { target: f } = o;
      if (!f) {
        this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
        return;
      }
      !this.projectionDelta || !this.prevProjectionDelta ? this.createProjectionDeltas() : (Wr(this.prevProjectionDelta.x, this.projectionDelta.x), Wr(this.prevProjectionDelta.y, this.projectionDelta.y)), ze(this.projectionDelta, this.layoutCorrected, f, this.latestValues), (this.treeScale.x !== d || this.treeScale.y !== h || !Zr(this.projectionDelta.x, this.prevProjectionDelta.x) || !Zr(this.projectionDelta.y, this.prevProjectionDelta.y)) && (this.hasProjected = !0, this.scheduleRender(), this.notifyListeners("projectionUpdate", f));
    }
    hide() {
      this.isVisible = !1;
    }
    show() {
      this.isVisible = !0;
    }
    scheduleRender(o = !0) {
      if (this.options.visualElement?.scheduleRender(), o) {
        const a = this.getStack();
        a && a.scheduleRender();
      }
      this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = void 0);
    }
    createProjectionDeltas() {
      this.prevProjectionDelta = xe(), this.projectionDelta = xe(), this.projectionDeltaWithTransform = xe();
    }
    setAnimationOrigin(o, a = !1) {
      const l = this.snapshot, u = l ? l.latestValues : {}, c = { ...this.latestValues }, d = xe();
      (!this.relativeParent || !this.relativeParent.options.layoutRoot) && (this.relativeTarget = this.relativeTargetOrigin = void 0), this.attemptToResolveRelativeTarget = !a;
      const h = st(), f = l ? l.source : void 0, g = this.layout ? this.layout.source : void 0, v = f !== g, y = this.getStack(), x = !y || y.members.length <= 1, T = !!(v && !x && this.options.crossfade === !0 && !this.path.some(Bp));
      this.animationProgress = 0;
      let b;
      this.mixTargetDelta = (P) => {
        const D = P / 1e3;
        no(d.x, o.x, D), no(d.y, o.y, D), this.setTargetDelta(d), this.relativeTarget && this.relativeTargetOrigin && this.layout && this.relativeParent && this.relativeParent.layout && (Mn(h, this.layout.layoutBox, this.relativeParent.layout.layoutBox), Fp(this.relativeTarget, this.relativeTargetOrigin, h, D), b && Sp(this.relativeTarget, b) && (this.isProjectionDirty = !1), b || (b = st()), kt(b, this.relativeTarget)), v && (this.animationValues = c, yp(c, u, this.latestValues, D, T, x)), this.root.scheduleUpdateProjection(), this.scheduleRender(), this.animationProgress = D;
      }, this.mixTargetDelta(this.options.layoutRoot ? 1e3 : 0);
    }
    startAnimation(o) {
      this.notifyListeners("animationStart"), this.currentAnimation?.stop(), this.resumingFrom?.currentAnimation?.stop(), this.pendingAnimation && (ee(this.pendingAnimation), this.pendingAnimation = void 0), this.pendingAnimation = Y.update(() => {
        xn.hasAnimatedSinceResize = !0, this.motionValue || (this.motionValue = Te(0)), this.currentAnimation = hp(this.motionValue, [0, 1e3], {
          ...o,
          velocity: 0,
          isSync: !0,
          onUpdate: (a) => {
            this.mixTargetDelta(a), o.onUpdate && o.onUpdate(a);
          },
          onStop: () => {
          },
          onComplete: () => {
            o.onComplete && o.onComplete(), this.completeAnimation();
          }
        }), this.resumingFrom && (this.resumingFrom.currentAnimation = this.currentAnimation), this.pendingAnimation = void 0;
      });
    }
    completeAnimation() {
      this.resumingFrom && (this.resumingFrom.currentAnimation = void 0, this.resumingFrom.preserveOpacity = void 0);
      const o = this.getStack();
      o && o.exitAnimationComplete(), this.resumingFrom = this.currentAnimation = this.animationValues = void 0, this.notifyListeners("animationComplete");
    }
    finishAnimation() {
      this.currentAnimation && (this.mixTargetDelta && this.mixTargetDelta(Ap), this.currentAnimation.stop()), this.completeAnimation();
    }
    applyTransformsToTarget() {
      const o = this.getLead();
      let { targetWithTransforms: a, target: l, layout: u, latestValues: c } = o;
      if (!(!a || !l || !u)) {
        if (this !== o && this.layout && u && gl(this.options.animationType, this.layout.layoutBox, u.layoutBox)) {
          l = this.target || st();
          const d = gt(this.layout.layoutBox.x);
          l.x.min = o.target.x.min, l.x.max = l.x.min + d;
          const h = gt(this.layout.layoutBox.y);
          l.y.min = o.target.y.min, l.y.max = l.y.min + h;
        }
        kt(a, l), ve(a, c), ze(this.projectionDeltaWithTransform, this.layoutCorrected, a, c);
      }
    }
    registerSharedNode(o, a) {
      this.sharedNodes.has(o) || this.sharedNodes.set(o, new Dp()), this.sharedNodes.get(o).add(a);
      const u = a.options.initialPromotionConfig;
      a.promote({
        transition: u ? u.transition : void 0,
        preserveFollowOpacity: u && u.shouldPreserveFollowOpacity ? u.shouldPreserveFollowOpacity(a) : void 0
      });
    }
    isLead() {
      const o = this.getStack();
      return o ? o.lead === this : !0;
    }
    getLead() {
      const { layoutId: o } = this.options;
      return o ? this.getStack()?.lead || this : this;
    }
    getPrevLead() {
      const { layoutId: o } = this.options;
      return o ? this.getStack()?.prevLead : void 0;
    }
    getStack() {
      const { layoutId: o } = this.options;
      if (o)
        return this.root.sharedNodes.get(o);
    }
    promote({ needsReset: o, transition: a, preserveFollowOpacity: l } = {}) {
      const u = this.getStack();
      u && u.promote(this, l), o && (this.projectionDelta = void 0, this.needsReset = !0), a && this.setOptions({ transition: a });
    }
    relegate() {
      const o = this.getStack();
      return o ? o.relegate(this) : !1;
    }
    resetSkewAndRotation() {
      const { visualElement: o } = this.options;
      if (!o)
        return;
      let a = !1;
      const { latestValues: l } = o;
      if ((l.z || l.rotate || l.rotateX || l.rotateY || l.rotateZ || l.skewX || l.skewY) && (a = !0), !a)
        return;
      const u = {};
      l.z && is("z", o, u, this.animationValues);
      for (let c = 0; c < ss.length; c++)
        is(`rotate${ss[c]}`, o, u, this.animationValues), is(`skew${ss[c]}`, o, u, this.animationValues);
      o.render();
      for (const c in u)
        o.setStaticValue(c, u[c]), this.animationValues && (this.animationValues[c] = u[c]);
      o.scheduleRender();
    }
    applyProjectionStyles(o, a) {
      if (!this.instance || this.isSVG)
        return;
      if (!this.isVisible) {
        o.visibility = "hidden";
        return;
      }
      const l = this.getTransformTemplate();
      if (this.needsReset) {
        this.needsReset = !1, o.visibility = "", o.opacity = "", o.pointerEvents = vn(a?.pointerEvents) || "", o.transform = l ? l(this.latestValues, "") : "none";
        return;
      }
      const u = this.getLead();
      if (!this.projectionDelta || !this.layout || !u.target) {
        this.options.layoutId && (o.opacity = this.latestValues.opacity !== void 0 ? this.latestValues.opacity : 1, o.pointerEvents = vn(a?.pointerEvents) || ""), this.hasProjected && !ae(this.latestValues) && (o.transform = l ? l({}, "") : "none", this.hasProjected = !1);
        return;
      }
      o.visibility = "";
      const c = u.animationValues || u.latestValues;
      this.applyTransformsToTarget();
      let d = Cp(this.projectionDeltaWithTransform, this.treeScale, c);
      l && (d = l(c, d)), o.transform = d;
      const { x: h, y: f } = this.projectionDelta;
      o.transformOrigin = `${h.origin * 100}% ${f.origin * 100}% 0`, u.animationValues ? o.opacity = u === this ? c.opacity ?? this.latestValues.opacity ?? 1 : this.preserveOpacity ? this.latestValues.opacity : c.opacityExit : o.opacity = u === this ? c.opacity !== void 0 ? c.opacity : "" : c.opacityExit !== void 0 ? c.opacityExit : 0;
      for (const g in Vs) {
        if (c[g] === void 0)
          continue;
        const { correct: v, applyTo: y, isCSSVariable: x } = Vs[g], T = d === "none" ? c[g] : v(c[g], u);
        if (y) {
          const b = y.length;
          for (let P = 0; P < b; P++)
            o[y[P]] = T;
        } else
          x ? this.options.visualElement.renderState.vars[g] = T : o[g] = T;
      }
      this.options.layoutId && (o.pointerEvents = u === this ? vn(a?.pointerEvents) || "" : "none");
    }
    clearSnapshot() {
      this.resumeFrom = this.snapshot = void 0;
    }
    // Only run on root
    resetTree() {
      this.root.nodes.forEach((o) => o.currentAnimation?.stop()), this.root.nodes.forEach(Qr), this.root.sharedNodes.clear();
    }
  };
}
function Rp(t) {
  t.updateLayout();
}
function Mp(t) {
  const e = t.resumeFrom?.snapshot || t.snapshot;
  if (t.isLead() && t.layout && e && t.hasListeners("didUpdate")) {
    const { layoutBox: n, measuredBox: s } = t.layout, { animationType: i } = t.options, r = e.source !== t.layout.source;
    i === "size" ? At((c) => {
      const d = r ? e.measuredBox[c] : e.layoutBox[c], h = gt(d);
      d.min = n[c].min, d.max = d.min + h;
    }) : gl(i, e.layoutBox, n) && At((c) => {
      const d = r ? e.measuredBox[c] : e.layoutBox[c], h = gt(n[c]);
      d.max = d.min + h, t.relativeTarget && !t.currentAnimation && (t.isProjectionDirty = !0, t.relativeTarget[c].max = t.relativeTarget[c].min + h);
    });
    const o = xe();
    ze(o, n, e.layoutBox);
    const a = xe();
    r ? ze(a, t.applyTransform(s, !0), e.measuredBox) : ze(a, n, e.layoutBox);
    const l = !hl(o);
    let u = !1;
    if (!t.resumeFrom) {
      const c = t.getClosestProjectingParent();
      if (c && !c.resumeFrom) {
        const { snapshot: d, layout: h } = c;
        if (d && h) {
          const f = st();
          Mn(f, e.layoutBox, d.layoutBox);
          const g = st();
          Mn(g, n, h.layoutBox), fl(f, g) || (u = !0), c.options.layoutRoot && (t.relativeTarget = g, t.relativeTargetOrigin = f, t.relativeParent = c);
        }
      }
    }
    t.notifyListeners("didUpdate", {
      layout: n,
      snapshot: e,
      delta: a,
      layoutDelta: o,
      hasLayoutChanged: l,
      hasRelativeLayoutChanged: u
    });
  } else if (t.isLead()) {
    const { onExitComplete: n } = t.options;
    n && n();
  }
  t.options.transition = void 0;
}
function Ep(t) {
  t.parent && (t.isProjecting() || (t.isProjectionDirty = t.parent.isProjectionDirty), t.isSharedProjectionDirty || (t.isSharedProjectionDirty = !!(t.isProjectionDirty || t.parent.isProjectionDirty || t.parent.isSharedProjectionDirty)), t.isTransformDirty || (t.isTransformDirty = t.parent.isTransformDirty));
}
function Vp(t) {
  t.isProjectionDirty = t.isSharedProjectionDirty = t.isTransformDirty = !1;
}
function Np(t) {
  t.clearSnapshot();
}
function Qr(t) {
  t.clearMeasurements();
}
function to(t) {
  t.isLayoutDirty = !1;
}
function kp(t) {
  const { visualElement: e } = t.options;
  e && e.getProps().onBeforeLayoutMeasure && e.notify("BeforeLayoutMeasure"), t.resetTransform();
}
function eo(t) {
  t.finishAnimation(), t.targetDelta = t.relativeTarget = t.target = void 0, t.isProjectionDirty = !0;
}
function Ip(t) {
  t.resolveTargetDelta();
}
function jp(t) {
  t.calcProjection();
}
function Lp(t) {
  t.resetSkewAndRotation();
}
function Op(t) {
  t.removeLeadSnapshot();
}
function no(t, e, n) {
  t.translate = J(e.translate, 0, n), t.scale = J(e.scale, 1, n), t.origin = e.origin, t.originPoint = e.originPoint;
}
function so(t, e, n, s) {
  t.min = J(e.min, n.min, s), t.max = J(e.max, n.max, s);
}
function Fp(t, e, n, s) {
  so(t.x, e.x, n.x, s), so(t.y, e.y, n.y, s);
}
function Bp(t) {
  return t.animationValues && t.animationValues.opacityExit !== void 0;
}
const $p = {
  duration: 0.45,
  ease: [0.4, 0, 0.1, 1]
}, io = (t) => typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().includes(t), ro = io("applewebkit/") && !io("chrome/") ? Math.round : Mt;
function oo(t) {
  t.min = ro(t.min), t.max = ro(t.max);
}
function _p(t) {
  oo(t.x), oo(t.y);
}
function gl(t, e, n) {
  return t === "position" || t === "preserve-aspect" && !Yf(Jr(e), Jr(n), 0.2);
}
function Up(t) {
  return t !== t.root && t.scroll?.wasRoot;
}
const zp = ml({
  attachResizeListener: (t, e) => Ze(t, "resize", e),
  measureScroll: () => ({
    x: document.documentElement.scrollLeft || document.body.scrollLeft,
    y: document.documentElement.scrollTop || document.body.scrollTop
  }),
  checkIsScrollRoot: () => !0
}), rs = {
  current: void 0
}, yl = ml({
  measureScroll: (t) => ({
    x: t.scrollLeft,
    y: t.scrollTop
  }),
  defaultParent: () => {
    if (!rs.current) {
      const t = new zp({});
      t.mount(window), t.setOptions({ layoutScroll: !0 }), rs.current = t;
    }
    return rs.current;
  },
  resetTransform: (t, e) => {
    t.style.transform = e !== void 0 ? e : "none";
  },
  checkIsScrollRoot: (t) => window.getComputedStyle(t).position === "fixed"
}), Wp = {
  pan: {
    Feature: up
  },
  drag: {
    Feature: cp,
    ProjectionNode: yl,
    MeasureLayout: cl
  }
};
function ao(t, e, n) {
  const { props: s } = t;
  t.animationState && s.whileHover && t.animationState.setActive("whileHover", n === "Start");
  const i = "onHover" + n, r = s[i];
  r && Y.postRender(() => r(e, on(e)));
}
class Kp extends se {
  mount() {
    const { current: e } = this.node;
    e && (this.unmount = hh(e, (n, s) => (ao(this.node, s, "Start"), (i) => ao(this.node, i, "End"))));
  }
  unmount() {
  }
}
class Gp extends se {
  constructor() {
    super(...arguments), this.isActive = !1;
  }
  onFocus() {
    let e = !1;
    try {
      e = this.node.current.matches(":focus-visible");
    } catch {
      e = !0;
    }
    !e || !this.node.animationState || (this.node.animationState.setActive("whileFocus", !0), this.isActive = !0);
  }
  onBlur() {
    !this.isActive || !this.node.animationState || (this.node.animationState.setActive("whileFocus", !1), this.isActive = !1);
  }
  mount() {
    this.unmount = nn(Ze(this.node.current, "focus", () => this.onFocus()), Ze(this.node.current, "blur", () => this.onBlur()));
  }
  unmount() {
  }
}
function lo(t, e, n) {
  const { props: s } = t;
  if (t.current instanceof HTMLButtonElement && t.current.disabled)
    return;
  t.animationState && s.whileTap && t.animationState.setActive("whileTap", n === "Start");
  const i = "onTap" + (n === "End" ? "" : n), r = s[i];
  r && Y.postRender(() => r(e, on(e)));
}
class Hp extends se {
  mount() {
    const { current: e } = this.node;
    e && (this.unmount = gh(e, (n, s) => (lo(this.node, s, "Start"), (i, { success: r }) => lo(this.node, i, r ? "End" : "Cancel")), { useGlobalTarget: this.node.props.globalTapTarget }));
  }
  unmount() {
  }
}
const Bs = /* @__PURE__ */ new WeakMap(), os = /* @__PURE__ */ new WeakMap(), Xp = (t) => {
  const e = Bs.get(t.target);
  e && e(t);
}, Yp = (t) => {
  t.forEach(Xp);
};
function qp({ root: t, ...e }) {
  const n = t || document;
  os.has(n) || os.set(n, {});
  const s = os.get(n), i = JSON.stringify(e);
  return s[i] || (s[i] = new IntersectionObserver(Yp, { root: t, ...e })), s[i];
}
function Jp(t, e, n) {
  const s = qp(e);
  return Bs.set(t, n), s.observe(t), () => {
    Bs.delete(t), s.unobserve(t);
  };
}
const Zp = {
  some: 0,
  all: 1
};
class Qp extends se {
  constructor() {
    super(...arguments), this.hasEnteredView = !1, this.isInView = !1;
  }
  startObserver() {
    this.unmount();
    const { viewport: e = {} } = this.node.getProps(), { root: n, margin: s, amount: i = "some", once: r } = e, o = {
      root: n ? n.current : void 0,
      rootMargin: s,
      threshold: typeof i == "number" ? i : Zp[i]
    }, a = (l) => {
      const { isIntersecting: u } = l;
      if (this.isInView === u || (this.isInView = u, r && !u && this.hasEnteredView))
        return;
      u && (this.hasEnteredView = !0), this.node.animationState && this.node.animationState.setActive("whileInView", u);
      const { onViewportEnter: c, onViewportLeave: d } = this.node.getProps(), h = u ? c : d;
      h && h(l);
    };
    return Jp(this.node.current, o, a);
  }
  mount() {
    this.startObserver();
  }
  update() {
    if (typeof IntersectionObserver > "u")
      return;
    const { props: e, prevProps: n } = this.node;
    ["amount", "margin", "root"].some(tm(e, n)) && this.startObserver();
  }
  unmount() {
  }
}
function tm({ viewport: t = {} }, { viewport: e = {} } = {}) {
  return (n) => t[n] !== e[n];
}
const em = {
  inView: {
    Feature: Qp
  },
  tap: {
    Feature: Hp
  },
  focus: {
    Feature: Gp
  },
  hover: {
    Feature: Kp
  }
}, nm = {
  layout: {
    ProjectionNode: yl,
    MeasureLayout: cl
  }
}, sm = {
  ...zf,
  ...em,
  ...Wp,
  ...nm
}, as = /* @__PURE__ */ rf(sm, vf);
class im {
  // 不再需要 getClient，因為現在通過後端 API 調用
  async searchPlaces(e, n, s) {
    try {
      const i = await fetch("/api/itinerary/search-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: e, latitude: n, longitude: s })
      });
      if (!i.ok) {
        const o = await i.json();
        throw new Error(o.error || "Failed to search places");
      }
      return (await i.json()).data || [];
    } catch (i) {
      return console.error("Gemini Search Error:", i), [];
    }
  }
  async optimizeDayPlan(e) {
    try {
      const n = await fetch("/api/itinerary/optimize-day-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ places: e })
      });
      if (!n.ok) {
        const i = await n.json();
        throw new Error(i.error || "Failed to optimize day plan");
      }
      return (await n.json()).data || null;
    } catch (n) {
      return console.error("Gemini Optimization Error:", n), null;
    }
  }
}
let ls = null;
const rm = () => (ls || (ls = new im()), ls), co = new Proxy({}, {
  get(t, e) {
    return rm()[e];
  }
});
class om {
  constructor(e = "/api") {
    this.baseURL = e, this.defaultHeaders = {
      "Content-Type": "application/json"
    };
  }
  /**
   * 設定認證 token
   */
  setAuthToken(e) {
    if (e)
      this.defaultHeaders = {
        ...this.defaultHeaders,
        Authorization: `Bearer ${e}`
      };
    else {
      const { Authorization: n, ...s } = this.defaultHeaders;
      this.defaultHeaders = s;
    }
  }
  /**
   * 從 cookie 或 localStorage 獲取 session
   */
  getSessionToken() {
    const e = document.cookie.split(";");
    for (const n of e) {
      const [s, i] = n.trim().split("=");
      if (s === "session_id" || s === "session")
        return i;
    }
    return localStorage.getItem("session_token");
  }
  /**
   * 建立完整的請求 URL
   */
  buildURL(e) {
    if (e.startsWith("http://") || e.startsWith("https://"))
      return e;
    const n = e.startsWith("/") ? e.slice(1) : e;
    return `${this.baseURL}/${n}`;
  }
  /**
   * 處理 API 回應
   */
  async handleResponse(e) {
    const n = e.headers.get("content-type"), s = n && n.includes("application/json");
    let i;
    try {
      i = s ? await e.json() : await e.text();
    } catch {
      return {
        success: !1,
        error: "Failed to parse response"
      };
    }
    return e.ok ? {
      success: !0,
      data: i.data !== void 0 ? i.data : i,
      message: i.message
    } : {
      success: !1,
      error: i.error || i.message || `HTTP ${e.status}: ${e.statusText}`,
      message: i.message
    };
  }
  /**
   * 通用請求方法
   */
  async request(e, n = {}) {
    const s = this.buildURL(e), i = this.getSessionToken(), r = {
      ...this.defaultHeaders,
      ...n.headers
    };
    i && !r.Authorization && (r.Authorization = `Bearer ${i}`);
    try {
      const o = await fetch(s, {
        ...n,
        headers: r,
        credentials: "include"
        // 包含 cookies
      });
      return await this.handleResponse(o);
    } catch (o) {
      return console.error("[APIClient] Request failed:", o), {
        success: !1,
        error: o instanceof Error ? o.message : "Network error"
      };
    }
  }
  /**
   * GET 請求
   */
  async get(e, n) {
    return this.request(e, {
      ...n,
      method: "GET"
    });
  }
  /**
   * POST 請求
   */
  async post(e, n, s) {
    return this.request(e, {
      ...s,
      method: "POST",
      body: n ? JSON.stringify(n) : void 0
    });
  }
  /**
   * PUT 請求
   */
  async put(e, n, s) {
    return this.request(e, {
      ...s,
      method: "PUT",
      body: n ? JSON.stringify(n) : void 0
    });
  }
  /**
   * PATCH 請求
   */
  async patch(e, n, s) {
    return this.request(e, {
      ...s,
      method: "PATCH",
      body: n ? JSON.stringify(n) : void 0
    });
  }
  /**
   * DELETE 請求
   */
  async delete(e, n) {
    return this.request(e, {
      ...n,
      method: "DELETE"
    });
  }
}
let cs = null;
const Mi = () => (cs || (cs = new om()), cs);
new Proxy({}, {
  get(t, e) {
    return Mi()[e];
  }
});
class am {
  constructor(e) {
    this.apiClient = e || Mi();
  }
  /**
   * 搜尋地點
   */
  async searchLocations(e) {
    return this.apiClient.post("/location/search", e);
  }
  /**
   * 獲取地點詳情
   */
  async getLocationDetails(e) {
    return this.apiClient.get(`/location/${e}`);
  }
  /**
   * 獲取地點詳情（使用 Google Place ID）
   */
  async getLocationByGooglePlaceId(e) {
    return this.apiClient.get(`/location/google/${e}`);
  }
  /**
   * 設定用戶地點互動狀態
   */
  async setUserLocationStatus(e, n, s) {
    return this.apiClient.post(`/location/${e}/interaction`, {
      status: n,
      notes: s
    });
  }
  /**
   * 獲取用戶的地點互動狀態
   */
  async getUserLocationStatus(e) {
    return this.apiClient.get(`/location/${e}/interaction`);
  }
  /**
   * 收藏地點
   */
  async favoriteLocation(e) {
    return this.apiClient.post(`/location/${e}/favorite`);
  }
  /**
   * 取消收藏地點
   */
  async unfavoriteLocation(e) {
    return this.apiClient.delete(`/location/${e}/favorite`);
  }
  /**
   * 獲取用戶收藏的地點列表
   */
  async getFavoriteLocations() {
    return this.apiClient.get("/location/favorites");
  }
  /**
   * 獲取用戶訪問過的地點列表
   */
  async getVisitedLocations() {
    return this.apiClient.get("/location/visited");
  }
  /**
   * 獲取用戶個人地點收藏
   * @param status - 篩選狀態：'visited' | 'want_to_visit' | 'want_to_revisit'
   * @param category - 篩選分類：'restaurant' | 'attraction' | 'hotel' | etc.
   */
  async getPersonalLocations(e, n) {
    const s = new URLSearchParams();
    e && s.append("status", e), n && s.append("category", n);
    const i = s.toString();
    return this.apiClient.get(`/itinerary/location/personal${i ? "?" + i : ""}`);
  }
  /**
   * 獲取地點評論
   */
  async getLocationComments(e) {
    return this.apiClient.get(`/location/${e}/comments`);
  }
  /**
   * 新增地點評論
   */
  async addLocationComment(e, n, s) {
    return this.apiClient.post(`/location/${e}/comments`, {
      comment: n,
      rating: s
    });
  }
}
let us = null;
const lm = () => (us || (us = new am()), us), _t = new Proxy({}, {
  get(t, e) {
    return lm()[e];
  }
});
class cm {
  constructor(e) {
    this.apiClient = e || Mi();
  }
  /**
   * 使用 Google OAuth 登入
   */
  async loginWithGoogle() {
    window.location.href = "/api/auth/google";
  }
  /**
   * 處理 Google OAuth 回調
   */
  async handleGoogleCallback(e) {
    return this.apiClient.post("/auth/google/callback", { code: e });
  }
  /**
   * 使用電子郵件和密碼登入
   */
  async loginWithPassword(e) {
    const n = await this.apiClient.post("/auth/login", e);
    return n.success && n.data && (this.saveSession(n.data.session), this.saveUser(n.data.user)), n;
  }
  /**
   * 註冊新用戶
   */
  async register(e) {
    return this.apiClient.post("/auth/register", e);
  }
  /**
   * 登出
   */
  async logout() {
    const e = await this.apiClient.post("/auth/logout");
    return this.clearSession(), this.clearUser(), e;
  }
  /**
   * 獲取當前用戶
   */
  async getCurrentUser() {
    return this.apiClient.get("/auth/me");
  }
  /**
   * 檢查是否已登入
   */
  isAuthenticated() {
    const e = this.getSession();
    return e ? e.expiresAt && e.expiresAt < Date.now() ? (this.clearSession(), !1) : !0 : !1;
  }
  /**
   * 獲取當前用戶（從本地儲存）
   */
  getCurrentUserLocal() {
    try {
      const e = localStorage.getItem("user");
      return e ? JSON.parse(e) : null;
    } catch (e) {
      return console.error("[AuthService] Failed to get user from local storage:", e), null;
    }
  }
  /**
   * 儲存會話到 localStorage
   */
  saveSession(e) {
    try {
      localStorage.setItem("session", JSON.stringify(e)), localStorage.setItem("session_id", e.id);
    } catch (n) {
      console.error("[AuthService] Failed to save session:", n);
    }
  }
  /**
   * 從 localStorage 獲取會話
   */
  getSession() {
    try {
      const e = localStorage.getItem("session");
      return e ? JSON.parse(e) : null;
    } catch (e) {
      return console.error("[AuthService] Failed to get session from local storage:", e), null;
    }
  }
  /**
   * 儲存用戶資訊到 localStorage
   */
  saveUser(e) {
    try {
      localStorage.setItem("user", JSON.stringify(e));
    } catch (n) {
      console.error("[AuthService] Failed to save user:", n);
    }
  }
  /**
   * 清除會話
   */
  clearSession() {
    localStorage.removeItem("session"), localStorage.removeItem("session_id");
  }
  /**
   * 清除用戶資訊
   */
  clearUser() {
    localStorage.removeItem("user");
  }
}
let ds = null;
const um = () => (ds || (ds = new cm()), ds), vl = new Proxy({}, {
  get(t, e) {
    return um()[e];
  }
}), uo = ({ place: t, onClick: e, showInteractions: n = !0 }) => {
  const [s, i] = L(null), [r, o] = L(!1), [a, l] = L(!1), [u, c] = L(!1);
  B(() => {
    (async () => {
      const v = vl.isAuthenticated();
      c(v), v && t.id && n && await d();
    })();
  }, [t.id, n]);
  const d = async () => {
    if (t.id)
      try {
        const g = await _t.getUserLocationStatus(t.id);
        g.success && g.data && i(g.data.status);
      } catch (g) {
        console.error("[PlaceCard] Error loading user status:", g);
      }
  }, h = async (g, v) => {
    if (g.stopPropagation(), !(!u || !t.id || a)) {
      l(!0);
      try {
        (await _t.setUserLocationStatus(t.id, v)).success && i(v);
      } catch (y) {
        console.error("[PlaceCard] Error setting status:", y);
      } finally {
        l(!1);
      }
    }
  }, f = async (g) => {
    if (g.stopPropagation(), !(!u || !t.id || a)) {
      l(!0);
      try {
        r ? (await _t.unfavoriteLocation(t.id), o(!1)) : (await _t.favoriteLocation(t.id), o(!0));
      } catch (v) {
        console.error("[PlaceCard] Error toggling favorite:", v);
      } finally {
        l(!1);
      }
    }
  };
  return /* @__PURE__ */ p.jsx(
    "div",
    {
      onClick: e,
      className: "bg-white rounded-2xl border border-slate-100 p-4 transition-all hover:bg-slate-50 hover:border-blue-200 cursor-pointer group",
      children: /* @__PURE__ */ p.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ p.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ p.jsx("h3", { className: "font-bold text-slate-800 truncate text-sm group-hover:text-blue-600 transition-colors", children: t.name }),
          t.address && /* @__PURE__ */ p.jsxs("p", { className: "text-[10px] text-slate-400 mt-1 truncate font-medium", children: [
            /* @__PURE__ */ p.jsx("i", { className: "fas fa-map-marker-alt mr-1 text-slate-300" }),
            " ",
            t.address
          ] }),
          t.rating && /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-1 mt-1", children: [
            /* @__PURE__ */ p.jsx("i", { className: "fas fa-star text-amber-400 text-[9px]" }),
            /* @__PURE__ */ p.jsx("span", { className: "text-[9px] text-slate-500 font-bold", children: t.rating }),
            t.userRatingCount && /* @__PURE__ */ p.jsxs("span", { className: "text-[8px] text-slate-400", children: [
              "(",
              t.userRatingCount,
              ")"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-2", children: [
          u && n && /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ p.jsx(
              "button",
              {
                onClick: (g) => h(g, "visited"),
                disabled: a,
                className: `w-7 h-7 rounded-lg flex items-center justify-center transition-all ${s === "visited" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600"}`,
                title: "來過",
                children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-check text-[9px]" })
              }
            ),
            /* @__PURE__ */ p.jsx(
              "button",
              {
                onClick: (g) => h(g, "want_to_visit"),
                disabled: a,
                className: `w-7 h-7 rounded-lg flex items-center justify-center transition-all ${s === "want_to_visit" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"}`,
                title: "想來",
                children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-heart text-[9px]" })
              }
            ),
            /* @__PURE__ */ p.jsx(
              "button",
              {
                onClick: (g) => h(g, "want_to_revisit"),
                disabled: a,
                className: `w-7 h-7 rounded-lg flex items-center justify-center transition-all ${s === "want_to_revisit" ? "bg-purple-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-600"}`,
                title: "想再來",
                children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-redo text-[9px]" })
              }
            ),
            /* @__PURE__ */ p.jsx(
              "button",
              {
                onClick: f,
                disabled: a,
                className: `w-7 h-7 rounded-lg flex items-center justify-center transition-all ${r ? "bg-amber-500 text-white" : "bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500"}`,
                title: "收藏",
                children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-star text-[9px]" })
              }
            )
          ] }),
          /* @__PURE__ */ p.jsx("div", { className: "w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all", children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-chevron-right text-[10px]" }) })
        ] })
      ] })
    }
  );
}, ho = ({
  item: t,
  onRemove: e,
  onTimeUpdate: n,
  onClick: s,
  isLast: i,
  travelTimeToNext: r,
  travelMode: o = "DRIVING",
  nextPlace: a
}) => {
  const [l, u] = L(!1), [c, d] = L(t.startTime), h = j(null), {
    attributes: f,
    listeners: g,
    setNodeRef: v,
    transform: y,
    transition: x,
    isDragging: T
  } = xu({ id: t.id }), b = {
    transform: Ge.Transform.toString(y),
    transition: x,
    zIndex: T ? 50 : l ? 100 : 1,
    opacity: T ? 0.3 : 1
  }, P = o === "DRIVING" ? "blue" : "emerald", D = (S) => {
    const [N, O] = S.split(":"), F = parseInt(N), G = F >= 12 ? "下午" : "上午", _ = F % 12 || 12;
    return { ampm: G, h: _.toString().padStart(2, "0"), m: O };
  }, { ampm: R, h: m, m: w } = D(t.startTime), C = () => {
    u(!1), n && c !== t.startTime && n(t.id, c);
  };
  B(() => {
    const S = (N) => {
      h.current && !h.current.contains(N.target) && l && C();
    };
    return l && document.addEventListener("mousedown", S), () => document.removeEventListener("mousedown", S);
  }, [l, c]);
  const M = (S) => {
    if (S.stopPropagation(), !a) return;
    const N = t.place.location ? `${t.place.location.lat},${t.place.location.lng}` : encodeURIComponent(t.place.name), O = a.location ? `${a.location.lat},${a.location.lng}` : encodeURIComponent(a.name), F = o === "DRIVING" ? "driving" : "walking";
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${N}&destination=${O}&travelmode=${F}`, "_blank");
  };
  return /* @__PURE__ */ p.jsxs(
    "div",
    {
      ref: v,
      style: b,
      className: "relative flex flex-col group w-full",
      children: [
        l && /* @__PURE__ */ p.jsx("div", { className: "fixed inset-0 bg-slate-900/5 backdrop-blur-[1px] z-[90] pointer-events-none" }),
        /* @__PURE__ */ p.jsxs("div", { className: "flex items-start gap-4 sm:gap-6 w-full relative", children: [
          /* @__PURE__ */ p.jsxs("div", { className: "relative flex flex-col items-center flex-shrink-0", children: [
            /* @__PURE__ */ p.jsx("div", { className: "w-4 h-4 rounded-full bg-white border-4 border-blue-600 shadow-xl z-20 relative group-hover:scale-125 transition-all duration-500" }),
            !i && /* @__PURE__ */ p.jsx("div", { className: "absolute top-12 bottom-[-54px] w-[2px] bg-gradient-to-b from-blue-600/30 via-slate-100 to-slate-100 z-10" })
          ] }),
          /* @__PURE__ */ p.jsxs("div", { className: "flex-1 min-w-0 flex flex-col gap-3", children: [
            /* @__PURE__ */ p.jsx("div", { ref: h, className: "flex-shrink-0 relative z-[101]", children: l ? (
              /* 時間選擇器彈窗 */
              /* @__PURE__ */ p.jsxs("div", { className: "absolute top-0 left-0 z-[110] bg-[#1e1e1e] rounded-[2rem] p-4 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.45)] border border-slate-700 w-44 animate-in fade-in zoom-in slide-in-from-left-4 duration-300", children: [
                /* @__PURE__ */ p.jsx("div", { className: "absolute top-6 -left-2 w-4 h-4 bg-[#1e1e1e] border-l border-t border-slate-700 rotate-[-45deg]" }),
                /* @__PURE__ */ p.jsxs("div", { className: "flex flex-col gap-4 relative", children: [
                  /* @__PURE__ */ p.jsxs("div", { className: "flex items-center justify-between px-1", children: [
                    /* @__PURE__ */ p.jsx("span", { className: "text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]", children: "行程時間" }),
                    /* @__PURE__ */ p.jsx("button", { onClick: C, className: "text-[10px] font-black text-blue-400 hover:text-white transition-colors", children: "儲存" })
                  ] }),
                  /* @__PURE__ */ p.jsxs("div", { className: "space-y-3", children: [
                    /* @__PURE__ */ p.jsx("div", { className: "relative group", children: /* @__PURE__ */ p.jsx(
                      "input",
                      {
                        type: "time",
                        autoFocus: !0,
                        value: c,
                        onChange: (S) => d(S.target.value),
                        className: "w-full bg-[#2a2d31] text-white border-2 border-transparent focus:border-blue-500 rounded-2xl py-3 px-4 text-2xl font-black tabular-nums outline-none transition-all shadow-inner text-center"
                      }
                    ) }),
                    /* @__PURE__ */ p.jsxs("p", { className: "text-[9px] text-slate-500 font-bold leading-tight px-1", children: [
                      /* @__PURE__ */ p.jsx("i", { className: "fas fa-info-circle mr-1" }),
                      " 修改將自動順延後續行程"
                    ] })
                  ] })
                ] })
              ] })
            ) : /* @__PURE__ */ p.jsxs(
              "button",
              {
                onClick: (S) => {
                  S.stopPropagation(), u(!0);
                },
                className: "group/time relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-white hover:ring-2 hover:ring-blue-500 transition-all duration-300 w-fit shadow-sm",
                children: [
                  /* @__PURE__ */ p.jsx("span", { className: "text-[11px] font-black text-slate-400 uppercase tracking-tighter", children: R }),
                  /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ p.jsxs("span", { className: "text-[18px] font-black text-blue-600 tabular-nums leading-none tracking-tighter", children: [
                      m,
                      ":",
                      w
                    ] }),
                    /* @__PURE__ */ p.jsx("div", { className: "w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center group-hover/time:bg-blue-600 transition-colors", children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-pencil text-[8px] text-blue-400 group-hover/time:text-white" }) })
                  ] })
                ]
              }
            ) }),
            /* @__PURE__ */ p.jsxs(
              "div",
              {
                onClick: s,
                className: `bg-white p-5 rounded-[2.5rem] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-between hover:border-blue-400 hover:shadow-[0_25px_60px_rgba(37,99,235,0.12)] transition-all duration-500 cursor-pointer active:scale-[0.98] overflow-hidden ${l ? "opacity-30" : ""}`,
                children: [
                  /* @__PURE__ */ p.jsx("div", { ...f, ...g, onClick: (S) => S.stopPropagation(), className: "cursor-grab active:cursor-grabbing mr-4 text-slate-200 hover:text-blue-500 transition-colors p-2 flex-shrink-0", children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-grip-vertical text-sm" }) }),
                  /* @__PURE__ */ p.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ p.jsx("h4", { className: "font-black text-slate-900 text-[16px] sm:text-[18px] leading-tight break-words whitespace-normal group-hover:text-blue-600 transition-colors tracking-tight", children: t.place.name }),
                    /* @__PURE__ */ p.jsxs("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-2 mt-3", children: [
                      /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 bg-blue-50/60 rounded-xl", children: [
                        /* @__PURE__ */ p.jsx("i", { className: "fas fa-hourglass-start text-blue-500 text-[10px]" }),
                        /* @__PURE__ */ p.jsx("span", { className: "text-[11px] text-blue-700 font-black", children: "停留 1.5h" })
                      ] }),
                      /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ p.jsx("i", { className: "fas fa-location-dot text-slate-200 text-[11px]" }),
                        /* @__PURE__ */ p.jsx("span", { className: "text-[11px] text-slate-400 font-bold truncate max-w-[160px]", children: t.place.address?.split(" ")[0] || "澎湖縣" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ p.jsx("button", { onClick: (S) => {
                    S.stopPropagation(), e(t.id);
                  }, className: "ml-4 w-10 h-10 rounded-2xl flex items-center justify-center text-slate-200 hover:bg-red-50 hover:text-red-500 transition-all duration-300 flex-shrink-0", children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-trash-alt text-[12px]" }) })
                ]
              }
            )
          ] })
        ] }),
        !i && /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-4 sm:gap-6 h-[100px] pointer-events-none w-full mt-2", children: [
          /* @__PURE__ */ p.jsx("div", { className: "w-4 flex-shrink-0" }),
          /* @__PURE__ */ p.jsx("div", { className: "relative flex-1 flex items-center justify-start min-w-0", children: r && /* @__PURE__ */ p.jsxs("button", { onClick: M, className: "pointer-events-auto group/nav relative flex items-center gap-4 bg-white border border-slate-50 py-3.5 px-6 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-500 max-w-[260px]", children: [
            /* @__PURE__ */ p.jsx("div", { className: `w-10 h-10 rounded-2xl bg-${P}-600 flex items-center justify-center text-white text-[13px] shadow-lg group-hover/nav:rotate-12 transition-all`, children: /* @__PURE__ */ p.jsx("i", { className: `fas fa-${o === "DRIVING" ? "car-side" : "person-walking"}` }) }),
            /* @__PURE__ */ p.jsxs("div", { className: "flex flex-col items-start min-w-0", children: [
              /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ p.jsx("span", { className: "text-[16px] font-black text-slate-900 tabular-nums leading-none", children: r }),
                /* @__PURE__ */ p.jsx("div", { className: "w-2 h-2 rounded-full bg-blue-500 animate-pulse" })
              ] }),
              /* @__PURE__ */ p.jsx("span", { className: `text-[9px] font-black text-${P}-500 uppercase tracking-widest leading-none mt-1.5 whitespace-nowrap`, children: "點擊開啟導覽" })
            ] })
          ] }) })
        ] })
      ]
    }
  );
}, dm = ({
  items: t,
  center: e,
  travelMode: n = "DRIVING",
  onAddPlaceFromMap: s,
  selectedPlace: i,
  onInfoWindowClose: r,
  onTravelDataUpdate: o
}) => {
  const a = j(null), l = j(null), u = j([]), c = j([]), d = j([]), h = j(null), [f, g] = L(!1), [v, y] = L(null);
  B(() => {
    (async () => {
      try {
        const w = await fetch("/api/itinerary/maps-api-key", {
          method: "GET",
          credentials: "include"
        });
        if (w.ok) {
          const C = await w.json();
          C.success && C.apiKey && y(C.apiKey);
        }
      } catch (w) {
        console.error("[MapView] Failed to fetch Google Maps API key:", w);
      }
    })();
  }, []), B(() => ((async () => {
    if (!a.current || !v) return;
    const w = (C) => {
      var M, S, N, O = "The Google Maps JavaScript API", F = "google", G = "importLibrary", _ = "__googleMapsCallback__", k = document, U = window;
      U = U[F] || (U[F] = {});
      var H = U.maps || (U.maps = {}), tt = /* @__PURE__ */ new Set(), et = new URLSearchParams(), X = () => M || (M = new Promise(async (dt, xt) => {
        await (S = k.createElement("script")), S.async = !0, et.set("libraries", [...tt] + "");
        for (N in C) et.set(N.replace(/[A-Z]/g, (Ot) => "_" + Ot[0].toLowerCase()), C[N]);
        et.set("callback", F + ".maps." + _), S.src = "https://maps.googleapis.com/maps/api/js?" + et, H[_] = dt, S.onerror = () => M = xt(Error(O + " could not load.")), k.head.append(S);
      }));
      H[G] ? console.warn(O + " only loads once. Re-trying:", C) : H[G] = (dt, ...xt) => tt.add(dt) && X().then(() => H[G](dt, ...xt));
    };
    window.google?.maps?.importLibrary || w({ key: v, v: "weekly", loading: "async" });
    try {
      const { Map: C, InfoWindow: M } = await window.google.maps.importLibrary("maps"), S = e || { lat: 23.5713, lng: 119.5793 };
      l.current = new C(a.current, {
        center: S,
        zoom: 12,
        mapId: "DEMO_MAP_ID",
        disableDefaultUI: !0,
        zoomControl: !0,
        clickableIcons: !0,
        gestureHandling: "greedy"
        // 允許滾動縮放，不需要按 command
      }), h.current = new M(), h.current.addListener("closeclick", () => {
        r && r();
      }), l.current.addListener("click", async (N) => {
        N.placeId ? (N.stop(), x(N.placeId)) : r && r();
      }), g(!0);
    } catch (C) {
      console.error("Failed to load Google Maps libraries:", C);
    }
  })(), () => b()), [v]), B(() => {
    f && R();
  }, [t, f, n]), B(() => {
    (async () => {
      if (!f || !l.current || !i) {
        f && !i && h.current && h.current.close();
        return;
      }
      if (i.location)
        l.current.panTo(i.location), l.current.setZoom(16), T(i);
      else
        try {
          const { Place: w } = await window.google.maps.importLibrary("places"), C = {
            textQuery: i.name,
            fields: ["displayName", "formattedAddress", "location", "id", "rating", "userRatingCount", "nationalPhoneNumber", "websiteURI", "types"],
            maxResultCount: 1,
            locationBias: l.current.getCenter()
          }, { places: M } = await w.searchByText(C);
          if (M && M.length > 0) {
            const S = M[0], N = {
              ...i,
              id: S.id || i.id,
              location: { lat: S.location.lat(), lng: S.location.lng() },
              address: S.formattedAddress || i.address,
              formatted_address: S.formattedAddress || i.address,
              rating: S.rating,
              userRatingCount: S.userRatingCount,
              phoneNumber: S.nationalPhoneNumber,
              website: S.websiteURI,
              types: S.types,
              // 添加 Google Place 相關欄位
              google_place_id: S.id || i.id,
              place_id: S.id || i.id,
              latitude: S.location.lat(),
              longitude: S.location.lng(),
              lat: S.location.lat(),
              lng: S.location.lng(),
              google_rating: S.rating,
              user_ratings_total: S.userRatingCount
            };
            l.current.panTo(N.location), l.current.setZoom(16), T(N);
          }
        } catch (w) {
          console.error("Resolve place error:", w);
        }
    })();
  }, [i, f]);
  const x = async (m) => {
    try {
      const { Place: w } = await window.google.maps.importLibrary("places"), C = new w({ id: m });
      await C.fetchFields({
        fields: ["displayName", "formattedAddress", "location", "rating", "userRatingCount", "nationalPhoneNumber", "websiteURI", "regularOpeningHours", "types", "priceLevel"]
      });
      const M = {
        id: m,
        name: C.displayName || "未知地點",
        address: C.formattedAddress,
        formatted_address: C.formattedAddress,
        rating: C.rating,
        userRatingCount: C.userRatingCount,
        phoneNumber: C.nationalPhoneNumber,
        website: C.websiteURI,
        types: C.types,
        location: { lat: C.location.lat(), lng: C.location.lng() },
        // 添加 Google Place 相關欄位
        google_place_id: m,
        place_id: m,
        latitude: C.location.lat(),
        longitude: C.location.lng(),
        lat: C.location.lat(),
        lng: C.location.lng(),
        google_rating: C.rating,
        user_ratings_total: C.userRatingCount
      };
      T(M);
    } catch (w) {
      console.error("Error fetching place details:", w);
    }
  }, T = async (m) => {
    if (!l.current || !h.current) return;
    const w = vl.isAuthenticated();
    let C = null, M = !1;
    if (w && m.id)
      try {
        const _ = await _t.getUserLocationStatus(m.id);
        _.success && _.data && (C = _.data.status);
      } catch (_) {
        console.error("[MapView] Error loading user status:", _);
      }
    const S = document.createElement("div");
    S.className = "p-0 min-w-[300px] max-w-[340px] font-sans overflow-hidden rounded-3xl bg-white";
    const N = m.rating ? Array(5).fill(0).map((_, k) => {
      const U = Math.min(Math.max(m.rating - k, 0), 1);
      return `<i class="fas fa-star ${U >= 0.8 ? "text-amber-400" : U >= 0.3 ? "text-amber-400/60" : "text-slate-100"}" style="font-size: 11px;"></i>`;
    }).join("") : "", O = m.rating ? `<div class="flex items-center gap-2 mb-4 bg-amber-50/50 p-2.5 rounded-2xl border border-amber-100/50">
           <div class="flex gap-0.5">${N}</div>
           <span class="text-amber-700 text-xs font-black">${m.rating}</span>
           <span class="text-amber-600/50 text-[10px] font-bold">/ ${m.userRatingCount?.toLocaleString()} 則評論</span>
         </div>` : "", F = m.types ? `<div class="flex flex-wrap gap-1.5 mb-5">
           ${m.types.slice(0, 3).map((_) => `<span class="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">${_.replace("_", " ")}</span>`).join("")}
         </div>` : "", G = w && m.id ? `
      <div class="flex items-center gap-2 mb-4 pt-4 border-t border-slate-50">
        <button id="btn-status-visited-${m.id}" class="flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black transition-all ${C === "visited" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600"}">
          <i class="fas fa-check mr-1"></i>來過
        </button>
        <button id="btn-status-want-${m.id}" class="flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black transition-all ${C === "want_to_visit" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"}">
          <i class="fas fa-heart mr-1"></i>想來
        </button>
        <button id="btn-status-revisit-${m.id}" class="flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black transition-all ${C === "want_to_revisit" ? "bg-purple-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-600"}">
          <i class="fas fa-redo mr-1"></i>想再來
        </button>
        <button id="btn-favorite-${m.id}" class="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500">
          <i class="fas fa-star text-[10px]"></i>
        </button>
      </div>
    ` : "";
    S.innerHTML = `
      <div class="p-6">
        <div class="flex justify-between items-start mb-5">
           <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-[14px] shadow-xl shadow-blue-200">
               <i class="fas fa-location-dot"></i>
             </div>
             <div class="flex flex-col">
               <span class="text-blue-600 text-[10px] font-black uppercase tracking-[0.25em] leading-none mb-1">Discover Place</span>
               <div class="w-8 h-1 bg-blue-100 rounded-full"></div>
             </div>
           </div>
        </div>
        <div class="font-black text-2xl text-slate-900 leading-tight mb-2 tracking-tighter">${m.name}</div>
        ${O}
        ${F}
        <div class="space-y-4 pt-5 border-t border-slate-50">
          ${m.phoneNumber ? `<div class="flex items-center gap-4 group"><div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm"><i class="fas fa-phone text-[10px]"></i></div><span class="text-[13px] text-slate-700 font-bold">${m.phoneNumber}</span></div>` : ""}
          ${m.website ? `<a href="${m.website}" target="_blank" class="flex items-center gap-4 group transition-all"><div class="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><i class="fas fa-link text-[10px]"></i></div><span class="text-[13px] text-indigo-600 font-black group-hover:underline">造訪官方網站</span></a>` : ""}
          <div class="flex items-start gap-4"><div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm"><i class="fas fa-map text-[10px]"></i></div><span class="text-[12px] text-slate-500 font-medium leading-relaxed">${m.address || "地址資訊"}</span></div>
        </div>
        ${G}
        <button id="btn-add-${m.id}" class="mt-4 w-full py-4.5 bg-slate-900 hover:bg-blue-600 text-white rounded-[1.25rem] text-[12px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-slate-200 active:scale-[0.96] flex items-center justify-center gap-3 overflow-hidden group relative">
          <span class="relative z-10"><i class="fas fa-plus-circle mr-1"></i> 加入此行程</span>
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    `, h.current.setContent(S), h.current.setPosition(m.location), h.current.open(l.current), setTimeout(() => {
      const _ = document.getElementById(`btn-add-${m.id}`);
      if (_ && (_.onclick = (k) => {
        k.preventDefault(), s(m), h.current.close();
      }), w && m.id) {
        const k = document.getElementById(`btn-status-visited-${m.id}`), U = document.getElementById(`btn-status-want-${m.id}`), H = document.getElementById(`btn-status-revisit-${m.id}`), tt = document.getElementById(`btn-favorite-${m.id}`);
        k && (k.onclick = async (et) => {
          et.preventDefault();
          try {
            await _t.setUserLocationStatus(m.id, "visited"), T(m);
          } catch (X) {
            console.error("[MapView] Error setting status:", X);
          }
        }), U && (U.onclick = async (et) => {
          et.preventDefault();
          try {
            await _t.setUserLocationStatus(m.id, "want_to_visit"), T(m);
          } catch (X) {
            console.error("[MapView] Error setting status:", X);
          }
        }), H && (H.onclick = async (et) => {
          et.preventDefault();
          try {
            await _t.setUserLocationStatus(m.id, "want_to_revisit"), T(m);
          } catch (X) {
            console.error("[MapView] Error setting status:", X);
          }
        }), tt && (tt.onclick = async (et) => {
          et.preventDefault();
          try {
            M || await _t.favoriteLocation(m.id), T(m);
          } catch (X) {
            console.error("[MapView] Error toggling favorite:", X);
          }
        });
      }
    }, 10);
  }, b = () => {
    u.current.forEach((m) => m.setMap(null)), u.current = [], c.current.forEach((m) => m.setMap(null)), c.current = [], d.current.forEach((m) => m.setMap(null)), d.current = [];
  }, P = (m, w) => {
    const M = (w.lat - m.lat) * Math.PI / 180, S = (w.lng - m.lng) * Math.PI / 180, N = Math.sin(M / 2) * Math.sin(M / 2) + Math.cos(m.lat * Math.PI / 180) * Math.cos(w.lat * Math.PI / 180) * Math.sin(S / 2) * Math.sin(S / 2), k = 6371 * (2 * Math.atan2(Math.sqrt(N), Math.sqrt(1 - N))) * (n === "DRIVING" ? 1.45 : 1.2) / (n === "DRIVING" ? 40 : 5);
    return { text: `${Math.max(3, Math.round(k * 60))} 分鐘`, isEstimated: !0, status: "預估" };
  }, D = async (m) => {
    if (m.length < 2) return [];
    const w = [], C = new window.google.maps.DirectionsService();
    for (let M = 0; M < m.length - 1; M++)
      try {
        const S = await new Promise((O, F) => {
          C.route({
            origin: m[M],
            destination: m[M + 1],
            travelMode: n === "DRIVING" ? google.maps.TravelMode.DRIVING : google.maps.TravelMode.WALKING
          }, (G, _) => {
            _ === "OK" ? O(G) : F(_);
          });
        }), N = S.routes[0].legs[0];
        w.push({
          index: M,
          duration: N.duration.text,
          status: n === "DRIVING" ? "行車" : "步行",
          isEstimated: !1,
          midpoint: N.steps[Math.floor(N.steps.length / 2)].end_location,
          overview_path: S.routes[0].overview_path
        });
      } catch {
        const N = P(m[M], m[M + 1]);
        w.push({
          index: M,
          duration: N.text,
          status: "預估",
          isEstimated: !0,
          midpoint: { lat: (m[M].lat + m[M + 1].lat) / 2, lng: (m[M].lng + m[M + 1].lng) / 2 },
          overview_path: [m[M], m[M + 1]]
        });
      }
    return w;
  }, R = async () => {
    if (!l.current || !f) return;
    b();
    const { AdvancedMarkerElement: m, PinElement: w } = await window.google.maps.importLibrary("marker"), { Polyline: C } = await window.google.maps.importLibrary("maps"), M = new window.google.maps.LatLngBounds(), S = [];
    t.forEach((N, O) => {
      if (N.place.location) {
        const F = new w({ background: "#2563eb", borderColor: "#ffffff", glyphColor: "#ffffff", glyphText: (O + 1).toString(), scale: 1.1 }), G = new m({ map: l.current, position: N.place.location, title: N.place.name, content: F.element });
        G.addListener("click", () => T(N.place)), u.current.push(G), S.push(N.place.location), M.extend(N.place.location);
      }
    }), S.length > 1 ? D(S).then((N) => {
      o && o(N.map((O) => O.duration)), N.forEach((O) => {
        const F = new C({
          path: O.overview_path,
          geodesic: !0,
          strokeColor: n === "DRIVING" ? "#2563eb" : "#10b981",
          strokeOpacity: 0.6,
          strokeWeight: 6,
          map: l.current
        });
        d.current.push(F);
        const G = document.createElement("div");
        G.className = "pointer-events-none group";
        const _ = n === "DRIVING" ? "blue" : "emerald";
        G.innerHTML = `
            <div class="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-${_}-100 flex items-center gap-3 transform transition-all duration-500 hover:scale-110">
              <div class="w-7 h-7 rounded-xl bg-${_}-600 flex items-center justify-center shadow-lg">
                <i class="fas fa-${n === "DRIVING" ? "car-side" : "person-walking"} text-[10px] text-white"></i>
              </div>
              <div class="flex flex-col">
                <span class="text-[12px] font-black text-slate-800 leading-none mb-0.5">${O.duration}</span>
                <span class="text-[8px] font-black text-${_}-500 uppercase tracking-widest leading-none">${O.status}路徑</span>
              </div>
            </div>`;
        const k = new m({ map: l.current, position: O.midpoint, content: G, zIndex: 200 });
        c.current.push(k);
      });
    }) : o && o([]), S.length > 0 && !i && l.current.fitBounds(M, { padding: 140 });
  };
  return /* @__PURE__ */ p.jsxs("div", { className: "absolute inset-0 bg-slate-100 overflow-hidden", children: [
    /* @__PURE__ */ p.jsx("div", { ref: a, className: "w-full h-full" }),
    !f && /* @__PURE__ */ p.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-slate-50/90 backdrop-blur-xl z-50", children: /* @__PURE__ */ p.jsxs("div", { className: "flex flex-col items-center gap-6", children: [
      /* @__PURE__ */ p.jsxs("div", { className: "relative w-16 h-16", children: [
        /* @__PURE__ */ p.jsx("div", { className: "absolute inset-0 border-4 border-blue-100 rounded-full" }),
        /* @__PURE__ */ p.jsx("div", { className: "absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" })
      ] }),
      /* @__PURE__ */ p.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ p.jsx("p", { className: "text-sm font-black text-slate-800 uppercase tracking-[0.3em] mb-1", children: "PENGHU AI MAP" }),
        /* @__PURE__ */ p.jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse", children: "Initializing Smart Interface..." })
      ] })
    ] }) })
  ] });
}, hs = (t) => {
  const [e, n] = t.split(":").map(Number);
  return e * 60 + n;
}, hm = (t) => {
  const e = (t % 1440 + 1440) % 1440, n = Math.floor(e / 60), s = e % 60;
  return `${n.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}, gm = ({
  initialItinerary: t,
  userItineraries: e = [],
  currentUser: n,
  onSave: s
}) => {
  const [i, r] = L(""), [o, a] = L([]), [l, u] = L(!1), [c, d] = L(!1), [h, f] = L(0), [g, v] = L("DRIVING"), [y, x] = L(() => {
    if (t && t.dayPlans)
      return t.dayPlans.map((V, E) => {
        if (V.date && (V.date.includes("第") || V.date.includes("天"))) {
          const z = /* @__PURE__ */ new Date();
          return z.setDate(z.getDate() + E), { ...V, date: z.toISOString().split("T")[0] };
        }
        return V;
      });
    const A = /* @__PURE__ */ new Date();
    return [
      { date: A.toISOString().split("T")[0], items: [] },
      { date: new Date(A.getTime() + 1440 * 60 * 1e3).toISOString().split("T")[0], items: [] },
      { date: new Date(A.getTime() + 2880 * 60 * 1e3).toISOString().split("T")[0], items: [] }
    ];
  }), [T, b] = L([]), [P, D] = L(null), [R, m] = L(), [w, C] = L("low"), [M, S] = L(
    t?.id || null
  ), [N, O] = L(!1), F = mt.useRef(null), [G, _] = L(!1), [k, U] = L([]), [H, tt] = L(!1), et = Jl(
    Oi(Xs, { activationConstraint: { distance: 8 } }),
    Oi(Gs, { coordinateGetter: Tu })
  );
  B(() => {
    navigator.geolocation && navigator.geolocation.getCurrentPosition(
      (A) => m({ lat: A.coords.latitude, lng: A.coords.longitude }),
      () => console.warn("Location permission denied")
    );
  }, []), B(() => {
    if (!(!s || !n))
      return F.current && clearTimeout(F.current), F.current = setTimeout(async () => {
        if (!N) {
          O(!0);
          try {
            const A = {
              title: `澎湖行程 ${(/* @__PURE__ */ new Date()).toLocaleDateString("zh-TW")}`,
              dayPlans: y
            };
            M && (A.id = M);
            const V = await s(A);
            V && V.id && (S(V.id), typeof window < "u" && window.showToast && window.showToast("行程已自動儲存", "success"));
          } catch (A) {
            console.error("[App] Auto-save failed:", A), typeof window < "u" && window.showToast && window.showToast("自動儲存失敗，請稍後再試", "error");
          } finally {
            O(!1);
          }
        }
      }, 3e3), () => {
        F.current && clearTimeout(F.current);
      };
  }, [y, s, n, M, N]);
  const X = async () => {
    if (!i.trim()) return;
    u(!0);
    const A = await co.searchPlaces(i, R?.lat, R?.lng);
    a(A), u(!1);
  }, dt = async () => {
    if (n) {
      tt(!0);
      try {
        const A = await _t.getPersonalLocations();
        if (A.success && A.data) {
          const V = A.data.map((E) => ({
            id: E.id,
            name: E.name,
            address: E.address,
            location: E.latitude && E.longitude ? {
              lat: E.latitude,
              lng: E.longitude
            } : void 0,
            rating: E.google_rating,
            userRatingCount: E.google_user_ratings_total,
            phoneNumber: E.phone_number,
            website: E.website,
            types: typeof E.google_types == "string" ? JSON.parse(E.google_types) : E.google_types,
            thumbnail: E.thumbnail_url,
            google_place_id: E.google_place_id,
            place_id: E.google_place_id,
            latitude: E.latitude,
            longitude: E.longitude,
            lat: E.latitude,
            lng: E.longitude,
            google_rating: E.google_rating,
            user_ratings_total: E.google_user_ratings_total
          }));
          U(V), _(!0);
        }
      } catch (A) {
        console.error("[App] Error loading personal locations:", A), typeof window < "u" && window.showToast && window.showToast("載入個人地點失敗", "error");
      } finally {
        tt(!1);
      }
    }
  }, xt = (A) => {
    const V = y[h].items;
    let E = "09:00";
    if (V.length > 0) {
      const z = V[V.length - 1], [Z, rt] = z.startTime.split(":").map(Number);
      E = `${((Z + 1) % 24).toString().padStart(2, "0")}:${rt.toString().padStart(2, "0")}`;
    }
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      place: A,
      startTime: E,
      duration: 60
    };
  }, Ot = (A) => {
    x((V) => {
      const E = [...V], z = E[h].items;
      return z.some((Z) => Z.place.id === A.id) ? V : (E[h].items = [...z, xt(A)], E);
    }), a([]), r(""), D(null);
  }, pt = (A) => {
    x((V) => {
      const E = [...V];
      return E[h].items = E[h].items.filter((z) => z.id !== A), E;
    });
  }, ie = (A, V) => {
    x((E) => {
      const z = [...E], Z = [...z[h].items], rt = Z.findIndex((Nt) => Nt.id === A);
      if (rt === -1) return E;
      const ot = hs(Z[rt].startTime), Dt = hs(V) - ot;
      for (let Nt = rt; Nt < Z.length; Nt++) {
        const an = hs(Z[Nt].startTime);
        Z[Nt] = {
          ...Z[Nt],
          startTime: Nt === rt ? V : hm(an + Dt)
        };
      }
      return z[h].items = Z, z;
    });
  }, Ft = (A) => {
    const { active: V, over: E } = A;
    E && V.id !== E.id && x((z) => {
      const Z = [...z], rt = Z[h].items, ot = rt.findIndex((Dt) => Dt.id === V.id), Vt = rt.findIndex((Dt) => Dt.id === E.id);
      return Z[h].items = Ys(rt, ot, Vt), Z;
    });
  }, Et = () => {
    const A = y.length + 1, V = y.length > 0 && y[0].date ? new Date(y[0].date) : /* @__PURE__ */ new Date();
    if (y.length > 0 && y[0].date && !y[0].date.includes("第")) {
      const E = new Date(y[0].date);
      E.setDate(E.getDate() + (A - 1)), x((z) => [...z, { date: E.toISOString().split("T")[0], items: [] }]);
    } else {
      const E = new Date(V);
      E.setDate(E.getDate() + (A - 1)), x((z) => [...z, { date: E.toISOString().split("T")[0], items: [] }]);
    }
    f(y.length);
  }, K = (A, V) => {
    x((E) => {
      const z = [...E];
      return z[A] = { ...z[A], date: V }, z;
    });
  }, re = (A) => {
    if (!A) return "未設定日期";
    if (A.includes("第") && A.includes("天")) return A;
    try {
      const V = new Date(A);
      if (isNaN(V.getTime())) return A;
      const E = V.getFullYear(), z = String(V.getMonth() + 1).padStart(2, "0"), Z = String(V.getDate()).padStart(2, "0"), ot = ["日", "一", "二", "三", "四", "五", "六"][V.getDay()];
      return `${E}/${z}/${Z} (${ot})`;
    } catch {
      return A;
    }
  }, St = async () => {
    const A = y[h].items;
    if (A.length < 2) return;
    d(!0);
    const V = await co.optimizeDayPlan(A.map((E) => E.place));
    V && V.itinerary && x((E) => {
      const z = [...E], Z = [...z[h].items], rt = V.itinerary.map((ot) => {
        const Vt = Z.find((Dt) => Dt.place.name === ot.placeName);
        return Vt ? { ...Vt, startTime: ot.recommendedTime || Vt.startTime } : null;
      }).filter(Boolean);
      return rt.length > 0 && (z[h].items = rt), z;
    }), d(!1);
  }, Xt = () => {
    D(null), a([]);
  };
  return /* @__PURE__ */ p.jsxs("div", { className: "flex flex-col lg:flex-row h-[100dvh] w-full bg-slate-50 overflow-hidden font-sans relative", children: [
    N && /* @__PURE__ */ p.jsxs("div", { className: "fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse", children: [
      /* @__PURE__ */ p.jsx("i", { className: "fas fa-spinner fa-spin text-sm" }),
      /* @__PURE__ */ p.jsx("span", { className: "text-sm font-bold", children: "正在儲存..." })
    ] }),
    /* @__PURE__ */ p.jsxs("aside", { className: "hidden lg:flex flex-col w-[30%] xl:w-[28%] bg-white border-r border-slate-100 shadow-2xl z-20 relative", children: [
      /* @__PURE__ */ p.jsxs("div", { className: "p-6 xl:p-8 pb-4", children: [
        /* @__PURE__ */ p.jsxs("div", { className: "flex items-center justify-between mb-8", children: [
          /* @__PURE__ */ p.jsx("h1", { className: "text-2xl xl:text-3xl font-black text-blue-600 tracking-tighter leading-none", children: "行程規劃" }),
          /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-1.5 overflow-x-auto no-scrollbar", children: [
            y.map((A, V) => /* @__PURE__ */ p.jsxs("button", { onClick: () => {
              f(V), b([]);
            }, className: `px-4 py-2 rounded-full text-[11px] font-black transition-all duration-300 ${h === V ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`, children: [
              "D",
              V + 1
            ] }, V)),
            /* @__PURE__ */ p.jsx("button", { onClick: Et, className: "w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center flex-shrink-0 shadow-sm", children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-plus text-[10px]" }) })
          ] })
        ] }),
        /* @__PURE__ */ p.jsxs("div", { className: "flex bg-slate-100 p-1.5 rounded-2xl mb-6", children: [
          /* @__PURE__ */ p.jsxs("button", { onClick: () => v("DRIVING"), className: `flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black transition-all ${g === "DRIVING" ? "bg-white text-blue-600 shadow-md" : "text-slate-400"}`, children: [
            /* @__PURE__ */ p.jsx("i", { className: "fas fa-car-side" }),
            " 行車"
          ] }),
          /* @__PURE__ */ p.jsxs("button", { onClick: () => v("WALKING"), className: `flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black transition-all ${g === "WALKING" ? "bg-white text-emerald-600 shadow-md" : "text-slate-400"}`, children: [
            /* @__PURE__ */ p.jsx("i", { className: "fas fa-person-walking" }),
            " 步行"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ p.jsxs("div", { className: "flex-1 overflow-y-auto overflow-x-visible px-4 xl:px-8 py-4 custom-scrollbar bg-[#fdfdfe] relative", children: [
        /* @__PURE__ */ p.jsxs("div", { className: "flex items-center justify-between mb-8 px-2", children: [
          /* @__PURE__ */ p.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ p.jsxs("h2", { className: "text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap", children: [
              re(y[h].date),
              " 行程規劃"
            ] }),
            /* @__PURE__ */ p.jsx(
              "input",
              {
                type: "date",
                value: y[h].date.includes("第") ? "" : y[h].date,
                onChange: (A) => K(h, A.target.value),
                className: "text-[10px] px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                title: "選擇日期"
              }
            )
          ] }),
          /* @__PURE__ */ p.jsx("div", { className: "h-[1px] flex-1 bg-slate-100 ml-4" })
        ] }),
        /* @__PURE__ */ p.jsx("div", { className: "w-full relative", children: y[h].items.length === 0 ? /* @__PURE__ */ p.jsxs("div", { className: "py-24 text-center border-2 border-dashed border-slate-100 rounded-[3.5rem] bg-white", children: [
          /* @__PURE__ */ p.jsx("i", { className: "fas fa-map-location-dot text-slate-200 text-4xl mb-4" }),
          /* @__PURE__ */ p.jsx("p", { className: "text-[12px] font-black text-slate-300 uppercase tracking-widest px-8", children: "搜尋景點開始你的澎湖冒險" })
        ] }) : /* @__PURE__ */ p.jsx(Qc, { sensors: et, collisionDetection: Ql, onDragEnd: Ft, children: /* @__PURE__ */ p.jsx(hu, { items: y[h].items.map((A) => A.id), strategy: uu, children: /* @__PURE__ */ p.jsx("div", { className: "space-y-0 w-full relative", children: y[h].items.map((A, V) => /* @__PURE__ */ p.jsx(ho, { item: A, onRemove: pt, onTimeUpdate: ie, onClick: () => D({ ...A.place }), isLast: V === y[h].items.length - 1, travelTimeToNext: T[V], travelMode: g, nextPlace: y[h].items[V + 1]?.place }, A.id)) }) }) }) })
      ] }),
      /* @__PURE__ */ p.jsx("div", { className: "p-8 bg-white border-t border-slate-50 relative z-30", children: /* @__PURE__ */ p.jsxs("button", { onClick: St, disabled: y[h].items.length < 2 || c, className: "w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-[0.97] disabled:opacity-30", children: [
        c ? /* @__PURE__ */ p.jsx("i", { className: "fas fa-spinner fa-spin" }) : /* @__PURE__ */ p.jsx("i", { className: "fas fa-magic" }),
        " AI 智慧優化排序"
      ] }) })
    ] }),
    /* @__PURE__ */ p.jsxs("main", { className: "flex-1 relative bg-slate-100 overflow-hidden h-full", children: [
      /* @__PURE__ */ p.jsxs("div", { className: "absolute top-8 left-1/2 -translate-x-1/2 w-[90%] lg:w-[540px] z-30", children: [
        /* @__PURE__ */ p.jsxs("div", { className: "bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-white p-2 flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/10", children: [
          /* @__PURE__ */ p.jsx("div", { className: "w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200", children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-search text-lg" }) }),
          /* @__PURE__ */ p.jsx("input", { type: "text", placeholder: "搜尋澎湖秘境、美食...", className: "flex-1 bg-transparent border-none outline-none text-base font-bold text-slate-700 placeholder:text-slate-400", value: i, onChange: (A) => r(A.target.value), onKeyDown: (A) => A.key === "Enter" && X() }),
          /* @__PURE__ */ p.jsx(
            "button",
            {
              onClick: dt,
              disabled: H || !n,
              className: "w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-50",
              title: "我的地點收藏",
              children: H ? /* @__PURE__ */ p.jsx("i", { className: "fas fa-spinner fa-spin text-lg" }) : /* @__PURE__ */ p.jsx("i", { className: "fas fa-bookmark text-lg" })
            }
          )
        ] }),
        /* @__PURE__ */ p.jsxs(Ah, { children: [
          o.length > 0 && /* @__PURE__ */ p.jsx(as.div, { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 15 }, className: "absolute top-full mt-5 w-full bg-white/95 rounded-[2.5rem] shadow-2xl border border-white overflow-hidden max-h-[50vh] flex flex-col p-4 gap-2", children: o.map((A) => /* @__PURE__ */ p.jsx(uo, { place: A, onClick: () => {
            D({ ...A }), a([]), window.innerWidth < 1024 && C("low");
          } }, A.id)) }),
          G && k.length > 0 && /* @__PURE__ */ p.jsxs(as.div, { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 15 }, className: "absolute top-full mt-5 w-full bg-white/95 rounded-[2.5rem] shadow-2xl border border-white overflow-hidden max-h-[50vh] flex flex-col", children: [
            /* @__PURE__ */ p.jsxs("div", { className: "p-4 border-b border-slate-100 flex items-center justify-between", children: [
              /* @__PURE__ */ p.jsxs("h3", { className: "text-sm font-black text-slate-700", children: [
                "我的地點收藏 (",
                k.length,
                ")"
              ] }),
              /* @__PURE__ */ p.jsx(
                "button",
                {
                  onClick: () => {
                    _(!1), U([]);
                  },
                  className: "w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-all",
                  children: /* @__PURE__ */ p.jsx("i", { className: "fas fa-times text-xs" })
                }
              )
            ] }),
            /* @__PURE__ */ p.jsx("div", { className: "overflow-y-auto max-h-[calc(50vh-60px)] p-4 gap-2 flex flex-col", children: k.map((A) => /* @__PURE__ */ p.jsx(uo, { place: A, onClick: () => {
              Ot(A), _(!1), U([]), typeof window < "u" && window.showToast && window.showToast("已加入行程", "success");
            } }, A.id)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ p.jsx("div", { className: "w-full h-full", children: /* @__PURE__ */ p.jsx(dm, { items: y[h].items, center: R, travelMode: g, onAddPlaceFromMap: Ot, selectedPlace: P, onInfoWindowClose: Xt, onTravelDataUpdate: (A) => b(A) }) }),
      /* @__PURE__ */ p.jsxs(as.div, { className: "lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-[3.5rem] shadow-2xl z-40 overflow-hidden flex flex-col", animate: { height: w === "high" ? "85%" : "25%" }, transition: { type: "spring", damping: 25 }, children: [
        /* @__PURE__ */ p.jsx("div", { className: "w-full h-12 flex flex-col items-center justify-center cursor-pointer", onClick: () => C(w === "low" ? "high" : "low"), children: /* @__PURE__ */ p.jsx("div", { className: "w-14 h-1.5 bg-slate-100 rounded-full" }) }),
        /* @__PURE__ */ p.jsxs("div", { className: "flex-1 overflow-y-auto px-6 pb-28 custom-scrollbar", children: [
          /* @__PURE__ */ p.jsxs("div", { className: "flex items-center justify-between mb-8 px-2", children: [
            /* @__PURE__ */ p.jsx("h2", { className: "text-2xl font-black text-slate-900", children: y[h].date }),
            /* @__PURE__ */ p.jsx("div", { className: "flex gap-2", children: y.map((A, V) => /* @__PURE__ */ p.jsxs("button", { onClick: () => {
              f(V), b([]);
            }, className: `w-11 h-11 rounded-full text-[11px] font-black ${h === V ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-400"}`, children: [
              "D",
              V + 1
            ] }, V)) })
          ] }),
          /* @__PURE__ */ p.jsx("div", { className: "space-y-0 w-full relative", children: y[h].items.map((A, V) => /* @__PURE__ */ p.jsx(ho, { item: A, onRemove: pt, onTimeUpdate: ie, onClick: () => {
            D({ ...A.place }), C("low");
          }, isLast: V === y[h].items.length - 1, travelTimeToNext: T[V], travelMode: g, nextPlace: y[h].items[V + 1]?.place }, A.id)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ p.jsx("style", { children: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      ` })
  ] });
};
export {
  gm as App,
  gm as default
};
