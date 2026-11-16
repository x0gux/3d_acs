import * as r from "three";
import { Controls as $, Vector3 as D, MOUSE as A, TOUCH as T, Quaternion as G, Spherical as U, Vector2 as S, Ray as q, Plane as Q, MathUtils as J } from "three";
const Y = { type: "change" }, j = { type: "start" }, Z = { type: "end" }, L = new q(), F = new Q(), tt = Math.cos(70 * J.DEG2RAD), x = new D(), E = 2 * Math.PI, b = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, z = 1e-6;
class et extends $ {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, e = null) {
    super(t, e), this.state = b.NONE, this.target = new D(), this.cursor = new D(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: A.ROTATE, MIDDLE: A.DOLLY, RIGHT: A.PAN }, this.touches = { ONE: T.ROTATE, TWO: T.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._cursorStyle = "auto", this._domElementKeyEvents = null, this._lastPosition = new D(), this._lastQuaternion = new G(), this._lastTargetPosition = new D(), this._quat = new G().setFromUnitVectors(t.up, new D(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new U(), this._sphericalDelta = new U(), this._scale = 1, this._panOffset = new D(), this._rotateStart = new S(), this._rotateEnd = new S(), this._rotateDelta = new S(), this._panStart = new S(), this._panEnd = new S(), this._panDelta = new S(), this._dollyStart = new S(), this._dollyEnd = new S(), this._dollyDelta = new S(), this._dollyDirection = new D(), this._mouse = new S(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = it.bind(this), this._onPointerDown = st.bind(this), this._onPointerUp = ot.bind(this), this._onContextMenu = dt.bind(this), this._onMouseWheel = rt.bind(this), this._onKeyDown = ht.bind(this), this._onTouchStart = lt.bind(this), this._onTouchMove = ct.bind(this), this._onMouseDown = nt.bind(this), this._onMouseMove = at.bind(this), this._interceptControlDown = ut.bind(this), this._interceptControlUp = pt.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
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
    this.state = b.NONE, this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.ownerDocument.removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { capture: !0 }), this._controlActive = !1, this._pointers.length = 0, this._pointerPositions = {}, this.domElement.style.touchAction = "", this.domElement.style.cursor = "auto";
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
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(Y), this.update(), this.state = b.NONE;
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
    x.copy(e).sub(this.target), x.applyQuaternion(this._quat), this._spherical.setFromVector3(x), this.autoRotate && this.state === b.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let s = this.minAzimuthAngle, i = this.maxAzimuthAngle;
    isFinite(s) && isFinite(i) && (s < -Math.PI ? s += E : s > Math.PI && (s -= E), i < -Math.PI ? i += E : i > Math.PI && (i -= E), s <= i ? this._spherical.theta = Math.max(s, Math.min(i, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (s + i) / 2 ? Math.max(s, this._spherical.theta) : Math.min(i, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let o = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const h = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), o = h != this._spherical.radius;
    }
    if (x.setFromSpherical(this._spherical), x.applyQuaternion(this._quatInverse), e.copy(this.target).add(x), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let h = null;
      if (this.object.isPerspectiveCamera) {
        const l = x.length();
        h = this._clampDistance(l * this._scale);
        const c = l - h;
        this.object.position.addScaledVector(this._dollyDirection, c), this.object.updateMatrixWorld(), o = !!c;
      } else if (this.object.isOrthographicCamera) {
        const l = new D(this._mouse.x, this._mouse.y, 0);
        l.unproject(this.object);
        const c = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), o = c !== this.object.zoom;
        const n = new D(this._mouse.x, this._mouse.y, 0);
        n.unproject(this.object), this.object.position.sub(n).add(l), this.object.updateMatrixWorld(), h = x.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      h !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(h).add(this.object.position) : (L.origin.copy(this.object.position), L.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(L.direction)) < tt ? this.object.lookAt(this.target) : (F.setFromNormalAndCoplanarPoint(this.object.up, this.target), L.intersectPlane(F, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const h = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), h !== this.object.zoom && (this.object.updateProjectionMatrix(), o = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, o || this._lastPosition.distanceToSquared(this.object.position) > z || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > z || this._lastTargetPosition.distanceToSquared(this.target) > z ? (this.dispatchEvent(Y), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
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
    const s = this.domElement.getBoundingClientRect(), i = t - s.left, o = e - s.top, h = s.width, l = s.height;
    this._mouse.x = i / h * 2 - 1, this._mouse.y = -(o / l) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
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
    const h = (t.pageX + e.x) * 0.5, l = (t.pageY + e.y) * 0.5;
    this._updateZoomParameters(h, l);
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
function st(a) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(a.pointerId), this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(a) && (this._addPointer(a), a.pointerType === "touch" ? this._onTouchStart(a) : this._onMouseDown(a), this._cursorStyle === "grab" && (this.domElement.style.cursor = "grabbing")));
}
function it(a) {
  this.enabled !== !1 && (a.pointerType === "touch" ? this._onTouchMove(a) : this._onMouseMove(a));
}
function ot(a) {
  switch (this._removePointer(a), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(a.pointerId), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(Z), this.state = b.NONE, this._cursorStyle === "grab" && (this.domElement.style.cursor = "grab");
      break;
    case 1:
      const t = this._pointers[0], e = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: e.x, pageY: e.y });
      break;
  }
}
function nt(a) {
  let t;
  switch (a.button) {
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
      this._handleMouseDownDolly(a), this.state = b.DOLLY;
      break;
    case A.ROTATE:
      if (a.ctrlKey || a.metaKey || a.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(a), this.state = b.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(a), this.state = b.ROTATE;
      }
      break;
    case A.PAN:
      if (a.ctrlKey || a.metaKey || a.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(a), this.state = b.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(a), this.state = b.PAN;
      }
      break;
    default:
      this.state = b.NONE;
  }
  this.state !== b.NONE && this.dispatchEvent(j);
}
function at(a) {
  switch (this.state) {
    case b.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(a);
      break;
    case b.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(a);
      break;
    case b.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(a);
      break;
  }
}
function rt(a) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== b.NONE || (a.preventDefault(), this.dispatchEvent(j), this._handleMouseWheel(this._customWheelEvent(a)), this.dispatchEvent(Z));
}
function ht(a) {
  this.enabled !== !1 && this._handleKeyDown(a);
}
function lt(a) {
  switch (this._trackPointer(a), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case T.ROTATE:
          if (this.enableRotate === !1) {
            this.state = b.NONE;
            break;
          }
          this._handleTouchStartRotate(a), this.state = b.TOUCH_ROTATE;
          break;
        case T.PAN:
          if (this.enablePan === !1) {
            this.state = b.NONE;
            break;
          }
          this._handleTouchStartPan(a), this.state = b.TOUCH_PAN;
          break;
        default:
          this.state = b.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case T.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(a), this.state = b.TOUCH_DOLLY_PAN;
          break;
        case T.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(a), this.state = b.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = b.NONE;
      }
      break;
    default:
      this.state = b.NONE;
  }
  this.state !== b.NONE && this.dispatchEvent(j);
}
function ct(a) {
  switch (this._trackPointer(a), this.state) {
    case b.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(a), this.update();
      break;
    case b.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(a), this.update();
      break;
    case b.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(a), this.update();
      break;
    case b.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(a), this.update();
      break;
    default:
      this.state = b.NONE;
  }
}
function dt(a) {
  this.enabled !== !1 && a.preventDefault();
}
function ut(a) {
  a.key === "Control" && (this._controlActive = !0, this.domElement.ownerDocument.addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function pt(a) {
  a.key === "Control" && (this._controlActive = !1, this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
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
    this.walls = /* @__PURE__ */ new Map(), this.counter = 0, this.selectedId = null, this._v = new r.Vector3(), this.autoWallId = null, this.scene = t, this.fade = { ...mt, ...e };
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
    const o = i > 0, h = new r.Group(), l = [];
    for (let n = 0; n < t.length; n++) {
      const d = t[n], u = t[(n + 1) % t.length], g = u.x - d.x, f = u.z - d.z, y = Math.hypot(g, f);
      if (y < 1e-4) continue;
      const p = new r.BoxGeometry(
        e.thicknessM,
        e.heightM,
        y + e.thicknessM
      );
      p.rotateY(Math.atan2(g, f)), p.translate((d.x + u.x) / 2, e.heightM / 2, (d.z + u.z) / 2);
      const M = new r.MeshStandardMaterial({
        color: s,
        transparent: !0
      }), m = new r.Mesh(p, M);
      let _, w;
      o ? (_ = -f / y, w = g / y) : (_ = f / y, w = -g / y), l.push({
        mesh: m,
        midpoint: new r.Vector3(
          (d.x + u.x) / 2,
          e.heightM / 2,
          (d.z + u.z) / 2
        ),
        outward: new r.Vector3(-_, 0, -w),
        opacity: 1
      }), h.add(m);
    }
    if (l.length === 0)
      throw this.disposeGroup(h), new Error("유효한 벽 변이 없습니다.");
    this.scene.add(h);
    const c = `wall_${++this.counter}`;
    return h.userData.wallId = c, this.walls.set(c, { group: h, segments: l }), c;
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
    const { minOpacity: s, fadeStart: i, fadeEnd: o, fadeSpeed: h } = this.fade, l = Math.max(o - i, 1e-3), c = 1 - Math.exp(-h * Math.min(e, 0.1)), n = t.position;
    for (const d of this.walls.values())
      for (const u of d.segments) {
        this._v.subVectors(n, u.midpoint);
        const g = this._v.length();
        if (g < 1e-6) continue;
        this._v.multiplyScalar(1 / g);
        const f = this._v.dot(u.outward), y = u.bothSides ? Math.abs(f) : f, p = Math.min(Math.max((y - i) / l, 0), 1), m = 1 - p * p * (3 - 2 * p) * (1 - s);
        u.opacity += (m - u.opacity) * c, u.mesh.material.opacity = u.opacity;
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
    const s = e.heightM ?? 2.5, i = e.color ?? 4674921, o = new r.Group(), h = [];
    for (const c of t) {
      const n = new r.BoxGeometry(c.widthM, s, c.depthM);
      n.translate(c.x, s / 2, c.z);
      const d = new r.MeshStandardMaterial({
        color: i,
        transparent: !0
      }), u = new r.Mesh(n, d), g = c.widthM >= c.depthM ? new r.Vector3(0, 0, 1) : new r.Vector3(1, 0, 0);
      h.push({
        mesh: u,
        midpoint: new r.Vector3(c.x, s / 2, c.z),
        outward: g,
        opacity: 1,
        bothSides: !0
      }), o.add(u);
    }
    this.scene.add(o);
    const l = `auto_wall_${++this.counter}`;
    return o.userData.wallId = l, this.walls.set(l, { group: o, segments: h }), this.autoWallId = l, h.length;
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
      Array.isArray(o) ? o.forEach((h) => h.dispose()) : o == null || o.dispose();
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
const H = {
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
    this.robots = /* @__PURE__ */ new Map(), this.instanceIndex = /* @__PURE__ */ new Map(), this.dummy = new r.Object3D(), this.tmpMatrix = new r.Matrix4(), this.tmpColor = new r.Color(), this.count = 0, this.scene = t, this.maxCount = e;
    const s = new r.BoxGeometry(1.2, 0.6, 1.8), i = new r.MeshStandardMaterial({ roughness: 0.6 });
    this.mesh = new r.InstancedMesh(s, i, e), this.mesh.count = 0, this.mesh.instanceMatrix.setUsage(r.DynamicDrawUsage), this.mesh.frustumCulled = !1, this.mesh.name = "AcsRobots", t.add(this.mesh);
  }
  getMesh() {
    return this.mesh;
  }
  getRobotCount() {
    return this.robots.size;
  }
  /** 로봇 좌표 수신 (신규면 등록, 기존이면 목표 갱신) */
  updateRobotPose(t) {
    const e = H[t.status] ?? H.idle, s = t.theta !== void 0 && t.theta !== null;
    let i = this.robots.get(t.id);
    if (i)
      i.target = { x: t.x, z: t.y }, i.status = t.status, i.lastUpdate = Date.now(), i.hasTargetHeading = s, s && (i.targetHeading = -r.MathUtils.degToRad(t.theta));
    else {
      if (this.count >= this.maxCount) return;
      const o = this.count++;
      this.instanceIndex.set(t.id, o), this.mesh.count = this.count, i = {
        id: t.id,
        current: { x: t.x, z: t.y },
        target: { x: t.x, z: t.y },
        heading: s ? -r.MathUtils.degToRad(t.theta) : 0,
        targetHeading: s ? -r.MathUtils.degToRad(t.theta) : 0,
        hasTargetHeading: s,
        status: t.status,
        lastUpdate: Date.now()
      }, this.robots.set(t.id, i), this.dummy.position.set(i.current.x, 0.3, i.current.z), this.dummy.rotation.set(0, i.heading, 0), this.dummy.updateMatrix(), this.mesh.setMatrixAt(o, this.dummy.matrix);
    }
    this.tmpColor.setHex(e), this.mesh.setColorAt(this.instanceIndex.get(t.id), this.tmpColor), this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = !0);
  }
  removeRobot(t) {
    const e = this.instanceIndex.get(t);
    if (e === void 0) return;
    const s = this.count - 1;
    if (e !== s) {
      let i = null;
      for (const [o, h] of this.instanceIndex)
        if (h === s) {
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
  /** 매 프레임 호출: Lerp 보간 + 인스턴스 행렬 갱신 */
  update(t) {
    if (this.robots.size === 0) return;
    const e = Math.min(1, t * 3), s = Math.min(1, t * 5);
    for (const i of this.robots.values()) {
      const o = i.target.x - i.current.x, h = i.target.z - i.current.z;
      i.current.x += o * e, i.current.z += h * e, i.hasTargetHeading || Math.hypot(o, h) > 0.05 && (i.targetHeading = Math.atan2(o, h));
      let l = i.targetHeading - i.heading;
      for (; l > Math.PI; ) l -= Math.PI * 2;
      for (; l < -Math.PI; ) l += Math.PI * 2;
      i.heading += l * s;
      const c = this.instanceIndex.get(i.id);
      this.dummy.position.set(i.current.x, 0.3, i.current.z), this.dummy.rotation.set(0, i.heading, 0), this.dummy.updateMatrix(), this.mesh.setMatrixAt(c, this.dummy.matrix);
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
const N = {
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
}, B = 2450411, wt = 6583435, _t = 16096779;
function X(a) {
  if (a.kind) return a.kind;
  const t = a.nodeId.toUpperCase();
  return t.startsWith("RACK") ? "rack" : /^T\d+$/.test(t) ? "charge" : "normal";
}
function bt(a, t) {
  const e = document.createElement("canvas"), s = 10, i = "bold 44px ui-monospace, SFMono-Regular, monospace", o = e.getContext("2d");
  o.font = i;
  const h = Math.ceil(o.measureText(a).width);
  e.width = h + s * 2, e.height = 60;
  const l = e.getContext("2d");
  l.font = i, l.fillStyle = "rgba(2, 6, 23, 0.78)", l.fillRect(0, 0, e.width, e.height), l.fillStyle = t, l.textBaseline = "middle", l.fillText(a, s, e.height / 2 + 2);
  const c = new r.CanvasTexture(e);
  c.colorSpace = r.SRGBColorSpace;
  const n = new r.Sprite(
    new r.SpriteMaterial({ map: c, transparent: !0, depthTest: !1 })
  ), d = 0.5;
  return n.scale.set(d * e.width / e.height, d, 1), n.renderOrder = 10, n.raycast = () => {
  }, n;
}
class yt {
  constructor(t) {
    this.group = new r.Group(), this.nodeMesh = null, this.nodeIds = [], this.nodeKindColors = [], this.nodePositions = /* @__PURE__ */ new Map(), this.lineSegments = null, this.lineColorAttr = null, this.edgeList = [], this.arrowMesh = null, this.arrowsVisible = !0, this.highlightedNodes = /* @__PURE__ */ new Set(), this.highlightedEdges = /* @__PURE__ */ new Set(), this.options = {
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
    var l, c;
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
      const d = Number((l = n.nodePosition) == null ? void 0 : l.x), u = Number((c = n.nodePosition) == null ? void 0 : c.y);
      if (isNaN(d) || isNaN(u)) continue;
      const g = d * s, f = i(u);
      o.push({ node: n, x: g, z: f }), this.nodePositions.set(n.nodeId, { x: g, z: f });
    }
    if (o.length > 0) {
      const n = this.options.nodeSize, d = new r.CylinderGeometry(n, n, 0.06, 24), u = new r.MeshBasicMaterial();
      this.nodeMesh = new r.InstancedMesh(d, u, o.length), this.nodeMesh.frustumCulled = !1, this.nodeMesh.name = "AcsGraphNodes";
      const g = new r.Object3D();
      o.forEach((f, y) => {
        this.nodeIds.push(f.node.nodeId);
        const p = new r.Color(
          N[X(f.node)] ?? N.normal
        );
        this.nodeKindColors.push(p), g.position.set(f.x, 0.04, f.z), g.scale.setScalar(1), g.updateMatrix(), this.nodeMesh.setMatrixAt(y, g.matrix), this.nodeMesh.setColorAt(y, p);
      }), this.nodeMesh.instanceColor && (this.nodeMesh.instanceColor.needsUpdate = !0), this.group.add(this.nodeMesh);
    }
    if (this.options.showLabels)
      for (const n of o) {
        const d = new r.Color(
          N[X(n.node)] ?? N.normal
        ), u = bt(n.node.nodeId, `#${d.getHexString()}`);
        u.position.set(n.x, 0.55, n.z), this.group.add(u);
      }
    const h = (t.edges ?? []).filter(
      (n) => this.nodePositions.has(n.startNodeId) && this.nodePositions.has(n.endNodeId)
    );
    if (h.length > 0) {
      const n = new Float32Array(h.length * 2 * 3), d = new Float32Array(h.length * 2 * 3), u = /* @__PURE__ */ new Map(), g = new Set(
        h.map((p) => `${p.startNodeId}->${p.endNodeId}`)
      ), f = [];
      h.forEach((p, M) => {
        const m = this.nodePositions.get(p.startNodeId), _ = this.nodePositions.get(p.endNodeId);
        n.set([m.x, 0.05, m.z, _.x, 0.05, _.z], M * 6);
        const w = p.edgeId ?? `${p.startNodeId}-${p.endNodeId}`, P = new r.Color(p.roadType ? _t : wt);
        d.set([P.r, P.g, P.b, P.r, P.g, P.b], M * 6);
        const C = { key: w, edge: p, vOff: M * 2, base: P, arrowIdx: -1 };
        this.edgeList.push(C), u.set(w, C), g.has(`${p.endNodeId}->${p.startNodeId}`) || f.push({
          key: w,
          mid: { x: (m.x + _.x) / 2, z: (m.z + _.z) / 2 },
          angleY: Math.atan2(_.x - m.x, _.z - m.z)
        });
      });
      const y = new r.BufferGeometry();
      if (y.setAttribute("position", new r.BufferAttribute(n, 3)), this.lineColorAttr = new r.BufferAttribute(d, 3), y.setAttribute("color", this.lineColorAttr), this.lineSegments = new r.LineSegments(
        y,
        new r.LineBasicMaterial({ vertexColors: !0 })
      ), this.lineSegments.frustumCulled = !1, this.group.add(this.lineSegments), this.options.showArrows && f.length > 0) {
        const p = new r.ConeGeometry(0.16, 0.45, 12);
        p.rotateX(Math.PI / 2);
        const M = new r.MeshBasicMaterial();
        this.arrowMesh = new r.InstancedMesh(p, M, f.length), this.arrowMesh.frustumCulled = !1, this.arrowMesh.name = "AcsGraphEdgeArrows", this.arrowMesh.visible = this.arrowsVisible;
        const m = new r.Object3D(), _ = new r.Color();
        f.forEach((w, P) => {
          m.position.set(w.mid.x, 0.12, w.mid.z), m.rotation.set(0, w.angleY, 0), m.scale.setScalar(1), m.updateMatrix(), this.arrowMesh.setMatrixAt(P, m.matrix);
          const C = u.get(w.key);
          C.arrowIdx = P, _.copy(C.base), this.arrowMesh.setColorAt(P, _);
        }), this.arrowMesh.instanceColor && (this.arrowMesh.instanceColor.needsUpdate = !0), this.group.add(this.arrowMesh);
      }
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
    const t = new r.Object3D(), e = new r.Color(B);
    this.nodeIds.forEach((s, i) => {
      const o = this.nodePositions.get(s), h = this.highlightedNodes.has(s);
      t.position.set(o.x, 0.04, o.z), t.scale.setScalar(h ? 1.6 : 1), t.updateMatrix(), this.nodeMesh.setMatrixAt(i, t.matrix), this.nodeMesh.setColorAt(i, h ? e : this.nodeKindColors[i]);
    }), this.nodeMesh.instanceMatrix.needsUpdate = !0, this.nodeMesh.instanceColor && (this.nodeMesh.instanceColor.needsUpdate = !0);
  }
  refreshEdgeColors() {
    var i;
    if (!this.lineColorAttr) return;
    const t = new r.Color(B), e = new r.Color(), s = this.lineColorAttr.array;
    for (const o of this.edgeList) {
      e.copy(this.highlightedEdges.has(o.key) ? t : o.base);
      for (const h of [o.vOff, o.vOff + 1])
        s[h * 3] = e.r, s[h * 3 + 1] = e.g, s[h * 3 + 2] = e.b;
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
const K = (a) => a === 32 || a === 9 || a === 10 || a === 13;
function Mt(a) {
  const t = new Uint8Array(a);
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
  const o = parseInt(s(), 10), h = parseInt(s(), 10), l = parseInt(s(), 10);
  if (!o || !h || !Number.isFinite(l) || l <= 0)
    throw new Error("PGM 헤더가 올바르지 않습니다.");
  const c = o * h, n = new Uint8Array(c);
  if (i === "P5")
    if (e++, l < 256)
      for (let d = 0; d < c; d++)
        n[d] = Math.round(t[e + d] * 255 / l);
    else
      for (let d = 0; d < c; d++) {
        const u = t[e + d * 2] << 8 | t[e + d * 2 + 1];
        n[d] = Math.round(u * 255 / l);
      }
  else
    for (let d = 0; d < c; d++) {
      const u = parseInt(s(), 10);
      n[d] = Math.round((Number.isNaN(u) ? 0 : u) * 255 / l);
    }
  return { width: o, height: h, gray: n };
}
function Pt(a) {
  const t = {};
  for (const e of a.split(/\r?\n/)) {
    const s = (e.split("#")[0] ?? "").trim();
    if (!s || s.startsWith("%")) continue;
    const i = s.indexOf(":");
    if (i < 0) continue;
    const o = s.slice(0, i).trim(), h = s.slice(i + 1).trim();
    switch (o) {
      case "image":
        t.image = h.replace(/["']/g, "");
        break;
      case "resolution": {
        const l = parseFloat(h);
        Number.isFinite(l) && (t.resolutionMPerPx = l);
        break;
      }
      case "origin": {
        const l = h.replace(/[\[\]]/g, "").split(",").map((c) => parseFloat(c.trim()));
        l.length >= 2 && Number.isFinite(l[0]) && Number.isFinite(l[1]) && (t.originX = l[0], t.originY = l[1]);
        break;
      }
      case "negate":
        t.negate = parseInt(h, 10) === 1;
        break;
      case "occupied_thresh": {
        const l = parseFloat(h);
        Number.isFinite(l) && (t.occupiedThresh = l);
        break;
      }
      case "free_thresh": {
        const l = parseFloat(h);
        Number.isFinite(l) && (t.freeThresh = l);
        break;
      }
    }
  }
  return t;
}
function xt(a, t = {}) {
  const { width: e, height: s, gray: i } = a, o = t.negate ?? !1, h = t.occupiedThresh ?? 0.65, l = t.freeThresh ?? 0.196, c = document.createElement("canvas");
  c.width = e, c.height = s;
  const n = c.getContext("2d"), d = n.createImageData(e, s), u = d.data;
  for (let g = 0; g < e * s; g++) {
    const f = i[g], y = (o ? f : 255 - f) / 255;
    let p, M, m;
    y > h ? (p = 30, M = 41, m = 59) : y < l ? (p = 226, M = 232, m = 240) : (p = 11, M = 17, m = 32), u[g * 4] = p, u[g * 4 + 1] = M, u[g * 4 + 2] = m, u[g * 4 + 3] = 255;
  }
  return n.putImageData(d, 0, 0), c;
}
function Et(a, t, e) {
  const { width: s, height: i, gray: o } = a, h = (e == null ? void 0 : e.negate) ?? t.negate ?? !1, l = (e == null ? void 0 : e.occupiedThresh) ?? t.occupiedThresh ?? 0.65, c = t.resolutionMPerPx ?? 0.05, n = t.originX ?? 0, d = t.originY ?? 0, u = (e == null ? void 0 : e.minComponentPixels) ?? 4, g = s * i, f = new Uint8Array(g);
  for (let p = 0; p < g; p++)
    f[p] = (h ? o[p] : 255 - o[p]) / 255 > l ? 1 : 0;
  if (u > 1) {
    const p = new Int32Array(g), M = [0], m = [];
    let _ = 0;
    for (let w = 0; w < g; w++) {
      if (!f[w] || p[w] !== 0) continue;
      _++;
      let P = 0;
      for (m.push(w), p[w] = _; m.length > 0; ) {
        const C = m.pop();
        P++;
        const I = C % s, V = (C - I) / s;
        for (let O = -1; O <= 1; O++)
          for (let k = -1; k <= 1; k++) {
            if (k === 0 && O === 0) continue;
            const v = I + k, W = V + O;
            if (v < 0 || v >= s || W < 0 || W >= i) continue;
            const R = W * s + v;
            f[R] && p[R] === 0 && (p[R] = _, m.push(R));
          }
      }
      M.push(P);
    }
    for (let w = 0; w < g; w++)
      f[w] && M[p[w]] < u && (f[w] = 0);
  }
  const y = [];
  for (let p = 0; p < i; p++) {
    const M = d + (i - 0.5 - p) * c;
    let m = -1;
    for (let _ = 0; _ <= s; _++) {
      const w = _ < s && f[p * s + _] === 1;
      w && m < 0 ? m = _ : !w && m >= 0 && (y.push({
        x: n + (m + _) / 2 * c,
        z: M,
        widthM: (_ - m) * c,
        depthM: c
      }), m = -1);
    }
  }
  return y;
}
function Ct(a) {
  var c;
  const t = a, e = (c = t.floorList) == null ? void 0 : c[0];
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
  })).filter((n) => i.has(n.startNodeId) && i.has(n.endNodeId)), h = {
    mapId: t.mapCode ?? e.floorNumber,
    mapName: e.floorName || e.floorNumber,
    nodes: s,
    edges: o
  }, l = {
    name: e.floorName || e.floorNumber || "-",
    lengthM: e.floorLength ?? 0,
    widthM: e.floorWidth ?? 0,
    version: e.floorMapVersion ?? "-"
  };
  return { graph: h, floorInfo: l };
}
async function Dt(a) {
  const t = a.find((n) => /\.pgm$/i.test(n.name)), e = a.find((n) => /\.(yaml|yml)$/i.test(n.name));
  let s;
  for (const n of a)
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
  const h = xt(i, o);
  let l = { nodes: [], edges: [] }, c = null;
  if (s) {
    const n = Ct(
      JSON.parse(await s.text())
    );
    l = n.graph, c = n.floorInfo;
  }
  return { canvas: h, meta: o, graph: l, floorInfo: c, pgm: i };
}
class Tt {
  constructor(t, e = {}) {
    this.raycaster = new r.Raycaster(), this.clock = new r.Clock(), this.calibration = null, this.mapPlane = null, this.wallDrawing = !1, this.wallMarkers = new r.Group(), this.markerGeo = new r.SphereGeometry(0.15, 12, 12), this.markerMat = new r.MeshBasicMaterial({ color: 2282478 }), this.previewPositions = new Float32Array(512 * 3), this.previewGeo = new r.BufferGeometry(), this.downX = 0, this.downY = 0, this.handlePointerDown = (c) => {
      this.downX = c.clientX, this.downY = c.clientY;
    }, this.handlePointerUp = (c) => {
      var y, p, M, m, _, w;
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
      const g = this.mapGraph.raycastEdge(this.raycaster);
      if (g) {
        this.mapGraph.highlightEdges([g.key]), (m = this.onEdgeClickCb) == null || m.call(this, g.edge);
        return;
      }
      const f = this.wallBuilder.raycastWalls(this.raycaster);
      f ? (this.wallBuilder.setSelected(f.wallId), (_ = this.onWallSelectedCb) == null || _.call(this, f.wallId)) : (this.wallBuilder.setSelected(null), (w = this.onWallSelectedCb) == null || w.call(this, null));
    }, this.animate = () => {
      requestAnimationFrame(() => this.animate());
      const c = this.clock.getDelta();
      this.robotManager.update(c), this.controls.update(), this.wallBuilder.updateViewDependentOpacity(this.camera, c), this.renderer.render(this.scene, this.camera);
    }, this.pendingPoints = [], this.container = t;
    const s = e.width ?? (t.clientWidth || 800), i = e.height ?? (t.clientHeight || 600);
    this.scene = new r.Scene(), this.scene.background = new r.Color(e.backgroundColor ?? 725280), this.scene.fog = new r.Fog(
      725280,
      e.fogNear ?? 80,
      e.fogFar ?? 300
    ), this.camera = new r.PerspectiveCamera(50, s / i, 0.1, 500), this.camera.position.set(30, 28, 30), this.renderer = new r.WebGLRenderer({ antialias: !0 }), this.renderer.setSize(s, i), this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)), this.container.appendChild(this.renderer.domElement), this.controls = new et(this.camera, this.renderer.domElement), this.controls.enableDamping = !0, this.controls.dampingFactor = 0.05, this.controls.target.set(0, 0, 0), this.raycaster.params.Line = { threshold: 0.35 };
    const o = new r.GridHelper(100, 50, 3359061, 1120295);
    this.scene.add(o);
    const h = new r.Mesh(
      new r.PlaneGeometry(120, 120),
      new r.MeshStandardMaterial({ color: 988970, roughness: 1 })
    );
    h.rotation.x = -Math.PI / 2, h.position.y = -0.01, this.scene.add(h), this.scene.add(new r.AmbientLight(16777215, 0.5));
    const l = new r.DirectionalLight(16777215, 1.2);
    l.position.set(30, 40, 20), this.scene.add(l), this.scene.add(this.wallMarkers), this.previewGeo.setAttribute(
      "position",
      new r.BufferAttribute(this.previewPositions, 3)
    ), this.previewGeo.setDrawRange(0, 0), this.previewLine = new r.Line(
      this.previewGeo,
      new r.LineBasicMaterial({ color: 2282478 })
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
    const i = new r.Vector2(
      (t - s.left) / s.width * 2 - 1,
      -((e - s.top) / s.height) * 2 + 1
    );
    return this.raycaster.setFromCamera(i, this.camera), !0;
  }
  /** 화면 클릭 좌표 → 바닥면(Y=0) 교차점 (월드 좌표) */
  raycastFloor(t, e) {
    if (!this.setRaycasterFromScreen(t, e)) return null;
    const s = new r.Plane(new r.Vector3(0, 1, 0), 0), i = new r.Vector3();
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
      var y, p, M, m, _, w, P, C;
      if (i.colorSpace = r.SRGBColorSpace, i.flipY = !1, this.mapPlane) {
        this.scene.remove(this.mapPlane), this.mapPlane.geometry.dispose();
        const I = this.mapPlane.material;
        (y = I.map) == null || y.dispose(), I.dispose();
      }
      const o = (e == null ? void 0 : e.widthPx) ?? ((p = this.calibration) == null ? void 0 : p.imageWidthPx) ?? 1024, h = (e == null ? void 0 : e.heightPx) ?? ((M = this.calibration) == null ? void 0 : M.imageHeightPx) ?? 1024, l = (e == null ? void 0 : e.resolutionMPerPx) ?? ((m = this.calibration) == null ? void 0 : m.resolutionMPerPx), c = l != null ? o * l : ((_ = this.calibration) == null ? void 0 : _.realWidthM) ?? 50, n = l != null ? h * l : ((w = this.calibration) == null ? void 0 : w.realHeightM) ?? 28;
      let d, u;
      (e == null ? void 0 : e.originX) !== void 0 || (e == null ? void 0 : e.originY) !== void 0 ? (d = e.originX ?? 0, u = e.originY ?? 0) : ((P = this.calibration) == null ? void 0 : P.originX) !== void 0 || ((C = this.calibration) == null ? void 0 : C.originY) !== void 0 ? (d = this.calibration.originX ?? 0, u = this.calibration.originY ?? 0) : (d = -c / 2, u = -n / 2), this.calibration = {
        imageWidthPx: o,
        imageHeightPx: h,
        realWidthM: c,
        realHeightM: n,
        originX: d,
        originY: u,
        resolutionMPerPx: l ?? void 0
      };
      const g = new r.PlaneGeometry(c, n), f = new r.MeshStandardMaterial({ map: i, roughness: 1 });
      this.mapPlane = new r.Mesh(g, f), this.mapPlane.rotation.x = -Math.PI / 2, this.mapPlane.position.set(d + c / 2, 0.01, u + n / 2), this.scene.add(this.mapPlane);
    };
    if (typeof t == "string")
      new r.TextureLoader().load(t, s);
    else {
      const i = t instanceof HTMLCanvasElement ? new r.CanvasTexture(t) : new r.Texture(t);
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
    const s = new r.Mesh(this.markerGeo, this.markerMat);
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
    const s = this.cal.imageWidthPx / 2, i = this.cal.imageHeightPx / 2, o = (t - s) * this.scaleX + this.originX, h = -(e - i) * this.scaleY + this.originY;
    return { x: o, z: h };
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
  N as NODE_KIND_COLOR,
  ft as RobotManager,
  H as STATUS_COLOR,
  gt as WallBuilder,
  Ct as convertAxbisBusinessMap,
  Et as extractPgmWallBoxes,
  Dt as loadAxbisMapFromFiles,
  Pt as parseMapYaml,
  Mt as parsePGM,
  xt as pgmToCanvas
};
