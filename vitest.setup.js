/**
 * Vitest global setup.
 *
 * DOMPurify 3.4.8 introduced `getNodeName = lookupGetter(Node.prototype, 'nodeName')` which
 * it uses (via `unapply`) to read node names in a realm-safe way. In happy-dom, however,
 * `Node.prototype.nodeName` is a stub that always returns `''`; the real implementation lives
 * in `Element.prototype.nodeName` (returns tagName) and other subclass overrides.
 * When DOMPurify calls the base `Node.prototype` getter via `.call(element)`, it gets `''` for
 * every element, so no tag matches the allow-list and everything is stripped — including safe
 * tags like `<h1>` and `<p>`.
 *
 * Fix: redefine `Node.prototype.nodeName` to walk the actual prototype chain of `this`,
 * skipping `Node.prototype` itself, and call the first getter found. This matches real-browser
 * behaviour (the native getter dispatches correctly for every node type) without touching any
 * other happy-dom internals.
 */
/* global Node */
if (typeof Node !== 'undefined') {
  const nodeProto = Node.prototype;
  const nodeProtoNodeNameDesc = Object.getOwnPropertyDescriptor(nodeProto, 'nodeName');

  Object.defineProperty(nodeProto, 'nodeName', {
    get() {
      // Walk the prototype chain of `this`, skipping Node.prototype,
      // to find the first nodeName getter defined on a subclass.
      let proto = Object.getPrototypeOf(this);
      while (proto !== null && proto !== nodeProto) {
        const desc = Object.getOwnPropertyDescriptor(proto, 'nodeName');
        if (desc && desc.get) {
          return desc.get.call(this);
        }
        proto = Object.getPrototypeOf(proto);
      }
      // Fallback to the original Node.prototype getter (returns '' in happy-dom).
      return nodeProtoNodeNameDesc?.get ? nodeProtoNodeNameDesc.get.call(this) : '';
    },
    configurable: true,
  });
}
