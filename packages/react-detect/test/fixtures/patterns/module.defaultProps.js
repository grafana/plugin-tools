/* eslint-disable */
/* [create-plugin] plugin: heywesty-trafficlight-panel@1.0.0 */
define(['react'], (e) =>
  (() => {
    'use strict';
    let r = {
        959: (r) => {
          r.exports = e;
        },
      },
      t = {};
    function o(e) {
      let n = t[e];
      if (void 0 !== n) {
        return n.exports;
      }
      let a = (t[e] = { exports: {} });
      return (r[e](a, a.exports, o), a.exports);
    }
    ((o.n = (e) => {
      let r = e && e.__esModule ? () => e.default : () => e;
      return (o.d(r, { a: r }), r);
    }),
      (o.d = (e, r) => {
        for (let t in r) {
          o.o(r, t) && !o.o(e, t) && Object.defineProperty(e, t, { enumerable: !0, get: r[t] });
        }
      }),
      (o.o = (e, r) => Object.prototype.hasOwnProperty.call(e, r)),
      (o.r = (e) => {
        ('undefined' !== typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
          Object.defineProperty(e, '__esModule', { value: !0 }));
      }));
    let n = {};
    (o.r(n), o.d(n, { default: () => u }));
    let a = o(959),
      l = o.n(a);
    function d({ name: e }) {
      return l().createElement('div', null, 'Hello, ', e, '!');
    }
    ((d.displayName = 'MyComponent'), (d.defaultProps = { name: 'World' }));
    const u = d;
    return n;
  })());
//# sourceMappingURL=module.js.map
