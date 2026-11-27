import { fmt } from './util.js';

async function svgImage(svg) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally { URL.revokeObjectURL(url); }
}

function starPath(x, cx, cy, r) {
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  x.closePath();
}

// Carte 1080×1350 (format portrait, passe bien sur WhatsApp et en story).
export async function buildCard({ s, stageName, level, avatar, weekLine, url }) {
  try {
    await Promise.all([document.fonts.load('200px Anton'), document.fonts.load('60px "Mr Dafoe"'), document.fonts.load('600 32px Archivo')]);
  } catch (e) { /* polices de secours */ }
  const W = 1080, H = 1350;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 860);
  [[0, '#24093f'], [0.35, '#5d1f78'], [0.62, '#c63d8e'], [0.8, '#ff7a73'], [1, '#ffb55c']].forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  const sun = document.createElement('canvas'); sun.width = W; sun.height = H;
  const sx = sun.getContext('2d');
  const sg = sx.createLinearGradient(0, 300, 0, 860);
  sg.addColorStop(0, '#ffe27a'); sg.addColorStop(1, '#ff5f9e');
  sx.fillStyle = sg; sx.beginPath(); sx.arc(W / 2, 600, 300, 0, Math.PI * 2); sx.fill();
  sx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 8; i++) sx.fillRect(0, 640 + i * 30, W, 6 + i * 2.5);
  x.drawImage(sun, 0, 0);

  const img = await svgImage(avatar);
  x.drawImage(img, W / 2 - 280, 250, 560, 622);

  x.fillStyle = '#1a0a2c'; x.fillRect(0, 860, W, H - 860);
  x.fillStyle = '#ffd45c'; x.fillRect(0, 854, W, 8);

  x.textAlign = 'center';
  x.font = '120px Anton, Impact, sans-serif';
  x.fillStyle = '#12051f'; x.fillText('Le QI de Ryan', W / 2 + 6, 156);
  x.fillStyle = '#fff'; x.fillText('Le QI de Ryan', W / 2, 150);
  x.font = '60px "Mr Dafoe", cursive';
  x.fillStyle = '#ffd45c'; x.fillText(stageName, W / 2, 225);

  const score = fmt(s);
  x.textAlign = 'left';
  x.font = '260px Anton, Impact, sans-serif'; const w1 = x.measureText(score).width;
  x.font = '90px Anton, Impact, sans-serif'; const w2 = x.measureText('/10').width;
  const x0 = (W - w1 - w2 - 16) / 2;
  x.font = '260px Anton, Impact, sans-serif';
  x.fillStyle = '#000'; x.fillText(score, x0 + 8, 1128);
  x.fillStyle = '#7dffb0'; x.fillText(score, x0, 1120);
  x.font = '90px Anton, Impact, sans-serif';
  x.fillStyle = '#fff'; x.fillText('/10', x0 + w1 + 16, 1120);

  for (let i = 0; i < 5; i++) {
    starPath(x, W / 2 - 160 + i * 80, 1190, 30);
    x.fillStyle = i < level ? '#fff' : 'transparent'; x.fill();
    x.lineWidth = 4; x.strokeStyle = i < level ? '#12051f' : '#ffffff66'; x.stroke();
  }
  x.textAlign = 'center';
  x.font = '600 34px Archivo, sans-serif';
  x.fillStyle = '#d4b6d8'; x.fillText(weekLine, W / 2, 1270);
  x.fillStyle = '#ffd45c'; x.fillText(url, W / 2, 1320);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
