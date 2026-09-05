const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.graph-card')];
const viewer = document.querySelector('#viewer');
const viewerTitle = document.querySelector('#viewerTitle');
const viewerImage = document.querySelector('#viewerImage');
const closeButton = document.querySelector('.close-button');
const projectionButton = document.querySelector('#projectionButton');
const calculatorSection = document.querySelector('.calculator-section');
const expandCalculator = document.querySelector('#expandCalculator');

filters.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    filters.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    cards.forEach((card) => {
      card.hidden = selected !== 'all' && card.dataset.family !== selected;
    });
  });
});

document.querySelectorAll('.image-button').forEach((button) => {
  button.addEventListener('click', () => {
    const sourceImage = button.querySelector('img');
    viewerTitle.textContent = button.dataset.title;
    viewerImage.src = button.dataset.image;
    viewerImage.alt = sourceImage.alt;
    viewer.showModal();
  });
});

closeButton.addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) viewer.close();
});
projectionButton.addEventListener('click', () => {
  const active = document.body.classList.toggle('projection');
  projectionButton.setAttribute('aria-pressed', String(active));
  projectionButton.innerHTML = active
    ? '<span aria-hidden="true">×</span> Exit projection mode'
    : '<span aria-hidden="true">▣</span> Projection mode';
});

function setCalculatorExpanded(active) {
  calculatorSection.classList.toggle('expanded', active);
  document.body.classList.toggle('calculator-open', active);
  expandCalculator.setAttribute('aria-pressed', String(active));
  expandCalculator.textContent = active ? 'Return to gallery' : 'Expand calculator';
}

expandCalculator.addEventListener('click', () => {
  setCalculatorExpanded(!calculatorSection.classList.contains('expanded'));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && calculatorSection.classList.contains('expanded')) {
    setCalculatorExpanded(false);
    expandCalculator.focus();
  }
});

const modeButtons = [...document.querySelectorAll('.mode-button')];
const browseOnly = [...document.querySelectorAll('.browse-only')];
const identifyMode = document.querySelector('#identifyMode');
const transformMode = document.querySelector('#transformMode');

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    modeButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    browseOnly.forEach((item) => { item.hidden = mode !== 'browse'; });
    identifyMode.hidden = mode !== 'identify';
    transformMode.hidden = mode !== 'transform';
    if (mode === 'identify' && !quizStarted) startChallenge();
    if (mode === 'transform') drawTransformation();
    document.querySelector(mode === 'browse' ? '#gallery' : mode === 'identify' ? '#identifyMode' : '#transformMode')
      .scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const challengeCanvas = document.querySelector('#challengeCanvas');
const challengeContext = challengeCanvas.getContext('2d');
const answerChoices = document.querySelector('#answerChoices');
const challengeFeedback = document.querySelector('#challengeFeedback');
const challengeCount = document.querySelector('#challengeCount');
const challengeScore = document.querySelector('#challengeScore');
const nextChallenge = document.querySelector('#nextChallenge');

const challenges = [
  { src: 'assets/Polygraphs.png', crop: [18, 36, 263, 263], answer: 'y = x', family: 'linear' },
  { src: 'assets/Polygraphs.png', crop: [289, 36, 263, 263], answer: 'y = x²', family: 'quadratic' },
  { src: 'assets/Polygraphs.png', crop: [18, 359, 263, 263], answer: 'y = x³', family: 'cubic' },
  { src: 'assets/Polygraphs.png', crop: [289, 359, 263, 263], answer: 'y = x⁴', family: 'quartic' },
  { src: 'assets/OtherFunctions.png', crop: [10, 36, 263, 263], answer: 'y = |x|', family: 'absolute value' },
  { src: 'assets/OtherFunctions.png', crop: [280, 36, 263, 263], answer: 'y = √x', family: 'square root' },
  { src: 'assets/RationalGraphs.png', crop: [10, 34, 263, 263], answer: 'y = 1/x', family: 'reciprocal' },
  { src: 'assets/RationalGraphs.png', crop: [280, 34, 263, 263], answer: 'y = 1/x²', family: 'reciprocal squared' },
  { src: 'assets/ExpoLogGraphs.png', crop: [14, 36, 263, 263], answer: 'y = 2ˣ', family: 'exponential' },
  { src: 'assets/ExpoLogGraphs.png', crop: [284, 36, 263, 263], answer: 'y = log₂(x)', family: 'logarithmic' },
  { src: 'assets/Trig1Graphs.png', crop: [14, 35, 263, 263], answer: 'y = sin(x)', family: 'sine' },
  { src: 'assets/Trig1Graphs.png', crop: [14, 359, 263, 263], answer: 'y = cos(x)', family: 'cosine' },
  { src: 'assets/Trig2Graphs.png', crop: [20, 14, 263, 263], answer: 'y = tan(x)', family: 'tangent' },
  { src: 'assets/InverseTrig2Graphs.png', crop: [14, 11, 263, 263], answer: 'y = tan⁻¹(x)', family: 'inverse tangent' }
];
const allAnswers = challenges.map((item) => item.answer);
let currentChallenge = null;
let previousChallenge = -1;
let questionNumber = 0;
let score = 0;
let quizStarted = false;

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function drawChallenge(item) {
  const image = new Image();
  image.onload = () => {
    const [sx, sy, sw, sh] = item.crop;
    challengeContext.clearRect(0, 0, challengeCanvas.width, challengeCanvas.height);
    challengeContext.fillStyle = '#fff';
    challengeContext.fillRect(0, 0, challengeCanvas.width, challengeCanvas.height);
    const scale = Math.min(500 / sw, 350 / sh);
    const width = sw * scale;
    const height = sh * scale;
    challengeContext.drawImage(image, sx, sy, sw, sh, (540 - width) / 2, (390 - height) / 2, width, height);
  };
  image.src = item.src;
}

