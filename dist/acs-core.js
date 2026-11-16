import * as l from "three";
import { Controls as $, Vector3 as D, MOUSE as A, TOUCH as T, Quaternion as j, Spherical as U, Vector2 as S, Ray as q, Plane as Q, MathUtils as J } from "three";
const Y = { type: "change" }, G = { type: "start" }, Z = { type: "end" }, v = new q(), H = new Q(), tt = Math.cos(70 * J.DEG2RAD), x = new D(), E = 2 * Math.PI, _ = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, W = 1e-6;
class et extends $ {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, e = null) {
    super(t, e), this.state = _.NONE, this.target = new D(), this.cursor = new D(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: A.ROTATE, MIDDLE: A.DOLLY, RIGHT: A.PAN }, this.touches = { ONE: T.ROTATE, TWO: T.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._cursorStyle = "auto", this._domElementKeyEvents = null, this._lastPosition = new D(), this._lastQuaternion = new j(), this._lastTargetPosition = new D(), this._quat = new j().setFromUnitVectors(t.up, new D(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new U(), this._sphericalDelta = new U(), this._scale = 1, this._panOffset = new D(), this._rotateStart = new S(), this._rotateEnd = new S(), this._rotateDelta = new S(), this._panStart = new S(), this._panEnd = new S(), this._panDelta = new S(), this._dollyStart = new S(), this._dollyEnd = new S(), this._dollyDelta = new S(), this._dollyDirection = new D(), this._mouse = new S(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = it.bind(this), this._onPointerDown = st.bind(this), this._onPointerUp = ot.bind(this), this._onContextMenu = dt.bind(this), this._onMouseWheel = rt.bind(this), this._onKeyDown = ht.bind(this), this._onTouchStart = lt.bind(this), this._onTouchMove = ct.bind(this), this._onMouseDown = nt.bind(this), this._onMouseMove = at.bind(this), this._interceptControlDown = ut.bind(this), this._interceptControlUp = pt.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
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
    this.state = _.NONE, this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.ownerDocument.removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { capture: !0 }), this._controlActive = !1, this._pointers.length = 0, this._pointerPositions = {}, this.domElement.style.touchAction = "", this.domElement.style.cursor = "auto";
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
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(Y), this.update(), this.state = _.NONE;
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
    x.copy(e).sub(this.target), x.applyQuaternion(this._quat), this._spherical.setFromVector3(x), this.autoRotate && this.state === _.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let s = this.minAzimuthAngle, i = this.maxAzimuthAngle;
    isFinite(s) && isFinite(i) && (s < -Math.PI ? s += E : s > Math.PI && (s -= E), i < -Math.PI ? i += E : i > Math.PI && (i -= E), s <= i ? this._spherical.theta = Math.max(s, Math.min(i, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (s + i) / 2 ? Math.max(s, this._spherical.theta) : Math.min(i, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let o = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const a = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), o = a != this._spherical.radius;
    }
    if (x.setFromSpherical(this._spherical), x.applyQuaternion(this._quatInverse), e.copy(this.target).add(x), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let a = null;
      if (this.object.isPerspectiveCamera) {
        const r = x.length();
        a = this._clampDistance(r * this._scale);
        const c = r - a;
        this.object.position.addScaledVector(this._dollyDirection, c), this.object.updateMatrixWorld(), o = !!c;
      } else if (this.object.isOrthographicCamera) {
        const r = new D(this._mouse.x, this._mouse.y, 0);
        r.unproject(this.object);
        const c = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), o = c !== this.object.zoom;
        const n = new D(this._mouse.x, this._mouse.y, 0);
        n.unproject(this.object), this.object.position.sub(n).add(r), this.object.updateMatrixWorld(), a = x.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      a !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position) : (v.origin.copy(this.object.position), v.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(v.direction)) < tt ? this.object.lookAt(this.target) : (H.setFromNormalAndCoplanarPoint(this.object.up, this.target), v.intersectPlane(H, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const a = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), a !== this.object.zoom && (this.object.updateProjectionMatrix(), o = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, o || this._lastPosition.distanceToSquared(this.object.position) > W || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > W || this._lastTargetPosition.distanceToSquared(this.target) > W ? (this.dispatchEvent(Y), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? E / 60 * this.autoRotateSpeed * t : E / 60 / 60 * this.autoRotateSpeed;
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
    x.setFromMatrixColumn(e, 0), x.multiplyScalar(-t), this._panOffset.add(x);
  }
  _panUp(t, e) {
    this.screenSpacePanning === !0 ? x.setFromMatrixColumn(e, 1) : (x.setFromMatrixColumn(e, 0), x.crossVectors(this.object.up, x)), x.multiplyScalar(t), this._panOffset.add(x);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, e) {
    const s = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const i = this.object.position;
      x.copy(i).sub(this.target);
      let o = x.length();
      o *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * o / s.clientHeight, this.object.matrix), this._panUp(2 * e * o / s.clientHeight, this.object.matrix);
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
    const s = this.domElement.getBoundingClientRect(), i = t - s.left, o = e - s.top, a = s.width, r = s.height;
    this._mouse.x = i / a * 2 - 1, this._mouse.y = -(o / r) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
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
    this._rotateLeft(E * this._rotateDelta.x / e.clientHeight), this._rotateUp(E * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
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
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(E * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), e = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(-E * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), e = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(E * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), e = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(-E * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), e = !0;
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
    const e = this._getSecondPointerPosition(t), s = t.pageX - e.x, i = t.pageY - e.y, o = Math.sqrt(s * s + i * i);
    this._dollyStart.set(0, o);
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
      const s = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + s.x), o = 0.5 * (t.pageY + s.y);
      this._rotateEnd.set(i, o);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(E * this._rotateDelta.x / e.clientHeight), this._rotateUp(E * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd);
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
    const e = this._getSecondPointerPosition(t), s = t.pageX - e.x, i = t.pageY - e.y, o = Math.sqrt(s * s + i * i);
    this._dollyEnd.set(0, o), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
    const a = (t.pageX + e.x) * 0.5, r = (t.pageY + e.y) * 0.5;
    this._updateZoomParameters(a, r);
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
    e === void 0 && (e = new S(), this._pointerPositions[t.pointerId] = e), e.set(t.pageX, t.pageY);
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
function st(h) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(h.pointerId), this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(h) && (this._addPointer(h), h.pointerType === "touch" ? this._onTouchStart(h) : this._onMouseDown(h), this._cursorStyle === "grab" && (this.domElement.style.cursor = "grabbing")));
}
function it(h) {
  this.enabled !== !1 && (h.pointerType === "touch" ? this._onTouchMove(h) : this._onMouseMove(h));
}
function ot(h) {
  switch (this._removePointer(h), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(h.pointerId), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(Z), this.state = _.NONE, this._cursorStyle === "grab" && (this.domElement.style.cursor = "grab");
      break;
    case 1:
      const t = this._pointers[0], e = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: e.x, pageY: e.y });
      break;
  }
}
function nt(h) {
  let t;
  switch (h.button) {
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
    case A.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(h), this.state = _.DOLLY;
      break;
    case A.ROTATE:
      if (h.ctrlKey || h.metaKey || h.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(h), this.state = _.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(h), this.state = _.ROTATE;
      }
      break;
    case A.PAN:
      if (h.ctrlKey || h.metaKey || h.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(h), this.state = _.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(h), this.state = _.PAN;
      }
      break;
    default:
      this.state = _.NONE;
  }
  this.state !== _.NONE && this.dispatchEvent(G);
}
function at(h) {
  switch (this.state) {
    case _.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(h);
      break;
    case _.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(h);
      break;
    case _.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(h);
      break;
  }
}
function rt(h) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== _.NONE || (h.preventDefault(), this.dispatchEvent(G), this._handleMouseWheel(this._customWheelEvent(h)), this.dispatchEvent(Z));
}
function ht(h) {
  this.enabled !== !1 && this._handleKeyDown(h);
}
function lt(h) {
  switch (this._trackPointer(h), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case T.ROTATE:
          if (this.enableRotate === !1) {
            this.state = _.NONE;
            break;
          }
          this._handleTouchStartRotate(h), this.state = _.TOUCH_ROTATE;
          break;
        case T.PAN:
          if (this.enablePan === !1) {
            this.state = _.NONE;
            break;
          }
          this._handleTouchStartPan(h), this.state = _.TOUCH_PAN;
          break;
        default:
          this.state = _.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case T.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(h), this.state = _.TOUCH_DOLLY_PAN;
          break;
        case T.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(h), this.state = _.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = _.NONE;
      }
      break;
    default:
      this.state = _.NONE;
  }
  this.state !== _.NONE && this.dispatchEvent(G);
}
function ct(h) {
  switch (this._trackPointer(h), this.state) {
    case _.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(h), this.update();
      break;
    case _.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(h), this.update();
      break;
    case _.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(h), this.update();
      break;
    case _.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(h), this.update();
      break;
    default:
      this.state = _.NONE;
  }
}
function dt(h) {
  this.enabled !== !1 && h.preventDefault();
}
function ut(h) {
  h.key === "Control" && (this._controlActive = !0, this.domElement.ownerDocument.addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function pt(h) {
  h.key === "Control" && (this._controlActive = !1, this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
const mt = {
  enabled: !0,
  minOpacity: 0.15,
  fadeStart: 0.45,
  fadeEnd: 0.85,
  fadeSpeed: 8
};
class gt {
  constructor(t, e) {
    this.walls = /* @__PURE__ */ new Map(), this.counter = 0, this.selectedId = null, this._v = new l.Vector3(), this.autoWallId = null, this.scene = t, this.fade = { ...mt, ...e };
  }
  /**
   * 월드 포인트 배열 → 3D 벽 메시 생성 (변 단위 메시들의 Group)
   * points: 루프가 닫힌 순서의 바닥면 점들 (미터)
   */
  buildWall(t, e = { heightM: 3, thicknessM: 0.15 }, s = 9741240) {
    if (t.length < 3)
      throw new Error("벽 생성을 위해서는 최소 3개 이상의 점이 필요합니다.");
    let i = 0;
    for (let n = 0; n < t.length; n++) {
      const d = t[n], u = t[(n + 1) % t.length];
      i += d.x * u.z - u.x * d.z;
    }
    const o = i > 0, a = new l.Group(), r = [];
    for (let n = 0; n < t.length; n++) {
      const d = t[n], u = t[(n + 1) % t.length], m = u.x - d.x, f = u.z - d.z, y = Math.hypot(m, f);
      if (y < 1e-4) continue;
      const p = new l.BoxGeometry(
        e.thicknessM,
        e.heightM,
        y + e.thicknessM
      );
      p.rotateY(Math.atan2(m, f)), p.translate((d.x + u.x) / 2, e.heightM / 2, (d.z + u.z) / 2);
      const M = new l.MeshStandardMaterial({
        color: s,
        transparent: !0
      }), g = new l.Mesh(p, M);
      let b, w;
      o ? (b = -f / y, w = m / y) : (b = f / y, w = -m / y), r.push({
        mesh: g,
        midpoint: new l.Vector3(
          (d.x + u.x) / 2,
          e.heightM / 2,
          (d.z + u.z) / 2
        ),
        outward: new l.Vector3(-b, 0, -w),
        opacity: 1
      }), a.add(g);
    }
    if (r.length === 0)
      throw this.disposeGroup(a), new Error("유효한 벽 변이 없습니다.");
    this.scene.add(a);
    const c = `wall_${++this.counter}`;
    return a.userData.wallId = c, this.walls.set(c, { group: a, segments: r }), c;
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
    const { minOpacity: s, fadeStart: i, fadeEnd: o, fadeSpeed: a } = this.fade, r = Math.max(o - i, 1e-3), c = 1 - Math.exp(-a * Math.min(e, 0.1)), n = t.position;
    for (const d of this.walls.values())
      for (const u of d.segments) {
        this._v.subVectors(n, u.midpoint);
        const m = this._v.length();
        if (m < 1e-6) continue;
        this._v.multiplyScalar(1 / m);
        const f = this._v.dot(u.outward), y = u.bothSides ? Math.abs(f) : f, p = Math.min(Math.max((y - i) / r, 0), 1), g = 1 - p * p * (3 - 2 * p) * (1 - s);
        u.opacity += (g - u.opacity) * c, u.mesh.material.opacity = u.opacity;
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
    for (const s of t.segments)
      s.mesh.material.emissive.setHex(e);
  }
  getSelected() {
    return this.selectedId;
  }
  /**
   * PGM에서 추출한 벽 박스들로 자동 벽을 생성합니다 (기존 자동 벽은 교체).
   * 수동 벽과 동일한 WallSegment 구조로 만들어 뷰 의존적 페이드가 동일하게 적용됩니다.
   * 스탠드얼론 박스는 안/밖 구분이 없으므로 양면 페이드(bothSides)로 동작합니다.
   * @returns 생성된 세그먼트 수
   */
  buildAutoWalls(t, e = {}) {
    if (this.clearAutoWalls(), t.length === 0) return 0;
    const s = e.heightM ?? 2.5, i = e.color ?? 4674921, o = new l.Group(), a = [];
    for (const c of t) {
      const n = new l.BoxGeometry(c.widthM, s, c.depthM);
      n.translate(c.x, s / 2, c.z);
      const d = new l.MeshStandardMaterial({
        color: i,
        transparent: !0
      }), u = new l.Mesh(n, d), m = c.widthM >= c.depthM ? new l.Vector3(0, 0, 1) : new l.Vector3(1, 0, 0);
      a.push({
        mesh: u,
        midpoint: new l.Vector3(c.x, s / 2, c.z),
        outward: m,
        opacity: 1,
        bothSides: !0
      }), o.add(u);
    }
    this.scene.add(o);
    const r = `auto_wall_${++this.counter}`;
    return o.userData.wallId = r, this.walls.set(r, { group: o, segments: a }), this.autoWallId = r, a.length;
  }
  /** PGM 자동 벽 제거 */
  clearAutoWalls() {
    this.autoWallId && (this.removeWall(this.autoWallId), this.autoWallId = null);
  }
  hasAutoWalls() {
    return this.autoWallId !== null;
  }
  /** 레이캐스트로 가장 가까운 벽 피킹 */
  raycastWalls(t) {
    let e = null;
    for (const [s, i] of this.walls) {
      const o = t.intersectObject(i.group, !0);
      o.length > 0 && (!e || o[0].distance < e.dist) && (e = {
        wallId: s,
        mesh: o[0].object,
        dist: o[0].distance
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
    for (const s of t.children) {
      const i = s;
      (e = i.geometry) == null || e.dispose();
      const o = i.material;
      Array.isArray(o) ? o.forEach((a) => a.dispose()) : o == null || o.dispose();
    }
    t.clear();
  }
  clearAll() {
    const t = Array.from(this.walls.keys());
    for (const e of t)
      this.removeWall(e);
    this.selectedId = null, this.autoWallId = null;
  }
}
const F = {
  running: 2278750,
  // 녹색
  idle: 9741240,
  // 회색
  charging: 3900150,
  // 파랑
  error: 15680580
  // 빨강
};
class ft {
  constructor(t, e = 500) {
    this.robots = /* @__PURE__ */ new Map(), this.instanceIndex = /* @__PURE__ */ new Map(), this.dummy = new l.Object3D(), this.tmpMatrix = new l.Matrix4(), this.tmpColor = new l.Color(), this.count = 0, this.arrivedCbs = [], this.scene = t, this.maxCount = e;
    const s = new l.BoxGeometry(1.2, 0.6, 1.8), i = new l.MeshStandardMaterial({ roughness: 0.6 });
    this.mesh = new l.InstancedMesh(s, i, e), this.mesh.count = 0, this.mesh.instanceMatrix.setUsage(l.DynamicDrawUsage), this.mesh.frustumCulled = !1, this.mesh.name = "AcsRobots", t.add(this.mesh);
  }
  getMesh() {
    return this.mesh;
  }
  getRobotCount() {
    return this.robots.size;
  }
  /**
   * 로봇 좌표 수신 (신규면 등록, 기존이면 목표 갱신)
   * @param opts.interruptPath true(기본)이면 진행 중인 시뮬레이션 경로를 중단하고
   *        실측 좌표로 전환합니다. 시뮬레이션 틱에서는 false를 넘기세요.
   */
  updateRobotPose(t, e) {
    const s = this.robots.get(t.id);
    s != null && s.path && (e == null ? void 0 : e.interruptPath) !== !1 && (s.path = void 0);
    const i = F[t.status] ?? F.idle, o = t.theta !== void 0 && t.theta !== null;
    let a = this.robots.get(t.id);
    if (a)
      a.target = { x: t.x, z: t.y }, a.status = t.status, a.lastUpdate = Date.now(), a.hasTargetHeading = o, o && (a.targetHeading = -l.MathUtils.degToRad(t.theta));
    else {
      if (this.count >= this.maxCount) return;
      const r = this.count++;
      this.instanceIndex.set(t.id, r), this.mesh.count = this.count, a = {
        id: t.id,
        current: { x: t.x, z: t.y },
        target: { x: t.x, z: t.y },
        heading: o ? -l.MathUtils.degToRad(t.theta) : 0,
        targetHeading: o ? -l.MathUtils.degToRad(t.theta) : 0,
        hasTargetHeading: o,
        status: t.status,
        lastUpdate: Date.now()
      }, this.robots.set(t.id, a), this.dummy.position.set(a.current.x, 0.3, a.current.z), this.dummy.rotation.set(0, a.heading, 0), this.dummy.updateMatrix(), this.mesh.setMatrixAt(r, this.dummy.matrix);
    }
    this.tmpColor.setHex(i), this.mesh.setColorAt(this.instanceIndex.get(t.id), this.tmpColor), this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = !0);
  }
  removeRobot(t) {
    const e = this.instanceIndex.get(t);
    if (e === void 0) return;
    const s = this.count - 1;
    if (e !== s) {
      let i = null;
      for (const [o, a] of this.instanceIndex)
        if (a === s) {
          i = o;
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
  /** 매 프레임 호출: 경로 진행/보간 + 인스턴스 행렬 갱신 */
  update(t) {
    if (this.robots.size === 0) return;
    const e = Math.min(1, t * 3), s = Math.min(1, t * 5);
    for (const i of this.robots.values()) {
      if (i.path)
        this.advancePath(i, t);
      else {
        const r = i.target.x - i.current.x, c = i.target.z - i.current.z;
        i.current.x += r * e, i.current.z += c * e, i.hasTargetHeading || Math.hypot(r, c) > 0.05 && (i.targetHeading = Math.atan2(r, c));
      }
      let o = i.targetHeading - i.heading;
      for (; o > Math.PI; ) o -= Math.PI * 2;
      for (; o < -Math.PI; ) o += Math.PI * 2;
      i.heading += o * s;
      const a = this.instanceIndex.get(i.id);
      this.dummy.position.set(i.current.x, 0.3, i.current.z), this.dummy.rotation.set(0, i.heading, 0), this.dummy.updateMatrix(), this.mesh.setMatrixAt(a, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = !0;
  }
  /** 경로를 등속으로 진행 → current 갱신, 도착 시 이벤트 발생 */
  advancePath(t, e) {
    const s = t.path;
    let i = s.speedMps * e;
    for (; i > 0 && s.seg < s.points.length - 1; ) {
      const n = s.points[s.seg], d = s.points[s.seg + 1], m = Math.hypot(d.x - n.x, d.z - n.z) - s.segDist;
      m > i ? (s.segDist += i, i = 0) : (i -= m, s.seg++, s.segDist = 0);
    }
    if (s.seg >= s.points.length - 1) {
      const n = s.points[s.points.length - 1];
      t.current = { x: n.x, z: n.z }, t.target = { ...t.current };
      const d = s.onComplete;
      t.path = void 0;
      for (const u of this.arrivedCbs) u(t.id);
      d == null || d(t.id);
      return;
    }
    const o = s.points[s.seg], a = s.points[s.seg + 1], r = Math.hypot(a.x - o.x, a.z - o.z), c = r > 1e-6 ? s.segDist / r : 0;
    t.current = { x: o.x + (a.x - o.x) * c, z: o.z + (a.z - o.z) * c }, t.target = { ...t.current }, t.targetHeading = Math.atan2(a.x - o.x, a.z - o.z);
  }
  /** 60초 이상 갱신 없는 로봇 제거 (경로 진행 중인 로봇은 제외) */
  sweepStale(t = 6e4) {
    const e = Date.now();
    for (const [s, i] of this.robots)
      i.path || e - i.lastUpdate >= t && this.removeRobot(s);
  }
  /**
   * 로봇이 웨이포인트를 따라 등속 이동하도록 경로를 설정합니다 (기존 경로 교체).
   * 실측 좌표(updateRobotPose, interruptPath 기본 true)가 들어오면 경로는 자동 중단됩니다.
   * @returns 성공 여부 (로봇 미존재/웨이포인트 부족 시 false)
   */
  setRobotPath(t, e, s) {
    const i = this.robots.get(t);
    return !i || e.length < 2 ? !1 : (i.path = {
      points: e.map((o) => ({ x: o.x, z: o.z })),
      seg: 0,
      segDist: 0,
      speedMps: Math.max((s == null ? void 0 : s.speedMps) ?? 1, 0.01),
      onComplete: s == null ? void 0 : s.onComplete
    }, !0);
  }
  /** 진행 중인 경로 이동 중단 (로봇은 현재 위치에 정지) */
  stopRobotPath(t) {
    const e = this.robots.get(t);
    e && (e.path = void 0);
  }
  hasRobotPath(t) {
    var e;
    return ((e = this.robots.get(t)) == null ? void 0 : e.path) != null;
  }
  /** 로봇의 현재 렌더 위치 (없으면 null) */
  getRobotPosition(t) {
    const e = this.robots.get(t);
    return e ? { x: e.current.x, z: e.current.z } : null;
  }
  /** 경로 이동 완료(목적지 도착) 구독 */
  onRobotArrived(t) {
    this.arrivedCbs.push(t);
  }
  dispose() {
    this.scene.remove(this.mesh), this.mesh.geometry.dispose(), this.mesh.material.dispose(), this.robots.clear(), this.instanceIndex.clear();
  }
}
const O = {
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
}, B = 2450411, wt = 6583435, bt = 16096779;
function X(h) {
  if (h.kind) return h.kind;
  const t = h.nodeId.toUpperCase();
  return t.startsWith("RACK") ? "rack" : /^T\d+$/.test(t) ? "charge" : "normal";
}
function _t(h, t) {
  const e = document.createElement("canvas"), s = 10, i = "bold 44px ui-monospace, SFMono-Regular, monospace", o = e.getContext("2d");
  o.font = i;
  const a = Math.ceil(o.measureText(h).width);
  e.width = a + s * 2, e.height = 60;
  const r = e.getContext("2d");
  r.font = i, r.fillStyle = "rgba(2, 6, 23, 0.78)", r.fillRect(0, 0, e.width, e.height), r.fillStyle = t, r.textBaseline = "middle", r.fillText(h, s, e.height / 2 + 2);
  const c = new l.CanvasTexture(e);
  c.colorSpace = l.SRGBColorSpace;
  const n = new l.Sprite(
    new l.SpriteMaterial({ map: c, transparent: !0, depthTest: !1 })
  ), d = 0.5;
  return n.scale.set(d * e.width / e.height, d, 1), n.renderOrder = 10, n.raycast = () => {
  }, n;
}
class yt {
  constructor(t) {
    this.group = new l.Group(), this.nodeMesh = null, this.nodeIds = [], this.nodeKindColors = [], this.nodePositions = /* @__PURE__ */ new Map(), this.lineSegments = null, this.lineColorAttr = null, this.edgeList = [], this.arrowMesh = null, this.arrowsVisible = !0, this.highlightedNodes = /* @__PURE__ */ new Set(), this.highlightedEdges = /* @__PURE__ */ new Set(), this.options = {
      unit: "mm",
      flipZ: !1,
      yOrigin: "bottom",
      showLabels: !0,
      nodeSize: 0.4,
      showArrows: !0
    }, this.scene = t, this.group.name = "AcsMapGraph", t.add(this.group);
  }
  /** 맵 그래프 로드 (기존 그래프는 교체) */
  load(t, e) {
    var r, c;
    this.clear(), e && (this.options = { ...this.options, ...e });
    const s = this.options.unit === "m" ? 1 : 1e-3, i = (n) => {
      const d = n * s;
      if (this.options.yOrigin === "top") {
        const u = this.options.frameHeight;
        return u != null ? u * s - d : -d;
      }
      return this.options.flipZ ? -d : d;
    }, o = [];
    for (const n of t.nodes ?? []) {
      const d = Number((r = n.nodePosition) == null ? void 0 : r.x), u = Number((c = n.nodePosition) == null ? void 0 : c.y);
      if (isNaN(d) || isNaN(u)) continue;
      const m = d * s, f = i(u);
      o.push({ node: n, x: m, z: f }), this.nodePositions.set(n.nodeId, { x: m, z: f });
    }
    if (o.length > 0) {
      const n = this.options.nodeSize, d = new l.CylinderGeometry(n, n, 0.06, 24), u = new l.MeshBasicMaterial();
      this.nodeMesh = new l.InstancedMesh(d, u, o.length), this.nodeMesh.frustumCulled = !1, this.nodeMesh.name = "AcsGraphNodes";
      const m = new l.Object3D();
      o.forEach((f, y) => {
        this.nodeIds.push(f.node.nodeId);
        const p = new l.Color(
          O[X(f.node)] ?? O.normal
        );
        this.nodeKindColors.push(p), m.position.set(f.x, 0.04, f.z), m.scale.setScalar(1), m.updateMatrix(), this.nodeMesh.setMatrixAt(y, m.matrix), this.nodeMesh.setColorAt(y, p);
      }), this.nodeMesh.instanceColor && (this.nodeMesh.instanceColor.needsUpdate = !0), this.group.add(this.nodeMesh);
    }
    if (this.options.showLabels)
      for (const n of o) {
        const d = new l.Color(
          O[X(n.node)] ?? O.normal
        ), u = _t(n.node.nodeId, `#${d.getHexString()}`);
        u.position.set(n.x, 0.55, n.z), this.group.add(u);
      }
    const a = (t.edges ?? []).filter(
      (n) => this.nodePositions.has(n.startNodeId) && this.nodePositions.has(n.endNodeId)
    );
    if (a.length > 0) {
      const n = new Float32Array(a.length * 2 * 3), d = new Float32Array(a.length * 2 * 3), u = /* @__PURE__ */ new Map(), m = new Set(
        a.map((p) => `${p.startNodeId}->${p.endNodeId}`)
      ), f = [];
      a.forEach((p, M) => {
        const g = this.nodePositions.get(p.startNodeId), b = this.nodePositions.get(p.endNodeId);
        n.set([g.x, 0.05, g.z, b.x, 0.05, b.z], M * 6);
        const w = p.edgeId ?? `${p.startNodeId}-${p.endNodeId}`, P = new l.Color(p.roadType ? bt : wt);
        d.set([P.r, P.g, P.b, P.r, P.g, P.b], M * 6);
        const C = { key: w, edge: p, vOff: M * 2, base: P, arrowIdx: -1 };
        this.edgeList.push(C), u.set(w, C), m.has(`${p.endNodeId}->${p.startNodeId}`) || f.push({
          key: w,
          mid: { x: (g.x + b.x) / 2, z: (g.z + b.z) / 2 },
          angleY: Math.atan2(b.x - g.x, b.z - g.z)
        });
      });
      const y = new l.BufferGeometry();
      if (y.setAttribute("position", new l.BufferAttribute(n, 3)), this.lineColorAttr = new l.BufferAttribute(d, 3), y.setAttribute("color", this.lineColorAttr), this.lineSegments = new l.LineSegments(
        y,
        new l.LineBasicMaterial({ vertexColors: !0 })
      ), this.lineSegments.frustumCulled = !1, this.group.add(this.lineSegments), this.options.showArrows && f.length > 0) {
        const p = new l.ConeGeometry(0.16, 0.45, 12);
        p.rotateX(Math.PI / 2);
        const M = new l.MeshBasicMaterial();
        this.arrowMesh = new l.InstancedMesh(p, M, f.length), this.arrowMesh.frustumCulled = !1, this.arrowMesh.name = "AcsGraphEdgeArrows", this.arrowMesh.visible = this.arrowsVisible;
        const g = new l.Object3D(), b = new l.Color();
        f.forEach((w, P) => {
          g.position.set(w.mid.x, 0.12, w.mid.z), g.rotation.set(0, w.angleY, 0), g.scale.setScalar(1), g.updateMatrix(), this.arrowMesh.setMatrixAt(P, g.matrix);
          const C = u.get(w.key);
          C.arrowIdx = P, b.copy(C.base), this.arrowMesh.setColorAt(P, b);
        }), this.arrowMesh.instanceColor && (this.arrowMesh.instanceColor.needsUpdate = !0), this.group.add(this.arrowMesh);
      }
    }
  }
  // ───────────────────────────────────────────────────────
  // 경로 탐색 / 조회
  // ───────────────────────────────────────────────────────
  /**
   * 시작 → 목적지 노드의 최단 경로 (Dijkstra).
   * 가중치 = edgeLengthM ?? 노드 간 유클리드 거리, 엣지는 벤더 규약대로 방향성(start→end) 적용.
   * @returns 노드 ID 배열 (start 포함) — 경로가 없으면 null
   */
  findPath(t, e) {
    if (t === e)
      return this.nodePositions.has(t) ? [t] : null;
    if (!this.nodePositions.has(t) || !this.nodePositions.has(e))
      return null;
    const s = /* @__PURE__ */ new Map();
    for (const n of this.edgeList) {
      const d = this.nodePositions.get(n.edge.startNodeId), u = this.nodePositions.get(n.edge.endNodeId), m = n.edge.edgeLengthM ?? Math.hypot(u.x - d.x, u.z - d.z);
      s.has(n.edge.startNodeId) || s.set(n.edge.startNodeId, []), s.get(n.edge.startNodeId).push({
        to: n.edge.endNodeId,
        w: Math.max(m, 0)
      });
    }
    const i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Set();
    for (i.set(t, 0); ; ) {
      let n = null, d = 1 / 0;
      for (const [u, m] of i)
        !a.has(u) && m < d && (d = m, n = u);
      if (n === null || n === e) break;
      a.add(n);
      for (const { to: u, w: m } of s.get(n) ?? []) {
        if (a.has(u)) continue;
        const f = d + m;
        f < (i.get(u) ?? 1 / 0) && (i.set(u, f), o.set(u, n));
      }
    }
    if (!i.has(e)) return null;
    const r = [e];
    let c = e;
    for (; o.has(c); )
      c = o.get(c), r.unshift(c);
    return r[0] === t ? r : null;
  }
  /** 노드의 월드 좌표 (없으면 null) */
  getGraphNodePosition(t) {
    return this.nodePositions.get(t) ?? null;
  }
  /** 좌표에서 가장 가까운 노드 ID */
  findNearestNode(t) {
    let e = null, s = 1 / 0;
    for (const [i, o] of this.nodePositions) {
      const a = (o.x - t.x) ** 2 + (o.z - t.z) ** 2;
      a < s && (s = a, e = i);
    }
    return e;
  }
  /**
   * 노드 경로 하이라이트 — 노드 + 연속 노드쌍에 대응하는 엣지를 자동 매칭해 함께 표시
   * (엣지 ID 형식과 무관하게 startNodeId/endNodeId로 매칭)
   */
  highlightPath(t) {
    this.highlightNodes(t);
    const e = [];
    for (const s of this.edgeList)
      for (let i = 0; i < t.length - 1; i++)
        if (s.edge.startNodeId === t[i] && s.edge.endNodeId === t[i + 1]) {
          e.push(s.key);
          break;
        }
    this.highlightEdges(e);
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
  /** 레이캐스트 → 클릭된 엣지 (raycaster.params.Line.threshold 필요) */
  raycastEdge(t) {
    var o;
    if (!this.lineSegments) return null;
    const s = (o = t.intersectObject(this.lineSegments)[0]) == null ? void 0 : o.index;
    if (s === void 0 || !this.edgeList[s]) return null;
    const i = this.edgeList[s];
    return { key: i.key, edge: i.edge };
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
    const t = new l.Object3D(), e = new l.Color(B);
    this.nodeIds.forEach((s, i) => {
      const o = this.nodePositions.get(s), a = this.highlightedNodes.has(s);
      t.position.set(o.x, 0.04, o.z), t.scale.setScalar(a ? 1.6 : 1), t.updateMatrix(), this.nodeMesh.setMatrixAt(i, t.matrix), this.nodeMesh.setColorAt(i, a ? e : this.nodeKindColors[i]);
    }), this.nodeMesh.instanceMatrix.needsUpdate = !0, this.nodeMesh.instanceColor && (this.nodeMesh.instanceColor.needsUpdate = !0);
  }
  refreshEdgeColors() {
    var i;
    if (!this.lineColorAttr) return;
    const t = new l.Color(B), e = new l.Color(), s = this.lineColorAttr.array;
    for (const o of this.edgeList) {
      e.copy(this.highlightedEdges.has(o.key) ? t : o.base);
      for (const a of [o.vOff, o.vOff + 1])
        s[a * 3] = e.r, s[a * 3 + 1] = e.g, s[a * 3 + 2] = e.b;
      this.arrowMesh && o.arrowIdx >= 0 && this.arrowMesh.setColorAt(o.arrowIdx, e);
    }
    this.lineColorAttr.needsUpdate = !0, (i = this.arrowMesh) != null && i.instanceColor && (this.arrowMesh.instanceColor.needsUpdate = !0);
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
  /** 일방통행 방향 화살표 표시/숨김 */
  setArrowsVisible(t) {
    this.arrowsVisible = t, this.arrowMesh && (this.arrowMesh.visible = t);
  }
  getNodeCount() {
    return this.nodeIds.length;
  }
  getEdgeCount() {
    return this.edgeList.length;
  }
  clear() {
    for (const t of [...this.group.children])
      this.group.remove(t), this.disposeChild(t);
    this.nodeMesh = null, this.nodeIds = [], this.nodeKindColors = [], this.nodePositions.clear(), this.lineSegments = null, this.lineColorAttr = null, this.edgeList = [], this.arrowMesh = null, this.highlightedNodes.clear(), this.highlightedEdges.clear();
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
const K = (h) => h === 32 || h === 9 || h === 10 || h === 13;
function Mt(h) {
  const t = new Uint8Array(h);
  let e = 0;
  const s = () => {
    for (; ; ) {
      for (; e < t.length && K(t[e]); ) e++;
      if (e < t.length && t[e] === 35) {
        for (; e < t.length && t[e] !== 10; ) e++;
        continue;
      }
      break;
    }
    let d = "";
    for (; e < t.length && !K(t[e]); )
      d += String.fromCharCode(t[e++]);
    return d;
  }, i = s();
  if (i !== "P5" && i !== "P2")
    throw new Error(
      `지원하지 않는 PGM 형식입니다: ${i} (P5 바이너리 / P2 ASCII만 지원)`
    );
  const o = parseInt(s(), 10), a = parseInt(s(), 10), r = parseInt(s(), 10);
  if (!o || !a || !Number.isFinite(r) || r <= 0)
    throw new Error("PGM 헤더가 올바르지 않습니다.");
  const c = o * a, n = new Uint8Array(c);
  if (i === "P5")
    if (e++, r < 256)
      for (let d = 0; d < c; d++)
        n[d] = Math.round(t[e + d] * 255 / r);
    else
      for (let d = 0; d < c; d++) {
        const u = t[e + d * 2] << 8 | t[e + d * 2 + 1];
        n[d] = Math.round(u * 255 / r);
      }
  else
    for (let d = 0; d < c; d++) {
      const u = parseInt(s(), 10);
      n[d] = Math.round((Number.isNaN(u) ? 0 : u) * 255 / r);
    }
  return { width: o, height: a, gray: n };
}
function Pt(h) {
  const t = {};
  for (const e of h.split(/\r?\n/)) {
    const s = (e.split("#")[0] ?? "").trim();
    if (!s || s.startsWith("%")) continue;
    const i = s.indexOf(":");
    if (i < 0) continue;
    const o = s.slice(0, i).trim(), a = s.slice(i + 1).trim();
    switch (o) {
      case "image":
        t.image = a.replace(/["']/g, "");
        break;
      case "resolution": {
        const r = parseFloat(a);
        Number.isFinite(r) && (t.resolutionMPerPx = r);
        break;
      }
      case "origin": {
        const r = a.replace(/[\[\]]/g, "").split(",").map((c) => parseFloat(c.trim()));
        r.length >= 2 && Number.isFinite(r[0]) && Number.isFinite(r[1]) && (t.originX = r[0], t.originY = r[1]);
        break;
      }
      case "negate":
        t.negate = parseInt(a, 10) === 1;
        break;
      case "occupied_thresh": {
        const r = parseFloat(a);
        Number.isFinite(r) && (t.occupiedThresh = r);
        break;
      }
      case "free_thresh": {
        const r = parseFloat(a);
        Number.isFinite(r) && (t.freeThresh = r);
        break;
      }
    }
  }
  return t;
}
function xt(h, t = {}) {
  const { width: e, height: s, gray: i } = h, o = t.negate ?? !1, a = t.occupiedThresh ?? 0.65, r = t.freeThresh ?? 0.196, c = document.createElement("canvas");
  c.width = e, c.height = s;
  const n = c.getContext("2d"), d = n.createImageData(e, s), u = d.data;
  for (let m = 0; m < e * s; m++) {
    const f = i[m], y = (o ? f : 255 - f) / 255;
    let p, M, g;
    y > a ? (p = 30, M = 41, g = 59) : y < r ? (p = 226, M = 232, g = 240) : (p = 11, M = 17, g = 32), u[m * 4] = p, u[m * 4 + 1] = M, u[m * 4 + 2] = g, u[m * 4 + 3] = 255;
  }
  return n.putImageData(d, 0, 0), c;
}
function Et(h, t, e) {
  const { width: s, height: i, gray: o } = h, a = (e == null ? void 0 : e.negate) ?? t.negate ?? !1, r = (e == null ? void 0 : e.occupiedThresh) ?? t.occupiedThresh ?? 0.65, c = t.resolutionMPerPx ?? 0.05, n = t.originX ?? 0, d = t.originY ?? 0, u = (e == null ? void 0 : e.minComponentPixels) ?? 4, m = s * i, f = new Uint8Array(m);
  for (let p = 0; p < m; p++)
    f[p] = (a ? o[p] : 255 - o[p]) / 255 > r ? 1 : 0;
  if (u > 1) {
    const p = new Int32Array(m), M = [0], g = [];
    let b = 0;
    for (let w = 0; w < m; w++) {
      if (!f[w] || p[w] !== 0) continue;
      b++;
      let P = 0;
      for (g.push(w), p[w] = b; g.length > 0; ) {
        const C = g.pop();
        P++;
        const I = C % s, V = (C - I) / s;
        for (let R = -1; R <= 1; R++)
          for (let N = -1; N <= 1; N++) {
            if (N === 0 && R === 0) continue;
            const L = I + N, z = V + R;
            if (L < 0 || L >= s || z < 0 || z >= i) continue;
            const k = z * s + L;
            f[k] && p[k] === 0 && (p[k] = b, g.push(k));
          }
      }
      M.push(P);
    }
    for (let w = 0; w < m; w++)
      f[w] && M[p[w]] < u && (f[w] = 0);
  }
  const y = [];
  for (let p = 0; p < i; p++) {
    const M = d + (i - 0.5 - p) * c;
    let g = -1;
    for (let b = 0; b <= s; b++) {
      const w = b < s && f[p * s + b] === 1;
      w && g < 0 ? g = b : !w && g >= 0 && (y.push({
        x: n + (g + b) / 2 * c,
        z: M,
        widthM: (b - g) * c,
        depthM: c
      }), g = -1);
    }
  }
  return y;
}
function Ct(h) {
  var c;
  const t = h, e = (c = t.floorList) == null ? void 0 : c[0];
  if (!e)
    throw new Error(
      "floorList가 없는 맵 JSON입니다. (Axbis 비즈니스 맵 규격 확인)"
    );
  const s = (e.nodeList ?? []).map((n) => ({
    nodeId: String(n.nodeLabel ?? n.nodeUuid ?? n.nodeNumber ?? ""),
    nodePosition: {
      x: Number(n.xCoordinate ?? 0),
      y: Number(n.yCoordinate ?? 0)
    },
    kind: n.nodeType === 2 ? "parking" : "normal"
  })), i = new Set(s.map((n) => n.nodeId)), o = (e.edgeList ?? []).map((n) => ({
    edgeId: n.edgeLabel != null ? String(n.edgeLabel) : void 0,
    startNodeId: String(n.beginNodeLabel ?? ""),
    endNodeId: String(n.endNodeLabel ?? ""),
    roadType: n.roadType || void 0,
    maxVelocity: n.maxVelocity,
    orientation: n.orientation || void 0,
    edgeLengthM: n.edgeLength
  })).filter((n) => i.has(n.startNodeId) && i.has(n.endNodeId)), a = {
    mapId: t.mapCode ?? e.floorNumber,
    mapName: e.floorName || e.floorNumber,
    nodes: s,
    edges: o
  }, r = {
    name: e.floorName || e.floorNumber || "-",
    lengthM: e.floorLength ?? 0,
    widthM: e.floorWidth ?? 0,
    version: e.floorMapVersion ?? "-"
  };
  return { graph: a, floorInfo: r };
}
async function Dt(h) {
  const t = h.find((n) => /\.pgm$/i.test(n.name)), e = h.find((n) => /\.(yaml|yml)$/i.test(n.name));
  let s;
  for (const n of h)
    if (/\.json$/i.test(n.name))
      try {
        const d = JSON.parse(await n.text());
        if (d && Array.isArray(d.floorList)) {
          s = n;
          break;
        }
      } catch {
      }
  if (!t)
    throw new Error("PGM 지도 파일(.pgm)을 찾을 수 없습니다.");
  const i = Mt(await t.arrayBuffer());
  let o = { widthPx: i.width, heightPx: i.height };
  e ? o = {
    ...Pt(await e.text()),
    widthPx: i.width,
    heightPx: i.height
  } : o.resolutionMPerPx = 0.05;
  const a = xt(i, o);
  let r = { nodes: [], edges: [] }, c = null;
  if (s) {
    const n = Ct(
      JSON.parse(await s.text())
    );
    r = n.graph, c = n.floorInfo;
  }
  return { canvas: a, meta: o, graph: r, floorInfo: c, pgm: i };
}
class Tt {
  constructor(t, e = {}) {
    this.raycaster = new l.Raycaster(), this.clock = new l.Clock(), this.calibration = null, this.mapPlane = null, this.wallDrawing = !1, this.wallMarkers = new l.Group(), this.markerGeo = new l.SphereGeometry(0.15, 12, 12), this.markerMat = new l.MeshBasicMaterial({ color: 2282478 }), this.previewPositions = new Float32Array(512 * 3), this.previewGeo = new l.BufferGeometry(), this.downX = 0, this.downY = 0, this.handlePointerDown = (c) => {
      this.downX = c.clientX, this.downY = c.clientY;
    }, this.handlePointerUp = (c) => {
      var y, p, M, g, b, w;
      if (Math.hypot(c.clientX - this.downX, c.clientY - this.downY) > 5) return;
      if (this.wallDrawing) {
        const P = this.raycastFloor(c.clientX, c.clientY);
        P && this.addWallPointWorld(P.x, P.z);
        return;
      }
      if (!this.setRaycasterFromScreen(c.clientX, c.clientY)) return;
      const d = (y = this.raycaster.intersectObject(this.robotManager.getMesh())[0]) == null ? void 0 : y.instanceId;
      if (d !== void 0) {
        const P = this.robotManager.getRobotIdByInstance(d);
        if (P) {
          (p = this.onRobotClickCb) == null || p.call(this, P);
          return;
        }
      }
      const u = this.mapGraph.raycastNode(this.raycaster);
      if (u) {
        (M = this.onNodeClickCb) == null || M.call(this, u);
        return;
      }
      const m = this.mapGraph.raycastEdge(this.raycaster);
      if (m) {
        this.mapGraph.highlightEdges([m.key]), (g = this.onEdgeClickCb) == null || g.call(this, m.edge);
        return;
      }
      const f = this.wallBuilder.raycastWalls(this.raycaster);
      f ? (this.wallBuilder.setSelected(f.wallId), (b = this.onWallSelectedCb) == null || b.call(this, f.wallId)) : (this.wallBuilder.setSelected(null), (w = this.onWallSelectedCb) == null || w.call(this, null));
    }, this.animate = () => {
      requestAnimationFrame(() => this.animate());
      const c = this.clock.getDelta();
      this.robotManager.update(c), this.controls.update(), this.wallBuilder.updateViewDependentOpacity(this.camera, c), this.renderer.render(this.scene, this.camera);
    }, this.pendingPoints = [], this.container = t;
    const s = e.width ?? (t.clientWidth || 800), i = e.height ?? (t.clientHeight || 600);
    this.scene = new l.Scene(), this.scene.background = new l.Color(e.backgroundColor ?? 725280), this.scene.fog = new l.Fog(
      725280,
      e.fogNear ?? 80,
      e.fogFar ?? 300
    ), this.camera = new l.PerspectiveCamera(50, s / i, 0.1, 500), this.camera.position.set(30, 28, 30), this.renderer = new l.WebGLRenderer({ antialias: !0 }), this.renderer.setSize(s, i), this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)), this.container.appendChild(this.renderer.domElement), this.controls = new et(this.camera, this.renderer.domElement), this.controls.enableDamping = !0, this.controls.dampingFactor = 0.05, this.controls.target.set(0, 0, 0), this.raycaster.params.Line = { threshold: 0.35 };
    const o = new l.GridHelper(100, 50, 3359061, 1120295);
    this.scene.add(o);
    const a = new l.Mesh(
      new l.PlaneGeometry(120, 120),
      new l.MeshStandardMaterial({ color: 988970, roughness: 1 })
    );
    a.rotation.x = -Math.PI / 2, a.position.y = -0.01, this.scene.add(a), this.scene.add(new l.AmbientLight(16777215, 0.5));
    const r = new l.DirectionalLight(16777215, 1.2);
    r.position.set(30, 40, 20), this.scene.add(r), this.scene.add(this.wallMarkers), this.previewGeo.setAttribute(
      "position",
      new l.BufferAttribute(this.previewPositions, 3)
    ), this.previewGeo.setDrawRange(0, 0), this.previewLine = new l.Line(
      this.previewGeo,
      new l.LineBasicMaterial({ color: 2282478 })
    ), this.scene.add(this.previewLine), this.wallBuilder = new gt(this.scene, e.wallFade), this.robotManager = new ft(this.scene), this.mapGraph = new yt(this.scene), this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown), this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp), this.handleResize = this.handleResize.bind(this), window.addEventListener("resize", this.handleResize), this.animate();
  }
  handleResize() {
    const t = this.container.clientWidth || 800, e = this.container.clientHeight || 600;
    this.camera.aspect = t / e, this.camera.updateProjectionMatrix(), this.renderer.setSize(t, e);
  }
  /** 화면 좌표로 레이캐스터 설정 */
  setRaycasterFromScreen(t, e) {
    const s = this.renderer.domElement.getBoundingClientRect();
    if (s.width === 0 || s.height === 0) return !1;
    const i = new l.Vector2(
      (t - s.left) / s.width * 2 - 1,
      -((e - s.top) / s.height) * 2 + 1
    );
    return this.raycaster.setFromCamera(i, this.camera), !0;
  }
  /** 화면 클릭 좌표 → 바닥면(Y=0) 교차점 (월드 좌표) */
  raycastFloor(t, e) {
    if (!this.setRaycasterFromScreen(t, e)) return null;
    const s = new l.Plane(new l.Vector3(0, 1, 0), 0), i = new l.Vector3();
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
      var y, p, M, g, b, w, P, C;
      if (i.colorSpace = l.SRGBColorSpace, i.flipY = !1, this.mapPlane) {
        this.scene.remove(this.mapPlane), this.mapPlane.geometry.dispose();
        const I = this.mapPlane.material;
        (y = I.map) == null || y.dispose(), I.dispose();
      }
      const o = (e == null ? void 0 : e.widthPx) ?? ((p = this.calibration) == null ? void 0 : p.imageWidthPx) ?? 1024, a = (e == null ? void 0 : e.heightPx) ?? ((M = this.calibration) == null ? void 0 : M.imageHeightPx) ?? 1024, r = (e == null ? void 0 : e.resolutionMPerPx) ?? ((g = this.calibration) == null ? void 0 : g.resolutionMPerPx), c = r != null ? o * r : ((b = this.calibration) == null ? void 0 : b.realWidthM) ?? 50, n = r != null ? a * r : ((w = this.calibration) == null ? void 0 : w.realHeightM) ?? 28;
      let d, u;
      (e == null ? void 0 : e.originX) !== void 0 || (e == null ? void 0 : e.originY) !== void 0 ? (d = e.originX ?? 0, u = e.originY ?? 0) : ((P = this.calibration) == null ? void 0 : P.originX) !== void 0 || ((C = this.calibration) == null ? void 0 : C.originY) !== void 0 ? (d = this.calibration.originX ?? 0, u = this.calibration.originY ?? 0) : (d = -c / 2, u = -n / 2), this.calibration = {
        imageWidthPx: o,
        imageHeightPx: a,
        realWidthM: c,
        realHeightM: n,
        originX: d,
        originY: u,
        resolutionMPerPx: r ?? void 0
      };
      const m = new l.PlaneGeometry(c, n), f = new l.MeshStandardMaterial({ map: i, roughness: 1 });
      this.mapPlane = new l.Mesh(m, f), this.mapPlane.rotation.x = -Math.PI / 2, this.mapPlane.position.set(d + c / 2, 0.01, u + n / 2), this.scene.add(this.mapPlane);
    };
    if (typeof t == "string")
      new l.TextureLoader().load(t, s);
    else {
      const i = t instanceof HTMLCanvasElement ? new l.CanvasTexture(t) : new l.Texture(t);
      i.needsUpdate = !0, s(i);
    }
  }
  // ───────────────────────────────────────────────────────
  // PGM 자동 벽 (WallBuilder 세그먼트로 생성 → 뷰 의존적 페이드 동일 적용)
  // ───────────────────────────────────────────────────────
  /**
   * PGM 점유격자에서 벽을 자동 생성합니다 (기존 자동 벽은 교체).
   * 외곽 벽 + 내부 장애물(랙/기둥)이 PGM과 픽셀 단위로 일치하게 세워지고,
   * 수동 벽과 동일한 뷰 의존적 페이드(카메라 정면 벽 자동 반투명)가 적용됩니다.
   * @returns 생성된 벽 세그먼트 수
   */
  buildAutoWalls(t, e, s) {
    this.clearAutoWalls();
    const i = Et(t, e, {
      occupiedThresh: s == null ? void 0 : s.occupiedThresh,
      minComponentPixels: s == null ? void 0 : s.minComponentPixels
    });
    return i.length === 0 ? 0 : this.wallBuilder.buildAutoWalls(i, {
      heightM: s == null ? void 0 : s.heightM,
      color: s == null ? void 0 : s.color
    });
  }
  /** PGM 자동 벽 제거 */
  clearAutoWalls() {
    this.wallBuilder.clearAutoWalls();
  }
  hasAutoWalls() {
    return this.wallBuilder.hasAutoWalls();
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
    var o;
    if (!this.wallDrawing || this.wallPointsCount() >= 512) return;
    const s = new l.Mesh(this.markerGeo, this.markerMat);
    s.position.set(t, 0.05, e), this.wallMarkers.add(s);
    const i = this.wallPointsCount() + 1;
    this.previewPositions[(i - 1) * 3] = t, this.previewPositions[(i - 1) * 3 + 1] = 0.05, this.previewPositions[(i - 1) * 3 + 2] = e, this.previewGeo.setDrawRange(0, i), this.previewGeo.getAttribute("position").needsUpdate = !0, this.pendingPoints.push({ x: t, z: e }), (o = this.onWallPointAddedCb) == null || o.call(this, { x: t, z: e });
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
  /**
   * 로봇 좌표 수신 (신규 등록 또는 목표 갱신, 렌더는 Lerp 보간)
   * @param opts.interruptPath true(기본)이면 진행 중인 시뮬레이션 경로를 중단하고 실측 좌표로 전환.
   *        시뮬레이션 틱으로 로봇을 움직일 때는 false를 넘기세요.
   */
  updateRobotPose(t, e) {
    this.robotManager.updateRobotPose(t, e);
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
  // 로봇 경로 이동 (시뮬레이션) + 그래프 경로 탐색
  // ───────────────────────────────────────────────────────
  /**
   * 로봇이 웨이포인트를 따라 등속 이동합니다 (시뮬레이션).
   * 실측 좌표(updateRobotPose, interruptPath 기본 true)가 들어오면 자동 중단됩니다.
   * @returns 성공 여부
   */
  moveRobotAlongPath(t, e, s) {
    return this.robotManager.setRobotPath(t, e, s);
  }
  /** 진행 중인 경로 이동 중단 (로봇은 현재 위치에 정지) */
  stopRobotPath(t) {
    this.robotManager.stopRobotPath(t);
  }
  hasRobotPath(t) {
    return this.robotManager.hasRobotPath(t);
  }
  /** 그래프 상 최단 경로 탐색 → 노드 ID 배열 (경로 없으면 null) */
  findPath(t, e) {
    return this.mapGraph.findPath(t, e);
  }
  /** 노드의 월드 좌표 */
  getGraphNodePosition(t) {
    return this.mapGraph.getGraphNodePosition(t);
  }
  /** 좌표에서 가장 가까운 노드 ID */
  findNearestNode(t) {
    return this.mapGraph.findNearestNode(t);
  }
  /** 로봇의 현재 위치에서 가장 가까운 노드 ID */
  findNearestNodeToRobot(t) {
    const e = this.robotManager.getRobotPosition(t);
    return e ? this.mapGraph.findNearestNode(e) : null;
  }
  /** 노드 경로 하이라이트 (연속 노드쌍 엣지 자동 매칭) */
  highlightGraphPath(t) {
    this.mapGraph.highlightPath(t);
  }
  /**
   * 로봇을 지정 노드까지 그래프 최단 경로로 이동시키는 원스톱 명령 (시뮬레이션).
   * 로봇 현재 위치 → 가장 가까운 노드 → 최단 경로 → 목적지 순서로 웨이포인트를 구성하고
   * 진행 경로(노드/엣지)를 하이라이트합니다.
   * @returns 경과 노드 ID 배열 (로봇 없음/경로 없음이면 null)
   */
  dispatchRobotToNode(t, e, s) {
    const i = this.robotManager.getRobotPosition(t);
    if (!i) return null;
    const o = this.mapGraph.findNearestNode(i);
    if (!o) return null;
    const a = this.mapGraph.findPath(o, e);
    if (!a) return null;
    const r = [{ x: i.x, z: i.z }];
    for (const c of a) {
      const n = this.mapGraph.getGraphNodePosition(c);
      n && r.push(n);
    }
    return this.moveRobotAlongPath(t, r, {
      speedMps: s == null ? void 0 : s.speedMps
    }) ? (this.mapGraph.highlightPath(a), a) : null;
  }
  /** 경로 이동 완료(목적지 도착) 구독 */
  onRobotArrived(t) {
    this.robotManager.onRobotArrived(t);
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
  /** 맵 그래프 엣지 클릭 (속성 포함 MapGraphEdge 전달) */
  onEdgeClick(t) {
    this.onEdgeClickCb = t;
  }
  dispose() {
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown), this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp), window.removeEventListener("resize", this.handleResize), this.controls.dispose(), this.renderer.dispose(), this.wallBuilder.clearAll(), this.robotManager.dispose(), this.mapGraph.dispose(), this.clearAutoWalls();
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
class At {
  constructor() {
    this.scaleX = 1, this.scaleY = 1, this.originX = 0, this.originY = 0;
  }
  setCalibration(t) {
    this.cal = t, this.originX = t.originX ?? 0, this.originY = t.originY ?? 0, this.scaleX = t.realWidthM / t.imageWidthPx, this.scaleY = t.realHeightM / t.imageHeightPx;
  }
  /** 픽셀 하나 → 월드 (x, z) */
  toWorld(t, e) {
    const s = this.cal.imageWidthPx / 2, i = this.cal.imageHeightPx / 2, o = (t - s) * this.scaleX + this.originX, a = -(e - i) * this.scaleY + this.originY;
    return { x: o, z: a };
  }
  /** 점 배열 → 월드 (x, z) 배열 */
  toWorldPoints(t) {
    return t.map((e) => this.toWorld(e.x, e.y));
  }
}
export {
  Tt as AcsViewer,
  yt as MapGraphRenderer,
  At as MapTransform,
  O as NODE_KIND_COLOR,
  ft as RobotManager,
  F as STATUS_COLOR,
  gt as WallBuilder,
  Ct as convertAxbisBusinessMap,
  Et as extractPgmWallBoxes,
  Dt as loadAxbisMapFromFiles,
  Pt as parseMapYaml,
  Mt as parsePGM,
  xt as pgmToCanvas
};
