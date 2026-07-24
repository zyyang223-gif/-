const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17],
];
const tip = [4, 8, 12, 16, 20];
const mcp = [1, 5, 9, 13, 17];

function fingerExtended(lm, finger) {
  return lm[tip[finger]].y < lm[tip[finger] - 2].y;
}

export function detectGesture(lm) {
  const ext = [0,1,2,3,4].map(i => fingerExtended(lm, i));
  const allClosed = ext.every(e => !e);
  const allOpen = ext.every(e => e);
  const onlyIndex = !ext[0] && ext[1] && !ext[2] && !ext[3] && !ext[4];
  if (allClosed) return 'fist';
  if (allOpen) return 'open';
  if (onlyIndex) return 'point';
  return 'other';
}

export function calcOpenness(lm) {
  let total = 0;
  for (let i = 0; i < 5; i++) {
    total += Math.hypot(lm[tip[i]].x - lm[mcp[i]].x, lm[tip[i]].y - lm[mcp[i]].y, lm[tip[i]].z - lm[mcp[i]].z);
  }
  let spread = 0;
  for (let i = 0; i < 4; i++) {
    spread += Math.hypot(lm[tip[i]].x - lm[tip[i+1]].x, lm[tip[i]].y - lm[tip[i+1]].y, lm[tip[i]].z - lm[tip[i+1]].z);
  }
  const raw = total * 0.15 + spread * 0.2;
  return Math.min(1, Math.max(0, (raw - 0.12) / 0.35));
}

function drawHand(ctx, lm, w, h) {
  const pts = lm.map(l => ({ x: l.x * w, y: l.y * h }));
  ctx.strokeStyle = '#00c8ff';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  for (const [i, j] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[j].x, pts[j].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < pts.length; i++) {
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, [0,5,9,13,17].includes(i) ? 3 : 2, 0, Math.PI * 2);
    ctx.fillStyle = '#00c8ff';
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    const pt = pts[tip[i]];
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,200,255,0.3)';
    ctx.fill();
  }
}

function showError(msg) {
  document.getElementById('loading').innerHTML = `
    <div class="error">${msg}</div>
    <div style="font-size:13px;opacity:0.5;margin-top:8px">使用鼠标作为备用控制</div>
    <button class="retry-btn" onclick="location.reload()">重试</button>
  `;
}

function enableMouseFallback(state) {
  document.getElementById('loading').style.display = 'none';
  document.querySelector('.cam-preview').style.opacity = '0.3';
  state.handsActive = true;
  document.addEventListener('mousemove', (e) => {
    state.openness = 1 - (e.clientY / window.innerHeight);
    state.handsActive = true;
  });
  document.addEventListener('mouseleave', () => { state.handsActive = false; });
}

export async function startHandTracking(state) {
  const loadStep = document.getElementById('load-step');
  let handsReady = false;

  try {
    loadStep.textContent = '请求摄像头权限…';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' }
    });
    const video = document.getElementById('video');
    video.srcObject = stream;
    await video.play();

    const canvas = document.getElementById('cam-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;

    document.querySelector('.cam-preview').style.opacity = '1';
    document.getElementById('loading').style.display = 'none';

    let handLandmarker = null;

    handLandmarker = new window.Hands({
      locateFile: (file) => `/models/${file}`
    });
    handLandmarker.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const handStateEl = document.getElementById('hand-state');
    const scaleValEl = document.getElementById('scale-val');

    handLandmarker.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        state.handsActive = true;
        const lm = results.multiHandLandmarks[0];
        const val = calcOpenness(lm);
        const gesture = detectGesture(lm);

        state.openness = val;

        if (gesture === 'point' && !state.pointTriggered) {
        } else if (gesture !== 'point') {
          state.pointTriggered = false;
        }

        handStateEl.textContent = gesture === 'open' ? '🖐 张开' : gesture === 'fist' ? '✊ 握拳' : '检测中';
        scaleValEl.textContent = val.toFixed(2);

        const mirrored = lm.map(p => ({ ...p, x: 1 - p.x }));
        drawHand(ctx, mirrored, canvas.width, canvas.height);
      } else {
        state.handsActive = false;
        state.openness = 0;
        handStateEl.textContent = '未检测';
        scaleValEl.textContent = '0.00';
      }
    });
    await handLandmarker.initialize();
    handsReady = true;

    let lastTime = performance.now();
    function mainLoop() {
      const now = performance.now();
      if (now - lastTime < 33) { requestAnimationFrame(mainLoop); return; }
      lastTime = now;
      if (handsReady && handLandmarker) {
        try { handLandmarker.send({ image: video }); } catch {}
      }
      requestAnimationFrame(mainLoop);
    }
    mainLoop();

  } catch (e) {
    console.error(e);
    showError('摄像头/模型加载失败: ' + e.message);
    enableMouseFallback(state);
  }
}