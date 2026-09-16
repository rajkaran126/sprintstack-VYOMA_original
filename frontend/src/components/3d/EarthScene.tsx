import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Satellite, DebrisObject, Encounter } from '../../types';
import { RotateCcw, Crosshair, Layers, Compass, Play, Pause } from 'lucide-react';
import { OrbitalLegend } from './OrbitalLegend';

interface EarthSceneProps {
  satellite?: Satellite;
  debrisList?: DebrisObject[];
  selectedEncounter?: Encounter | null;
  onSelectDebris?: (debrisId: string) => void;
  customEarthModelUrl?: string;
  customSatelliteModelUrl?: string;
}

export const EarthScene: React.FC<EarthSceneProps> = ({
  satellite,
  debrisList = [],
  selectedEncounter,
  onSelectDebris,
  customEarthModelUrl,
  customSatelliteModelUrl,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isRotating, setIsRotating] = useState(true);

  // References for scene objects
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const orbitGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const encounterGroupRef = useRef<THREE.Group | null>(null);
  const satelliteModelTemplateRef = useRef<THREE.Group | null>(null);
  const debrisModelTemplateRef = useRef<THREE.Group | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState<number>(0);

  // Scale factor: Earth radius in Three.js units = 5.0 (actual ~6378 km)
  // Scale = 5.0 / 6378.137 ≈ 0.0007839
  const SCALE = 5.0 / 6378.137;

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(14, 10, 16);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(25, 15, 20);
    scene.add(sunLight);

    const blueFill = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueFill.position.set(-20, -10, -20);
    scene.add(blueFill);

    // 5. Earth Sphere
    const earthRadius = 5.0;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const textureLoader = new THREE.TextureLoader();

    // High-Resolution Earth Diffuse & Normal Maps
    const earthDiffuse = textureLoader.load('/models/earth/Earth_Diffuse.jpg');
    earthDiffuse.colorSpace = THREE.SRGBColorSpace;
    const earthNormal = textureLoader.load('/models/earth/Earth_Normal.jpg');
    const earthClouds = textureLoader.load('/models/earth/EarthClouds_Mask.jpg');

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthDiffuse,
      normalMap: earthNormal,
      roughness: 0.75,
      metalness: 0.08,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Atmospheric Cloud Layer (Drifts independently)
    const cloudsGeometry = new THREE.SphereGeometry(earthRadius * 1.012, 64, 64);
    const cloudsMaterial = new THREE.MeshStandardMaterial({
      map: earthClouds,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    scene.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    // 6. 3D Model: Satellite (Target Monitored Asset)
    const satAlbedo = textureLoader.load('/models/satellite/lambert1_albedo.jpg');
    satAlbedo.colorSpace = THREE.SRGBColorSpace;
    const satNormal = textureLoader.load('/models/satellite/lambert1_normal.png');
    const satMetal = textureLoader.load('/models/satellite/lambert1_metallic.jpg');
    const satRough = textureLoader.load('/models/satellite/lambert1_roughness.jpg');
    const satEmissive = textureLoader.load('/models/satellite/lambert1_emissive.jpg');

    const satMaterial = new THREE.MeshStandardMaterial({
      map: satAlbedo,
      normalMap: satNormal,
      metalnessMap: satMetal,
      roughnessMap: satRough,
      emissiveMap: satEmissive,
      emissive: new THREE.Color(0x223344),
      metalness: 0.85,
      roughness: 0.35,
    });

    const objLoader = new OBJLoader();
    objLoader.load(
      '/models/satellite/SatelliteSubstancePainter.obj',
      (obj) => {
        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).material = satMaterial;
            child.castShadow = true;
          }
        });
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const targetSize = 0.75;
          const scale = targetSize / maxDim;
          obj.scale.set(scale, scale, scale);
        }
        satelliteModelTemplateRef.current = obj;
        console.log('[VYOMA 3D] Loaded custom Satellite 3D model.');
        setModelsLoaded((c) => c + 1);
      },
      undefined,
      (err) => {
        console.warn('[VYOMA 3D] Satellite OBJ fallback:', err);
      }
    );

    // 7. 3D Model: Meteorite (For Space Debris Objects)
    const metDiffuse = textureLoader.load('/models/meteorite/Meteorite_Proxy_Diffuse.png');
    metDiffuse.colorSpace = THREE.SRGBColorSpace;
    const metNormal = textureLoader.load('/models/meteorite/Meteorite_Proxy_Normal_4K.png');

    const meteoriteMaterial = new THREE.MeshStandardMaterial({
      map: metDiffuse,
      normalMap: metNormal,
      roughness: 0.85,
      metalness: 0.2,
    });

    const fbxLoader = new FBXLoader();
    fbxLoader.load(
      '/models/meteorite/Meteorite_Final.fbx',
      (fbx) => {
        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).material = meteoriteMaterial;
          }
        });
        const box = new THREE.Box3().setFromObject(fbx);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const targetSize = 0.42;
          const scale = targetSize / maxDim;
          fbx.scale.set(scale, scale, scale);
        }
        debrisModelTemplateRef.current = fbx;
        console.log('[VYOMA 3D] Loaded Meteorite 3D model for debris.');
        setModelsLoaded((c) => c + 1);
      },
      undefined,
      (err) => {
        console.warn('[VYOMA 3D] Meteorite FBX fallback:', err);
      }
    );

    // Atmospheric Rayleigh glow shell
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.025, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // Starfield background particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xa0c4ff, size: 1.2, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Groups for dynamic items
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    orbitGroupRef.current = orbitGroup;

    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    const encounterGroup = new THREE.Group();
    scene.add(encounterGroup);
    encounterGroupRef.current = encounterGroup;

    // Simple Mouse Orbit Interaction
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = new THREE.Spherical().setFromVector3(camera.position);

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      spherical.theta -= deltaX * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * 0.008));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(7.5, Math.min(45, spherical.radius + e.deltaY * 0.02));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    let t = 0;
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      t += 0.004;

      if (isRotating) {
        if (earthMeshRef.current) {
          earthMeshRef.current.rotation.y += 0.0008;
        }
        if (cloudsMeshRef.current) {
          cloudsMeshRef.current.rotation.y += 0.0012;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Orbits, Markers, and Encounter Highlight whenever inputs change
  useEffect(() => {
    if (!orbitGroupRef.current || !markersGroupRef.current || !encounterGroupRef.current) return;

    const orbitGroup = orbitGroupRef.current;
    const markersGroup = markersGroupRef.current;
    const encounterGroup = encounterGroupRef.current;

    // Clear previous children
    while (orbitGroup.children.length > 0) orbitGroup.remove(orbitGroup.children[0]);
    while (markersGroup.children.length > 0) markersGroup.remove(markersGroup.children[0]);
    while (encounterGroup.children.length > 0) encounterGroup.remove(encounterGroup.children[0]);

    if (!showOrbits) return;

    // Helper: compute ECI points for 3D trajectory
    const generateOrbitPoints = (altKm: number, incDeg: number, raanDeg: number = 0) => {
      const r = (6378.137 + altKm) * SCALE;
      const points: THREE.Vector3[] = [];
      const numPoints = 100;
      const incRad = (incDeg * Math.PI) / 180;
      const raanRad = (raanDeg * Math.PI) / 180;

      for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        const cosRaan = Math.cos(raanRad);
        const sinRaan = Math.sin(raanRad);
        const cosInc = Math.cos(incRad);
        const sinInc = Math.sin(incRad);

        const x = r * (cosRaan * cosTheta - sinRaan * sinTheta * cosInc);
        const y = r * (sinTheta * sinInc); // Z mapped to Y for intuitive 3D coordinate convention
        const z = r * (sinRaan * cosTheta + cosRaan * sinTheta * cosInc);
        points.push(new THREE.Vector3(x, y, z));
      }
      return points;
    };

    // 1. Primary Satellite Orbit (Cyan Glowing Line)
    if (satellite) {
      const satPoints = generateOrbitPoints(satellite.altitude_km, satellite.inclination_deg, satellite.raan_deg);
      const satGeo = new THREE.BufferGeometry().setFromPoints(satPoints);
      const satMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2, transparent: true, opacity: 0.85 });
      const satLine = new THREE.Line(satGeo, satMat);
      orbitGroup.add(satLine);

      // Primary Satellite 3D Marker (3D Model or glowing marker)
      const satPos = satPoints[0];
      if (satelliteModelTemplateRef.current) {
        const satInstance = satelliteModelTemplateRef.current.clone();
        satInstance.position.copy(satPos);
        markersGroup.add(satInstance);
      } else {
        const satMarkerGeo = new THREE.OctahedronGeometry(0.24, 0);
        const satMarkerMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        const satMarker = new THREE.Mesh(satMarkerGeo, satMarkerMat);
        satMarker.position.copy(satPos);
        markersGroup.add(satMarker);
      }

      // Outer beacon aura
      const haloGeo = new THREE.SphereGeometry(0.45, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(satPos);
      markersGroup.add(halo);
    }

    // 2. Debris Orbits and Markers
    debrisList.forEach((deb) => {
      const isSelected = selectedEncounter?.debris_id === deb.id;
      const debPoints = generateOrbitPoints(deb.altitude_km, deb.inclination_deg, deb.raan_deg);
      const debGeo = new THREE.BufferGeometry().setFromPoints(debPoints);

      const lineColor = isSelected ? 0xef4444 : deb.altitude_km < 510 ? 0xf97316 : 0x94a3b8;
      const debMat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.45,
      });
      const debLine = new THREE.Line(debGeo, debMat);
      orbitGroup.add(debLine);

      // Debris marker position
      const phaseIdx = Math.floor(((deb.phase_deg || 0) / 360) * debPoints.length) % debPoints.length;
      const markerPos = debPoints[phaseIdx];

      if (debrisModelTemplateRef.current) {
        const debMesh = debrisModelTemplateRef.current.clone();
        debMesh.position.copy(markerPos);
        const rot = ((deb.phase_deg || 0) * Math.PI) / 180;
        debMesh.rotation.set(rot * 0.9, rot * 1.5, rot * 0.7);
        if (isSelected) {
          debMesh.scale.multiplyScalar(1.6);
          // Conjunction threat aura around active meteorite
          const haloGeo = new THREE.SphereGeometry(0.4, 16, 16);
          const haloMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.4 });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.position.copy(markerPos);
          markersGroup.add(halo);
        }
        markersGroup.add(debMesh);
      } else {
        const markerGeo = new THREE.BoxGeometry(isSelected ? 0.22 : 0.12, isSelected ? 0.22 : 0.12, isSelected ? 0.22 : 0.12);
        const markerMat = new THREE.MeshBasicMaterial({ color: isSelected ? 0xffffff : lineColor });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(markerPos);
        markersGroup.add(marker);
      }

      // 3. Highlight Selected Encounter Conjunction
      if (isSelected && satellite) {
        const satPos = generateOrbitPoints(satellite.altitude_km, satellite.inclination_deg, satellite.raan_deg)[0];
        
        // Relative distance line between Satellite and Debris
        const lineGeo = new THREE.BufferGeometry().setFromPoints([satPos, markerPos]);
        const lineMat = new THREE.LineDashedMaterial({
          color: 0xef4444,
          dashSize: 0.2,
          gapSize: 0.1,
          linewidth: 2,
        });
        const distLine = new THREE.Line(lineGeo, lineMat);
        distLine.computeLineDistances();
        encounterGroup.add(distLine);

        // Closest Approach Point Marker (Midpoint Pulsing Beacon)
        const midPoint = new THREE.Vector3().addVectors(satPos, markerPos).multiplyScalar(0.5);
        const tcaSphereGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const tcaMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const tcaMarker = new THREE.Mesh(tcaSphereGeo, tcaMat);
        tcaMarker.position.copy(midPoint);
        encounterGroup.add(tcaMarker);
      }
    });
  }, [satellite, debrisList, selectedEncounter, showOrbits, modelsLoaded]);

  // Controls Handlers
  const handleResetCamera = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(14, 10, 16);
    cameraRef.current.lookAt(0, 0, 0);
  };

  const handleFocusSatellite = () => {
    if (!cameraRef.current || !satellite) return;
    const r = (6378.137 + satellite.altitude_km) * SCALE;
    cameraRef.current.position.set(r * 1.5, r * 0.8, r * 1.2);
    cameraRef.current.lookAt(0, 0, 0);
  };

  const handleFocusEncounter = () => {
    if (!cameraRef.current || !selectedEncounter || !satellite) return;
    const r = (6378.137 + satellite.altitude_km) * SCALE;
    cameraRef.current.position.set(r * 1.2, r * 0.4, r * 0.9);
    cameraRef.current.lookAt(0, 0, 0);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Floating Glass Controls HUD */}
      <div
        className="liquid-glass"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          zIndex: 10,
        }}
      >
        <button
          onClick={handleResetCamera}
          className="liquid-button"
          title="Reset Camera View"
          style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <RotateCcw size={13} />
          Reset
        </button>

        <button
          onClick={handleFocusSatellite}
          className="liquid-button"
          title="Focus Monitored Satellite"
          style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Crosshair size={13} />
          Satellite
        </button>

        {selectedEncounter && (
          <button
            onClick={handleFocusEncounter}
            className="liquid-button liquid-button-primary"
            title="Focus Conjunction Geometry"
            style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Compass size={13} />
            Encounter
          </button>
        )}

        <button
          onClick={() => setShowOrbits(!showOrbits)}
          className="liquid-button"
          title="Toggle Orbit Curves"
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: showOrbits ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <Layers size={13} />
          Orbits
        </button>

        <button
          onClick={() => setIsRotating(!isRotating)}
          className="liquid-button"
          title={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
          style={{ padding: '6px 8px', borderRadius: '6px', fontSize: '0.75rem' }}
        >
          {isRotating ? <Pause size={13} /> : <Play size={13} />}
        </button>
      </div>

      {/* Selected Encounter Badge on HUD */}
      {selectedEncounter && (
        <div
          className="liquid-glass animate-risk-pulse"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px 14px',
            zIndex: 10,
            border: '1px solid rgba(239, 68, 68, 0.5)',
            background: 'rgba(239, 68, 68, 0.15)',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Conjunction
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>
            {selectedEncounter.debris_name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
            Miss: <strong style={{ color: '#EF4444' }}>{selectedEncounter.min_distance_km} km</strong> · TCA:{' '}
            {selectedEncounter.tca_utc.split(' ')[1] || '14:32'}
          </div>
        </div>
      )}

      {/* Orbital Visualization Legend */}
      <OrbitalLegend />
    </div>
  );
};