function startChallenge() {
  quizStarted = true;
  questionNumber += 1;
  let index;
  do index = Math.floor(Math.random() * challenges.length);
  while (index === previousChallenge && challenges.length > 1);
  previousChallenge = index;
  currentChallenge = challenges[index];
  drawChallenge(currentChallenge);

  const distractors = shuffled(allAnswers.filter((answer) => answer !== currentChallenge.answer)).slice(0, 3);
  const choices = shuffled([currentChallenge.answer, ...distractors]);
  answerChoices.querySelectorAll('.choice-button').forEach((button) => button.remove());
  choices.forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    button.textContent = choice;
    button.addEventListener('click', () => answerChallenge(button, choice));
    answerChoices.appendChild(button);
  });
  challengeCount.textContent = `Question ${questionNumber}`;
  challengeScore.textContent = `${score} correct`;
  challengeFeedback.className = 'challenge-feedback';
  challengeFeedback.textContent = 'Choose an answer when you are ready.';
  nextChallenge.disabled = true;
}

function answerChallenge(selectedButton, choice) {
  const buttons = [...answerChoices.querySelectorAll('.choice-button')];
  buttons.forEach((button) => {
    button.disabled = true;
    if (button.textContent === currentChallenge.answer) button.classList.add('correct');
  });
  if (choice === currentChallenge.answer) {
    score += 1;
    selectedButton.classList.add('correct');
    challengeFeedback.className = 'challenge-feedback success';
    challengeFeedback.textContent = `Correct. This is the ${currentChallenge.family} parent function.`;
  } else {
    selectedButton.classList.add('incorrect');
    challengeFeedback.className = 'challenge-feedback try-again';
    challengeFeedback.textContent = `Not this time. The graph is ${currentChallenge.answer}, the ${currentChallenge.family} parent function.`;
  }
  challengeScore.textContent = `${score} correct`;
  nextChallenge.disabled = false;
}

nextChallenge.addEventListener('click', startChallenge);

const transformCanvas = document.querySelector('#transformCanvas');
const transformContext = transformCanvas.getContext('2d');
const parentFunction = document.querySelector('#parentFunction');
const reflectY = document.querySelector('#reflectY');
const aControl = document.querySelector('#aControl');
const hControl = document.querySelector('#hControl');
const kControl = document.querySelector('#kControl');
const aValue = document.querySelector('#aValue');
const hValue = document.querySelector('#hValue');
const kValue = document.querySelector('#kValue');
const transformFormula = document.querySelector('#transformFormula');
const transformNotice = document.querySelector('#transformNotice');
const resetTransform = document.querySelector('#resetTransform');

const parentFunctions = {
  quadratic: { label: 'x²', evaluate: (x) => x * x },
  absolute: { label: '|x|', evaluate: (x) => Math.abs(x) },
  linear: { label: 'x', evaluate: (x) => x },
  cubic: { label: 'x³', evaluate: (x) => x * x * x },
  sqrt: { label: '√x', evaluate: (x) => x < 0 ? NaN : Math.sqrt(x) },
  reciprocal: { label: '1/x', evaluate: (x) => Math.abs(x) < .025 ? NaN : 1 / x },
  exponential: { label: '2ˣ', evaluate: (x) => 2 ** x }
};

function graphPoint(x, y) {
  return [transformCanvas.width / 2 + x * 38, transformCanvas.height / 2 - y * 38];
}

