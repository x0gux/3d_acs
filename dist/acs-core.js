import * as c from "three";
import { Controls as K, Vector3 as x, MOUSE as T, TOUCH as C, Quaternion as v, Spherical as L, Vector2 as E, Ray as X, Plane as Z, MathUtils as V, BufferGeometry as q, BufferAttribute as $ } from "three";
const G = { type: "change" }, R = { type: "start" }, F = { type: "end" }, S = new X(), j = new Z(), Q = Math.cos(70 * V.DEG2RAD), b = new x(), w = 2 * Math.PI, g = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, A = 1e-6;
class J extends K {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, e = null) {
    super(t, e), this.state = g.NONE, this.target = new x(), this.cursor = new x(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: T.ROTATE, MIDDLE: T.DOLLY, RIGHT: T.PAN }, this.touches = { ONE: C.ROTATE, TWO: C.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._cursorStyle = "auto", this._domElementKeyEvents = null, this._lastPosition = new x(), this._lastQuaternion = new v(), this._lastTargetPosition = new x(), this._quat = new v().setFromUnitVectors(t.up, new x(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new L(), this._sphericalDelta = new L(), this._scale = 1, this._panOffset = new x(), this._rotateStart = new E(), this._rotateEnd = new E(), this._rotateDelta = new E(), this._panStart = new E(), this._panEnd = new E(), this._panDelta = new E(), this._dollyStart = new E(), this._dollyEnd = new E(), this._dollyDelta = new E(), this._dollyDirection = new x(), this._mouse = new E(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = et.bind(this), this._onPointerDown = tt.bind(this), this._onPointerUp = it.bind(this), this._onContextMenu = lt.bind(this), this._onMouseWheel = nt.bind(this), this._onKeyDown = rt.bind(this), this._onTouchStart = at.bind(this), this._onTouchMove = ht.bind(this), this._onMouseDown = st.bind(this), this._onMouseMove = ot.bind(this), this._interceptControlDown = ct.bind(this), this._interceptControlUp = dt.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
  }
  /**
   * Defines the visual representation of the cursor.
   *
   * @type {('auto'|'grab')}
   * @default 'auto'
   */
  set cursorStyle(t) {
    this._cursorStyle = t, t === "grab" ? this.domElement.style.cursor = "grab" : this.domElement.style.cursor = "auto";
  }
  get cursorStyle() {
    return this._cursorStyle;
  }
  connect(t) {
    super.connect(t), this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.ownerDocument.addEventListener("keydown", this._interceptControlDown, { passive: !0, capture: !0 }), this.domElement.style.touchAction = "none";
  }
  disconnect() {
    this.state = g.NONE, this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.ownerDocument.removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { capture: !0 }), this._controlActive = !1, this._pointers.length = 0, this._pointerPositions = {}, this.domElement.style.touchAction = "", this.domElement.style.cursor = "auto";
  }
  dispose() {
    this.disconnect();
  }
  /**
   * Get the current vertical rotation, in radians.
   *
   * @return {number} The current vertical rotation, in radians.
   */
  getPolarAngle() {
    return this._spherical.phi;
  }
  /**
   * Get the current horizontal rotation, in radians.
   *
   * @return {number} The current horizontal rotation, in radians.
   */
  getAzimuthalAngle() {
    return this._spherical.theta;
  }
  /**
   * Returns the distance from the camera to the target.
   *
   * @return {number} The distance from the camera to the target.
   */
  getDistance() {
    return this.object.position.distanceTo(this.target);
  }
  /**
   * Adds key event listeners to the given DOM element.
   * `window` is a recommended argument for using this method.
   *
   * @param {HTMLElement} domElement - The DOM element
   */
  listenToKeyEvents(t) {
    t.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = t;
  }
  /**
   * Removes the key event listener previously defined with `listenToKeyEvents()`.
   */
  stopListenToKeyEvents() {
    this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
  }
  /**
   * Save the current state of the controls. This can later be recovered with `reset()`.
   */
  saveState() {
    this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
  }
  /**
   * Reset the controls to their state from either the last time the `saveState()`
   * was called, or the initial state.
   */
  reset() {
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(G), this.update(), this.state = g.NONE;
  }
  /**
   * Programmatically pan the camera.
   *
   * @param {number} deltaX - The horizontal pan amount in pixels.
   * @param {number} deltaY - The vertical pan amount in pixels.
   */
  pan(t, e) {
    this._pan(t, e), this.update();
  }
  /**
   * Programmatically dolly in (zoom in for perspective camera).
   *
   * @param {number} dollyScale - The dolly scale factor.
   */
  dollyIn(t) {
    this._dollyIn(t), this.update();
  }
  /**
   * Programmatically dolly out (zoom out for perspective camera).
   *
   * @param {number} dollyScale - The dolly scale factor.
   */
  dollyOut(t) {
    this._dollyOut(t), this.update();
  }
  /**
   * Programmatically rotate the camera left (around the vertical axis).
   *
   * @param {number} angle - The rotation angle in radians.
   */
  rotateLeft(t) {
    this._rotateLeft(t), this.update();
  }
  /**
   * Programmatically rotate the camera up (around the horizontal axis).
   *
   * @param {number} angle - The rotation angle in radians.
   */
  rotateUp(t) {
    this._rotateUp(t), this.update();
  }
  update(t = null) {
    const e = this.object.position;
    b.copy(e).sub(this.target), b.applyQuaternion(this._quat), this._spherical.setFromVector3(b), this.autoRotate && this.state === g.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let s = this.minAzimuthAngle, i = this.maxAzimuthAngle;
    isFinite(s) && isFinite(i) && (s < -Math.PI ? s += w : s > Math.PI && (s -= w), i < -Math.PI ? i += w : i > Math.PI && (i -= w), s <= i ? this._spherical.theta = Math.max(s, Math.min(i, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (s + i) / 2 ? Math.max(s, this._spherical.theta) : Math.min(i, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let a = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const l = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), a = l != this._spherical.radius;
    }
    if (b.setFromSpherical(this._spherical), b.applyQuaternion(this._quatInverse), e.copy(this.target).add(b), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let l = null;
      if (this.object.isPerspectiveCamera) {
        const h = b.length();
        l = this._clampDistance(h * this._scale);
        const d = h - l;
        this.object.position.addScaledVector(this._dollyDirection, d), this.object.updateMatrixWorld(), a = !!d;
      } else if (this.object.isOrthographicCamera) {
        const h = new x(this._mouse.x, this._mouse.y, 0);
        h.unproject(this.object);
        const d = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), a = d !== this.object.zoom;
        const r = new x(this._mouse.x, this._mouse.y, 0);
        r.unproject(this.object), this.object.position.sub(r).add(h), this.object.updateMatrixWorld(), l = b.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      l !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(l).add(this.object.position) : (S.origin.copy(this.object.position), S.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(S.direction)) < Q ? this.object.lookAt(this.target) : (j.setFromNormalAndCoplanarPoint(this.object.up, this.target), S.intersectPlane(j, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const l = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), l !== this.object.zoom && (this.object.updateProjectionMatrix(), a = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, a || this._lastPosition.distanceToSquared(this.object.position) > A || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > A || this._lastTargetPosition.distanceToSquared(this.target) > A ? (this.dispatchEvent(G), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? w / 60 * this.autoRotateSpeed * t : w / 60 / 60 * this.autoRotateSpeed;
  }
  _getZoomScale(t) {
    const e = Math.abs(t * 0.01);
    return Math.pow(0.95, this.zoomSpeed * e);
  }
  _rotateLeft(t) {
    this._sphericalDelta.theta -= t;
  }
  _rotateUp(t) {
    this._sphericalDelta.phi -= t;
  }
  _panLeft(t, e) {
    b.setFromMatrixColumn(e, 0), b.multiplyScalar(-t), this._panOffset.add(b);
  }
  _panUp(t, e) {
    this.screenSpacePanning === !0 ? b.setFromMatrixColumn(e, 1) : (b.setFromMatrixColumn(e, 0), b.crossVectors(this.object.up, b)), b.multiplyScalar(t), this._panOffset.add(b);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, e) {
    const s = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const i = this.object.position;
      b.copy(i).sub(this.target);
      let a = b.length();
      a *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * a / s.clientHeight, this.object.matrix), this._panUp(2 * e * a / s.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(t * (this.object.right - this.object.left) / this.object.zoom / s.clientWidth, this.object.matrix), this._panUp(e * (this.object.top - this.object.bottom) / this.object.zoom / s.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
  }
  _dollyOut(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _dollyIn(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _updateZoomParameters(t, e) {
    if (!this.zoomToCursor)
      return;
    this._performCursorZoom = !0;
    const s = this.domElement.getBoundingClientRect(), i = t - s.left, a = e - s.top, l = s.width, h = s.height;
    this._mouse.x = i / l * 2 - 1, this._mouse.y = -(a / h) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
  }
  _clampDistance(t) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, t));
  }
  //
  // event callbacks - update the object state
  //
  _handleMouseDownRotate(t) {
    this._rotateStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownDolly(t) {
    this._updateZoomParameters(t.clientX, t.clientY), this._dollyStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownPan(t) {
    this._panStart.set(t.clientX, t.clientY);
  }
  _handleMouseMoveRotate(t) {
    this._rotateEnd.set(t.clientX, t.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(w * this._rotateDelta.x / e.clientHeight), this._rotateUp(w * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
  }
  _handleMouseMoveDolly(t) {
    this._dollyEnd.set(t.clientX, t.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.zoomToCursor && (this._performCursorZoom = !0, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize()), this.update();
  }
  _handleMouseMovePan(t) {
    this._panEnd.set(t.clientX, t.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
  }
  _handleMouseWheel(t) {
    this._updateZoomParameters(t.clientX, t.clientY), t.deltaY < 0 ? this._dollyIn(this._getZoomScale(t.deltaY)) : t.deltaY > 0 && this._dollyOut(this._getZoomScale(t.deltaY)), this.update();
  }
  _handleKeyDown(t) {
    let e = !1;
    switch (t.code) {
      case this.keys.UP:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(w * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), e = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(-w * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), e = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(w * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), e = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(-w * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), e = !0;
        break;
    }
    e && (t.preventDefault(), this.update());
  }
  _handleTouchStartRotate(t) {
    if (this._pointers.length === 1)
      this._rotateStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), s = 0.5 * (t.pageX + e.x), i = 0.5 * (t.pageY + e.y);
      this._rotateStart.set(s, i);
    }
  }
  _handleTouchStartPan(t) {
    if (this._pointers.length === 1)
      this._panStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), s = 0.5 * (t.pageX + e.x), i = 0.5 * (t.pageY + e.y);
      this._panStart.set(s, i);
    }
  }
  _handleTouchStartDolly(t) {
    const e = this._getSecondPointerPosition(t), s = t.pageX - e.x, i = t.pageY - e.y, a = Math.sqrt(s * s + i * i);
    this._dollyStart.set(0, a);
  }
  _handleTouchStartDollyPan(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enablePan && this._handleTouchStartPan(t);
  }
  _handleTouchStartDollyRotate(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enableRotate && this._handleTouchStartRotate(t);
  }
  _handleTouchMoveRotate(t) {
    if (this._pointers.length == 1)
      this._rotateEnd.set(t.pageX, t.pageY);
    else {
      const s = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + s.x), a = 0.5 * (t.pageY + s.y);
      this._rotateEnd.set(i, a);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(w * this._rotateDelta.x / e.clientHeight), this._rotateUp(w * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(t) {
    if (this._pointers.length === 1)
      this._panEnd.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), s = 0.5 * (t.pageX + e.x), i = 0.5 * (t.pageY + e.y);
      this._panEnd.set(s, i);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(t) {
    const e = this._getSecondPointerPosition(t), s = t.pageX - e.x, i = t.pageY - e.y, a = Math.sqrt(s * s + i * i);
    this._dollyEnd.set(0, a), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
    const l = (t.pageX + e.x) * 0.5, h = (t.pageY + e.y) * 0.5;
    this._updateZoomParameters(l, h);
  }
  _handleTouchMoveDollyPan(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enablePan && this._handleTouchMovePan(t);
  }
  _handleTouchMoveDollyRotate(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enableRotate && this._handleTouchMoveRotate(t);
  }
  // pointers
  _addPointer(t) {
    this._pointers.push(t.pointerId);
  }
  _removePointer(t) {
    delete this._pointerPositions[t.pointerId];
    for (let e = 0; e < this._pointers.length; e++)
      if (this._pointers[e] == t.pointerId) {
        this._pointers.splice(e, 1);
        return;
      }
  }
  _isTrackingPointer(t) {
    for (let e = 0; e < this._pointers.length; e++)
      if (this._pointers[e] == t.pointerId) return !0;
    return !1;
  }
  _trackPointer(t) {
    let e = this._pointerPositions[t.pointerId];
    e === void 0 && (e = new E(), this._pointerPositions[t.pointerId] = e), e.set(t.pageX, t.pageY);
  }
  _getSecondPointerPosition(t) {
    const e = t.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[e];
  }
  //
  _customWheelEvent(t) {
    const e = t.deltaMode, s = {
      clientX: t.clientX,
      clientY: t.clientY,
      deltaY: t.deltaY
    };
    switch (e) {
      case 1:
        s.deltaY *= 16;
        break;
      case 2:
        s.deltaY *= 100;
        break;
    }
    return t.ctrlKey && !this._controlActive && (s.deltaY *= 10), s;
  }
}
function tt(o) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(o.pointerId), this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(o) && (this._addPointer(o), o.pointerType === "touch" ? this._onTouchStart(o) : this._onMouseDown(o), this._cursorStyle === "grab" && (this.domElement.style.cursor = "grabbing")));
}
function et(o) {
  this.enabled !== !1 && (o.pointerType === "touch" ? this._onTouchMove(o) : this._onMouseMove(o));
}
function it(o) {
  switch (this._removePointer(o), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(o.pointerId), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(F), this.state = g.NONE, this._cursorStyle === "grab" && (this.domElement.style.cursor = "grab");
      break;
    case 1:
      const t = this._pointers[0], e = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: e.x, pageY: e.y });
      break;
  }
}
function st(o) {
  let t;
  switch (o.button) {
    case 0:
      t = this.mouseButtons.LEFT;
      break;
    case 1:
      t = this.mouseButtons.MIDDLE;
      break;
    case 2:
      t = this.mouseButtons.RIGHT;
      break;
    default:
      t = -1;
  }
  switch (t) {
    case T.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(o), this.state = g.DOLLY;
      break;
    case T.ROTATE:
      if (o.ctrlKey || o.metaKey || o.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(o), this.state = g.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(o), this.state = g.ROTATE;
      }
      break;
    case T.PAN:
      if (o.ctrlKey || o.metaKey || o.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(o), this.state = g.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(o), this.state = g.PAN;
      }
      break;
    default:
      this.state = g.NONE;
  }
  this.state !== g.NONE && this.dispatchEvent(R);
}
function ot(o) {
  switch (this.state) {
    case g.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(o);
      break;
    case g.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(o);
      break;
    case g.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(o);
      break;
  }
}
function nt(o) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== g.NONE || (o.preventDefault(), this.dispatchEvent(R), this._handleMouseWheel(this._customWheelEvent(o)), this.dispatchEvent(F));
}
function rt(o) {
  this.enabled !== !1 && this._handleKeyDown(o);
}
function at(o) {
  switch (this._trackPointer(o), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case C.ROTATE:
          if (this.enableRotate === !1) {
            this.state = g.NONE;
            break;
          }
          this._handleTouchStartRotate(o), this.state = g.TOUCH_ROTATE;
          break;
        case C.PAN:
          if (this.enablePan === !1) {
            this.state = g.NONE;
            break;
          }
          this._handleTouchStartPan(o), this.state = g.TOUCH_PAN;
          break;
        default:
          this.state = g.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case C.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(o), this.state = g.TOUCH_DOLLY_PAN;
          break;
        case C.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(o), this.state = g.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = g.NONE;
      }
      break;
    default:
      this.state = g.NONE;
  }
  this.state !== g.NONE && this.dispatchEvent(R);
}
function ht(o) {
  switch (this._trackPointer(o), this.state) {
    case g.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(o), this.update();
      break;
    case g.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(o), this.update();
      break;
    case g.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(o), this.update();
      break;
    case g.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(o), this.update();
      break;
    default:
      this.state = g.NONE;
  }
}
function lt(o) {
  this.enabled !== !1 && o.preventDefault();
}
function ct(o) {
  o.key === "Control" && (this._controlActive = !0, this.domElement.ownerDocument.addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function dt(o) {
  o.key === "Control" && (this._controlActive = !1, this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function ut(o, t = !1) {
  const e = o[0].index !== null, s = new Set(Object.keys(o[0].attributes)), i = new Set(Object.keys(o[0].morphAttributes)), a = {}, l = {}, h = o[0].morphTargetsRelative, d = new q();
  d.morphTargetsRelative = h;
  let r = 0;
  for (let n = 0; n < o.length; ++n) {
    const u = o[n];
    let p = 0, f = 0;
    if (e !== (u.index !== null))
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."), null;
    for (const m in u.attributes) {
      if (!s.has(m))
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + '. All geometries must have compatible attributes; make sure "' + m + '" attribute exists among all geometries, or in none of them.'), null;
      a[m] === void 0 && (a[m] = []), a[m].push(u.attributes[m]), p++;
    }
    if (p !== s.size)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". Make sure all geometries have the same number of attributes."), null;
    if (h !== u.morphTargetsRelative)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". .morphTargetsRelative must be consistent throughout all geometries."), null;
    for (const m in u.morphAttributes) {
      if (!i.has(m))
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ".  .morphAttributes must be consistent throughout all geometries."), null;
      if (u.morphAttributes[m].length !== o[0].morphAttributes[m].length)
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + '. All geometries must have the same number of morph targets for the "' + m + '" morph attribute.'), null;
      l[m] === void 0 && (l[m] = []), l[m].push(u.morphAttributes[m]), f++;
    }
    if (f !== i.size)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". Make sure all geometries have the same number of morph attributes."), null;
    if (t) {
      let m;
      if (e)
        m = u.index.count;
      else if (u.attributes.position !== void 0)
        m = u.attributes.position.count;
      else
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". The geometry must have either an index or a position attribute"), null;
      d.addGroup(r, m, n), r += m;
    }
  }
  if (e) {
    let n = 0;
    const u = [];
    for (let p = 0; p < o.length; ++p) {
      const f = o[p].index;
      for (let m = 0; m < f.count; ++m)
        u.push(f.getX(m) + n);
      n += o[p].attributes.position.count;
    }
    d.setIndex(u);
  }
  for (const n in a) {
    const u = z(a[n]);
    if (!u)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + n + " attribute."), null;
    d.setAttribute(n, u);
  }
  for (const n in l) {
    const u = l[n][0].length;
    if (u !== 0) {
      d.morphAttributes = d.morphAttributes || {}, d.morphAttributes[n] = [];
      for (let p = 0; p < u; ++p) {
        const f = [];
        for (let _ = 0; _ < l[n].length; ++_)
          f.push(l[n][_][p]);
        const m = z(f);
        if (!m)
          return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + n + " morphAttribute."), null;
        d.morphAttributes[n].push(m);
      }
    }
  }
  return d;
}
function z(o) {
  let t, e, s, i = -1, a = 0;
  for (let r = 0; r < o.length; ++r) {
    const n = o[r];
    if (t === void 0 && (t = n.array.constructor), t !== n.array.constructor)
      return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."), null;
    if (e === void 0 && (e = n.itemSize), e !== n.itemSize)
      return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."), null;
    if (s === void 0 && (s = n.normalized), s !== n.normalized)
      return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."), null;
    if (i === -1 && (i = n.gpuType), i !== n.gpuType)
      return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."), null;
    a += n.count * e;
  }
  const l = new t(a), h = new $(l, e, s);
  let d = 0;
  for (let r = 0; r < o.length; ++r) {
    const n = o[r];
    if (n.isInterleavedBufferAttribute) {
      const u = d / e;
      for (let p = 0, f = n.count; p < f; p++)
        for (let m = 0; m < e; m++) {
          const _ = n.getComponent(p, m);
          h.setComponent(p + u, m, _);
        }
    } else
      l.set(n.array, d);
    d += n.count * e;
  }
  return i !== void 0 && (h.gpuType = i), h;
}
class mt {
  constructor(t) {
    this.walls = /* @__PURE__ */ new Map(), this.counter = 0, this.selectedId = null, this.scene = t;
  }
  /**
   * 월드 포인트 배열 → 3D 벽 메시 생성
   * points: 루프가 닫힌 순서의 바닥면 점들 (미터)
   */
  buildWall(t, e = { heightM: 3, thicknessM: 0.15 }, s = 9741240) {
    if (t.length < 3)
      throw new Error("벽 생성을 위해서는 최소 3개 이상의 점이 필요합니다.");
    const i = [];
    for (let r = 0; r < t.length; r++) {
      const n = t[r], u = t[(r + 1) % t.length], p = u.x - n.x, f = u.z - n.z, m = Math.hypot(p, f);
      if (m < 1e-4) continue;
      const _ = new c.BoxGeometry(
        e.thicknessM,
        e.heightM,
        m + e.thicknessM
      );
      _.rotateY(Math.atan2(p, f)), _.translate((n.x + u.x) / 2, e.heightM / 2, (n.z + u.z) / 2), i.push(_);
    }
    if (i.length === 0)
      throw new Error("유효한 벽 변이 없습니다.");
    const a = ut(i);
    if (i.forEach((r) => r.dispose()), !a)
      throw new Error("벽 지오메트리 병합에 실패했습니다.");
    const l = new c.MeshStandardMaterial({ color: s }), h = new c.Mesh(a, l);
    h.userData.wallId = `wall_${++this.counter}`, this.scene.add(h);
    const d = h.userData.wallId;
    return this.walls.set(d, h), d;
  }
  getWall(t) {
    return this.walls.get(t);
  }
  getWallCount() {
    return this.walls.size;
  }
  getWallIds() {
    return Array.from(this.walls.keys());
  }
  // ───────────────────────────────────────────────────────
  // 선택 / 하이라이트
  // ───────────────────────────────────────────────────────
  /** 벽 선택 (선택된 벽은 emissive로 하이라이트) */
  setSelected(t) {
    if (this.selectedId) {
      const e = this.walls.get(this.selectedId);
      e && e.material.emissive.setHex(0);
    }
    if (this.selectedId = t, t) {
      const e = this.walls.get(t);
      e && e.material.emissive.setHex(1920728);
    }
  }
  getSelected() {
    return this.selectedId;
  }
  /** 레이캐스트로 가장 가까운 벽 피킹 */
  raycastWalls(t) {
    let e = null;
    for (const [s, i] of this.walls) {
      const a = t.intersectObject(i);
      a.length > 0 && (!e || a[0].distance < e.dist) && (e = { wallId: s, mesh: i, dist: a[0].distance });
    }
    return e ? { wallId: e.wallId, mesh: e.mesh } : null;
  }
  // ───────────────────────────────────────────────────────
  // 삭제
  // ───────────────────────────────────────────────────────
  removeWall(t) {
    const e = this.walls.get(t);
    e && (this.selectedId === t && (this.selectedId = null), this.scene.remove(e), e.geometry.dispose(), Array.isArray(e.material) ? e.material.forEach((s) => s.dispose()) : e.material.dispose(), this.walls.delete(t));
  }
  clearAll() {
    const t = Array.from(this.walls.keys());
    for (const e of t)
      this.removeWall(e);
    this.selectedId = null;
  }
}
const U = {
  running: 2278750,
  // 녹색
  idle: 9741240,
  // 회색
  charging: 3900150,
  // 파랑
  error: 15680580
  // 빨강
};
class pt {
  constructor(t, e = 500) {
    this.robots = /* @__PURE__ */ new Map(), this.instanceIndex = /* @__PURE__ */ new Map(), this.dummy = new c.Object3D(), this.tmpMatrix = new c.Matrix4(), this.tmpColor = new c.Color(), this.count = 0, this.scene = t, this.maxCount = e;
    const s = new c.BoxGeometry(1.2, 0.6, 1.8), i = new c.MeshStandardMaterial({ roughness: 0.6 });
    this.mesh = new c.InstancedMesh(s, i, e), this.mesh.count = 0, this.mesh.instanceMatrix.setUsage(c.DynamicDrawUsage), this.mesh.frustumCulled = !1, this.mesh.name = "AcsRobots", t.add(this.mesh);
  }
  getMesh() {
    return this.mesh;
  }
  getRobotCount() {
    return this.robots.size;
  }
  /** 로봇 좌표 수신 (신규면 등록, 기존이면 목표 갱신) */
  updateRobotPose(t) {
    const e = U[t.status] ?? U.idle, s = t.theta !== void 0 && t.theta !== null;
    let i = this.robots.get(t.id);
    if (i)
      i.target = { x: t.x, z: t.y }, i.status = t.status, i.lastUpdate = Date.now(), i.hasTargetHeading = s, s && (i.targetHeading = -c.MathUtils.degToRad(t.theta));
    else {
      if (this.count >= this.maxCount) return;
      const a = this.count++;
      this.instanceIndex.set(t.id, a), this.mesh.count = this.count, i = {
        id: t.id,
        current: { x: t.x, z: t.y },
        target: { x: t.x, z: t.y },
        heading: s ? -c.MathUtils.degToRad(t.theta) : 0,
        targetHeading: s ? -c.MathUtils.degToRad(t.theta) : 0,
        hasTargetHeading: s,
        status: t.status,
        lastUpdate: Date.now()
      }, this.robots.set(t.id, i), this.dummy.position.set(i.current.x, 0.3, i.current.z), this.dummy.rotation.set(0, i.heading, 0), this.dummy.updateMatrix(), this.mesh.setMatrixAt(a, this.dummy.matrix);
    }
    this.tmpColor.setHex(e), this.mesh.setColorAt(this.instanceIndex.get(t.id), this.tmpColor), this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = !0);
  }
  removeRobot(t) {
    const e = this.instanceIndex.get(t);
    if (e === void 0) return;
    const s = this.count - 1;
    if (e !== s) {
      let i = null;
      for (const [a, l] of this.instanceIndex)
        if (l === s) {
          i = a;
          break;
        }
      i && (this.instanceIndex.set(i, e), this.mesh.getMatrixAt(s, this.tmpMatrix), this.mesh.setMatrixAt(e, this.tmpMatrix), this.mesh.instanceColor && (this.mesh.getColorAt(s, this.tmpColor), this.mesh.setColorAt(e, this.tmpColor)));
    }
    this.count--, this.mesh.count = this.count, this.instanceIndex.delete(t), this.robots.delete(t), this.mesh.instanceMatrix.needsUpdate = !0, this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = !0);
  }
  clearAll() {
    this.robots.clear(), this.instanceIndex.clear(), this.count = 0, this.mesh.count = 0, this.mesh.instanceMatrix.needsUpdate = !0;
  }
  /** instanceId → robotId (클릭 피킹용) */
  getRobotIdByInstance(t) {
    for (const [e, s] of this.instanceIndex)
      if (s === t) return e;
    return null;
  }
  /** 매 프레임 호출: Lerp 보간 + 인스턴스 행렬 갱신 */
  update(t) {
    if (this.robots.size === 0) return;
    const e = Math.min(1, t * 3), s = Math.min(1, t * 5);
    for (const i of this.robots.values()) {
      const a = i.target.x - i.current.x, l = i.target.z - i.current.z;
      i.current.x += a * e, i.current.z += l * e, i.hasTargetHeading || Math.hypot(a, l) > 0.05 && (i.targetHeading = Math.atan2(a, l));
      let h = i.targetHeading - i.heading;
      for (; h > Math.PI; ) h -= Math.PI * 2;
      for (; h < -Math.PI; ) h += Math.PI * 2;
      i.heading += h * s;
      const d = this.instanceIndex.get(i.id);
      this.dummy.position.set(i.current.x, 0.3, i.current.z), this.dummy.rotation.set(0, i.heading, 0), this.dummy.updateMatrix(), this.mesh.setMatrixAt(d, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = !0;
  }
  /** 60초 이상 갱신 없는 로봇 제거 */
  sweepStale(t = 6e4) {
    const e = Date.now();
    for (const [s, i] of this.robots)
      e - i.lastUpdate >= t && this.removeRobot(s);
  }
  dispose() {
    this.scene.remove(this.mesh), this.mesh.geometry.dispose(), this.mesh.material.dispose(), this.robots.clear(), this.instanceIndex.clear();
  }
}
const D = {
  charge: 16096779,
  // 충전노드 — 앰버
  rack: 9133302,
  // 랙 — 바이올렛
  container: 16347926,
  // 컨테이너 — 오렌지
  function: 3718648,
  // 기능노드 — 하늘색
  parking: 3003583,
  // 대기노드 (Axbis nodeType 2, idleParking) — 틸
  normal: 2282478
  // 일반 — 시안
}, H = 2450411, W = 6583435;
function Y(o) {
  if (o.kind) return o.kind;
  const t = o.nodeId.toUpperCase();
  return t.startsWith("RACK") ? "rack" : /^T\d+$/.test(t) ? "charge" : "normal";
}
function ft(o, t) {
  const e = document.createElement("canvas"), s = 10, i = "bold 44px ui-monospace, SFMono-Regular, monospace", a = e.getContext("2d");
  a.font = i;
  const l = Math.ceil(a.measureText(o).width);
  e.width = l + s * 2, e.height = 60;
  const h = e.getContext("2d");
  h.font = i, h.fillStyle = "rgba(2, 6, 23, 0.78)", h.fillRect(0, 0, e.width, e.height), h.fillStyle = t, h.textBaseline = "middle", h.fillText(o, s, e.height / 2 + 2);
  const d = new c.CanvasTexture(e);
  d.colorSpace = c.SRGBColorSpace;
  const r = new c.Sprite(
    new c.SpriteMaterial({ map: d, transparent: !0, depthTest: !1 })
  ), n = 0.5;
  return r.scale.set(n * e.width / e.height, n, 1), r.renderOrder = 10, r.raycast = () => {
  }, r;
}
class gt {
  constructor(t) {
    this.group = new c.Group(), this.nodeMesh = null, this.nodeIds = [], this.nodeKindColors = [], this.nodePositions = /* @__PURE__ */ new Map(), this.lineColors = null, this.lineColorAttr = null, this.edgeVertex = /* @__PURE__ */ new Map(), this.highlightedNodes = /* @__PURE__ */ new Set(), this.highlightedEdges = /* @__PURE__ */ new Set(), this.options = {
      unit: "mm",
      flipZ: !1,
      showLabels: !0,
      nodeSize: 0.4
    }, this.scene = t, this.group.name = "AcsMapGraph", t.add(this.group);
  }
  /** 맵 그래프 로드 (기존 그래프는 교체) */
  load(t, e) {
    var h, d;
    this.clear(), e && (this.options = { ...this.options, ...e });
    const s = this.options.unit === "m" ? 1 : 1e-3, i = this.options.flipZ ? -1 : 1, a = [];
    for (const r of t.nodes ?? []) {
      const n = Number((h = r.nodePosition) == null ? void 0 : h.x), u = Number((d = r.nodePosition) == null ? void 0 : d.y);
      if (isNaN(n) || isNaN(u)) continue;
      const p = n * s, f = i * u * s;
      a.push({ node: r, x: p, z: f }), this.nodePositions.set(r.nodeId, { x: p, z: f });
    }
    if (a.length > 0) {
      const r = this.options.nodeSize, n = new c.CylinderGeometry(r, r, 0.06, 24), u = new c.MeshBasicMaterial();
      this.nodeMesh = new c.InstancedMesh(n, u, a.length), this.nodeMesh.frustumCulled = !1, this.nodeMesh.name = "AcsGraphNodes";
      const p = new c.Object3D();
      a.forEach((f, m) => {
        this.nodeIds.push(f.node.nodeId);
        const _ = new c.Color(
          D[Y(f.node)] ?? D.normal
        );
        this.nodeKindColors.push(_), p.position.set(f.x, 0.04, f.z), p.scale.setScalar(1), p.updateMatrix(), this.nodeMesh.setMatrixAt(m, p.matrix), this.nodeMesh.setColorAt(m, _);
      }), this.nodeMesh.instanceColor && (this.nodeMesh.instanceColor.needsUpdate = !0), this.group.add(this.nodeMesh);
    }
    if (this.options.showLabels)
      for (const r of a) {
        const n = new c.Color(
          D[Y(r.node)] ?? D.normal
        ), u = ft(r.node.nodeId, `#${n.getHexString()}`);
        u.position.set(r.x, 0.55, r.z), this.group.add(u);
      }
    const l = (t.edges ?? []).filter(
      (r) => this.nodePositions.has(r.startNodeId) && this.nodePositions.has(r.endNodeId)
    );
    if (l.length > 0) {
      const r = new Float32Array(l.length * 2 * 3), n = new Float32Array(l.length * 2 * 3), u = new c.Color(W);
      l.forEach((m, _) => {
        const y = this.nodePositions.get(m.startNodeId), M = this.nodePositions.get(m.endNodeId);
        r.set([y.x, 0.05, y.z, M.x, 0.05, M.z], _ * 6), n.set([u.r, u.g, u.b, u.r, u.g, u.b], _ * 6);
        const P = m.edgeId ?? `${m.startNodeId}-${m.endNodeId}`;
        this.edgeVertex.set(P, _ * 2);
      });
      const p = new c.BufferGeometry();
      p.setAttribute("position", new c.BufferAttribute(r, 3)), this.lineColorAttr = new c.BufferAttribute(n, 3), p.setAttribute("color", this.lineColorAttr);
      const f = new c.LineSegments(
        p,
        new c.LineBasicMaterial({ vertexColors: !0 })
      );
      f.frustumCulled = !1, this.group.add(f);
    }
  }
  // ───────────────────────────────────────────────────────
  // 피킹
  // ───────────────────────────────────────────────────────
  /** 레이캐스트 → 클릭된 노드 ID */
  raycastNode(t) {
    var i;
    if (!this.nodeMesh) return null;
    const s = (i = t.intersectObject(this.nodeMesh)[0]) == null ? void 0 : i.instanceId;
    return s === void 0 || s >= this.nodeIds.length ? null : this.nodeIds[s] ?? null;
  }
  // ───────────────────────────────────────────────────────
  // 하이라이트 (경로 표시용)
  // ───────────────────────────────────────────────────────
  /** 노드 하이라이트 (기존 하이라이트 대체) */
  highlightNodes(t) {
    this.highlightedNodes = new Set(t), this.refreshNodeInstances();
  }
  /** 엣지 하이라이트 (기존 하이라이트 대체). key: edgeId 또는 "start-end" */
  highlightEdges(t) {
    this.highlightedEdges = new Set(t), this.refreshEdgeColors();
  }
  clearHighlights() {
    this.highlightedNodes.clear(), this.highlightedEdges.clear(), this.refreshNodeInstances(), this.refreshEdgeColors();
  }
  refreshNodeInstances() {
    if (!this.nodeMesh) return;
    const t = new c.Object3D(), e = new c.Color(H);
    this.nodeIds.forEach((s, i) => {
      const a = this.nodePositions.get(s), l = this.highlightedNodes.has(s);
      t.position.set(a.x, 0.04, a.z), t.scale.setScalar(l ? 1.6 : 1), t.updateMatrix(), this.nodeMesh.setMatrixAt(i, t.matrix), this.nodeMesh.setColorAt(i, l ? e : this.nodeKindColors[i]);
    }), this.nodeMesh.instanceMatrix.needsUpdate = !0, this.nodeMesh.instanceColor && (this.nodeMesh.instanceColor.needsUpdate = !0);
  }
  refreshEdgeColors() {
    if (!this.lineColors || !this.lineColorAttr) return;
    const t = new c.Color(W), e = new c.Color(H);
    for (const [, s] of this.edgeVertex) {
      const i = this.highlightedEdges.has(
        this.edgeKeyAt(s)
      ) ? e : t;
      for (const a of [s, s + 1])
        this.lineColors[a * 3] = i.r, this.lineColors[a * 3 + 1] = i.g, this.lineColors[a * 3 + 2] = i.b;
    }
    this.lineColorAttr.needsUpdate = !0;
  }
  /** 정점 오프셋 → 엣지 키 역 조회 */
  edgeKeyAt(t) {
    for (const [e, s] of this.edgeVertex)
      if (s === t) return e;
    return "";
  }
  // ───────────────────────────────────────────────────────
  // 표시/통계/정리
  // ───────────────────────────────────────────────────────
  setVisible(t) {
    this.group.visible = t;
  }
  isVisible() {
    return this.group.visible;
  }
  getNodeCount() {
    return this.nodeIds.length;
  }
  getEdgeCount() {
    return this.edgeVertex.size;
  }
  clear() {
    for (const t of [...this.group.children])
      this.group.remove(t), this.disposeChild(t);
    this.nodeMesh = null, this.nodeIds = [], this.nodeKindColors = [], this.nodePositions.clear(), this.lineColors = null, this.lineColorAttr = null, this.edgeVertex.clear(), this.highlightedNodes.clear(), this.highlightedEdges.clear();
  }
  disposeChild(t) {
    var s;
    const e = t;
    if ((s = e.geometry) == null || s.dispose(), Array.isArray(e.material))
      e.material.forEach((i) => i.dispose());
    else if (e.material) {
      const i = e.material.map;
      i == null || i.dispose(), e.material.dispose();
    }
  }
  dispose() {
    this.clear(), this.scene.remove(this.group);
  }
}
class Pt {
  constructor(t, e = {}) {
    this.raycaster = new c.Raycaster(), this.clock = new c.Clock(), this.calibration = null, this.mapPlane = null, this.wallDrawing = !1, this.wallMarkers = new c.Group(), this.markerGeo = new c.SphereGeometry(0.15, 12, 12), this.markerMat = new c.MeshBasicMaterial({ color: 2282478 }), this.previewPositions = new Float32Array(512 * 3), this.previewGeo = new c.BufferGeometry(), this.downX = 0, this.downY = 0, this.handlePointerDown = (d) => {
      this.downX = d.clientX, this.downY = d.clientY;
    }, this.handlePointerUp = (d) => {
      var f, m, _, y, M;
      if (Math.hypot(d.clientX - this.downX, d.clientY - this.downY) > 5) return;
      if (this.wallDrawing) {
        const P = this.raycastFloor(d.clientX, d.clientY);
        P && this.addWallPointWorld(P.x, P.z);
        return;
      }
      if (!this.setRaycasterFromScreen(d.clientX, d.clientY)) return;
      const n = (f = this.raycaster.intersectObject(this.robotManager.getMesh())[0]) == null ? void 0 : f.instanceId;
      if (n !== void 0) {
        const P = this.robotManager.getRobotIdByInstance(n);
        if (P) {
          (m = this.onRobotClickCb) == null || m.call(this, P);
          return;
        }
      }
      const u = this.mapGraph.raycastNode(this.raycaster);
      if (u) {
        (_ = this.onNodeClickCb) == null || _.call(this, u);
        return;
      }
      const p = this.wallBuilder.raycastWalls(this.raycaster);
      p ? (this.wallBuilder.setSelected(p.wallId), (y = this.onWallSelectedCb) == null || y.call(this, p.wallId)) : (this.wallBuilder.setSelected(null), (M = this.onWallSelectedCb) == null || M.call(this, null));
    }, this.animate = () => {
      requestAnimationFrame(() => this.animate());
      const d = this.clock.getDelta();
      this.robotManager.update(d), this.controls.update(), this.renderer.render(this.scene, this.camera);
    }, this.pendingPoints = [], this.container = t;
    const s = e.width ?? (t.clientWidth || 800), i = e.height ?? (t.clientHeight || 600);
    this.scene = new c.Scene(), this.scene.background = new c.Color(e.backgroundColor ?? 725280), this.scene.fog = new c.Fog(
      725280,
      e.fogNear ?? 80,
      e.fogFar ?? 300
    ), this.camera = new c.PerspectiveCamera(50, s / i, 0.1, 500), this.camera.position.set(30, 28, 30), this.renderer = new c.WebGLRenderer({ antialias: !0 }), this.renderer.setSize(s, i), this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)), this.container.appendChild(this.renderer.domElement), this.controls = new J(this.camera, this.renderer.domElement), this.controls.enableDamping = !0, this.controls.dampingFactor = 0.05, this.controls.target.set(0, 0, 0);
    const a = new c.GridHelper(100, 50, 3359061, 1120295);
    this.scene.add(a);
    const l = new c.Mesh(
      new c.PlaneGeometry(120, 120),
      new c.MeshStandardMaterial({ color: 988970, roughness: 1 })
    );
    l.rotation.x = -Math.PI / 2, l.position.y = -0.01, this.scene.add(l), this.scene.add(new c.AmbientLight(16777215, 0.5));
    const h = new c.DirectionalLight(16777215, 1.2);
    h.position.set(30, 40, 20), this.scene.add(h), this.scene.add(this.wallMarkers), this.previewGeo.setAttribute(
      "position",
      new c.BufferAttribute(this.previewPositions, 3)
    ), this.previewGeo.setDrawRange(0, 0), this.previewLine = new c.Line(
      this.previewGeo,
      new c.LineBasicMaterial({ color: 2282478 })
    ), this.scene.add(this.previewLine), this.wallBuilder = new mt(this.scene), this.robotManager = new pt(this.scene), this.mapGraph = new gt(this.scene), this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown), this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp), this.handleResize = this.handleResize.bind(this), window.addEventListener("resize", this.handleResize), this.animate();
  }
  handleResize() {
    const t = this.container.clientWidth || 800, e = this.container.clientHeight || 600;
    this.camera.aspect = t / e, this.camera.updateProjectionMatrix(), this.renderer.setSize(t, e);
  }
  /** 화면 좌표로 레이캐스터 설정 */
  setRaycasterFromScreen(t, e) {
    const s = this.renderer.domElement.getBoundingClientRect();
    if (s.width === 0 || s.height === 0) return !1;
    const i = new c.Vector2(
      (t - s.left) / s.width * 2 - 1,
      -((e - s.top) / s.height) * 2 + 1
    );
    return this.raycaster.setFromCamera(i, this.camera), !0;
  }
  /** 화면 클릭 좌표 → 바닥면(Y=0) 교차점 (월드 좌표) */
  raycastFloor(t, e) {
    if (!this.setRaycasterFromScreen(t, e)) return null;
    const s = new c.Plane(new c.Vector3(0, 1, 0), 0), i = new c.Vector3();
    return this.raycaster.ray.intersectPlane(s, i) ? { x: i.x, z: i.z } : null;
  }
  // ───────────────────────────────────────────────────────
  // 맵 이미지
  // ───────────────────────────────────────────────────────
  /** 맵 이미지 캘리브레이션 (바닥 텍스처 평면 크기 결정) */
  setMapCalibration(t) {
    this.calibration = t;
  }
  /**
   * 맵 이미지를 3D 바닥에 텍스처로 깔기
   * @param src 이미지 URL, HTMLImageElement, 또는 오프스크린 캔버스(PGM 변환 결과)
   * @param meta resolution/origin 메타데이터 (ROS YAML 규약)
   *             - resolutionMPerPx가 있으면: 평면 크기 = px × 해상도
   *             - origin이 있으면: 이미지 좌하단을 해당 월드 좌표에 배치 (이미지 위쪽 = +Z 북쪽)
   *             - 없으면: 맵 중심이 원점에 오도록 배치
   */
  loadMapImage(t, e) {
    const s = (i) => {
      var m, _, y, M, P, I, k, N;
      if (i.colorSpace = c.SRGBColorSpace, i.flipY = !1, this.mapPlane) {
        this.scene.remove(this.mapPlane), this.mapPlane.geometry.dispose();
        const O = this.mapPlane.material;
        (m = O.map) == null || m.dispose(), O.dispose();
      }
      const a = (e == null ? void 0 : e.widthPx) ?? ((_ = this.calibration) == null ? void 0 : _.imageWidthPx) ?? 1024, l = (e == null ? void 0 : e.heightPx) ?? ((y = this.calibration) == null ? void 0 : y.imageHeightPx) ?? 1024, h = (e == null ? void 0 : e.resolutionMPerPx) ?? ((M = this.calibration) == null ? void 0 : M.resolutionMPerPx), d = h != null ? a * h : ((P = this.calibration) == null ? void 0 : P.realWidthM) ?? 50, r = h != null ? l * h : ((I = this.calibration) == null ? void 0 : I.realHeightM) ?? 28;
      let n, u;
      (e == null ? void 0 : e.originX) !== void 0 || (e == null ? void 0 : e.originY) !== void 0 ? (n = e.originX ?? 0, u = e.originY ?? 0) : ((k = this.calibration) == null ? void 0 : k.originX) !== void 0 || ((N = this.calibration) == null ? void 0 : N.originY) !== void 0 ? (n = this.calibration.originX ?? 0, u = this.calibration.originY ?? 0) : (n = -d / 2, u = -r / 2), this.calibration = {
        imageWidthPx: a,
        imageHeightPx: l,
        realWidthM: d,
        realHeightM: r,
        originX: n,
        originY: u,
        resolutionMPerPx: h ?? void 0
      };
      const p = new c.PlaneGeometry(d, r), f = new c.MeshStandardMaterial({ map: i, roughness: 1 });
      this.mapPlane = new c.Mesh(p, f), this.mapPlane.rotation.x = -Math.PI / 2, this.mapPlane.position.set(n + d / 2, 0.01, u + r / 2), this.scene.add(this.mapPlane);
    };
    if (typeof t == "string")
      new c.TextureLoader().load(t, s);
    else {
      const i = t instanceof HTMLCanvasElement ? new c.CanvasTexture(t) : new c.Texture(t);
      i.needsUpdate = !0, s(i);
    }
  }
  // ───────────────────────────────────────────────────────
  // 벽 그리기
  // ───────────────────────────────────────────────────────
  startWallDrawing() {
    this.wallDrawing = !0, this.clearWallPoints();
  }
  stopWallDrawing() {
    this.wallDrawing = !1;
  }
  isWallDrawing() {
    return this.wallDrawing;
  }
  /** 월드 좌표로 벽 점 직접 추가 */
  addWallPointWorld(t, e) {
    var a;
    if (!this.wallDrawing || this.wallPointsCount() >= 512) return;
    const s = new c.Mesh(this.markerGeo, this.markerMat);
    s.position.set(t, 0.05, e), this.wallMarkers.add(s);
    const i = this.wallPointsCount() + 1;
    this.previewPositions[(i - 1) * 3] = t, this.previewPositions[(i - 1) * 3 + 1] = 0.05, this.previewPositions[(i - 1) * 3 + 2] = e, this.previewGeo.setDrawRange(0, i), this.previewGeo.getAttribute("position").needsUpdate = !0, this.pendingPoints.push({ x: t, z: e }), (a = this.onWallPointAddedCb) == null || a.call(this, { x: t, z: e });
  }
  wallPointsCount() {
    return this.pendingPoints.length;
  }
  /** 현재 찍은 점들 초기화 (벽은 유지) */
  clearWallPoints() {
    for (this.pendingPoints = []; this.wallMarkers.children.length > 0; )
      this.wallMarkers.remove(this.wallMarkers.children[0]);
    this.previewGeo.setDrawRange(0, 0);
  }
  /** 현재 그린 폴리라인 루프를 닫아 3D 월 생성 */
  closeWallLoop(t) {
    var i;
    if (this.pendingPoints.length < 3)
      throw new Error("벽 생성을 위해서는 최소 3개 이상의 점이 필요합니다.");
    const e = this.wallBuilder.buildWall(
      this.pendingPoints,
      t ?? { heightM: 3, thicknessM: 0.15 }
    ), s = this.wallBuilder.getWall(e);
    return this.clearWallPoints(), (i = this.onWallCreatedCb) == null || i.call(this, e, s), e;
  }
  /** 클릭으로 선택된 벽 삭제 */
  removeSelectedWall() {
    const t = this.wallBuilder.getSelected();
    t && this.wallBuilder.removeWall(t);
  }
  /** 생성된 모든 3D 월 삭제 */
  clearWalls() {
    this.wallBuilder.clearAll();
  }
  getWallCount() {
    return this.wallBuilder.getWallCount();
  }
  // ───────────────────────────────────────────────────────
  // 로봇
  // ───────────────────────────────────────────────────────
  /** 로봇 좌표 수신 (신규 등록 또는 목표 갱신, 렌더는 Lerp 보간) */
  updateRobotPose(t) {
    this.robotManager.updateRobotPose(t);
  }
  removeRobot(t) {
    this.robotManager.removeRobot(t);
  }
  clearRobots() {
    this.robotManager.clearAll();
  }
  getRobotCount() {
    return this.robotManager.getRobotCount();
  }
  // ───────────────────────────────────────────────────────
  // 맵 그래프 (노드/엣지)
  // ───────────────────────────────────────────────────────
  /** 맵 그래프 로드 (데모룸 /api/maps/{mapId} 규격 JSON과 호환) */
  loadMapGraph(t, e) {
    this.mapGraph.load(t, e);
  }
  /** REST API에서 맵 그래프 조회 후 로드 (예: ${API_BASE}/api/maps/{mapId}) */
  async loadMapGraphFromUrl(t, e) {
    const s = await fetch(t);
    if (!s.ok) throw new Error(`맵 그래프 조회 실패: ${s.status}`);
    const i = await s.json();
    this.loadMapGraph(i, e);
  }
  clearMapGraph() {
    this.mapGraph.clear();
  }
  setGraphVisible(t) {
    this.mapGraph.setVisible(t);
  }
  /** 경로상 노드 하이라이트 (로봇 계획 경로 표시용) */
  highlightGraphNodes(t) {
    this.mapGraph.highlightNodes(t);
  }
  /** 경로상 엣지 하이라이트. key: edgeId 또는 "startNodeId-endNodeId" */
  highlightGraphEdges(t) {
    this.mapGraph.highlightEdges(t);
  }
  clearGraphHighlights() {
    this.mapGraph.clearHighlights();
  }
  getGraphNodeCount() {
    return this.mapGraph.getNodeCount();
  }
  getGraphEdgeCount() {
    return this.mapGraph.getEdgeCount();
  }
  // ───────────────────────────────────────────────────────
  // 카메라 프리셋
  // ───────────────────────────────────────────────────────
  /** 정상단(top-down) 뷰 — 외곽선 그리기/맵 확인에 유용 (중심·높이 지정 가능) */
  setTopView(t = 0, e = 0, s = 60) {
    this.camera.position.set(t, s, e + 1e-3), this.controls.target.set(t, 0, e), this.camera.lookAt(t, 0, e), this.controls.update();
  }
  // ───────────────────────────────────────────────────────
  // 이벤트 / 기타
  // ───────────────────────────────────────────────────────
  onWallCreated(t) {
    this.onWallCreatedCb = t;
  }
  onWallPointAdded(t) {
    this.onWallPointAddedCb = t;
  }
  /** 벽 클릭 선택/해제 (null = 해제) */
  onWallSelected(t) {
    this.onWallSelectedCb = t;
  }
  /** 로봇 클릭 */
  onRobotClick(t) {
    this.onRobotClickCb = t;
  }
  /** 맵 그래프 노드 클릭 */
  onNodeClick(t) {
    this.onNodeClickCb = t;
  }
  dispose() {
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown), this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp), window.removeEventListener("resize", this.handleResize), this.controls.dispose(), this.renderer.dispose(), this.wallBuilder.clearAll(), this.robotManager.dispose(), this.mapGraph.dispose();
  }
  getThreeScene() {
    return this.scene;
  }
  getThreeRenderer() {
    return this.renderer;
  }
  getThreeCamera() {
    return this.camera;
  }
}
class Et {
  constructor() {
    this.scaleX = 1, this.scaleY = 1, this.originX = 0, this.originY = 0;
  }
  setCalibration(t) {
    this.cal = t, this.originX = t.originX ?? 0, this.originY = t.originY ?? 0, this.scaleX = t.realWidthM / t.imageWidthPx, this.scaleY = t.realHeightM / t.imageHeightPx;
  }
  /** 픽셀 하나 → 월드 (x, z) */
  toWorld(t, e) {
    const s = this.cal.imageWidthPx / 2, i = this.cal.imageHeightPx / 2, a = (t - s) * this.scaleX + this.originX, l = -(e - i) * this.scaleY + this.originY;
    return { x: a, z: l };
  }
  /** 점 배열 → 월드 (x, z) 배열 */
  toWorldPoints(t) {
    return t.map((e) => this.toWorld(e.x, e.y));
  }
}
const B = (o) => o === 32 || o === 9 || o === 10 || o === 13;
function _t(o) {
  const t = new Uint8Array(o);
  let e = 0;
  const s = () => {
    for (; ; ) {
      for (; e < t.length && B(t[e]); ) e++;
      if (e < t.length && t[e] === 35) {
        for (; e < t.length && t[e] !== 10; ) e++;
        continue;
      }
      break;
    }
    let n = "";
    for (; e < t.length && !B(t[e]); )
      n += String.fromCharCode(t[e++]);
    return n;
  }, i = s();
  if (i !== "P5" && i !== "P2")
    throw new Error(
      `지원하지 않는 PGM 형식입니다: ${i} (P5 바이너리 / P2 ASCII만 지원)`
    );
  const a = parseInt(s(), 10), l = parseInt(s(), 10), h = parseInt(s(), 10);
  if (!a || !l || !Number.isFinite(h) || h <= 0)
    throw new Error("PGM 헤더가 올바르지 않습니다.");
  const d = a * l, r = new Uint8Array(d);
  if (i === "P5")
    if (e++, h < 256)
      for (let n = 0; n < d; n++)
        r[n] = Math.round(t[e + n] * 255 / h);
    else
      for (let n = 0; n < d; n++) {
        const u = t[e + n * 2] << 8 | t[e + n * 2 + 1];
        r[n] = Math.round(u * 255 / h);
      }
  else
    for (let n = 0; n < d; n++) {
      const u = parseInt(s(), 10);
      r[n] = Math.round((Number.isNaN(u) ? 0 : u) * 255 / h);
    }
  return { width: a, height: l, gray: r };
}
function bt(o) {
  const t = {};
  for (const e of o.split(/\r?\n/)) {
    const s = (e.split("#")[0] ?? "").trim();
    if (!s || s.startsWith("%")) continue;
    const i = s.indexOf(":");
    if (i < 0) continue;
    const a = s.slice(0, i).trim(), l = s.slice(i + 1).trim();
    switch (a) {
      case "image":
        t.image = l.replace(/["']/g, "");
        break;
      case "resolution": {
        const h = parseFloat(l);
        Number.isFinite(h) && (t.resolutionMPerPx = h);
        break;
      }
      case "origin": {
        const h = l.replace(/[\[\]]/g, "").split(",").map((d) => parseFloat(d.trim()));
        h.length >= 2 && Number.isFinite(h[0]) && Number.isFinite(h[1]) && (t.originX = h[0], t.originY = h[1]);
        break;
      }
      case "negate":
        t.negate = parseInt(l, 10) === 1;
        break;
      case "occupied_thresh": {
        const h = parseFloat(l);
        Number.isFinite(h) && (t.occupiedThresh = h);
        break;
      }
      case "free_thresh": {
        const h = parseFloat(l);
        Number.isFinite(h) && (t.freeThresh = h);
        break;
      }
    }
  }
  return t;
}
function wt(o, t = {}) {
  const { width: e, height: s, gray: i } = o, a = t.negate ?? !1, l = t.occupiedThresh ?? 0.65, h = t.freeThresh ?? 0.196, d = document.createElement("canvas");
  d.width = e, d.height = s;
  const r = d.getContext("2d"), n = r.createImageData(e, s), u = n.data;
  for (let p = 0; p < e * s; p++) {
    const f = i[p], m = (a ? f : 255 - f) / 255;
    let _, y, M;
    m > l ? (_ = 30, y = 41, M = 59) : m < h ? (_ = 226, y = 232, M = 240) : (_ = 11, y = 17, M = 32), u[p * 4] = _, u[p * 4 + 1] = y, u[p * 4 + 2] = M, u[p * 4 + 3] = 255;
  }
  return r.putImageData(n, 0, 0), d;
}
function yt(o) {
  var d;
  const t = o, e = (d = t.floorList) == null ? void 0 : d[0];
  if (!e)
    throw new Error(
      "floorList가 없는 맵 JSON입니다. (Axbis 비즈니스 맵 규격 확인)"
    );
  const s = (e.nodeList ?? []).map((r) => ({
    nodeId: String(r.nodeLabel ?? r.nodeUuid ?? r.nodeNumber ?? ""),
    nodePosition: {
      x: Number(r.xCoordinate ?? 0),
      y: Number(r.yCoordinate ?? 0)
    },
    kind: r.nodeType === 2 ? "parking" : "normal"
  })), i = new Set(s.map((r) => r.nodeId)), a = (e.edgeList ?? []).map((r) => ({
    edgeId: r.edgeLabel != null ? String(r.edgeLabel) : void 0,
    startNodeId: String(r.beginNodeLabel ?? ""),
    endNodeId: String(r.endNodeLabel ?? "")
  })).filter((r) => i.has(r.startNodeId) && i.has(r.endNodeId)), l = {
    mapId: t.mapCode ?? e.floorNumber,
    mapName: e.floorName || e.floorNumber,
    nodes: s,
    edges: a
  }, h = {
    name: e.floorName || e.floorNumber || "-",
    lengthM: e.floorLength ?? 0,
    widthM: e.floorWidth ?? 0,
    version: e.floorMapVersion ?? "-"
  };
  return { graph: l, floorInfo: h };
}
async function xt(o) {
  const t = o.find((r) => /\.pgm$/i.test(r.name)), e = o.find((r) => /\.(yaml|yml)$/i.test(r.name));
  let s;
  for (const r of o)
    if (/\.json$/i.test(r.name))
      try {
        const n = JSON.parse(await r.text());
        if (n && Array.isArray(n.floorList)) {
          s = r;
          break;
        }
      } catch {
      }
  if (!t)
    throw new Error("PGM 지도 파일(.pgm)을 찾을 수 없습니다.");
  const i = _t(await t.arrayBuffer());
  let a = { widthPx: i.width, heightPx: i.height };
  e ? a = {
    ...bt(await e.text()),
    widthPx: i.width,
    heightPx: i.height
  } : a.resolutionMPerPx = 0.05;
  const l = wt(i, a);
  let h = { nodes: [], edges: [] }, d = null;
  if (s) {
    const r = yt(
      JSON.parse(await s.text())
    );
    h = r.graph, d = r.floorInfo;
  }
  return { canvas: l, meta: a, graph: h, floorInfo: d };
}
export {
  Pt as AcsViewer,
  gt as MapGraphRenderer,
  Et as MapTransform,
  D as NODE_KIND_COLOR,
  pt as RobotManager,
  U as STATUS_COLOR,
  mt as WallBuilder,
  yt as convertAxbisBusinessMap,
  xt as loadAxbisMapFromFiles,
  bt as parseMapYaml,
  _t as parsePGM,
  wt as pgmToCanvas
};
