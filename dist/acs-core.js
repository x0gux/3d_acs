import * as r from "three";
import { Controls as j, Vector3 as E, MOUSE as T, TOUCH as M, Quaternion as R, Spherical as A, Vector2 as w, Ray as v, Plane as U, MathUtils as z, BufferGeometry as H, BufferAttribute as W } from "three";
const C = { type: "change" }, S = { type: "start" }, I = { type: "end" }, D = new v(), O = new U(), Y = Math.cos(70 * z.DEG2RAD), _ = new E(), b = 2 * Math.PI, m = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, x = 1e-6;
class N extends j {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, e = null) {
    super(t, e), this.state = m.NONE, this.target = new E(), this.cursor = new E(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: T.ROTATE, MIDDLE: T.DOLLY, RIGHT: T.PAN }, this.touches = { ONE: M.ROTATE, TWO: M.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._cursorStyle = "auto", this._domElementKeyEvents = null, this._lastPosition = new E(), this._lastQuaternion = new R(), this._lastTargetPosition = new E(), this._quat = new R().setFromUnitVectors(t.up, new E(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new A(), this._sphericalDelta = new A(), this._scale = 1, this._panOffset = new E(), this._rotateStart = new w(), this._rotateEnd = new w(), this._rotateDelta = new w(), this._panStart = new w(), this._panEnd = new w(), this._panDelta = new w(), this._dollyStart = new w(), this._dollyEnd = new w(), this._dollyDelta = new w(), this._dollyDirection = new E(), this._mouse = new w(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = B.bind(this), this._onPointerDown = G.bind(this), this._onPointerUp = X.bind(this), this._onContextMenu = $.bind(this), this._onMouseWheel = F.bind(this), this._onKeyDown = V.bind(this), this._onTouchStart = q.bind(this), this._onTouchMove = Q.bind(this), this._onMouseDown = Z.bind(this), this._onMouseMove = K.bind(this), this._interceptControlDown = J.bind(this), this._interceptControlUp = tt.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
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
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(C), this.update(), this.state = m.NONE;
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
    _.copy(e).sub(this.target), _.applyQuaternion(this._quat), this._spherical.setFromVector3(_), this.autoRotate && this.state === m.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let s = this.minAzimuthAngle, i = this.maxAzimuthAngle;
    isFinite(s) && isFinite(i) && (s < -Math.PI ? s += b : s > Math.PI && (s -= b), i < -Math.PI ? i += b : i > Math.PI && (i -= b), s <= i ? this._spherical.theta = Math.max(s, Math.min(i, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (s + i) / 2 ? Math.max(s, this._spherical.theta) : Math.min(i, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let a = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const h = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), a = h != this._spherical.radius;
    }
    if (_.setFromSpherical(this._spherical), _.applyQuaternion(this._quatInverse), e.copy(this.target).add(_), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let h = null;
      if (this.object.isPerspectiveCamera) {
        const u = _.length();
        h = this._clampDistance(u * this._scale);
        const l = u - h;
        this.object.position.addScaledVector(this._dollyDirection, l), this.object.updateMatrixWorld(), a = !!l;
      } else if (this.object.isOrthographicCamera) {
        const u = new E(this._mouse.x, this._mouse.y, 0);
        u.unproject(this.object);
        const l = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), a = l !== this.object.zoom;
        const p = new E(this._mouse.x, this._mouse.y, 0);
        p.unproject(this.object), this.object.position.sub(p).add(u), this.object.updateMatrixWorld(), h = _.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      h !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(h).add(this.object.position) : (D.origin.copy(this.object.position), D.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(D.direction)) < Y ? this.object.lookAt(this.target) : (O.setFromNormalAndCoplanarPoint(this.object.up, this.target), D.intersectPlane(O, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const h = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), h !== this.object.zoom && (this.object.updateProjectionMatrix(), a = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, a || this._lastPosition.distanceToSquared(this.object.position) > x || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > x || this._lastTargetPosition.distanceToSquared(this.target) > x ? (this.dispatchEvent(C), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? b / 60 * this.autoRotateSpeed * t : b / 60 / 60 * this.autoRotateSpeed;
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
    _.setFromMatrixColumn(e, 0), _.multiplyScalar(-t), this._panOffset.add(_);
  }
  _panUp(t, e) {
    this.screenSpacePanning === !0 ? _.setFromMatrixColumn(e, 1) : (_.setFromMatrixColumn(e, 0), _.crossVectors(this.object.up, _)), _.multiplyScalar(t), this._panOffset.add(_);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, e) {
    const s = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const i = this.object.position;
      _.copy(i).sub(this.target);
      let a = _.length();
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
    const s = this.domElement.getBoundingClientRect(), i = t - s.left, a = e - s.top, h = s.width, u = s.height;
    this._mouse.x = i / h * 2 - 1, this._mouse.y = -(a / u) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
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
    this._rotateLeft(b * this._rotateDelta.x / e.clientHeight), this._rotateUp(b * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
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
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(b * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), e = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(-b * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), e = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(b * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), e = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(-b * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), e = !0;
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
    this._rotateLeft(b * this._rotateDelta.x / e.clientHeight), this._rotateUp(b * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd);
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
    const h = (t.pageX + e.x) * 0.5, u = (t.pageY + e.y) * 0.5;
    this._updateZoomParameters(h, u);
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
    e === void 0 && (e = new w(), this._pointerPositions[t.pointerId] = e), e.set(t.pageX, t.pageY);
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
function G(o) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(o.pointerId), this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(o) && (this._addPointer(o), o.pointerType === "touch" ? this._onTouchStart(o) : this._onMouseDown(o), this._cursorStyle === "grab" && (this.domElement.style.cursor = "grabbing")));
}
function B(o) {
  this.enabled !== !1 && (o.pointerType === "touch" ? this._onTouchMove(o) : this._onMouseMove(o));
}
function X(o) {
  switch (this._removePointer(o), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(o.pointerId), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(I), this.state = m.NONE, this._cursorStyle === "grab" && (this.domElement.style.cursor = "grab");
      break;
    case 1:
      const t = this._pointers[0], e = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: e.x, pageY: e.y });
      break;
  }
}
function Z(o) {
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
      this._handleMouseDownDolly(o), this.state = m.DOLLY;
      break;
    case T.ROTATE:
      if (o.ctrlKey || o.metaKey || o.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(o), this.state = m.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(o), this.state = m.ROTATE;
      }
      break;
    case T.PAN:
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
  this.state !== m.NONE && this.dispatchEvent(S);
}
function K(o) {
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
function F(o) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== m.NONE || (o.preventDefault(), this.dispatchEvent(S), this._handleMouseWheel(this._customWheelEvent(o)), this.dispatchEvent(I));
}
function V(o) {
  this.enabled !== !1 && this._handleKeyDown(o);
}
function q(o) {
  switch (this._trackPointer(o), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case M.ROTATE:
          if (this.enableRotate === !1) {
            this.state = m.NONE;
            break;
          }
          this._handleTouchStartRotate(o), this.state = m.TOUCH_ROTATE;
          break;
        case M.PAN:
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
        case M.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(o), this.state = m.TOUCH_DOLLY_PAN;
          break;
        case M.DOLLY_ROTATE:
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
  this.state !== m.NONE && this.dispatchEvent(S);
}
function Q(o) {
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
function $(o) {
  this.enabled !== !1 && o.preventDefault();
}
function J(o) {
  o.key === "Control" && (this._controlActive = !0, this.domElement.ownerDocument.addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function tt(o) {
  o.key === "Control" && (this._controlActive = !1, this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function et(o, t = !1) {
  const e = o[0].index !== null, s = new Set(Object.keys(o[0].attributes)), i = new Set(Object.keys(o[0].morphAttributes)), a = {}, h = {}, u = o[0].morphTargetsRelative, l = new H();
  l.morphTargetsRelative = u;
  let p = 0;
  for (let n = 0; n < o.length; ++n) {
    const d = o[n];
    let f = 0, g = 0;
    if (e !== (d.index !== null))
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."), null;
    for (const c in d.attributes) {
      if (!s.has(c))
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + '. All geometries must have compatible attributes; make sure "' + c + '" attribute exists among all geometries, or in none of them.'), null;
      a[c] === void 0 && (a[c] = []), a[c].push(d.attributes[c]), f++;
    }
    if (f !== s.size)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". Make sure all geometries have the same number of attributes."), null;
    if (u !== d.morphTargetsRelative)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". .morphTargetsRelative must be consistent throughout all geometries."), null;
    for (const c in d.morphAttributes) {
      if (!i.has(c))
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ".  .morphAttributes must be consistent throughout all geometries."), null;
      if (d.morphAttributes[c].length !== o[0].morphAttributes[c].length)
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + '. All geometries must have the same number of morph targets for the "' + c + '" morph attribute.'), null;
      h[c] === void 0 && (h[c] = []), h[c].push(d.morphAttributes[c]), g++;
    }
    if (g !== i.size)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". Make sure all geometries have the same number of morph attributes."), null;
    if (t) {
      let c;
      if (e)
        c = d.index.count;
      else if (d.attributes.position !== void 0)
        c = d.attributes.position.count;
      else
        return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + n + ". The geometry must have either an index or a position attribute"), null;
      l.addGroup(p, c, n), p += c;
    }
  }
  if (e) {
    let n = 0;
    const d = [];
    for (let f = 0; f < o.length; ++f) {
      const g = o[f].index;
      for (let c = 0; c < g.count; ++c)
        d.push(g.getX(c) + n);
      n += o[f].attributes.position.count;
    }
    l.setIndex(d);
  }
  for (const n in a) {
    const d = k(a[n]);
    if (!d)
      return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + n + " attribute."), null;
    l.setAttribute(n, d);
  }
  for (const n in h) {
    const d = h[n][0].length;
    if (d !== 0) {
      l.morphAttributes = l.morphAttributes || {}, l.morphAttributes[n] = [];
      for (let f = 0; f < d; ++f) {
        const g = [];
        for (let y = 0; y < h[n].length; ++y)
          g.push(h[n][y][f]);
        const c = k(g);
        if (!c)
          return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + n + " morphAttribute."), null;
        l.morphAttributes[n].push(c);
      }
    }
  }
  return l;
}
function k(o) {
  let t, e, s, i = -1, a = 0;
  for (let p = 0; p < o.length; ++p) {
    const n = o[p];
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
  const h = new t(a), u = new W(h, e, s);
  let l = 0;
  for (let p = 0; p < o.length; ++p) {
    const n = o[p];
    if (n.isInterleavedBufferAttribute) {
      const d = l / e;
      for (let f = 0, g = n.count; f < g; f++)
        for (let c = 0; c < e; c++) {
          const y = n.getComponent(f, c);
          u.setComponent(f + d, c, y);
        }
    } else
      h.set(n.array, l);
    l += n.count * e;
  }
  return i !== void 0 && (u.gpuType = i), u;
}
class it {
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
    for (let p = 0; p < t.length; p++) {
      const n = t[p], d = t[(p + 1) % t.length], f = d.x - n.x, g = d.z - n.z, c = Math.hypot(f, g);
      if (c < 1e-4) continue;
      const y = new r.BoxGeometry(
        e.thicknessM,
        e.heightM,
        c + e.thicknessM
      );
      y.rotateY(Math.atan2(f, g)), y.translate((n.x + d.x) / 2, e.heightM / 2, (n.z + d.z) / 2), i.push(y);
    }
    if (i.length === 0)
      throw new Error("유효한 벽 변이 없습니다.");
    const a = et(i);
    if (i.forEach((p) => p.dispose()), !a)
      throw new Error("벽 지오메트리 병합에 실패했습니다.");
    const h = new r.MeshStandardMaterial({ color: s }), u = new r.Mesh(a, h);
    u.userData.wallId = `wall_${++this.counter}`, this.scene.add(u);
    const l = u.userData.wallId;
    return this.walls.set(l, u), l;
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
const L = {
  running: 2278750,
  // 녹색
  idle: 9741240,
  // 회색
  charging: 3900150,
  // 파랑
  error: 15680580
  // 빨강
};
class st {
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
    const e = L[t.status] ?? L.idle, s = t.theta !== void 0 && t.theta !== null;
    let i = this.robots.get(t.id);
    if (i)
      i.target = { x: t.x, z: t.y }, i.status = t.status, i.lastUpdate = Date.now(), i.hasTargetHeading = s, s && (i.targetHeading = -r.MathUtils.degToRad(t.theta));
    else {
      if (this.count >= this.maxCount) return;
      const a = this.count++;
      this.instanceIndex.set(t.id, a), this.mesh.count = this.count, i = {
        id: t.id,
        current: { x: t.x, z: t.y },
        target: { x: t.x, z: t.y },
        heading: s ? -r.MathUtils.degToRad(t.theta) : 0,
        targetHeading: s ? -r.MathUtils.degToRad(t.theta) : 0,
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
      for (const [a, h] of this.instanceIndex)
        if (h === s) {
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
      const a = i.target.x - i.current.x, h = i.target.z - i.current.z;
      i.current.x += a * e, i.current.z += h * e, i.hasTargetHeading || Math.hypot(a, h) > 0.05 && (i.targetHeading = Math.atan2(a, h));
      let u = i.targetHeading - i.heading;
      for (; u > Math.PI; ) u -= Math.PI * 2;
      for (; u < -Math.PI; ) u += Math.PI * 2;
      i.heading += u * s;
      const l = this.instanceIndex.get(i.id);
      this.dummy.position.set(i.current.x, 0.3, i.current.z), this.dummy.rotation.set(0, i.heading, 0), this.dummy.updateMatrix(), this.mesh.setMatrixAt(l, this.dummy.matrix);
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
class nt {
  constructor(t, e = {}) {
    this.raycaster = new r.Raycaster(), this.clock = new r.Clock(), this.calibration = null, this.mapPlane = null, this.wallDrawing = !1, this.wallMarkers = new r.Group(), this.markerGeo = new r.SphereGeometry(0.15, 12, 12), this.markerMat = new r.MeshBasicMaterial({ color: 2282478 }), this.previewPositions = new Float32Array(512 * 3), this.previewGeo = new r.BufferGeometry(), this.downX = 0, this.downY = 0, this.handlePointerDown = (l) => {
      this.downX = l.clientX, this.downY = l.clientY;
    }, this.handlePointerUp = (l) => {
      var f, g, c, y;
      if (Math.hypot(l.clientX - this.downX, l.clientY - this.downY) > 5) return;
      if (this.wallDrawing) {
        const P = this.raycastFloor(l.clientX, l.clientY);
        P && this.addWallPointWorld(P.x, P.z);
        return;
      }
      if (!this.setRaycasterFromScreen(l.clientX, l.clientY)) return;
      const n = (f = this.raycaster.intersectObject(this.robotManager.getMesh())[0]) == null ? void 0 : f.instanceId;
      if (n !== void 0) {
        const P = this.robotManager.getRobotIdByInstance(n);
        if (P) {
          (g = this.onRobotClickCb) == null || g.call(this, P);
          return;
        }
      }
      const d = this.wallBuilder.raycastWalls(this.raycaster);
      d ? (this.wallBuilder.setSelected(d.wallId), (c = this.onWallSelectedCb) == null || c.call(this, d.wallId)) : (this.wallBuilder.setSelected(null), (y = this.onWallSelectedCb) == null || y.call(this, null));
    }, this.animate = () => {
      requestAnimationFrame(() => this.animate());
      const l = this.clock.getDelta();
      this.robotManager.update(l), this.controls.update(), this.renderer.render(this.scene, this.camera);
    }, this.pendingPoints = [], this.container = t;
    const s = e.width ?? (t.clientWidth || 800), i = e.height ?? (t.clientHeight || 600);
    this.scene = new r.Scene(), this.scene.background = new r.Color(e.backgroundColor ?? 725280), this.scene.fog = new r.Fog(
      725280,
      e.fogNear ?? 80,
      e.fogFar ?? 300
    ), this.camera = new r.PerspectiveCamera(50, s / i, 0.1, 500), this.camera.position.set(30, 28, 30), this.renderer = new r.WebGLRenderer({ antialias: !0 }), this.renderer.setSize(s, i), this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)), this.container.appendChild(this.renderer.domElement), this.controls = new N(this.camera, this.renderer.domElement), this.controls.enableDamping = !0, this.controls.dampingFactor = 0.05, this.controls.target.set(0, 0, 0);
    const a = new r.GridHelper(100, 50, 3359061, 1120295);
    this.scene.add(a);
    const h = new r.Mesh(
      new r.PlaneGeometry(120, 120),
      new r.MeshStandardMaterial({ color: 988970, roughness: 1 })
    );
    h.rotation.x = -Math.PI / 2, h.position.y = -0.01, this.scene.add(h), this.scene.add(new r.AmbientLight(16777215, 0.5));
    const u = new r.DirectionalLight(16777215, 1.2);
    u.position.set(30, 40, 20), this.scene.add(u), this.scene.add(this.wallMarkers), this.previewGeo.setAttribute(
      "position",
      new r.BufferAttribute(this.previewPositions, 3)
    ), this.previewGeo.setDrawRange(0, 0), this.previewLine = new r.Line(
      this.previewGeo,
      new r.LineBasicMaterial({ color: 2282478 })
    ), this.scene.add(this.previewLine), this.wallBuilder = new it(this.scene), this.robotManager = new st(this.scene), this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown), this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp), this.handleResize = this.handleResize.bind(this), window.addEventListener("resize", this.handleResize), this.animate();
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
  /** 맵 이미지를 3D 바닥에 텍스처로 깔기 */
  loadMapImage(t) {
    const e = (s) => {
      var l, p, n;
      if (s.colorSpace = r.SRGBColorSpace, this.mapPlane) {
        this.scene.remove(this.mapPlane), this.mapPlane.geometry.dispose();
        const d = this.mapPlane.material;
        (l = d.map) == null || l.dispose(), d.dispose();
      }
      const i = ((p = this.calibration) == null ? void 0 : p.realWidthM) ?? 50, a = ((n = this.calibration) == null ? void 0 : n.realHeightM) ?? 28, h = new r.PlaneGeometry(i, a), u = new r.MeshStandardMaterial({ map: s, roughness: 1 });
      this.mapPlane = new r.Mesh(h, u), this.mapPlane.rotation.x = -Math.PI / 2, this.mapPlane.position.y = 0.01, this.scene.add(this.mapPlane);
    };
    if (typeof t == "string")
      new r.TextureLoader().load(t, e);
    else {
      const s = new r.Texture(t);
      s.needsUpdate = !0, e(s);
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
    const s = new r.Mesh(this.markerGeo, this.markerMat);
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
  // 카메라 프리셋
  // ───────────────────────────────────────────────────────
  /** 정상단(top-down) 뷰 — 외곽선 그리기에 유용 */
  setTopView() {
    this.camera.position.set(0, 60, 1e-3), this.controls.target.set(0, 0, 0), this.camera.lookAt(0, 0, 0), this.controls.update();
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
  dispose() {
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown), this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp), window.removeEventListener("resize", this.handleResize), this.controls.dispose(), this.renderer.dispose(), this.wallBuilder.clearAll(), this.robotManager.dispose();
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
class at {
  constructor() {
    this.scaleX = 1, this.scaleY = 1, this.originX = 0, this.originY = 0;
  }
  setCalibration(t) {
    this.cal = t, this.originX = t.originX ?? 0, this.originY = t.originY ?? 0, this.scaleX = t.realWidthM / t.imageWidthPx, this.scaleY = t.realHeightM / t.imageHeightPx;
  }
  /** 픽셀 하나 → 월드 (x, z) */
  toWorld(t, e) {
    const s = this.cal.imageWidthPx / 2, i = this.cal.imageHeightPx / 2, a = (t - s) * this.scaleX + this.originX, h = -(e - i) * this.scaleY + this.originY;
    return { x: a, z: h };
  }
  /** 점 배열 → 월드 (x, z) 배열 */
  toWorldPoints(t) {
    return t.map((e) => this.toWorld(e.x, e.y));
  }
}
export {
  nt as AcsViewer,
  at as MapTransform,
  st as RobotManager,
  L as STATUS_COLOR,
  it as WallBuilder
};
