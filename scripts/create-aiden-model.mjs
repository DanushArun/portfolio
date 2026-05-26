import { writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const OUTPUT_PATH = 'public/models/aiden/aiden-observatory.glb';
const FULL_TURN = Math.PI * 2;
const THETA_E = 1.48;

class NodeFileReader {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
}

globalThis.FileReader = NodeFileReader;

function standardMaterial(config) {
  const mat = new THREE.MeshStandardMaterial({
    color: config.color,
    emissive: config.emissive ? new THREE.Color(config.emissive) : new THREE.Color('#000000'),
    emissiveIntensity: config.emissiveIntensity ?? 0,
    metalness: config.metalness ?? 0.5,
    opacity: config.opacity ?? 1,
    roughness: config.roughness ?? 0.5,
    transparent: config.opacity !== undefined && config.opacity < 1,
  });
  mat.name = config.name;
  return mat;
}

function lineMaterial(name, color, opacity) {
  const mat = new THREE.LineBasicMaterial({ color, opacity, transparent: opacity < 1 });
  mat.name = name;
  return mat;
}

function lensPoint(source, branch, shear) {
  const r = Math.max(0.001, Math.hypot(source.x, source.y));
  const theta = (r + branch * Math.sqrt(r * r + 4 * THETA_E * THETA_E)) / 2;
  const x = (theta * source.x) / r;
  const y = (theta * source.y) / r;
  return new THREE.Vector3(x * (1 + shear), y * (1 - shear * 0.55), source.z);
}

function sourceEllipse(angle, center, radius, phase) {
  return {
    x: center.x + Math.cos(angle) * radius.x,
    y: center.y + Math.sin(angle * 1.17 + phase) * radius.y,
    z: Math.sin(angle * 2.4 + phase) * 0.08,
  };
}

function arcCurve(config) {
  const points = [];
  const steps = 96;
  for (let i = 0; i <= steps; i += 1) {
    const t = config.from + ((config.to - config.from) * i) / steps;
    const source = sourceEllipse(t, config.center, config.radius, config.phase);
    const point = lensPoint(source, config.branch, config.shear);
    point.z += config.depth + Math.sin(t * 3.1) * 0.05;
    points.push(point);
  }
  return new THREE.CatmullRomCurve3(points, false, 'centripetal');
}

function addTube(group, name, curve, radius, mat) {
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, radius, 10), mat);
  mesh.name = name;
  group.add(mesh);
  return mesh;
}

function createLensMass(materials) {
  const group = new THREE.Group();
  group.name = 'lens_mass';

  const geometry = new THREE.IcosahedronGeometry(0.92, 4);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const vertex = new THREE.Vector3().fromBufferAttribute(pos, i);
    const bulge = 1 + Math.sin(vertex.x * 9 + vertex.y * 4) * 0.035;
    vertex.set(vertex.x * 1.15 * bulge, vertex.y * 0.82, vertex.z * 0.42);
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();

  const mass = new THREE.Mesh(geometry, materials.graphite);
  mass.name = 'lensing_elliptical_mass';
  group.add(mass);

  const aperture = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.50, 0.2, 80), materials.black);
  aperture.name = 'dark_listening_aperture';
  aperture.rotation.x = Math.PI / 2;
  aperture.position.z = 0.13;
  group.add(aperture);
  return group;
}

function createArcSystem(materials) {
  const group = new THREE.Group();
  group.name = 'lensed_call_arcs';
  const configs = [
    ['arc_agent_primary', materials.cyan, 0.018, 0.18, 1.52, 1, 0],
    ['arc_agent_secondary', materials.cyan, 0.014, 1.96, 3.38, 1, 0.42],
    ['arc_agent_duplicate', materials.cyanDim, 0.009, 3.65, 4.82, -1, 0.22],
    ['arc_customer_primary', materials.amber, 0.016, 4.92, 6.02, 1, 1.2],
    ['arc_customer_secondary', materials.amber, 0.012, 2.56, 3.16, 1, 2.2],
    ['arc_customer_duplicate', materials.amberDim, 0.009, 0.94, 1.46, -1, 2.1],
  ];
  for (const [name, mat, tube, from, to, branch, phase] of configs) {
    const curve = arcCurve({
      branch,
      center: { x: 0.18, y: -0.06 },
      depth: 0.16,
      from,
      phase,
      radius: { x: 0.10, y: 0.05 },
      shear: 0.16,
      to,
    });
    addTube(group, name, curve, tube, mat);
  }
  return group;
}

function createCriticalCurves(materials) {
  const group = new THREE.Group();
  group.name = 'critical_curve_overlay';
  const curves = [
    ['critical_curve_outer', 1.53, 0.82, materials.caustic],
    ['critical_curve_inner', 1.18, 0.67, materials.causticDim],
  ];
  for (const [name, radius, yScale, mat] of curves) {
    const points = [];
    for (let i = 0; i < 170; i += 1) {
      const t = (i / 169) * FULL_TURN;
      if (Math.sin(t * 2.5) < -0.82) continue;
      const ripple = 1 + Math.sin(t * 6) * 0.025;
      points.push(new THREE.Vector3(
        Math.cos(t) * radius * ripple,
        Math.sin(t) * radius * yScale,
        -0.025,
      ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, mat);
    line.name = name;
    group.add(line);
  }
  return group;
}

function createDetectorVane(index, materials) {
  const angle = (index / 8) * FULL_TURN + 0.12;
  const radius = 2.12 + (index % 2) * 0.16;
  const group = new THREE.Group();
  group.name = `detector_vane_${String(index + 1).padStart(2, '0')}`;
  group.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -0.08);
  group.rotation.z = angle + Math.PI / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-0.14, -0.30);
  shape.lineTo(0.14, -0.30);
  shape.lineTo(0.10, 0.38);
  shape.lineTo(-0.10, 0.38);
  shape.lineTo(-0.14, -0.30);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.015,
    depth: 0.045,
  }), materials.darkSteel);
  body.name = `${group.name}_body`;
  group.add(body);

  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.52, 0.07), materials.amber);
  slit.name = `${group.name}_spectral_hit`;
  slit.position.z = 0.055;
  group.add(slit);
  return group;
}