function drawGrid() {
  const ctx = transformContext;
  ctx.clearRect(0, 0, transformCanvas.width, transformCanvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, transformCanvas.width, transformCanvas.height);
  ctx.strokeStyle = '#e2e2e4';
  ctx.lineWidth = 1;
  for (let x = -10; x <= 10; x += 1) {
    const [px] = graphPoint(x, 0);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, transformCanvas.height); ctx.stroke();
  }
  for (let y = -6; y <= 6; y += 1) {
    const [, py] = graphPoint(0, y);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(transformCanvas.width, py); ctx.stroke();
  }
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  const [originX, originY] = graphPoint(0, 0);
  ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, transformCanvas.height); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(transformCanvas.width, originY); ctx.stroke();
}

function plotFunction(evaluate, color, width) {
  const ctx = transformContext;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  let drawing = false;
  let lastY = null;
  for (let pixelX = 0; pixelX <= transformCanvas.width; pixelX += 1) {
    const x = (pixelX - transformCanvas.width / 2) / 38;
    const y = evaluate(x);
    const [, pixelY] = graphPoint(x, y);
    const valid = Number.isFinite(y) && pixelY > -100 && pixelY < transformCanvas.height + 100;
    const jump = lastY !== null && Math.abs(pixelY - lastY) > 110;
    if (!valid || jump) {
      drawing = false;
      lastY = valid ? pixelY : null;
      continue;
    }
    if (!drawing) {
      ctx.moveTo(pixelX, pixelY);
      drawing = true;
    } else {
      ctx.lineTo(pixelX, pixelY);
    }
    lastY = pixelY;
  }
  ctx.stroke();
}

function signedShift(value, variable) {
  if (value === 0) return variable;
  return value > 0 ? `(${variable} − ${value})` : `(${variable} + ${Math.abs(value)})`;
}

function buildFormula(type, a, h, k, reflected) {
  const shiftedInput = signedShift(h, 'x');
  const input = reflected ? (shiftedInput === 'x' ? '−x' : `−${shiftedInput}`) : shiftedInput;
  const core = {
    quadratic: `(${input})²`,
    absolute: `|${input}|`,
    linear: input,
    cubic: `(${input})³`,
    sqrt: `√(${input})`,
    reciprocal: `1/(${input})`,
    exponential: `2^(${input})`
  }[type];
  const scale = a === 1 ? '' : a === -1 ? '−' : `${a}·`;
  const vertical = k === 0 ? '' : k > 0 ? ` + ${k}` : ` − ${Math.abs(k)}`;
  return `y = ${scale}${core}${vertical}`;
}

function buildNotice(type, a, h, k, reflected) {
  const changes = [];
  if (reflected) changes.push('reflected across the y-axis');
  if (a < 0) changes.push('reflected across the x-axis');
  if (Math.abs(a) > 1) changes.push('vertically stretched');
  if (Math.abs(a) > 0 && Math.abs(a) < 1) changes.push('vertically compressed');
  if (a === 0) changes.push('collapsed to a horizontal line');
  if (h !== 0) changes.push(`shifted ${Math.abs(h)} unit${Math.abs(h) === 1 ? '' : 's'} ${h > 0 ? 'right' : 'left'}`);
  if (k !== 0) changes.push(`shifted ${Math.abs(k)} unit${Math.abs(k) === 1 ? '' : 's'} ${k > 0 ? 'up' : 'down'}`);
  const evenFunction = ['quadratic', 'absolute'].includes(type);
  if (reflected && evenFunction) {
    return `The y-axis reflection is included, but this parent function is even, so f(−x) = f(x) and that reflection does not change its appearance${changes.length > 1 ? `. It is also ${changes.slice(1).join(', ')}.` : '.'}`;
  }
  return changes.length ? `The parent graph is ${changes.join(', ')}.` : 'The transformed graph matches the parent function.';
}

function drawTransformation() {
  const type = parentFunction.value;
  const parent = parentFunctions[type];
  const a = Number(aControl.value);
  const h = Number(hControl.value);
  const k = Number(kControl.value);
  const reflected = reflectY.checked;
  drawGrid();
  plotFunction(parent.evaluate, '#77777d', 3);
  plotFunction((x) => a * parent.evaluate(reflected ? -(x - h) : x - h) + k, '#b21f2d', 4);
  aValue.textContent = `a = ${a}`;
  hValue.textContent = `h = ${h}`;
  kValue.textContent = `k = ${k}`;
  transformFormula.textContent = buildFormula(type, a, h, k, reflected);
  transformNotice.textContent = buildNotice(type, a, h, k, reflected);
  transformCanvas.setAttribute('aria-label', `Graph of parent function ${parent.label} and transformed equation ${transformFormula.textContent}`);
}

[parentFunction, reflectY, aControl, hControl, kControl].forEach((control) => {
  control.addEventListener('input', drawTransformation);
});
resetTransform.addEventListener('click', () => {
  aControl.value = 1;
  hControl.value = 0;
  kControl.value = 0;
  reflectY.checked = false;
  drawTransformation();
});
