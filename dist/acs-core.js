import * as r from "three";
import { Controls as B, Vector3 as x, MOUSE as S, TOUCH as D, Quaternion as L, Spherical as v, Vector2 as E, Ray as K, Plane as X, MathUtils as Z } from "three";
const j = { type: "change" }, R = { type: "start" }, H = { type: "end" }, T = new K(), z = new X(), V = Math.cos(70 * Z.DEG2RAD), w = new x(), P = 2 * Math.PI, m = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, A = 1e-6;
class q extends B {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, e = null) {
    super(t, e), this.state = m.NONE, this.target = new x(), this.cursor = new x(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: S.ROTATE, MIDDLE: S.DOLLY, RIGHT: S.PAN }, this.touches = { ONE: D.ROTATE, TWO: D.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._cursorStyle = "auto", this._domElementKeyEvents = null, this._lastPosition = new x(), this._lastQuaternion = new L(), this._lastTargetPosition = new x(), this._quat = new L().setFromUnitVectors(t.up, new x(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new v(), this._sphericalDelta = new v(), this._scale = 1, this._panOffset = new x(), this._rotateStart = new E(), this._rotateEnd = new E(), this._rotateDelta = new E(), this._panStart = new E(), this._panEnd = new E(), this._panDelta = new E(), this._dollyStart = new E(), this._dollyEnd = new E(), this._dollyDelta = new E(), this._dollyDirection = new x(), this._mouse = new E(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = Q.bind(this), this._onPointerDown = $.bind(this), this._onPointerUp = J.bind(this), this._onContextMenu = at.bind(this), this._onMouseWheel = st.bind(this), this._onKeyDown = it.bind(this), this._onTouchStart = ot.bind(this), this._onTouchMove = nt.bind(this), this._onMouseDown = tt.bind(this), this._onMouseMove = et.bind(this), this._interceptControlDown = rt.bind(this), this._interceptControlUp = ht.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
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
    this.state = m.NONE, this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.ownerDocument.removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { capture: !0 }), this._controlActive = !1, this._pointers.length = 0, this._pointerPositions = {}, this.domElement.style.touchAction = "", this.domElement.style.cursor = "auto";
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
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(j), this.update(), this.state = m.NONE;
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
    w.copy(e).sub(this.target), w.applyQuaternion(this._quat), this._spherical.setFromVector3(w), this.autoRotate && this.state === m.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let i = this.minAzimuthAngle, s = this.maxAzimuthAngle;
    isFinite(i) && isFinite(s) && (i < -Math.PI ? i += P : i > Math.PI && (i -= P), s < -Math.PI ? s += P : s > Math.PI && (s -= P), i <= s ? this._spherical.theta = Math.max(i, Math.min(s, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (i + s) / 2 ? Math.max(i, this._spherical.theta) : Math.min(s, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let n = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const l = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), n = l != this._spherical.radius;
    }
    if (w.setFromSpherical(this._spherical), w.applyQuaternion(this._quatInverse), e.copy(this.target).add(w), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let l = null;
      if (this.object.isPerspectiveCamera) {
        const h = w.length();
        l = this._clampDistance(h * this._scale);
        const d = h - l;
        this.object.position.addScaledVector(this._dollyDirection, d), this.object.updateMatrixWorld(), n = !!d;
      } else if (this.object.isOrthographicCamera) {
        const h = new x(this._mouse.x, this._mouse.y, 0);
        h.unproject(this.object);
        const d = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), n = d !== this.object.zoom;
        const a = new x(this._mouse.x, this._mouse.y, 0);
        a.unproject(this.object), this.object.position.sub(a).add(h), this.object.updateMatrixWorld(), l = w.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      l !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(l).add(this.object.position) : (T.origin.copy(this.object.position), T.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(T.direction)) < V ? this.object.lookAt(this.target) : (z.setFromNormalAndCoplanarPoint(this.object.up, this.target), T.intersectPlane(z, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const l = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), l !== this.object.zoom && (this.object.updateProjectionMatrix(), n = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, n || this._lastPosition.distanceToSquared(this.object.position) > A || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > A || this._lastTargetPosition.distanceToSquared(this.target) > A ? (this.dispatchEvent(j), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? P / 60 * this.autoRotateSpeed * t : P / 60 / 60 * this.autoRotateSpeed;
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
    w.setFromMatrixColumn(e, 0), w.multiplyScalar(-t), this._panOffset.add(w);
  }
  _panUp(t, e) {
    this.screenSpacePanning === !0 ? w.setFromMatrixColumn(e, 1) : (w.setFromMatrixColumn(e, 0), w.crossVectors(this.object.up, w)), w.multiplyScalar(t), this._panOffset.add(w);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, e) {
    const i = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const s = this.object.position;
      w.copy(s).sub(this.target);
      let n = w.length();
      n *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * n / i.clientHeight, this.object.matrix), this._panUp(2 * e * n / i.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(t * (this.object.right - this.object.left) / this.object.zoom / i.clientWidth, this.object.matrix), this._panUp(e * (this.object.top - this.object.bottom) / this.object.zoom / i.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
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
    const i = this.domElement.getBoundingClientRect(), s = t - i.left, n = e - i.top, l = i.width, h = i.height;
    this._mouse.x = s / l * 2 - 1, this._mouse.y = -(n / h) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
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
    this._rotateLeft(P * this._rotateDelta.x / e.clientHeight), this._rotateUp(P * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
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
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(P * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), e = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(-P * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), e = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(P * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), e = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(-P * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), e = !0;
        break;
    }
    e && (t.preventDefault(), this.update());
  }
  _handleTouchStartRotate(t) {
    if (this._pointers.length === 1)
      this._rotateStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + e.x), s = 0.5 * (t.pageY + e.y);
      this._rotateStart.set(i, s);
    }
  }
  _handleTouchStartPan(t) {
    if (this._pointers.length === 1)
      this._panStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + e.x), s = 0.5 * (t.pageY + e.y);
      this._panStart.set(i, s);
    }
  }
  _handleTouchStartDolly(t) {
    const e = this._getSecondPointerPosition(t), i = t.pageX - e.x, s = t.pageY - e.y, n = Math.sqrt(i * i + s * s);
    this._dollyStart.set(0, n);
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
      const i = this._getSecondPointerPosition(t), s = 0.5 * (t.pageX + i.x), n = 0.5 * (t.pageY + i.y);
      this._rotateEnd.set(s, n);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(P * this._rotateDelta.x / e.clientHeight), this._rotateUp(P * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(t) {
    if (this._pointers.length === 1)
      this._panEnd.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + e.x), s = 0.5 * (t.pageY + e.y);
      this._panEnd.set(i, s);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(t) {
    const e = this._getSecondPointerPosition(t), i = t.pageX - e.x, s = t.pageY - e.y, n = Math.sqrt(i * i + s * s);
    this._dollyEnd.set(0, n), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
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
    const e = t.deltaMode, i = {
      clientX: t.clientX,
      clientY: t.clientY,
      deltaY: t.deltaY
    };
    switch (e) {
      case 1:
        i.deltaY *= 16;
        break;
      case 2:
        i.deltaY *= 100;
        break;
    }
    return t.ctrlKey && !this._controlActive && (i.deltaY *= 10), i;
  }
}
function $(o) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(o.pointerId), this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(o) && (this._addPointer(o), o.pointerType === "touch" ? this._onTouchStart(o) : this._onMouseDown(o), this._cursorStyle === "grab" && (this.domElement.style.cursor = "grabbing")));
}
function Q(o) {
  this.enabled !== !1 && (o.pointerType === "touch" ? this._onTouchMove(o) : this._onMouseMove(o));
}
function J(o) {
  switch (this._removePointer(o), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(o.pointerId), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(H), this.state = m.NONE, this._cursorStyle === "grab" && (this.domElement.style.cursor = "grab");
      break;
    case 1:
      const t = this._pointers[0], e = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: e.x, pageY: e.y });
      break;
  }
}
function tt(o) {
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
    case S.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(o), this.state = m.DOLLY;
      break;
    case S.ROTATE:
      if (o.ctrlKey || o.metaKey || o.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(o), this.state = m.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(o), this.state = m.ROTATE;
      }
      break;
    case S.PAN:
      if (o.ctrlKey || o.metaKey || o.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(o), this.state = m.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(o), this.state = m.PAN;
      }
      break;
    default:
      this.state = m.NONE;
  }
  this.state !== m.NONE && this.dispatchEvent(R);
}
function et(o) {
  switch (this.state) {
    case m.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(o);
      break;
    case m.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(o);
      break;
    case m.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(o);
      break;
  }
}
function st(o) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== m.NONE || (o.preventDefault(), this.dispatchEvent(R), this._handleMouseWheel(this._customWheelEvent(o)), this.dispatchEvent(H));
}
function it(o) {
  this.enabled !== !1 && this._handleKeyDown(o);
}
function ot(o) {
  switch (this._trackPointer(o), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case D.ROTATE:
          if (this.enableRotate === !1) {
            this.state = m.NONE;
            break;
          }
          this._handleTouchStartRotate(o), this.state = m.TOUCH_ROTATE;
          break;
        case D.PAN:
          if (this.enablePan === !1) {
            this.state = m.NONE;
            break;
          }
          this._handleTouchStartPan(o), this.state = m.TOUCH_PAN;
          break;
        default:
          this.state = m.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case D.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(o), this.state = m.TOUCH_DOLLY_PAN;
          break;
        case D.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(o), this.state = m.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = m.NONE;
      }
      break;
    default:
      this.state = m.NONE;
  }
  this.state !== m.NONE && this.dispatchEvent(R);
}
function nt(o) {
  switch (this._trackPointer(o), this.state) {
    case m.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(o), this.update();
      break;
    case m.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(o), this.update();
      break;
    case m.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(o), this.update();
      break;
    case m.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(o), this.update();
      break;
    default:
      this.state = m.NONE;
  }
}
function at(o) {
  this.enabled !== !1 && o.preventDefault();
}
function rt(o) {
  o.key === "Control" && (this._controlActive = !0, this.domElement.ownerDocument.addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function ht(o) {
  o.key === "Control" && (this._controlActive = !1, this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
const lt = {
  enabled: !0,
  minOpacity: 0.15,
  fadeStart: 0.45,
  fadeEnd: 0.85,
  fadeSpeed: 8
};
class ct {
  constructor(t, e) {
    this.walls = /* @__PURE__ */ new Map(), this.counter = 0, this.selectedId = null, this._v = new r.Vector3(), this.scene = t, this.fade = { ...lt, ...e };
  }
  /**
   * 월드 포인트 배열 → 3D 벽 메시 생성 (변 단위 메시들의 Group)
   * points: 루프가 닫힌 순서의 바닥면 점들 (미터)
   */
  buildWall(t, e = { heightM: 3, thicknessM: 0.15 }, i = 9741240) {
    if (t.length < 3)
      throw new Error("벽 생성을 위해서는 최소 3개 이상의 점이 필요합니다.");
    let s = 0;
    for (let a = 0; a < t.length; a++) {
      const c = t[a], u = t[(a + 1) % t.length];
      s += c.x * u.z - u.x * c.z;
    }
    const n = s > 0, l = new r.Group(), h = [];
    for (let a = 0; a < t.length; a++) {
      const c = t[a], u = t[(a + 1) % t.length], p = u.x - c.x, f = u.z - c.z, g = Math.hypot(p, f);
      if (g < 1e-4) continue;
      const _ = new r.BoxGeometry(
        e.thicknessM,
        e.heightM,
        g + e.thicknessM
      );
      _.rotateY(Math.atan2(p, f)), _.translate((c.x + u.x) / 2, e.heightM / 2, (c.z + u.z) / 2);
      const b = new r.MeshStandardMaterial({
        color: i,
        transparent: !0
      }), y = new r.Mesh(_, b);
      let M, C;
      n ? (M = -f / g, C = p / g) : (M = f / g, C = -p / g), h.push({
        mesh: y,
        midpoint: new r.Vector3(
          (c.x + u.x) / 2,
          e.heightM / 2,
          (c.z + u.z) / 2
        ),
        outward: new r.Vector3(-M, 0, -C),
        opacity: 1
      }), l.add(y);
    }
    if (h.length === 0)
      throw this.disposeGroup(l), new Error("유효한 벽 변이 없습니다.");
    this.scene.add(l);
    const d = `wall_${++this.counter}`;
    return l.userData.wallId = d, this.walls.set(d, { group: l, segments: h }), d;
  }
  // ───────────────────────────────────────────────────────
  // 뷰 의존적 페이드 (카메라에 가려지는 앞벽 자동 반투명)
  // ───────────────────────────────────────────────────────
  /**
   * 프레임마다 호출. 카메라 위치와 각 세그먼트의 바깥 법선 코사인(s)으로
   * 목표 opacity를 정하고, fadeSpeed 기반 지수 보간으로 부드럽게 전환한다.
   */
  updateViewDependentOpacity(t, e) {
    if (!this.fade.enabled || this.walls.size === 0) return;
    const { minOpacity: i, fadeStart: s, fadeEnd: n, fadeSpeed: l } = this.fade, h = Math.max(n - s, 1e-3), d = 1 - Math.exp(-l * Math.min(e, 0.1)), a = t.position;
    for (const c of this.walls.values())
      for (const u of c.segments) {
        this._v.subVectors(a, u.midpoint);
        const p = this._v.length();
        if (p < 1e-6) continue;
        this._v.multiplyScalar(1 / p);
        const f = this._v.dot(u.outward), g = Math.min(Math.max((f - s) / h, 0), 1), b = 1 - g * g * (3 - 2 * g) * (1 - i);
        u.opacity += (b - u.opacity) * d, u.mesh.material.opacity = u.opacity;
      }
  }
  setFadeEnabled(t) {
    this.fade.enabled = t, t || this.resetOpacities();
  }
  isFadeEnabled() {
    return this.fade.enabled;
  }
  setFadeOptions(t) {
    const e = this.fade.enabled;
    this.fade = { ...this.fade, ...t }, e && !this.fade.enabled && this.resetOpacities();
  }
  getFadeOptions() {
    return this.fade;
  }
  /** 페이드 비활성화 시 모든 세그먼트를 불투명으로 복원 */
  resetOpacities() {
    for (const t of this.walls.values())
      for (const e of t.segments)
        e.opacity = 1, e.mesh.material.opacity = 1;
  }
  // ───────────────────────────────────────────────────────
  // 조회
  // ───────────────────────────────────────────────────────
  getWall(t) {
    var e;
    return (e = this.walls.get(t)) == null ? void 0 : e.group;
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
  /** 벽 선택 (선택된 벽의 모든 세그먼트를 emissive로 하이라이트) */
  setSelected(t) {
    if (this.selectedId) {
      const e = this.walls.get(this.selectedId);
      e && this.setEmissive(e, 0);
    }
    if (this.selectedId = t, t) {
      const e = this.walls.get(t);
      e && this.setEmissive(e, 1920728);
    }
  }
  setEmissive(t, e) {
    for (const i of t.segments)
      i.mesh.material.emissive.setHex(e);
  }
  getSelected() {
    return this.selectedId;
  }
  /** 레이캐스트로 가장 가까운 벽 피킹 */
  raycastWalls(t) {
    let e = null;
    for (const [i, s] of this.walls) {
      const n = t.intersectObject(s.group, !0);
      n.length > 0 && (!e || n[0].distance < e.dist) && (e = {
        wallId: i,
        mesh: n[0].object,
        dist: n[0].distance
      });
    }
    return e ? { wallId: e.wallId, mesh: e.mesh } : null;
  }
  // ───────────────────────────────────────────────────────
  // 삭제
  // ───────────────────────────────────────────────────────
  removeWall(t) {
    const e = this.walls.get(t);
    e && (this.selectedId === t && (this.selectedId = null), this.scene.remove(e.group), this.disposeGroup(e.group), this.walls.delete(t));
  }
  disposeGroup(t) {
    var e;
    for (const i of t.children) {
      const s = i;
      (e = s.geometry) == null || e.dispose();
      const n = s.material;
      Array.isArray(n) ? n.forEach((l) => l.dispose()) : n == null || n.dispose();
    }
    t.clear();
  }
  clearAll() {
    const t = Array.from(this.walls.keys());
    for (const e of t)
      this.removeWall(e);
    this.selectedId = null;
  }
}
const W = {
  running: 2278750,
  // 녹색
  idle: 9741240,
  // 회색
  charging: 3900150,
  // 파랑
  error: 15680580
  // 빨강
};
class dt {
  constructor(t, e = 500) {
    this.robots = /* @__PURE__ */ new Map(), this.instanceIndex = /* @__PURE__ */ new Map(), this.dummy = new r.Object3D(), this.tmpMatrix = new r.Matrix4(), this.tmpColor = new r.Color(), this.count = 0, this.scene = t, this.maxCount = e;
    const i = new r.BoxGeometry(1.2, 0.6, 1.8), s = new r.MeshStandardMaterial({ roughness: 0.6 });
    this.mesh = new r.InstancedMesh(i, s, e), this.mesh.count = 0, this.mesh.instanceMatrix.setUsage(r.DynamicDrawUsage), this.mesh.frustumCulled = !1, this.mesh.name = "AcsRobots", t.add(this.mesh);
  }
  getMesh() {
    return this.mesh;
  }
  getRobotCount() {
    return this.robots.size;
  }
  /** 로봇 좌표 수신 (신규면 등록, 기존이면 목표 갱신) */
  updateRobotPose(t) {
    const e = W[t.status] ?? W.idle, i = t.theta !== void 0 && t.theta !== null;
    let s = this.robots.get(t.id);
    if (s)
      s.target = { x: t.x, z: t.y }, s.status = t.status, s.lastUpdate = Date.now(), s.hasTargetHeading = i, i && (s.targetHeading = -r.MathUtils.degToRad(t.theta));
    else {
      if (this.count >= this.maxCount) return;
      const n = this.count++;
      this.instanceIndex.set(t.id, n), this.mesh.count = this.count, s = {
        id: t.id,
        current: { x: t.x, z: t.y },
        target: { x: t.x, z: t.y },
        heading: i ? -r.MathUtils.degToRad(t.theta) : 0,
        targetHeading: i ? -r.MathUtils.degToRad(t.theta) : 0,
        hasTargetHeading: i,
        status: t.status,
        lastUpdate: Date.now()
      }, this.robots.set(t.id, s), this.dummy.position.set(s.current.x, 0.3, s.current.z), this.dummy.rotation.set(0, s.heading, 0), this.dummy.updateMatrix(), this.mesh.setMatrixAt(n, this.dummy.matrix);
    }
    this.tmpColor.setHex(e), this.mesh.setColorAt(this.instanceIndex.get(t.id), this.tmpColor), this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = !0);
  }
  removeRobot(t) {
    const e = this.instanceIndex.get(t);
    if (e === void 0) return;
    const i = this.count - 1;
    if (e !== i) {
      let s = null;
      for (const [n, l] of this.instanceIndex)
        if (l === i) {
          s = n;
          break;
        }
      s && (this.instanceIndex.set(s, e), this.mesh.getMatrixAt(i, this.tmpMatrix), this.mesh.setMatrixAt(e, this.tmpMatrix), this.mesh.instanceColor && (this.mesh.getColorAt(i, this.tmpColor), this.mesh.setColorAt(e, this.tmpColor)));
    }
    this.count--, this.mesh.count = this.count, this.instanceIndex.delete(t), this.robots.delete(t), this.mesh.instanceMatrix.needsUpdate = !0, this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = !0);
  }
  clearAll() {
    this.robots.clear(), this.instanceIndex.clear(), this.count = 0, this.mesh.count = 0, this.mesh.instanceMatrix.needsUpdate = !0;
  }
  /** instanceId → robotId (클릭 피킹용) */
  getRobotIdByInstance(t) {
    for (const [e, i] of this.instanceIndex)
      if (i === t) return e;
    return null;
  }
  /** 매 프레임 호출: Lerp 보간 + 인스턴스 행렬 갱신 */
  update(t) {
    if (this.robots.size === 0) return;
    const e = Math.min(1, t * 3), i = Math.min(1, t * 5);
    for (const s of this.robots.values()) {
      const n = s.target.x - s.current.x, l = s.target.z - s.current.z;
      s.current.x += n * e, s.current.z += l * e, s.hasTargetHeading || Math.hypot(n, l) > 0.05 && (s.targetHeading = Math.atan2(n, l));
      let h = s.targetHeading - s.heading;
      for (; h > Math.PI; ) h -= Math.PI * 2;
      for (; h < -Math.PI; ) h += Math.PI * 2;
      s.heading += h * i;
      const d = this.instanceIndex.get(s.id);
      this.dummy.position.set(s.current.x, 0.3, s.current.z), this.dummy.rotation.set(0, s.heading, 0), this.dummy.updateMatrix(), this.mesh.setMatrixAt(d, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = !0;
  }
  /** 60초 이상 갱신 없는 로봇 제거 */
  sweepStale(t = 6e4) {
    const e = Date.now();
    for (const [i, s] of this.robots)
      e - s.lastUpdate >= t && this.removeRobot(i);
  }
  dispose() {
    this.scene.remove(this.mesh), this.mesh.geometry.dispose(), this.mesh.material.dispose(), this.robots.clear(), this.instanceIndex.clear();
  }
}
const I = {
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
}, U = 2450411, Y = 6583435;
function G(o) {
  if (o.kind) return o.kind;
  const t = o.nodeId.toUpperCase();
  return t.startsWith("RACK") ? "rack" : /^T\d+$/.test(t) ? "charge" : "normal";
}
function ut(o, t) {
  const e = document.createElement("canvas"), i = 10, s = "bold 44px ui-monospace, SFMono-Regular, monospace", n = e.getContext("2d");
  n.font = s;
  const l = Math.ceil(n.measureText(o).width);
  e.width = l + i * 2, e.height = 60;
  const h = e.getContext("2d");
  h.font = s, h.fillStyle = "rgba(2, 6, 23, 0.78)", h.fillRect(0, 0, e.width, e.height), h.fillStyle = t, h.textBaseline = "middle", h.fillText(o, i, e.height / 2 + 2);
  const d = new r.CanvasTexture(e);
  d.colorSpace = r.SRGBColorSpace;
  const a = new r.Sprite(
    new r.SpriteMaterial({ map: d, transparent: !0, depthTest: !1 })
  ), c = 0.5;
  return a.scale.set(c * e.width / e.height, c, 1), a.renderOrder = 10, a.raycast = () => {
  }, a;
}
class pt {
  constructor(t) {
    this.group = new r.Group(), this.nodeMesh = null, this.nodeIds = [], this.nodeKindColors = [], this.nodePositions = /* @__PURE__ */ new Map(), this.lineColors = null, this.lineColorAttr = null, this.edgeVertex = /* @__PURE__ */ new Map(), this.highlightedNodes = /* @__PURE__ */ new Set(), this.highlightedEdges = /* @__PURE__ */ new Set(), this.options = {
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
    const i = this.options.unit === "m" ? 1 : 1e-3, s = this.options.flipZ ? -1 : 1, n = [];
    for (const a of t.nodes ?? []) {
      const c = Number((h = a.nodePosition) == null ? void 0 : h.x), u = Number((d = a.nodePosition) == null ? void 0 : d.y);
      if (isNaN(c) || isNaN(u)) continue;
      const p = c * i, f = s * u * i;
      n.push({ node: a, x: p, z: f }), this.nodePositions.set(a.nodeId, { x: p, z: f });
    }
    if (n.length > 0) {
      const a = this.options.nodeSize, c = new r.CylinderGeometry(a, a, 0.06, 24), u = new r.MeshBasicMaterial();
      this.nodeMesh = new r.InstancedMesh(c, u, n.length), this.nodeMesh.frustumCulled = !1, this.nodeMesh.name = "AcsGraphNodes";
      const p = new r.Object3D();
      n.forEach((f, g) => {
        this.nodeIds.push(f.node.nodeId);
        const _ = new r.Color(
          I[G(f.node)] ?? I.normal
        );
        this.nodeKindColors.push(_), p.position.set(f.x, 0.04, f.z), p.scale.setScalar(1), p.updateMatrix(), this.nodeMesh.setMatrixAt(g, p.matrix), this.nodeMesh.setColorAt(g, _);
      }), this.nodeMesh.instanceColor && (this.nodeMesh.instanceColor.needsUpdate = !0), this.group.add(this.nodeMesh);
    }
    if (this.options.showLabels)
      for (const a of n) {
        const c = new r.Color(
          I[G(a.node)] ?? I.normal
        ), u = ut(a.node.nodeId, `#${c.getHexString()}`);
        u.position.set(a.x, 0.55, a.z), this.group.add(u);
      }
    const l = (t.edges ?? []).filter(
      (a) => this.nodePositions.has(a.startNodeId) && this.nodePositions.has(a.endNodeId)
    );
    if (l.length > 0) {
      const a = new Float32Array(l.length * 2 * 3), c = new Float32Array(l.length * 2 * 3), u = new r.Color(Y);
      l.forEach((g, _) => {
        const b = this.nodePositions.get(g.startNodeId), y = this.nodePositions.get(g.endNodeId);
        a.set([b.x, 0.05, b.z, y.x, 0.05, y.z], _ * 6), c.set([u.r, u.g, u.b, u.r, u.g, u.b], _ * 6);
        const M = g.edgeId ?? `${g.startNodeId}-${g.endNodeId}`;
        this.edgeVertex.set(M, _ * 2);
      });
      const p = new r.BufferGeometry();
      p.setAttribute("position", new r.BufferAttribute(a, 3)), this.lineColorAttr = new r.BufferAttribute(c, 3), p.setAttribute("color", this.lineColorAttr);
      const f = new r.LineSegments(
        p,
        new r.LineBasicMaterial({ vertexColors: !0 })
      );
      f.frustumCulled = !1, this.group.add(f);
    }
  }
  // ───────────────────────────────────────────────────────
  // 피킹
  // ───────────────────────────────────────────────────────
  /** 레이캐스트 → 클릭된 노드 ID */
  raycastNode(t) {
    var s;
    if (!this.nodeMesh) return null;
    const i = (s = t.intersectObject(this.nodeMesh)[0]) == null ? void 0 : s.instanceId;
    return i === void 0 || i >= this.nodeIds.length ? null : this.nodeIds[i] ?? null;
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
    const t = new r.Object3D(), e = new r.Color(U);
    this.nodeIds.forEach((i, s) => {
      const n = this.nodePositions.get(i), l = this.highlightedNodes.has(i);
      t.position.set(n.x, 0.04, n.z), t.scale.setScalar(l ? 1.6 : 1), t.updateMatrix(), this.nodeMesh.setMatrixAt(s, t.matrix), this.nodeMesh.setColorAt(s, l ? e : this.nodeKindColors[s]);
    }), this.nodeMesh.instanceMatrix.needsUpdate = !0, this.nodeMesh.instanceColor && (this.nodeMesh.instanceColor.needsUpdate = !0);
  }
  refreshEdgeColors() {
    if (!this.lineColors || !this.lineColorAttr) return;
    const t = new r.Color(Y), e = new r.Color(U);
    for (const [, i] of this.edgeVertex) {
      const s = this.highlightedEdges.has(
        this.edgeKeyAt(i)
      ) ? e : t;
      for (const n of [i, i + 1])
        this.lineColors[n * 3] = s.r, this.lineColors[n * 3 + 1] = s.g, this.lineColors[n * 3 + 2] = s.b;
    }
    this.lineColorAttr.needsUpdate = !0;
  }
  /** 정점 오프셋 → 엣지 키 역 조회 */
  edgeKeyAt(t) {
    for (const [e, i] of this.edgeVertex)
      if (i === t) return e;
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
    var i;
    const e = t;
    if ((i = e.geometry) == null || i.dispose(), Array.isArray(e.material))
      e.material.forEach((s) => s.dispose());
    else if (e.material) {
      const s = e.material.map;
      s == null || s.dispose(), e.material.dispose();
    }
  }
  dispose() {
    this.clear(), this.scene.remove(this.group);
  }
}
class bt {
  constructor(t, e = {}) {
    this.raycaster = new r.Raycaster(), this.clock = new r.Clock(), this.calibration = null, this.mapPlane = null, this.wallDrawing = !1, this.wallMarkers = new r.Group(), this.markerGeo = new r.SphereGeometry(0.15, 12, 12), this.markerMat = new r.MeshBasicMaterial({ color: 2282478 }), this.previewPositions = new Float32Array(512 * 3), this.previewGeo = new r.BufferGeometry(), this.downX = 0, this.downY = 0, this.handlePointerDown = (d) => {
      this.downX = d.clientX, this.downY = d.clientY;
    }, this.handlePointerUp = (d) => {
      var f, g, _, b, y;
      if (Math.hypot(d.clientX - this.downX, d.clientY - this.downY) > 5) return;
      if (this.wallDrawing) {
        const M = this.raycastFloor(d.clientX, d.clientY);
        M && this.addWallPointWorld(M.x, M.z);
        return;
      }
      if (!this.setRaycasterFromScreen(d.clientX, d.clientY)) return;
      const c = (f = this.raycaster.intersectObject(this.robotManager.getMesh())[0]) == null ? void 0 : f.instanceId;
      if (c !== void 0) {
        const M = this.robotManager.getRobotIdByInstance(c);
        if (M) {
          (g = this.onRobotClickCb) == null || g.call(this, M);
          return;
        }
      }
      const u = this.mapGraph.raycastNode(this.raycaster);
      if (u) {
        (_ = this.onNodeClickCb) == null || _.call(this, u);
        return;
      }
      const p = this.wallBuilder.raycastWalls(this.raycaster);
      p ? (this.wallBuilder.setSelected(p.wallId), (b = this.onWallSelectedCb) == null || b.call(this, p.wallId)) : (this.wallBuilder.setSelected(null), (y = this.onWallSelectedCb) == null || y.call(this, null));
    }, this.animate = () => {
      requestAnimationFrame(() => this.animate());
      const d = this.clock.getDelta();
      this.robotManager.update(d), this.controls.update(), this.wallBuilder.updateViewDependentOpacity(this.camera, d), this.renderer.render(this.scene, this.camera);
    }, this.pendingPoints = [], this.container = t;
    const i = e.width ?? (t.clientWidth || 800), s = e.height ?? (t.clientHeight || 600);
    this.scene = new r.Scene(), this.scene.background = new r.Color(e.backgroundColor ?? 725280), this.scene.fog = new r.Fog(
      725280,
      e.fogNear ?? 80,
      e.fogFar ?? 300
    ), this.camera = new r.PerspectiveCamera(50, i / s, 0.1, 500), this.camera.position.set(30, 28, 30), this.renderer = new r.WebGLRenderer({ antialias: !0 }), this.renderer.setSize(i, s), this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)), this.container.appendChild(this.renderer.domElement), this.controls = new q(this.camera, this.renderer.domElement), this.controls.enableDamping = !0, this.controls.dampingFactor = 0.05, this.controls.target.set(0, 0, 0);
    const n = new r.GridHelper(100, 50, 3359061, 1120295);
    this.scene.add(n);
    const l = new r.Mesh(
      new r.PlaneGeometry(120, 120),
      new r.MeshStandardMaterial({ color: 988970, roughness: 1 })
    );
    l.rotation.x = -Math.PI / 2, l.position.y = -0.01, this.scene.add(l), this.scene.add(new r.AmbientLight(16777215, 0.5));
    const h = new r.DirectionalLight(16777215, 1.2);
    h.position.set(30, 40, 20), this.scene.add(h), this.scene.add(this.wallMarkers), this.previewGeo.setAttribute(
      "position",
      new r.BufferAttribute(this.previewPositions, 3)
    ), this.previewGeo.setDrawRange(0, 0), this.previewLine = new r.Line(
      this.previewGeo,
      new r.LineBasicMaterial({ color: 2282478 })
    ), this.scene.add(this.previewLine), this.wallBuilder = new ct(this.scene, e.wallFade), this.robotManager = new dt(this.scene), this.mapGraph = new pt(this.scene), this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown), this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp), this.handleResize = this.handleResize.bind(this), window.addEventListener("resize", this.handleResize), this.animate();
  }
  handleResize() {
    const t = this.container.clientWidth || 800, e = this.container.clientHeight || 600;
    this.camera.aspect = t / e, this.camera.updateProjectionMatrix(), this.renderer.setSize(t, e);
  }
  /** 화면 좌표로 레이캐스터 설정 */
  setRaycasterFromScreen(t, e) {
    const i = this.renderer.domElement.getBoundingClientRect();
    if (i.width === 0 || i.height === 0) return !1;
    const s = new r.Vector2(
      (t - i.left) / i.width * 2 - 1,
      -((e - i.top) / i.height) * 2 + 1
    );
    return this.raycaster.setFromCamera(s, this.camera), !0;
  }
  /** 화면 클릭 좌표 → 바닥면(Y=0) 교차점 (월드 좌표) */
  raycastFloor(t, e) {
    if (!this.setRaycasterFromScreen(t, e)) return null;
    const i = new r.Plane(new r.Vector3(0, 1, 0), 0), s = new r.Vector3();
    return this.raycaster.ray.intersectPlane(i, s) ? { x: s.x, z: s.z } : null;
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
    const i = (s) => {
      var g, _, b, y, M, C, O, k;
      if (s.colorSpace = r.SRGBColorSpace, s.flipY = !1, this.mapPlane) {
        this.scene.remove(this.mapPlane), this.mapPlane.geometry.dispose();
        const N = this.mapPlane.material;
        (g = N.map) == null || g.dispose(), N.dispose();
      }
      const n = (e == null ? void 0 : e.widthPx) ?? ((_ = this.calibration) == null ? void 0 : _.imageWidthPx) ?? 1024, l = (e == null ? void 0 : e.heightPx) ?? ((b = this.calibration) == null ? void 0 : b.imageHeightPx) ?? 1024, h = (e == null ? void 0 : e.resolutionMPerPx) ?? ((y = this.calibration) == null ? void 0 : y.resolutionMPerPx), d = h != null ? n * h : ((M = this.calibration) == null ? void 0 : M.realWidthM) ?? 50, a = h != null ? l * h : ((C = this.calibration) == null ? void 0 : C.realHeightM) ?? 28;
      let c, u;
      (e == null ? void 0 : e.originX) !== void 0 || (e == null ? void 0 : e.originY) !== void 0 ? (c = e.originX ?? 0, u = e.originY ?? 0) : ((O = this.calibration) == null ? void 0 : O.originX) !== void 0 || ((k = this.calibration) == null ? void 0 : k.originY) !== void 0 ? (c = this.calibration.originX ?? 0, u = this.calibration.originY ?? 0) : (c = -d / 2, u = -a / 2), this.calibration = {
        imageWidthPx: n,
        imageHeightPx: l,
        realWidthM: d,
        realHeightM: a,
        originX: c,
        originY: u,
        resolutionMPerPx: h ?? void 0
      };
      const p = new r.PlaneGeometry(d, a), f = new r.MeshStandardMaterial({ map: s, roughness: 1 });
      this.mapPlane = new r.Mesh(p, f), this.mapPlane.rotation.x = -Math.PI / 2, this.mapPlane.position.set(c + d / 2, 0.01, u + a / 2), this.scene.add(this.mapPlane);
    };
    if (typeof t == "string")
      new r.TextureLoader().load(t, i);
    else {
      const s = t instanceof HTMLCanvasElement ? new r.CanvasTexture(t) : new r.Texture(t);
      s.needsUpdate = !0, i(s);
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
    var n;
    if (!this.wallDrawing || this.wallPointsCount() >= 512) return;
    const i = new r.Mesh(this.markerGeo, this.markerMat);
    i.position.set(t, 0.05, e), this.wallMarkers.add(i);
    const s = this.wallPointsCount() + 1;
    this.previewPositions[(s - 1) * 3] = t, this.previewPositions[(s - 1) * 3 + 1] = 0.05, this.previewPositions[(s - 1) * 3 + 2] = e, this.previewGeo.setDrawRange(0, s), this.previewGeo.getAttribute("position").needsUpdate = !0, this.pendingPoints.push({ x: t, z: e }), (n = this.onWallPointAddedCb) == null || n.call(this, { x: t, z: e });
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
    var s;
    if (this.pendingPoints.length < 3)
      throw new Error("벽 생성을 위해서는 최소 3개 이상의 점이 필요합니다.");
    const e = this.wallBuilder.buildWall(
      this.pendingPoints,
      t ?? { heightM: 3, thicknessM: 0.15 }
    ), i = this.wallBuilder.getWall(e);
    return this.clearWallPoints(), (s = this.onWallCreatedCb) == null || s.call(this, e, i), e;
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
  // ───────────────────────────────────────────────────────
  // 벽 뷰 의존적 페이드 (카메라에 가려지는 앞벽 자동 반투명)
  // ───────────────────────────────────────────────────────
  /** 앞벽 자동 반투명 페이드 켜기/끄기 (끄면 모든 벽이 불투명으로 복원) */
  setWallFadeEnabled(t) {
    this.wallBuilder.setFadeEnabled(t);
  }
  isWallFadeEnabled() {
    return this.wallBuilder.isFadeEnabled();
  }
  /** 페이드 세부 옵션 조정 (minOpacity / fadeStart / fadeEnd / fadeSpeed) */
  setWallFadeOptions(t) {
    this.wallBuilder.setFadeOptions(t);
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
    const i = await fetch(t);
    if (!i.ok) throw new Error(`맵 그래프 조회 실패: ${i.status}`);
    const s = await i.json();
    this.loadMapGraph(s, e);
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
  setTopView(t = 0, e = 0, i = 60) {
    this.camera.position.set(t, i, e + 1e-3), this.controls.target.set(t, 0, e), this.camera.lookAt(t, 0, e), this.controls.update();
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
class yt {
  constructor() {
    this.scaleX = 1, this.scaleY = 1, this.originX = 0, this.originY = 0;
  }
  setCalibration(t) {
    this.cal = t, this.originX = t.originX ?? 0, this.originY = t.originY ?? 0, this.scaleX = t.realWidthM / t.imageWidthPx, this.scaleY = t.realHeightM / t.imageHeightPx;
  }
  /** 픽셀 하나 → 월드 (x, z) */
  toWorld(t, e) {
    const i = this.cal.imageWidthPx / 2, s = this.cal.imageHeightPx / 2, n = (t - i) * this.scaleX + this.originX, l = -(e - s) * this.scaleY + this.originY;
    return { x: n, z: l };
  }
  /** 점 배열 → 월드 (x, z) 배열 */
  toWorldPoints(t) {
    return t.map((e) => this.toWorld(e.x, e.y));
  }
}
const F = (o) => o === 32 || o === 9 || o === 10 || o === 13;
function mt(o) {
  const t = new Uint8Array(o);
  let e = 0;
  const i = () => {
    for (; ; ) {
      for (; e < t.length && F(t[e]); ) e++;
      if (e < t.length && t[e] === 35) {
        for (; e < t.length && t[e] !== 10; ) e++;
        continue;
      }
      break;
    }
    let c = "";
    for (; e < t.length && !F(t[e]); )
      c += String.fromCharCode(t[e++]);
    return c;
  }, s = i();
  if (s !== "P5" && s !== "P2")
    throw new Error(
      `지원하지 않는 PGM 형식입니다: ${s} (P5 바이너리 / P2 ASCII만 지원)`
    );
  const n = parseInt(i(), 10), l = parseInt(i(), 10), h = parseInt(i(), 10);
  if (!n || !l || !Number.isFinite(h) || h <= 0)
    throw new Error("PGM 헤더가 올바르지 않습니다.");
  const d = n * l, a = new Uint8Array(d);
  if (s === "P5")
    if (e++, h < 256)
      for (let c = 0; c < d; c++)
        a[c] = Math.round(t[e + c] * 255 / h);
    else
      for (let c = 0; c < d; c++) {
        const u = t[e + c * 2] << 8 | t[e + c * 2 + 1];
        a[c] = Math.round(u * 255 / h);
      }
  else
    for (let c = 0; c < d; c++) {
      const u = parseInt(i(), 10);
      a[c] = Math.round((Number.isNaN(u) ? 0 : u) * 255 / h);
    }
  return { width: n, height: l, gray: a };
}
function gt(o) {
  const t = {};
  for (const e of o.split(/\r?\n/)) {
    const i = (e.split("#")[0] ?? "").trim();
    if (!i || i.startsWith("%")) continue;
    const s = i.indexOf(":");
    if (s < 0) continue;
    const n = i.slice(0, s).trim(), l = i.slice(s + 1).trim();
    switch (n) {
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
function ft(o, t = {}) {
  const { width: e, height: i, gray: s } = o, n = t.negate ?? !1, l = t.occupiedThresh ?? 0.65, h = t.freeThresh ?? 0.196, d = document.createElement("canvas");
  d.width = e, d.height = i;
  const a = d.getContext("2d"), c = a.createImageData(e, i), u = c.data;
  for (let p = 0; p < e * i; p++) {
    const f = s[p], g = (n ? f : 255 - f) / 255;
    let _, b, y;
    g > l ? (_ = 30, b = 41, y = 59) : g < h ? (_ = 226, b = 232, y = 240) : (_ = 11, b = 17, y = 32), u[p * 4] = _, u[p * 4 + 1] = b, u[p * 4 + 2] = y, u[p * 4 + 3] = 255;
  }
  return a.putImageData(c, 0, 0), d;
}
function _t(o) {
  var d;
  const t = o, e = (d = t.floorList) == null ? void 0 : d[0];
  if (!e)
    throw new Error(
      "floorList가 없는 맵 JSON입니다. (Axbis 비즈니스 맵 규격 확인)"
    );
  const i = (e.nodeList ?? []).map((a) => ({
    nodeId: String(a.nodeLabel ?? a.nodeUuid ?? a.nodeNumber ?? ""),
    nodePosition: {
      x: Number(a.xCoordinate ?? 0),
      y: Number(a.yCoordinate ?? 0)
    },
    kind: a.nodeType === 2 ? "parking" : "normal"
  })), s = new Set(i.map((a) => a.nodeId)), n = (e.edgeList ?? []).map((a) => ({
    edgeId: a.edgeLabel != null ? String(a.edgeLabel) : void 0,
    startNodeId: String(a.beginNodeLabel ?? ""),
    endNodeId: String(a.endNodeLabel ?? "")
  })).filter((a) => s.has(a.startNodeId) && s.has(a.endNodeId)), l = {
    mapId: t.mapCode ?? e.floorNumber,
    mapName: e.floorName || e.floorNumber,
    nodes: i,
    edges: n
  }, h = {
    name: e.floorName || e.floorNumber || "-",
    lengthM: e.floorLength ?? 0,
    widthM: e.floorWidth ?? 0,
    version: e.floorMapVersion ?? "-"
  };
  return { graph: l, floorInfo: h };
}
async function Mt(o) {
  const t = o.find((a) => /\.pgm$/i.test(a.name)), e = o.find((a) => /\.(yaml|yml)$/i.test(a.name));
  let i;
  for (const a of o)
    if (/\.json$/i.test(a.name))
      try {
        const c = JSON.parse(await a.text());
        if (c && Array.isArray(c.floorList)) {
          i = a;
          break;
        }
      } catch {
      }
  if (!t)
    throw new Error("PGM 지도 파일(.pgm)을 찾을 수 없습니다.");
  const s = mt(await t.arrayBuffer());
  let n = { widthPx: s.width, heightPx: s.height };
  e ? n = {
    ...gt(await e.text()),
    widthPx: s.width,
    heightPx: s.height
  } : n.resolutionMPerPx = 0.05;
  const l = ft(s, n);
  let h = { nodes: [], edges: [] }, d = null;
  if (i) {
    const a = _t(
      JSON.parse(await i.text())
    );
    h = a.graph, d = a.floorInfo;
  }
  return { canvas: l, meta: n, graph: h, floorInfo: d };
}
export {
  bt as AcsViewer,
  pt as MapGraphRenderer,
  yt as MapTransform,
  I as NODE_KIND_COLOR,
  dt as RobotManager,
  W as STATUS_COLOR,
  ct as WallBuilder,
  _t as convertAxbisBusinessMap,
  Mt as loadAxbisMapFromFiles,
  gt as parseMapYaml,
  mt as parsePGM,
  ft as pgmToCanvas
};