function createSpectralSlits(materials) {
  const group = new THREE.Group();
  group.name = 'spectral_slit_array';
  for (let i = 0; i < 14; i += 1) {
    const height = 0.56 + (i % 3) * 0.12;
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.012, height, 0.035), materials.cyan);
    slit.name = `spectral_slit_${String(i + 1).padStart(2, '0')}`;
    slit.position.set(-1.54 + i * 0.24, -1.95, 0.02);
    slit.rotation.z = -0.08;
    group.add(slit);
  }
  return group;
}

function createInterferometerArm(index, materials) {
  const angle = (index / 4) * FULL_TURN + Math.PI / 4;
  const group = new THREE.Group();
  group.name = `interferometer_arm_${String(index + 1).padStart(2, '0')}`;
  group.rotation.z = angle;

  const boom = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.045, 0.055), materials.darkSteel);
  boom.name = `${group.name}_baseline`;
  boom.position.x = 2.9;
  group.add(boom);

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.31, 0.12, 48), materials.graphite);
  dish.name = `${group.name}_collector`;
  dish.position.x = 3.78;
  dish.rotation.y = Math.PI / 2;
  group.add(dish);
  return group;
}

function createFiberField(materials) {
  const points = [];
  for (let i = 0; i < 780; i += 1) {
    const angle = (i / 780) * FULL_TURN;
    const jitter = Math.sin(i * 19.19) * 0.12;
    const inner = 0.82 + (i % 9) * 0.012;
    const outer = 1.33 + jitter;
    points.push(new THREE.Vector3(Math.cos(angle) * inner, Math.sin(angle) * inner * 0.74, -0.02));
    points.push(new THREE.Vector3(Math.cos(angle) * outer, Math.sin(angle) * outer * 0.78, 0.06));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const field = new THREE.LineSegments(geometry, materials.fiber);
  field.name = 'surface_analysis_fibers';
  return field;
}

function createDetectorPlane(materials) {
  const group = new THREE.Group();
  group.name = 'faint_detector_plane';
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.025, 0.025), materials.sensor);
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.025, 3.4, 0.025), materials.sensor);
  frame.name = 'detector_plane_horizontal';
  side.name = 'detector_plane_vertical';
  frame.position.y = -1.7;
  side.position.x = 2.4;
  group.add(frame, side);
  return group;
}

function createMaterials() {
  return {
    amber: standardMaterial({
      color: '#ffb45c',
      emissive: '#ff9c2e',
      emissiveIntensity: 1.4,
      name: 'aiden_scoring_amber',
      roughness: 0.28,
    }),
    amberDim: standardMaterial({
      color: '#6f4122',
      emissive: '#ff7a1a',
      emissiveIntensity: 0.35,
      name: 'aiden_scoring_amber_dim',
    }),
    black: standardMaterial({ color: '#010102', name: 'aiden_absorbing_black', roughness: 0.92 }),
    cyan: standardMaterial({
      color: '#82fbff',
      emissive: '#42f2ff',
      emissiveIntensity: 1.55,
      name: 'aiden_lensing_cyan',
      roughness: 0.24,
    }),
    caustic: lineMaterial('aiden_critical_curve_line', '#d8faff', 0.44),
    causticDim: lineMaterial('aiden_inner_caustic_line', '#77888d', 0.32),
    cyanDim: standardMaterial({
      color: '#1d5f64',
      emissive: '#38d8e8',
      emissiveIntensity: 0.4,
      name: 'aiden_lensing_cyan_dim',
    }),
    darkSteel: standardMaterial({ color: '#17191c', metalness: 0.78, name: 'aiden_dark_steel' }),
    fiber: lineMaterial('aiden_surface_fiber_lines', '#4f565d', 0.38),
    graphite: standardMaterial({
      color: '#24282c',
      metalness: 0.74,
      name: 'aiden_anisotropic_graphite',
      roughness: 0.48,
    }),
    sensor: standardMaterial({ color: '#cbd4d8', name: 'aiden_sensor_plane', opacity: 0.28 }),
  };
}

function createModel() {
  const materials = createMaterials();
  const root = new THREE.Group();
  root.name = 'aiden_lensing_analysis_instrument';
  root.add(createDetectorPlane(materials));
  root.add(createLensMass(materials));
  root.add(createCriticalCurves(materials));
  root.add(createArcSystem(materials));
  root.add(createSpectralSlits(materials));
  root.add(createFiberField(materials));
  for (let i = 0; i < 8; i += 1) root.add(createDetectorVane(i, materials));
  for (let i = 0; i < 4; i += 1) root.add(createInterferometerArm(i, materials));
  root.rotation.x = -0.22;
  return root;
}

async function exportModel() {
  const scene = new THREE.Scene();
  scene.name = 'aiden_observatory_scene';
  scene.add(createModel());

  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(scene, { binary: true });
  await writeFile(OUTPUT_PATH, Buffer.from(glb));
  console.log(`Wrote ${OUTPUT_PATH}`);
}

await exportModel();
