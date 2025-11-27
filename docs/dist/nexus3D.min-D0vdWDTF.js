import J from "three";
function Z(z, M) {
  for (var T = 0; T < M.length; T++) {
    const w = M[T];
    if (typeof w != "string" && !Array.isArray(w)) {
      for (const N in w)
        if (N !== "default" && !(N in z)) {
          const d = Object.getOwnPropertyDescriptor(w, N);
          d && Object.defineProperty(z, N, d.get ? d : {
            enumerable: !0,
            get: () => w[N]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(z, Symbol.toStringTag, { value: "Module" }));
}
var L = { exports: {} }, tt = L.exports, Q;
function et() {
  return Q || (Q = 1, (function(z, M) {
    (function(T, w) {
      w(M, J);
    })(tt, (function(T, w) {
      function N(t) {
        if (t && t.__esModule) return t;
        var e = /* @__PURE__ */ Object.create(null);
        return t && Object.keys(t).forEach((function(r) {
          if (r !== "default") {
            var o = Object.getOwnPropertyDescriptor(t, r);
            Object.defineProperty(e, r, o.get ? o : { enumerable: !0, get: function() {
              return t[r];
            } });
          }
        })), e.default = t, Object.freeze(e);
      }
      var d = N(w);
      function V(t) {
        var e = t.getUint32(t.offset, !0), r = t.getUint32(t.offset + 4, !0);
        return t.offset += 8, 1 * r + e;
      }
      function y(t) {
        var e = t.getUint32(t.offset, !0);
        return t.offset += 4, e;
      }
      function O(t) {
        var e = t.getUint16(t.offset, !0);
        return t.offset += 2, e;
      }
      function F(t) {
        var e = t.getFloat32(t.offset, !0);
        return t.offset += 4, e;
      }
      function j(t, e) {
        var r = 1 / (t[12] * t[9] * t[6] * t[3] - t[8] * t[13] * t[6] * t[3] - t[12] * t[5] * t[10] * t[3] + t[4] * t[13] * t[10] * t[3] + t[8] * t[5] * t[14] * t[3] - t[4] * t[9] * t[14] * t[3] - t[12] * t[9] * t[2] * t[7] + t[8] * t[13] * t[2] * t[7] + t[12] * t[1] * t[10] * t[7] - t[0] * t[13] * t[10] * t[7] - t[8] * t[1] * t[14] * t[7] + t[0] * t[9] * t[14] * t[7] + t[12] * t[5] * t[2] * t[11] - t[4] * t[13] * t[2] * t[11] - t[12] * t[1] * t[6] * t[11] + t[0] * t[13] * t[6] * t[11] + t[4] * t[1] * t[14] * t[11] - t[0] * t[5] * t[14] * t[11] - t[8] * t[5] * t[2] * t[15] + t[4] * t[9] * t[2] * t[15] + t[8] * t[1] * t[6] * t[15] - t[0] * t[9] * t[6] * t[15] - t[4] * t[1] * t[10] * t[15] + t[0] * t[5] * t[10] * t[15]);
        e[0] = (t[9] * t[14] * t[7] - t[13] * t[10] * t[7] + t[13] * t[6] * t[11] - t[5] * t[14] * t[11] - t[9] * t[6] * t[15] + t[5] * t[10] * t[15]) * r, e[1] = (t[13] * t[10] * t[3] - t[9] * t[14] * t[3] - t[13] * t[2] * t[11] + t[1] * t[14] * t[11] + t[9] * t[2] * t[15] - t[1] * t[10] * t[15]) * r, e[2] = (t[5] * t[14] * t[3] - t[13] * t[6] * t[3] + t[13] * t[2] * t[7] - t[1] * t[14] * t[7] - t[5] * t[2] * t[15] + t[1] * t[6] * t[15]) * r, e[3] = (t[9] * t[6] * t[3] - t[5] * t[10] * t[3] - t[9] * t[2] * t[7] + t[1] * t[10] * t[7] + t[5] * t[2] * t[11] - t[1] * t[6] * t[11]) * r, e[4] = (t[12] * t[10] * t[7] - t[8] * t[14] * t[7] - t[12] * t[6] * t[11] + t[4] * t[14] * t[11] + t[8] * t[6] * t[15] - t[4] * t[10] * t[15]) * r, e[5] = (t[8] * t[14] * t[3] - t[12] * t[10] * t[3] + t[12] * t[2] * t[11] - t[0] * t[14] * t[11] - t[8] * t[2] * t[15] + t[0] * t[10] * t[15]) * r, e[6] = (t[12] * t[6] * t[3] - t[4] * t[14] * t[3] - t[12] * t[2] * t[7] + t[0] * t[14] * t[7] + t[4] * t[2] * t[15] - t[0] * t[6] * t[15]) * r, e[7] = (t[4] * t[10] * t[3] - t[8] * t[6] * t[3] + t[8] * t[2] * t[7] - t[0] * t[10] * t[7] - t[4] * t[2] * t[11] + t[0] * t[6] * t[11]) * r, e[8] = (t[8] * t[13] * t[7] - t[12] * t[9] * t[7] + t[12] * t[5] * t[11] - t[4] * t[13] * t[11] - t[8] * t[5] * t[15] + t[4] * t[9] * t[15]) * r, e[9] = (t[12] * t[9] * t[3] - t[8] * t[13] * t[3] - t[12] * t[1] * t[11] + t[0] * t[13] * t[11] + t[8] * t[1] * t[15] - t[0] * t[9] * t[15]) * r, e[10] = (t[4] * t[13] * t[3] - t[12] * t[5] * t[3] + t[12] * t[1] * t[7] - t[0] * t[13] * t[7] - t[4] * t[1] * t[15] + t[0] * t[5] * t[15]) * r, e[11] = (t[8] * t[5] * t[3] - t[4] * t[9] * t[3] - t[8] * t[1] * t[7] + t[0] * t[9] * t[7] + t[4] * t[1] * t[11] - t[0] * t[5] * t[11]) * r, e[12] = (t[12] * t[9] * t[6] - t[8] * t[13] * t[6] - t[12] * t[5] * t[10] + t[4] * t[13] * t[10] + t[8] * t[5] * t[14] - t[4] * t[9] * t[14]) * r, e[13] = (t[8] * t[13] * t[2] - t[12] * t[9] * t[2] + t[12] * t[1] * t[10] - t[0] * t[13] * t[10] - t[8] * t[1] * t[14] + t[0] * t[9] * t[14]) * r, e[14] = (t[12] * t[5] * t[2] - t[4] * t[13] * t[2] - t[12] * t[1] * t[6] + t[0] * t[13] * t[6] + t[4] * t[1] * t[14] - t[0] * t[5] * t[14]) * r, e[15] = (t[4] * t[9] * t[2] - t[8] * t[5] * t[2] + t[8] * t[1] * t[6] - t[0] * t[9] * t[6] - t[4] * t[1] * t[10] + t[0] * t[5] * t[10]) * r;
      }
      function k(t) {
        this.error = new Float32Array(t), this.data = new Int32Array(t), this.size = 0;
      }
      function X() {
        let t = this;
        t.maxBlocked = 30, t.modelMatrix = new Float32Array(16), t.viewMatrix = new Float32Array(16), t.projectionMatrix = new Float32Array(16), t.modelView = new Float32Array(16), t.modelViewInv = new Float32Array(16), t.modelViewProj = new Float32Array(16), t.modelViewProjInv = new Float32Array(16), t.planes = new Float32Array(24), t.viewport = new Float32Array(4), t.viewpoint = new Float32Array(4);
      }
      k.prototype = { push: function(t, e) {
        this.data[this.size] = t, this.error[this.size] = e, this.bubbleUp(this.size), this.size++;
      }, pop: function() {
        var t = this.data[0];
        return this.size--, this.size > 0 && (this.data[0] = this.data[this.size], this.error[0] = this.error[this.size], this.sinkDown(0)), t;
      }, bubbleUp: function(t) {
        for (var e = this.data[t], r = this.error[t]; t > 0; ) {
          var o = (t + 1 >> 1) - 1, s = this.error[o];
          if (s > r) break;
          this.data[t] = this.data[o], this.error[t] = s, this.data[o] = e, this.error[o] = r, t = o;
        }
      }, sinkDown: function(t) {
        for (var e = this.data[t], r = this.error[t]; ; ) {
          var o = 2 * (t + 1), s = o - 1, i = -1;
          if (s < this.size) {
            var a = this.error[s];
            a > r && (i = s);
          }
          if (o < this.size && this.error[o] > (i == -1 ? r : a) && (i = o), i == -1) break;
          this.data[t] = this.data[i], this.error[t] = this.error[i], this.data[i] = e, this.error[i] = r, t = i;
        }
      } }, X.prototype = { updateView: function(t, e, r) {
        let o = this;
        for (let f = 0; f < 16; f++) o.projectionMatrix[f] = e[f], o.modelView[f] = r[f];
        for (let f = 0; f < 4; f++) o.viewport[f] = t[f];
        var s, i, a;
        s = o.projectionMatrix, i = o.modelView, (a = o.modelViewProj)[0] = s[0] * i[0] + s[4] * i[1] + s[8] * i[2] + s[12] * i[3], a[1] = s[1] * i[0] + s[5] * i[1] + s[9] * i[2] + s[13] * i[3], a[2] = s[2] * i[0] + s[6] * i[1] + s[10] * i[2] + s[14] * i[3], a[3] = s[3] * i[0] + s[7] * i[1] + s[11] * i[2] + s[15] * i[3], a[4] = s[0] * i[4] + s[4] * i[5] + s[8] * i[6] + s[12] * i[7], a[5] = s[1] * i[4] + s[5] * i[5] + s[9] * i[6] + s[13] * i[7], a[6] = s[2] * i[4] + s[6] * i[5] + s[10] * i[6] + s[14] * i[7], a[7] = s[3] * i[4] + s[7] * i[5] + s[11] * i[6] + s[15] * i[7], a[8] = s[0] * i[8] + s[4] * i[9] + s[8] * i[10] + s[12] * i[11], a[9] = s[1] * i[8] + s[5] * i[9] + s[9] * i[10] + s[13] * i[11], a[10] = s[2] * i[8] + s[6] * i[9] + s[10] * i[10] + s[14] * i[11], a[11] = s[3] * i[8] + s[7] * i[9] + s[11] * i[10] + s[15] * i[11], a[12] = s[0] * i[12] + s[4] * i[13] + s[8] * i[14] + s[12] * i[15], a[13] = s[1] * i[12] + s[5] * i[13] + s[9] * i[14] + s[13] * i[15], a[14] = s[2] * i[12] + s[6] * i[13] + s[10] * i[14] + s[14] * i[15], a[15] = s[3] * i[12] + s[7] * i[13] + s[11] * i[14] + s[15] * i[15], j(o.modelViewProj, o.modelViewProjInv), j(o.modelView, o.modelViewInv), o.viewpoint[0] = o.modelViewInv[12], o.viewpoint[1] = o.modelViewInv[13], o.viewpoint[2] = o.modelViewInv[14], o.viewpoint[3] = 1;
        const u = o.modelViewProj, l = o.modelViewProjInv;
        let h = o.planes;
        h[0] = u[0] + u[3], h[1] = u[4] + u[7], h[2] = u[8] + u[11], h[3] = u[12] + u[15], h[4] = -u[0] + u[3], h[5] = -u[4] + u[7], h[6] = -u[8] + u[11], h[7] = -u[12] + u[15], h[8] = u[1] + u[3], h[9] = u[5] + u[7], h[10] = u[9] + u[11], h[11] = u[13] + u[15], h[12] = -u[1] + u[3], h[13] = -u[5] + u[7], h[14] = -u[9] + u[11], h[15] = -u[13] + u[15], h[16] = -u[2] + u[3], h[17] = -u[6] + u[7], h[18] = -u[10] + u[11], h[19] = -u[14] + u[15], h[20] = -u[2] + u[3], h[21] = -u[6] + u[7], h[22] = -u[10] + u[11], h[23] = -u[14] + u[15];
        for (let f = 0; f < 24; f += 4) {
          let b = Math.sqrt(h[f] * h[f] + h[f + 1] * h[f + 1] + h[f + 2] * h[f + 2]);
          h[f] /= b, h[f + 1] /= b, h[f + 2] /= b, h[f + 3] /= b;
        }
        const c = l[3] + l[15], x = (l[0] + l[12]) / c, E = (l[1] + l[13]) / c, U = (l[2] + l[14]) / c, g = -l[3] + l[15], _ = (-l[0] + l[12]) / g - x, P = (-l[1] + l[13]) / g - E, p = (-l[2] + l[14]) / g - U, B = Math.sqrt(_ * _ + P * P + p * p), R = l[12] / l[15] - o.viewpoint[0], q = l[13] / l[15] - o.viewpoint[1], D = l[14] / l[15] - o.viewpoint[2], v = 2 * B / Math.sqrt(R * R + q * q + D * D) / o.viewport[2];
        o.currentResolution == v ? o.sameResolution = !0 : o.sameResolution = !1, o.currentResolution = v;
      }, traverse: function(t, e) {
        let r = this;
        if (r.mesh = t, !t.isReady) return;
        const o = t.nodesCount;
        r.visited = new Uint8Array(o), r.blocked = new Uint8Array(o), r.selected = new Uint8Array(o), r.frame = e.frame, r.instance_errors = new Float32Array(o), r.frame > t.frame && (t.errors = new Float32Array(o), t.frame = r.frame), r.visitQueue = new k(o);
        for (var s = 0; s < t.nroots; s++) r.insertNode(s);
        r.currentError = e.currentError, r.drawSize = 0, r.nblocked = 0;
        for (var i = 0; r.visitQueue.size && r.nblocked < r.maxBlocked; ) {
          var a = r.visitQueue.error[0], u = r.visitQueue.pop();
          t.status[u] == 0 && i < e.maxPending && (e.candidates.push({ id: u, mesh: t, frame: r.frame, error: a }), i++);
          var l = r.blocked[u] || !r.expandNode(u, a);
          l ? r.nblocked++ : r.selected[u] = 1, r.insertChildren(u, l);
        }
        if (e.nodes.has(t)) for (let h of e.nodes.get(t)) {
          let c = r.nodeError(h);
          r.instance_errors[h] == 0 && (r.instance_errors[s] = c, t.errors[h] = Math.max(t.errors[h], c));
        }
        return r.mesh = null, r.instance_errors;
      }, insertNode: function(t) {
        let e = this;
        e.visited[t] = 1;
        const r = e.nodeError(t);
        e.instance_errors[t] = r, e.mesh.errors[t] = Math.max(r, e.mesh.errors[t]), e.mesh.frames[t] = e.frame, e.visitQueue.push(t, r);
      }, insertChildren: function(t, e) {
        let r = this;
        for (let o = r.mesh.nfirstpatch[t]; o < r.mesh.nfirstpatch[t + 1]; ++o) {
          const s = r.mesh.patches[3 * o];
          if (s == r.mesh.sink) return;
          e && (r.blocked[s] = 1), r.visited[s] || r.insertNode(s);
        }
      }, expandNode: function(t, e) {
        let r = this;
        if (t > 0 && e < r.currentError || r.drawSize > r.drawBudget || r.mesh.status[t] != 1) return !1;
        const o = r.mesh.nspheres, s = 5 * t;
        return r.isVisible(o[s], o[s + 1], o[s + 2], o[s + 3]) && (r.drawSize += 0.8 * r.mesh.nvertices[t]), !0;
      }, nodeError: function(t, e) {
        let r = this;
        const o = r.mesh.nspheres, s = r.viewpoint, i = 5 * t, a = o[i + 0], u = o[i + 1], l = o[i + 2];
        let h = o[i + 3];
        e && (h = o[i + 4]);
        const c = s[0] - a, x = s[1] - u, E = s[2] - l;
        let U = Math.sqrt(c * c + x * x + E * E) - h;
        U < 0.1 && (U = 0.1);
        let g = r.mesh.nerrors[t] / (r.currentResolution * U), _ = r.distance(a, u, l, o[i + 4]);
        return _ < -h ? g /= 101 : _ < 0 && (g /= 1 - _ / h * 100), g;
      }, distance: function(t, e, r, o) {
        const s = this.planes;
        let i = 1e20;
        for (let a = 0; a < 24; a += 4) {
          let u = s[a] * t + s[a + 1] * e + s[a + 2] * r + s[a + 3] + o;
          u < i && (i = u);
        }
        return i;
      }, isVisible: function(t, e, r, o) {
        const s = this.planes;
        for (let i = 0; i < 24; i += 4) if (s[i] * t + s[i + 1] * e + s[i + 2] * r + s[i + 3] + o < 0) return !1;
        return !0;
      } };
      let A = WebGLRenderingContext.prototype, S = [A.NONE, A.BYTE, A.UNSIGNED_BYTE, A.SHORT, A.UNSIGNED_SHORT, A.INT, A.UNSIGNED_INT, A.FLOAT, A.DOUBLE], K = [0, 1, 1, 2, 2, 4, 4, 4, 8], W = function(t) {
        var e = this;
        e.isReady = !1, e.onLoad = [], e.onUpdate = [], e.reqAttempt = 0, e.georeq = {}, e.texreq = {}, e.frame = 0, e.availableNodes = 0, t && e.open(t);
      };
      W.prototype = { open: function(t) {
        let e = this;
        e.url = t, e.httpRequest(t, 0, 88, (function() {
          console.log("Loading header for " + e.url);
          let r = new DataView(this.response);
          r.offset = 0, e.reqAttempt++;
          const o = e.importHeader(r);
          if (!o) return console.log("Empty header!"), void (e.reqAttempt < maxReqAttempt && e.open(e.url + "?" + Math.random()));
          e.reqAttempt = 0;
          for (let s in o) e[s] = o[s];
          e.vertex = e.signature.vertex, e.face = e.signature.face, e.renderMode = e.face.index ? ["FILL", "POINT"] : ["POINT"], e.compressed = 6 & e.signature.flags, e.meco = 2 & e.signature.flags, e.corto = 4 & e.signature.flags, e.deepzoom = 8 & e.signature.flags, e.deepzoom && (e.baseurl = t.substr(0, t.length - 4) + "_files/"), e.requestIndex();
        }), (function() {
          console.log("Open request error!");
        }), (function() {
          console.log("Open request abort!");
        }));
      }, httpRequest: function(t, e, r, o, s, i, a) {
        a || (a = "arraybuffer");
        var u = new XMLHttpRequest();
        return u.open("GET", t, !0), u.responseType = a, r && u.setRequestHeader("Range", "bytes=" + e + "-" + (r - 1)), u.onload = function() {
          switch (this.status) {
            case 0:
              s();
              break;
            case 206:
              o.bind(this)();
              break;
            case 200:
              r == 0 ? o.bind(this)() : s();
          }
        }, u.onerror = s, u.onabort = i, u.send(), u;
      }, requestIndex: function() {
        var t = this, e = 88 + 44 * t.nodesCount + 12 * t.patchesCount + 68 * t.texturesCount;
        t.httpRequest(this.url, 88, e, (function() {
          console.log("Loading index for " + t.url), t.handleIndex(this.response);
        }), (function() {
          console.log("Index request error!");
        }), (function() {
          console.log("Index request abort!");
        }));
      }, handleIndex: function(t) {
        let e = this, r = new DataView(t);
        r.offset = 0;
        const o = e.nodesCount;
        e.noffsets = new Uint32Array(o), e.nvertices = new Uint32Array(o), e.nfaces = new Uint32Array(o), e.nerrors = new Float32Array(o), e.nspheres = new Float32Array(5 * o), e.nsize = new Float32Array(o), e.nfirstpatch = new Uint32Array(o);
        for (let a = 0; a < o; a++) {
          e.noffsets[a] = 256 * y(r), e.nvertices[a] = O(r), e.nfaces[a] = O(r), e.nerrors[a] = F(r), r.offset += 8;
          for (let u = 0; u < 5; u++) e.nspheres[5 * a + u] = F(r);
          e.nfirstpatch[a] = y(r);
        }
        e.sink = o - 1, e.patches = new Uint32Array(r.buffer, r.offset, 3 * e.patchesCount), e.nroots = e.nodesCount;
        for (let a = 0; a < e.nroots; a++) for (let u = e.nfirstpatch[a]; u < e.nfirstpatch[a + 1]; u++) e.patches[3 * u] < e.nroots && (e.nroots = e.patches[3 * u]);
        r.offset += 12 * e.patchesCount, e.textures = new Uint32Array(e.texturesCount), e.texref = new Uint32Array(e.texturesCount);
        for (let a = 0; a < e.texturesCount; a++) e.textures[a] = 256 * y(r), r.offset += 64;
        e.vsize = 12 + (e.vertex.normal ? 6 : 0) + (e.vertex.color ? 4 : 0) + (e.vertex.texCoord ? 8 : 0), e.fsize = 6;
        let s = new Uint32Array(o - 1), i = new Uint32Array(o - 1);
        for (let a = 0; a < o - 1; a++) {
          for (let u = e.nfirstpatch[a]; u != e.nfirstpatch[a + 1]; u++) {
            let l = e.patches[3 * u + 2];
            s[a] += e.textures[l + 1] - e.textures[l], i[a]++;
          }
          e.nsize[a] = e.vsize * e.nvertices[a] + e.fsize * e.nfaces[a];
        }
        for (let a = 0; a < o - 1; a++) e.nsize[a] += 10 * s[a] / i[a];
        e.status = new Uint8Array(o), e.frames = new Uint32Array(o), e.errors = new Float32Array(o), e.reqAttempt = new Uint8Array(o), e.isReady = !0;
        for (let a of e.onLoad) a(this);
      }, importAttribute: function(t) {
        let e = {};
        return e.type = t.getUint8(t.offset++, !0), e.size = t.getUint8(t.offset++, !0), e.glType = S[e.type], e.normalized = e.type < 7, e.stride = K[e.type] * e.size, e.size == 0 ? null : e;
      }, importElement: function(t) {
        let e = [];
        for (let r = 0; r < 8; r++) e[r] = this.importAttribute(t);
        return e;
      }, importVertex: function(t) {
        const e = this.importElement(t);
        let r = e[2];
        return r && (r.type = 2, r.glType = S[2]), { position: e[0], normal: e[1], color: e[2], texCoord: e[3], data: e[4] };
      }, importFace: function(t) {
        const e = this.importElement(t);
        let r = e[2];
        return r && (r.type = 2, r.glType = S[2]), { index: e[0], normal: e[1], color: e[2], texCoord: e[3], data: e[4] };
      }, importSignature: function(t) {
        let e = {};
        return e.vertex = this.importVertex(t), e.face = this.importFace(t), e.flags = y(t), e;
      }, importHeader: function(t) {
        if (y(t) != 1316516640) return null;
        let e = {};
        return e.version = y(t), e.verticesCount = V(t), e.facesCount = V(t), e.signature = this.importSignature(t), e.nodesCount = y(t), e.patchesCount = y(t), e.texturesCount = y(t), e.sphere = { center: [F(t), F(t), F(t)], radius: F(t) }, e;
      }, createNode: function(t) {
      }, createNodeGeometry: function(t, e) {
      }, deleteNodeGeometry: function(t) {
      }, createTexture: function(t, e) {
      }, deleteTexture: function(t) {
      } };
      function Y() {
        let t = this;
        t.cortopath = ".", t.frame = 0, t.maxCacheSize = 1073741824, t.minFps = 15, t.currentFps = 0, t.targetError = 2, t.currentError = 2, t.maxError = 15, t.realError = 0, t.pending = 0, t.maxPending = 3, t.cacheSize = 0, t.candidates = [], t.nodes = /* @__PURE__ */ new Map(), t.last_frametime = 0, t.frametime = 0, t.end_frametime = 0, t.debug = { verbose: !1, nodes: !1, draw: !1, extract: !1 }, t.totswapped = 0, t.swaprate = 0, t.lastupdate = performance.now();
      }
      Y.prototype = { getTargetError: function() {
        return this.targetError;
      }, getMinFps: function() {
        return this.minFps;
      }, setMinFps: function(t) {
        this.minFps = t;
      }, getMaxCacheSize: function() {
        return this.maxCacheSize;
      }, setMaxCacheSize: function(t) {
        this.maxCacheSize = t;
      }, setTargetError: function(t) {
        this.targetError = t;
      }, loadCorto: function() {
        let t = new Worker(this.cortopath + "/corto.em.js");
        t.requests = {}, t.count = 0, t.postRequest = function(e) {
          t.postMessage({ buffer: e.buffer, request: this.count, rgba_colors: !0, short_index: !0, short_normals: !0 }), e.buffer = null, this.requests[this.count++] = e;
        }, t.onmessage = function(e) {
          var r = e.data.request, o = this.requests[r];
          delete this.requests[r], o.model = e.data.model, o.cache.readyGeometryNode(o.mesh, o.id, o.model);
        }, this.corto = t;
      }, beginFrame: function(t) {
        let e = this;
        e.frametime = performance.now();
        let r = e.frametime - e.last_frametime;
        if (e.last_frametime = e.frametime, r < 500 && (e.currentFps = 0.9 * e.currentFps + 1e3 / r * 0.1), t = e.currentFps, e.frame++, e.candidates = [], t && e.minFps) {
          e.currentFps = t;
          const o = e.minFps / t;
          o > 1.1 && (e.currentError *= 1.05), o < 0.9 && (e.currentError *= 0.95), e.currentError = Math.max(e.targetError, Math.min(e.maxError, e.currentError));
        } else e.currentError = e.targetError;
        e.rendered = 0, e.realError = 1e20, e.totswapped = 0;
      }, endFrame: function() {
        this.update();
      }, requestNode: function(t, e) {
        t.status[e] = 2, this.cacheSize += t.nsize[e], t.reqAttempt[e] = 0, this.nodes.has(t) || this.nodes.set(t, /* @__PURE__ */ new Set()), this.nodes.get(t).add(e), this.requestNodeGeometry(t, e), this.requestNodeTexture(t, e);
      }, requestNodeGeometry: function(t, e) {
        this.pending++, t.status[e]++;
        let r = t.deepzoom ? t.baseurl + e + ".nxn" : t.url, o = t.deepzoom ? 0 : t.noffsets[e], s = t.deepzoom ? 0 : t.noffsets[e + 1], i = t.georeq[e] = t.httpRequest(r, o, s, (() => {
          delete t.georeq[e], this.loadNodeGeometry(i, t, e), this.pending--;
        }), (() => {
          delete t.georeq[e], this.debug.verbose && console.log("Geometry request error!"), this.recoverNode(t, e, 0), this.pending--;
        }), (() => {
          delete t.georeq[e], this.debug.verbose && console.log("Geometry request abort!"), this.removeNode(t, e), this.pending--;
        }), "arraybuffer");
      }, requestNodeTexture: function(t, e) {
        if (!t.vertex.texCoord) return;
        let r = t.patches[3 * t.nfirstpatch[e] + 2];
        t.texref[r]++, t.status[e]++;
        let o = t.deepzoom ? t.baseurl + r + ".jpg" : t.url, s = t.deepzoom ? 0 : t.textures[r], i = t.deepzoom ? 0 : t.textures[r + 1], a = t.texreq[r] = t.httpRequest(o, s, i, (() => {
          delete t.texreq[r], this.loadNodeTexture(a, t, e, r);
        }), (() => {
          delete t.texreq[r], this.debug.verbose && console.log("Texture request error!"), this.recoverNode(t, e, 1);
        }), (() => {
          delete t.texreq[r], this.debug.verbose && console.log("Texture request abort!"), this.removeNode(t, e);
        }), "blob");
      }, recoverNode: function(t, e, r) {
        if (t.status[e] == 0) return;
        t.status[e]--;
        let o = this;
        if (t.reqAttempt[e] > 2) return this.debug.verbose && console.log("Max request limit for " + m.url + " node: " + n), void o.removeNode(t, e);
        switch (t.reqAttempt[e]++, r) {
          case 0:
            o.requestNodeGeometry(t, e), this.debug.verbose && console.log("Recovering geometry for " + m.url + " node: " + n);
            break;
          case 1:
            o.requestNodeTexture(t, e), this.debug.verbose && console.log("Recovering texture for " + m.url + " node: " + n);
        }
      }, loadNodeGeometry: function(t, e, r) {
        e.status[r] != 0 && (e.compressed ? (this.corto || this.loadCorto(), this.corto.postRequest({ mesh: e, id: r, buffer: t.response, cache: this })) : this.readyGeometryNode(e, r, t.response));
      }, loadNodeTexture: function(t, e, r, o) {
        if (e.status[r] == 0) throw "Should not load texture twice";
        let s = t.response, i = (l) => {
          e.status[r] != 0 && (e.createTexture(o, l), e.status[r]--, e.status[r] == 2 && this.readyNode(e, r));
        };
        if (typeof createImageBitmap < "u") try {
          createImageBitmap(s, { imageOrientation: "flipY" }).then(i);
        } catch {
          createImageBitmap(s).then(i);
        }
        else {
          var a = window.URL || window.webkitURL, u = document.createElement("img");
          u.onerror = function(l) {
            console.log("Texture loading error!");
          }, u.src = a.createObjectURL(s), u.onload = function() {
            a.revokeObjectURL(u.src), i(u);
          };
        }
      }, removeNode: function(t, e) {
        if (this.nodes.get(t).delete(e), t.status[e] == 0) return void (this.debug.verbose && console.log("Double remove due to abort."));
        if (t.status[e] = 0, e in t.georeq && t.georeq[e].readyState != 4 && (t.georeq[e].abort(), delete t.georeq[e]), t.availableNodes--, this.cacheSize -= t.nsize[e], t.deleteNodeGeometry(e), !t.vertex.texCoord) return;
        const r = t.patches[3 * t.nfirstpatch[e] + 2];
        r in t.texreq && t.texreq[r].readyState != 4 && (t.texreq[r].abort(), delete t.texreq[r]), t.texref[r]--, t.texref[r] == 0 && t.deleteTexture(r);
      }, readyGeometryNode: function(t, e, r) {
        if (t.status[e] == 0) return;
        const o = t.nvertices[e], s = t.nfaces[e];
        let i = {};
        if (t.corto) i = r;
        else {
          i.index = new Uint16Array(r, o * t.vsize, 3 * s), i.position = new Float32Array(r, 0, 3 * o);
          var a = 12 * o;
          t.vertex.texCoord && (i.uv = new Float32Array(r, a, 2 * o), a += 8 * o), t.vertex.normal && (i.normal = new Int16Array(r, a, 3 * o), a += 6 * o), t.vertex.color && (i.color = new Uint8Array(r, a, 4 * o), a += 4 * o);
        }
        t.createNodeGeometry(e, i), t.status[e]--, t.status[e] == 2 && this.readyNode(t, e);
      }, readyNode: function(t, e) {
        if (t.status[e]--, t.status[e] != 1) throw "A ready node should have status ==1";
        t.reqAttempt[e] = 0, t.createNode(e), t.availableNodes++;
        for (let r of t.onUpdate) r();
        this.update();
      }, flush: function(t) {
        if (this.nodes.has(t)) {
          for (let e of this.nodes.get(t)) this.removeNode(t, e);
          this.nodes.delete(t);
        }
      }, update: function() {
        if (this.pending >= 3) return;
        let t = null;
        for (let e of this.candidates) e.mesh.status[e.id] == 0 && (!t || e.error > t.error) && (t = e);
        if (t) {
          for (; this.cacheSize > this.maxCacheSize; ) {
            let e = null;
            for (let [r, o] of this.nodes) for (let s of o) {
              let i = r.errors[s], a = r.frames[s];
              (!e || i < e.error) && (e = { id: s, frame: a, error: i, mesh: r });
            }
            if (!e || e.error >= 0.9 * t.error) return;
            this.removeNode(e.mesh, e.id);
          }
          this.totswapped += t.mesh.nsize[t.id], this.candidates = this.candidates.filter(((e) => e.mesh == t.mesh && e.id == t.id)), this.requestNode(t.mesh, t.id), this.update();
        }
      } };
      let I = new Y();
      class $ extends d.Mesh {
        constructor(e, r, o) {
          if (super(), typeof r == "function") throw "Nexus3D constructor has changed: Nexus3D(url, renderer, options) where options include: onLoad, onUpdate, onProgress and material";
          this.patchWebGLRenderer(r), Object.assign(this, { isNXS: !0, type: "NXS", url: e, gl: r.getContext(), material: null, autoUpdate: !0, mesh: new W(), vbo: [], ibo: [], vao: [], textures: [], attributes: {}, basemesh: null }), "material" in o && (this.material = o.material), this.material || (this.material = new d.MeshStandardMaterial());
          for (let s of ["onLoad", "onUpdate", "onProgress"]) this["_" + s] = [], s in o && this["_" + s].push(o[s]);
          this.url && (typeof e == "object" ? (this.nxs = this.url, this.nxs.onLoad.push(((s) => {
            this.mesh = this.nxs.mesh, this.traversal = this.nxs.traversal, this.cache = this.nxs.cache, this.vbo = this.nxs.vbo, this.ibo = this.nxs.ibo, this.vao = this.nxs.vao, this.textures = this.nxs.textures, this.onLoadCallback(this);
          }))) : this.open(this.url));
        }
        copy(e) {
          throw Object3D.prototype.copy.call(this, e, !1), "Can't really copy.";
        }
        open(e) {
          let r = this;
          this.mesh.open(e), this.mesh.createNode = (o) => {
          }, this.mesh.createNodeGeometry = (o, s) => {
            r.createNodeGeometry(o, s);
          }, this.mesh.createTexture = (o, s) => {
            r.createTexture(o, s);
          }, this.mesh.deleteNodeGeometry = (o) => {
            r.deleteNodeGeometry(o);
          }, this.mesh.deleteTexture = (o) => {
            r.deleteTexture(o);
          }, this.mesh.onLoad.push((() => {
            r.onLoadCallback();
          })), this.mesh.onUpdate.push((() => {
            for (let o of r._onUpdate) o(this);
            for (let o of r._onProgress) o(this, this.mesh.availableNodes, this.mesh.nodesCount);
          })), this.traversal = new X(), this.cache = I, this.textures = {};
        }
        set onLoad(e) {
          this._onLoad.push(e);
        }
        set onUpdate(e) {
          this._onUpdate.push(e);
        }
        set onProgress(e) {
          this._onProgress.push(e);
        }
        updateMaterials() {
          this.material.map !== !1 && this.mesh.vertex.texCoord && (this.material.map = this.material_texture), this.mesh.vertex.color && (this.material.vertexColors = d.VertexColors), this.material.needsUpdate = !0;
        }
        onLoadCallback() {
          const e = this.mesh.sphere.center, r = new d.Vector3(e[0], e[1], e[2]), o = this.mesh.sphere.radius;
          this.boundingSphere = new d.Sphere(r, o);
          var s = new d.BufferGeometry();
          s.setAttribute("position", new d.BufferAttribute(new Float32Array(3), 3)), this.mesh.vertex.normal && s.setAttribute("normal", new d.BufferAttribute(new Float32Array(3), 3)), this.mesh.vertex.color && s.setAttribute("color", new d.BufferAttribute(new Float32Array(4), 4)), this.mesh.vertex.texCoord && s.setAttribute("uv", new d.BufferAttribute(new Float32Array(2), 2)), this.mesh.vertex.texCoord && (this.material_texture = new d.DataTexture(new Uint8Array([1, 1, 1]), 1, 1, d.RGBFormat), this.material_texture.needsUpdate = !0), this.updateMaterials(), this.geometry = s, this.frustumCulled = !1;
          for (let i of this._onLoad) i(this);
        }
        renderBufferDirect(e, r, o, s, i, a) {
          let u = new d.Vector2();
          e.getSize(u), this.modelViewMatrix.multiplyMatrices(o.matrixWorldInverse, this.matrixWorld), this.traversal.updateView([0, 0, u.width, u.height], o.projectionMatrix.elements, this.modelViewMatrix.elements), this.instance_errors = this.traversal.traverse(this.mesh, this.cache);
          let l = this.gl, h = l.getParameter(l.CURRENT_PROGRAM), c = this.attributes;
          c.position = l.getAttribLocation(h, "position"), c.normal = l.getAttribLocation(h, "normal"), c.color = l.getAttribLocation(h, "color"), c.uv = l.getAttribLocation(h, "uv"), c.size = l.getUniformLocation(h, "size"), c.scale = l.getUniformLocation(h, "scale");
          let x = l.getUniformLocation(h, "map");
          c.map = x ? l.getUniform(h, x) : null, this.setVisibility();
        }
        setVisibility() {
          let e = this.traversal, r = this.mesh;
          if (!r.isReady) return;
          let o = 0, s = this.attributes, i = this.mesh, a = this.gl, u = a instanceof WebGL2RenderingContext, l = s.uv + 10 * s.color + 100 * s.normal;
          for (let p = 0; p < r.nodesCount; p++) {
            if (!e.selected[p]) continue;
            {
              let v = !1;
              r.nfirstpatch[p + 1];
              for (var h = r.nfirstpatch[p]; h < r.nfirstpatch[p + 1]; ++h) {
                var c = r.patches[3 * h];
                if (!e.selected[c]) {
                  v = !0;
                  break;
                }
              }
              if (!v) continue;
            }
            var x = r.nspheres, E = 5 * p;
            if (!e.isVisible(x[E], x[E + 1], x[E + 2], x[E + 4])) continue;
            let B = !0;
            if (u && (l in this.vao[p] ? B = !1 : this.vao[p][l] = a.createVertexArray(), a.bindVertexArray(this.vao[p][l])), B) {
              a.bindBuffer(a.ARRAY_BUFFER, this.vbo[p]), a.bindBuffer(a.ELEMENT_ARRAY_BUFFER, this.ibo[p]), a.vertexAttribPointer(s.position, 3, a.FLOAT, !1, 12, 0), a.enableVertexAttribArray(s.position);
              let v = this.mesh.nvertices[p], f = 12 * v;
              if (i.vertex.texCoord && (s.uv >= 0 && (a.vertexAttribPointer(s.uv, 2, a.FLOAT, !1, 8, f), a.enableVertexAttribArray(s.uv)), f += 8 * v), i.vertex.color && (s.color >= 0 && (a.vertexAttribPointer(s.color, 4, a.UNSIGNED_BYTE, !0, 4, f), a.enableVertexAttribArray(s.color)), f += 4 * v), i.vertex.normal && s.normal >= 0 && (a.vertexAttribPointer(s.normal, 3, a.SHORT, !0, 6, f), a.enableVertexAttribArray(s.normal)), this.cache.debug.nodes) {
                a.disableVertexAttribArray(s.color);
                var U = this.instance_errors[p], g = [[1, 1, 1, 1], [1, 1, 1, 1], [0, 1, 0, 1], [0, 1, 1, 1], [1, 1, 0, 1], [1, 0, 1, 1], [1, 0, 0, 1]];
                let b = Math.min(5.99, Math.max(0, Math.log2(U) / 2)), G = Math.floor(b);
                b -= G;
                let H = [];
                for (let C = 0; C < 4; C++) H[C] = g[G][C] * (1 - b) + g[G + 1][C] * b;
                a.vertexAttrib4fv(s.color, H);
              }
            }
            this.cache.realError = Math.min(this.mesh.errors[p], this.cache.realError);
            let R = 0, q = 0, D = r.nfirstpatch[p + 1] - 1;
            for (let v = r.nfirstpatch[p]; v < r.nfirstpatch[p + 1]; ++v) {
              let f = r.patches[3 * v];
              if (e.selected[f] || (q = r.patches[3 * v + 1], !(v < D))) {
                if (q > R) {
                  if (r.vertex.texCoord && s.uv >= 0) {
                    var _ = r.patches[3 * v + 2];
                    if (_ != -1) {
                      var P = this.textures[_];
                      a.activeTexture(a.TEXTURE0 + s.map), a.bindTexture(a.TEXTURE_2D, P);
                    }
                  }
                  let b = this.material.wireframe ? a.LINE_STRIP : a.TRIANGLES;
                  a.drawElements(b, 3 * (q - R), a.UNSIGNED_SHORT, 6 * R), o += q - R;
                }
                R = r.patches[3 * v + 1];
              }
            }
          }
          this.cache.rendered += o;
        }
        createNodeGeometry(e, r) {
          let o = this.mesh;
          var s = o.nvertices[e];
          o.nfaces[e];
          let i = r.index, a = new ArrayBuffer(s * o.vsize);
          new Float32Array(a, 0, 3 * s).set(r.position);
          var u = 12 * s;
          if (o.vertex.texCoord && (new Float32Array(a, u, 2 * s).set(r.uv), u += 8 * s), o.vertex.color && (new Uint8Array(a, u, 4 * s).set(r.color), u += 4 * s), o.vertex.normal && (new Int16Array(a, u, 3 * s).set(r.normal), u += 6 * s), e < this.mesh.nroots) {
            let x = new d.BufferGeometry();
            x.setAttribute("position", new d.BufferAttribute(r.position, 3)), x.setAttribute("normal", new d.BufferAttribute(r.normal, 3)), x.setIndex(new d.BufferAttribute(r.index, 1)), this.basemesh = new d.Mesh(x, this.material), this.basemesh.visible = !1, this.add(this.basemesh);
          }
          var l = this.gl;
          this.vao[e] = {}, l.bindVertexArray(null);
          var h = this.vbo[e] = l.createBuffer();
          l.bindBuffer(l.ARRAY_BUFFER, h), l.bufferData(l.ARRAY_BUFFER, a, l.STATIC_DRAW);
          var c = this.ibo[e] = l.createBuffer();
          l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, c), l.bufferData(l.ELEMENT_ARRAY_BUFFER, i, l.STATIC_DRAW);
        }
        createTexture(e, r) {
          let o = this.gl;
          var s = o.getParameter(o.UNPACK_FLIP_Y_WEBGL);
          o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, !0);
          let i = this.textures[e] = o.createTexture();
          function a(u) {
            return u && (u & u - 1) == 0;
          }
          o.bindTexture(o.TEXTURE_2D, i), o.texImage2D(o.TEXTURE_2D, 0, o.RGB, o.RGB, o.UNSIGNED_BYTE, r), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_T, o.CLAMP_TO_EDGE), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_S, o.CLAMP_TO_EDGE), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MAG_FILTER, o.LINEAR), !(o instanceof WebGLRenderingContext) || a(r.width) && a(r.height) ? (o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MIN_FILTER, o.NEAREST_MIPMAP_LINEAR), o.generateMipmap(o.TEXTURE_2D)) : o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MIN_FILTER, o.LINEAR), o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, s);
        }
        deleteNodeGeometry(e) {
          if (this.gl.deleteBuffer(this.vbo[e]), this.gl.deleteBuffer(this.ibo[e]), this.vbo[e] = this.ibo[e] = null, this.vao[e]) for (const [r, o] of Object.entries(this.vao[e])) this.gl.deleteVertexArray(o);
          this.vao[e] = null;
        }
        deleteTexture(e) {
          this.textures[e] && (this.gl.deleteTexture(this.textures[e]), this.textures[e] = 0);
        }
        flush() {
          this.cache.flush(this.mesh);
        }
        dispose() {
          this.flush();
          for (let e of this.children) e.geometry.dispose();
        }
        toJSON(e) {
          throw "Can't";
        }
        patchWebGLRenderer(e) {
          if (e.nexusPatched) return;
          let r = e.renderBufferDirect;
          e.renderBufferDirect = (o, s, i, a, u, l) => {
            r(o, s, i, a, u, l), u.renderBufferDirect && u.renderBufferDirect(e, s, o, i, a, l);
          }, e.originalRender = e.render, e.render = (o, s) => {
            I.beginFrame(30), e.originalRender(o, s), I.endFrame();
          }, e.nexusPatched = !0;
        }
      }
      T.Cache = I, T.Nexus3D = $, Object.defineProperty(T, "__esModule", { value: !0 });
    }));
  })(L, L.exports)), L.exports;
}
var rt = et();
const st = /* @__PURE__ */ Z({
  __proto__: null
}, [rt]);
export {
  st as n
};
//# sourceMappingURL=nexus3D.min-D0vdWDTF.js.map
