import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, RotateCw, Box, Compass, Sparkles } from 'lucide-react';

export default function ThreeViewer({
  modelType = 'dining_table',
  currentFinish = 'sheesham_natural',
  showControls = true,
  height = '520px'
}) {
  const mountRef = useRef(null);
  const [exploded, setExploded] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);

  // References to animate parts
  const partsRef = useRef([]);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameIdRef = useRef(null);

  // Material finish configurations (PBR properties)
  const finishProfiles = {
    sheesham_natural: {
      name: 'Seasoned Sheesham (Natural Oil)',
      color: 0x4a2c1d,
      roughness: 0.38,
      metalness: 0.05,
      clearcoat: 0.15
    },
    teak_honey: {
      name: 'Royal Jodhpur Teak (Honey Satin)',
      color: 0x7a4e28,
      roughness: 0.32,
      metalness: 0.04,
      clearcoat: 0.25
    },
    ebonized_ash: {
      name: 'Ebonized Dark Ash',
      color: 0x1a1a1c,
      roughness: 0.45,
      metalness: 0.02,
      clearcoat: 0.08
    },
    acacia_warm: {
      name: 'Reclaimed Acacia (Umber Wax)',
      color: 0x5e3d24,
      roughness: 0.42,
      metalness: 0.03,
      clearcoat: 0.12
    },
    cast_brass: {
      name: 'Sand-Cast Raw Brass',
      color: 0xc5a880,
      roughness: 0.28,
      metalness: 0.88,
      clearcoat: 0.4
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const heightPx = parseInt(height, 10) || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 100);
    camera.position.set(3.8, 2.5, 4.2);

    // 3. Renderer with antialiasing & shadow map
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting setup (Architectural Atelier Studio Lighting)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.1);
    fillLight.position.set(-5, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc5a880, 1.6);
    rimLight.position.set(0, -3, -5);
    scene.add(rimLight);

    // Ground plane with subtle shadow catching
    const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.01;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 5. Build Parametric Model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    partsRef.current = [];

    const activeFinish = finishProfiles[currentFinish] || finishProfiles.sheesham_natural;

    function createWoodMat(color = activeFinish.color) {
      return new THREE.MeshStandardMaterial({
        color: color,
        roughness: activeFinish.roughness,
        metalness: activeFinish.metalness,
        wireframe: wireframeMode
      });
    }

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc5a880,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: wireframeMode
    });

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.65,
      metalness: 0.05,
      wireframe: wireframeMode
    });

    if (modelType === 'dining_table') {
      // Top Solid Slab (Chamfered edge)
      const topGeo = new THREE.BoxGeometry(2.4, 0.08, 1.0);
      const topMesh = new THREE.Mesh(topGeo, createWoodMat());
      topMesh.position.set(0, 0.74, 0);
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      modelGroup.add(topMesh);
      partsRef.current.push({ mesh: topMesh, origin: [0, 0.74, 0], offset: [0, 0.45, 0] });

      // Butterfly Inlay Keys (Precision Brass Inlay)
      [-0.6, 0.6].forEach(x => {
        const keyGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.085, 6);
        const keyMesh = new THREE.Mesh(keyGeo, brassMat);
        keyMesh.position.set(x, 0.745, 0.2);
        modelGroup.add(keyMesh);
        partsRef.current.push({ mesh: keyMesh, origin: [x, 0.745, 0.2], offset: [x * 0.2, 0.6, 0.2] });
      });

      // Left Trestle Leg Assembly
      const legLeftGeo = new THREE.BoxGeometry(0.12, 0.7, 0.75);
      const legLeft = new THREE.Mesh(legLeftGeo, createWoodMat());
      legLeft.position.set(-0.8, 0.35, 0);
      legLeft.castShadow = true;
      modelGroup.add(legLeft);
      partsRef.current.push({ mesh: legLeft, origin: [-0.8, 0.35, 0], offset: [-0.4, 0, 0] });

      // Right Trestle Leg Assembly
      const legRightGeo = new THREE.BoxGeometry(0.12, 0.7, 0.75);
      const legRight = new THREE.Mesh(legRightGeo, createWoodMat());
      legRight.position.set(0.8, 0.35, 0);
      legRight.castShadow = true;
      modelGroup.add(legRight);
      partsRef.current.push({ mesh: legRight, origin: [0.8, 0.35, 0], offset: [0.4, 0, 0] });

      // Stretcher Center Beam (Through-tenon joinery)
      const stretcherGeo = new THREE.BoxGeometry(1.6, 0.08, 0.12);
      const stretcher = new THREE.Mesh(stretcherGeo, createWoodMat());
      stretcher.position.set(0, 0.25, 0);
      stretcher.castShadow = true;
      modelGroup.add(stretcher);
      partsRef.current.push({ mesh: stretcher, origin: [0, 0.25, 0], offset: [0, -0.2, 0] });

      // Brass Floor Glides
      [-0.8, 0.8].forEach(x => {
        [-0.3, 0.3].forEach(z => {
          const footGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.04, 16);
          const footMesh = new THREE.Mesh(footGeo, brassMat);
          footMesh.position.set(x, 0.02, z);
          modelGroup.add(footMesh);
          partsRef.current.push({ mesh: footMesh, origin: [x, 0.02, z], offset: [x * 0.3, -0.15, z * 0.3] });
        });
      });
    } else if (modelType === 'lounge_chair') {
      // Cantilever Side Frames
      [-0.38, 0.38].forEach(x => {
        const frameGeo = new THREE.BoxGeometry(0.06, 0.65, 0.8);
        const frame = new THREE.Mesh(frameGeo, createWoodMat());
        frame.position.set(x, 0.35, 0);
        frame.rotation.x = -0.12;
        frame.castShadow = true;
        modelGroup.add(frame);
        partsRef.current.push({ mesh: frame, origin: [x, 0.35, 0], offset: [x * 1.5, 0, 0] });
      });

      // Deep Leather Seat Cushion
      const seatGeo = new THREE.BoxGeometry(0.7, 0.14, 0.72);
      const seat = new THREE.Mesh(seatGeo, leatherMat);
      seat.position.set(0, 0.28, 0.02);
      seat.rotation.x = -0.15;
      seat.castShadow = true;
      modelGroup.add(seat);
      partsRef.current.push({ mesh: seat, origin: [0, 0.28, 0.02], offset: [0, 0.35, 0] });

      // Ergonomic Angled Back Cushion
      const backGeo = new THREE.BoxGeometry(0.7, 0.48, 0.12);
      const back = new THREE.Mesh(backGeo, leatherMat);
      back.position.set(0, 0.58, -0.3);
      back.rotation.x = -0.32;
      back.castShadow = true;
      modelGroup.add(back);
      partsRef.current.push({ mesh: back, origin: [0, 0.58, -0.3], offset: [0, 0.3, -0.4] });
    } else if (modelType === 'credenza') {
      // Main Dovetailed Carcase
      const carcaseGeo = new THREE.BoxGeometry(2.1, 0.7, 0.48);
      const carcase = new THREE.Mesh(carcaseGeo, createWoodMat());
      carcase.position.set(0, 0.5, 0);
      carcase.castShadow = true;
      modelGroup.add(carcase);
      partsRef.current.push({ mesh: carcase, origin: [0, 0.5, 0], offset: [0, 0.1, 0] });

      // Fluted Sliding Front Portals
      [-0.5, 0.5].forEach((x, i) => {
        const doorGeo = new THREE.BoxGeometry(0.98, 0.64, 0.03);
        const door = new THREE.Mesh(doorGeo, createWoodMat());
        door.position.set(x, 0.5, 0.26);
        door.castShadow = true;
        modelGroup.add(door);
        partsRef.current.push({ mesh: door, origin: [x, 0.5, 0.26], offset: [x * 0.5, 0, 0.35] });
      });

      // Cylindrical Brass Base
      [-0.8, 0.8].forEach(x => {
        [-0.15, 0.15].forEach(z => {
          const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 16);
          const leg = new THREE.Mesh(legGeo, brassMat);
          leg.position.set(x, 0.08, z);
          modelGroup.add(leg);
          partsRef.current.push({ mesh: leg, origin: [x, 0.08, z], offset: [x * 0.2, -0.2, z * 0.2] });
        });
      });
    } else {
      // Mandore Bench
      const slabGeo = new THREE.BoxGeometry(1.6, 0.07, 0.42);
      const slab = new THREE.Mesh(slabGeo, createWoodMat());
      slab.position.set(0, 0.45, 0);
      slab.castShadow = true;
      modelGroup.add(slab);
      partsRef.current.push({ mesh: slab, origin: [0, 0.45, 0], offset: [0, 0.3, 0] });

      [-0.65, 0.65].forEach(x => {
        const legGeo = new THREE.BoxGeometry(0.07, 0.42, 0.42);
        const leg = new THREE.Mesh(legGeo, createWoodMat());
        leg.position.set(x, 0.21, 0);
        leg.castShadow = true;
        modelGroup.add(leg);
        partsRef.current.push({ mesh: leg, origin: [x, 0.21, 0], offset: [x * 0.4, 0, 0] });
      });
    }

    // 6. Interactive Mouse Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 5.2, theta: 0.8, phi: 1.1 };

    function updateCameraPos() {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0.45, 0);
    }
    updateCameraPos();

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      spherical.theta -= deltaX * 0.008;
      spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.008));
      updateCameraPos();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius = Math.max(2.5, Math.min(8.5, spherical.radius + e.deltaY * 0.004));
      updateCameraPos();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 7. Render Loop with smooth animation
    let currentExplodeT = 0;
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      // Smooth auto-rotation
      if (autoRotate && !isDragging) {
        spherical.theta += 0.003;
        updateCameraPos();
      }

      // Smooth exploded CAD joinery transition
      const targetT = exploded ? 1.0 : 0.0;
      currentExplodeT += (targetT - currentExplodeT) * 0.08;

      partsRef.current.forEach(item => {
        if (item.mesh && item.origin && item.offset) {
          item.mesh.position.x = item.origin[0] + item.offset[0] * currentExplodeT;
          item.mesh.position.y = item.origin[1] + item.offset[1] * currentExplodeT;
          item.mesh.position.z = item.origin[2] + item.offset[2] * currentExplodeT;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // ResizeObserver ensures canvas updates dynamically on layout shifts
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      resizeObserver.disconnect();

      // Dispose geometries, materials, and renderer to prevent WebGL memory leaks
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [modelType, currentFinish, wireframeMode, exploded, autoRotate, height]);

  return (
    <div className="three-viewport" style={{ height }} ref={mountRef}>
      {/* Overlay Badge & Specs */}
      <div className="three-overlay">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span className="badge badge-gold">
            <Sparkles size={12} aria-hidden="true" /> Real-Time 3D Parametric CAD
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Rotate 360° &bull; Scroll to Zoom &bull; Basni Factory Precision
          </span>
        </div>

        {showDimensions && (
          <div
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.75rem',
              fontSize: '0.75rem',
              color: 'var(--accent-gold)'
            }}
          >
            <Compass size={12} style={{ display: 'inline', marginRight: '4px' }} aria-hidden="true" />
            Tolerance &plusmn;0.18mm &bull; CNC Calibrated
          </div>
        )}
      </div>

      {/* Interactive Controls Toolbar */}
      {showControls && (
        <div className="three-toolbar">
          <button
            onClick={() => setExploded(!exploded)}
            className={`btn-ghost ${exploded ? 'active' : ''}`}
            title="Toggle Exploded CAD Joinery View"
            aria-label="Toggle exploded CAD joinery view"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: exploded ? 'var(--accent-gold)' : undefined
            }}
          >
            <Layers size={14} aria-hidden="true" />
            <span>{exploded ? 'Collapse CAD' : 'Explode Joinery'}</span>
          </button>

          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`btn-ghost ${wireframeMode ? 'active' : ''}`}
            title="Toggle CNC Wireframe Toolpath"
            aria-label="Toggle wireframe mode"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: wireframeMode ? 'var(--accent-gold)' : undefined
            }}
          >
            <Box size={14} aria-hidden="true" />
            <span>{wireframeMode ? 'Solid Shader' : 'CAD Wireframe'}</span>
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`btn-ghost ${autoRotate ? 'active' : ''}`}
            title="Toggle Continuous Orbit Rotation"
            aria-label="Toggle auto-rotation"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: autoRotate ? 'var(--accent-gold)' : undefined
            }}
          >
            <RotateCw size={14} aria-hidden="true" />
            <span>{autoRotate ? 'Pause Orbit' : 'Auto Rotate'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
