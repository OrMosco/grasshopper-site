// ========================================
// Three.js 3D Attendance Visualization
// הבעה במחשב - אוניברסיטת חיפה
// ========================================

let scene, camera, renderer, controls;
let towers = [];
let raycaster, mouse;
let currentGroup = 1;
let animationId;
let hoveredTower = null;

const COLORS = {
  zero:   0x333355,   // לא נכח אף פעם
  low:    0xff4757,   // נוכחות נמוכה
  mid:    0xffa502,   // נוכחות בינונית
  high:   0x00d4aa,   // נוכחות גבוהה
  full:   0x7b68ee,   // נוכחות מלאה
  ground: 0x15152a,
  grid:   0x2a2a4e,
};

function getAttendanceColor(count, maxLessons) {
  if (count === 0) return COLORS.zero;
  const ratio = count / Math.max(maxLessons, 1);
  if (ratio <= 0.25) return COLORS.low;
  if (ratio <= 0.5) return COLORS.mid;
  if (ratio < 1) return COLORS.high;
  return COLORS.full;
}

function initVisualization() {
  const container = document.getElementById('three-canvas');
  if (!container) return;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);
  scene.fog = new THREE.FogExp2(0x0a0a12, 0.012);

  // Camera
  camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(25, 20, 25);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI / 2.1;

  // Raycaster for hover
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Lights
  setupLights();

  // Ground
  setupGround();

  // Build towers
  buildTowers(currentGroup);

  // Events
  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('mousemove', onMouseMove);

  // Animate
  animate();
}

function setupLights() {
  // Ambient
  const ambient = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambient);

  // Main directional
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(15, 25, 15);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  scene.add(dirLight);

  // Accent light
  const pointLight = new THREE.PointLight(0x00d4aa, 0.5, 50);
  pointLight.position.set(-10, 15, -10);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(0x7b68ee, 0.3, 50);
  pointLight2.position.set(10, 10, -15);
  scene.add(pointLight2);
}

function setupGround() {
  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const groundMat = new THREE.MeshStandardMaterial({
    color: COLORS.ground,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid helper
  const gridHelper = new THREE.GridHelper(60, 30, COLORS.grid, COLORS.grid);
  gridHelper.position.y = 0;
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);
}

function buildTowers(groupNum) {
  // Clear existing towers
  towers.forEach(t => {
    scene.remove(t.group);
    t.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  });
  towers = [];

  const students = getAllStudents(groupNum);
  const count = students.length;

  // Grid layout: arrange students in rows and columns
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const spacing = 3.5;
  const offsetX = ((cols - 1) * spacing) / 2;
  const offsetZ = ((rows - 1) * spacing) / 2;

  students.forEach((student, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * spacing - offsetX;
    const z = row * spacing - offsetZ;

    const attendanceCount = getStudentAttendanceCount(student);
    const tower = createTower(student, attendanceCount, x, z, index);
    towers.push(tower);
  });
}

function createTower(student, attendanceCount, x, z, index) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const maxHeight = 8;
  const minHeight = 0.3;
  const heightRatio = attendanceCount / Math.max(TOTAL_LESSONS, 1);
  const height = minHeight + heightRatio * (maxHeight - minHeight);
  const color = getAttendanceColor(attendanceCount, CURRENT_LESSON);

  // Base platform (circle on ground)
  const baseGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.8,
    metalness: 0.2,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.05;
  base.receiveShadow = true;
  group.add(base);

  // Main tower - twisted box geometry
  const segments = Math.max(2, attendanceCount * 2);
  const towerGeo = new THREE.BoxGeometry(1, height, 1, 1, segments, 1);

  // Twist the vertices based on attendance
  const positions = towerGeo.attributes.position;
  const twistAmount = attendanceCount * 0.15;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const normalizedY = (y + height / 2) / height;
    const angle = normalizedY * twistAmount;
    const px = positions.getX(i);
    const pz = positions.getZ(i);
    positions.setX(i, px * Math.cos(angle) - pz * Math.sin(angle));
    positions.setZ(i, px * Math.sin(angle) + pz * Math.cos(angle));
  }
  positions.needsUpdate = true;
  towerGeo.computeVertexNormals();

  const towerMat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.4,
    metalness: 0.6,
    emissive: color,
    emissiveIntensity: 0.1,
  });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = height / 2 + 0.1;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  // Top accent sphere
  if (attendanceCount > 0) {
    const sphereSize = 0.2 + attendanceCount * 0.05;
    const sphereGeo = new THREE.SphereGeometry(sphereSize, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.y = height + 0.1 + sphereSize;
    group.add(sphere);
  }

  // Rings around tower based on attendance
  for (let i = 0; i < attendanceCount; i++) {
    const ringY = (height / (attendanceCount + 1)) * (i + 1) + 0.1;
    const ringGeo = new THREE.TorusGeometry(0.8, 0.04, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = ringY;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }

  scene.add(group);

  return {
    group,
    tower,
    student,
    attendanceCount,
    baseY: 0,
    index,
    rotationSpeed: 0.002 + attendanceCount * 0.003,
    floatOffset: index * 0.5,
  };
}

function animate() {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Animate towers
  towers.forEach(t => {
    // Slow rotation based on attendance
    t.group.rotation.y += t.rotationSpeed;

    // Gentle float
    const floatY = Math.sin(time + t.floatOffset) * 0.1;
    t.group.position.y = t.baseY + floatY;
  });

  // Highlight hovered tower
  if (hoveredTower) {
    hoveredTower.group.scale.set(1.1, 1.1, 1.1);
  }

  controls.update();
  renderer.render(scene, camera);
}

function onResize() {
  const container = document.getElementById('three-canvas');
  if (!container) return;

  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function onMouseMove(event) {
  const container = document.getElementById('three-canvas');
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Get all meshes from tower groups
  const meshes = [];
  towers.forEach(t => {
    t.group.traverse(child => {
      if (child.isMesh) {
        child.userData.towerData = t;
        meshes.push(child);
      }
    });
  });

  const intersects = raycaster.intersectObjects(meshes);
  const tooltip = document.getElementById('tooltip');

  // Reset previous hover
  if (hoveredTower) {
    hoveredTower.group.scale.set(1, 1, 1);
    hoveredTower = null;
  }

  if (intersects.length > 0) {
    const data = intersects[0].object.userData.towerData;
    if (data) {
      hoveredTower = data;
      const percentage = getAttendancePercentage(data.student);

      tooltip.style.display = 'block';
      tooltip.style.left = (event.clientX + 15) + 'px';
      tooltip.style.top = (event.clientY - 10) + 'px';
      tooltip.innerHTML = `
        <div class="tooltip-name">${data.student.name}</div>
        <div class="tooltip-info">
          נוכחות: ${data.attendanceCount} / ${CURRENT_LESSON} שיעורים<br>
          ${percentage.toFixed(0)}%
        </div>
      `;
    }
  } else {
    tooltip.style.display = 'none';
  }
}

function switchGroup(groupNum) {
  currentGroup = groupNum;
  buildTowers(groupNum);

  // Update buttons
  document.querySelectorAll('.group-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.group) === groupNum);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Update lesson info
  const lessonBadge = document.getElementById('lesson-badge');
  if (lessonBadge) {
    lessonBadge.textContent = `שיעור ${CURRENT_LESSON} מתוך ${TOTAL_LESSONS}`;
  }

  initVisualization();
});
