
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let countDisplay = document.getElementById('count');
let resultsBox = document.getElementById('results');
let currentFacingMode = 'environment'; // or 'user'
let currentStream = null;

// Setup camera with facing mode
async function setupCamera(facingMode = 'environment') {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: facingMode },
    audio: false
  });
  currentStream = stream;
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

// Toggle camera front/rear
document.getElementById('toggleCamera').addEventListener('click', async () => {
  currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
  await setupCamera(currentFacingMode);
});

// Toggle flash/torch
document.getElementById('toggleFlash').addEventListener('click', () => {
  if (!currentStream) return;
  const track = currentStream.getVideoTracks()[0];
  const capabilities = track.getCapabilities();
  if (capabilities.torch) {
    const constraints = { advanced: [{ torch: !track.getSettings().torch }] };
    track.applyConstraints(constraints);
  } else {
    alert("Torch not supported on this device.");
  }
});

// Object detection
async function detectObjects() {
  const model = await cocoSsd.load();
  await setupCamera(currentFacingMode);
  video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  async function detectFrame() {
    const predictions = await model.detect(video);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0);

    predictions.forEach(pred => {
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(...pred.bbox);
      ctx.fillStyle = "#00FF00";
      ctx.fillText(pred.class, pred.bbox[0], pred.bbox[1] - 5);
    });

    countDisplay.textContent = `Objects detected: ${predictions.length}`;

    // Group predictions by class
    const counts = {};
    predictions.forEach(pred => {
      counts[pred.class] = (counts[pred.class] || 0) + 1;
    });

    resultsBox.innerHTML = Object.entries(counts)
      .map(([key, val]) => `<div>${key}: ${val}</div>`)
      .join("");

    requestAnimationFrame(detectFrame);
  }

  detectFrame();
}

detectObjects();
