
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countDisplay = document.getElementById('count');

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

async function detectObjects() {
  const model = await cocoSsd.load();
  await setupCamera();
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

    requestAnimationFrame(detectFrame);
  }

  detectFrame();
}

detectObjects();
