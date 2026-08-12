const gameBoard = document.getElementById("gameBoard");
const timerDisplay = document.getElementById("timer");
const restartBtn = document.getElementById("restartBtn");

const totalTime = 20;
const PREVIEW_SECONDS = 5;
const GRID_COLS = 4;
const GRID_ROWS = 4;

let countdown;          
let previewInterval;    
let timeLeft = totalTime;

const images = [];
for (let i = 1; i <= 8; i++) {
  images.push(`img/${i}.jpg`);
  images.push(`img/${i}.jpg`);
}

let flippedCards = [];
let lockBoard = false;
let matchedSets = 0;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function fitBoardToViewport() {
  const cs = getComputedStyle(gameBoard);
  const gap = parseFloat(cs.gap) || 0;
  const padH = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  const marV = (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
  const maxW = parseFloat(cs.maxWidth) || Infinity;

  const titleH = (document.querySelector('h1')?.offsetHeight || 0);
  const timerH = (timerDisplay?.offsetHeight || 0);
  const restartH = (restartBtn.style.display !== "none") ? (restartBtn.offsetHeight + 16) : 0;

  const availableHeight = window.innerHeight - titleH - timerH - restartH - marV - 20;
  const availableWidth  = Math.min(window.innerWidth, isFinite(maxW) ? maxW : window.innerWidth) - padH;

  const sizeByWidth  = Math.floor((availableWidth  - gap * (GRID_COLS - 1)) / GRID_COLS);
  const sizeByHeight = Math.floor((availableHeight - gap * (GRID_ROWS - 1)) / GRID_ROWS);

  let size = Math.min(sizeByWidth, sizeByHeight);
  if (!isFinite(size) || size <= 0) size = 60;
  size = Math.max(40, size - 1);

  gameBoard.style.gridTemplateColumns = `repeat(${GRID_COLS}, ${size}px)`;
}

function initGame() {
  clearInterval(countdown);
  clearInterval(previewInterval);

  gameBoard.innerHTML = "";
  flippedCards = [];
  lockBoard = true;
  matchedSets = 0;
  timeLeft = totalTime;
  timerDisplay.textContent = `미리보기 ${PREVIEW_SECONDS}초`;
  restartBtn.style.display = "none";

  const shuffled = shuffle([...images]);

  shuffled.forEach(src => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.image = src;

    card.innerHTML = `
      <div class="card-inner">
        <div class="back"><img src="img/back.png" alt="back"></div>
        <div class="front"><img src="${src}" alt="front"></div>
      </div>
    `;

    card.addEventListener("click", () => flipCard(card));
    gameBoard.appendChild(card);
  });

  fitBoardToViewport();

  const allCards = document.querySelectorAll(".card");
  setTimeout(() => {
    allCards.forEach(card => card.classList.add("flipped"));
    startPreviewCountdown(allCards);
  }, 100);
}

function startPreviewCountdown(allCards) {
  let remain = PREVIEW_SECONDS; // 3
  timerDisplay.textContent = `미리보기 ${remain}초`;

  previewInterval = setInterval(() => {
    remain--;
    if (remain > 0) {
      timerDisplay.textContent = `미리보기 ${remain}초`; // 2, 1
    } else {
      clearInterval(previewInterval);

      allCards.forEach(card => card.classList.remove("flipped"));
      showStartOverlay();
    }
  }, 1000);
}

function showStartOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "startOverlay";
  overlay.textContent = "START";
  document.body.appendChild(overlay);

  overlay.addEventListener("animationend", () => {
    overlay.remove();
    showStartMessage();
  }, { once: true });
}

function showStartMessage() {
  timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
  lockBoard = false;
  startTimer();      
}

function flipCard(card) {
  if (lockBoard || card.classList.contains("flipped")) return;

  card.classList.add("flipped");
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    checkMatch();
  }
}

function checkMatch() {
  lockBoard = true;
  const [card1, card2] = flippedCards;
  if (card1.dataset.image === card2.dataset.image) {
    matchedSets++;
    flippedCards = [];
    lockBoard = false;
  } else {
    setTimeout(() => {
      card1.classList.remove("flipped");
      card2.classList.remove("flipped");
      flippedCards = [];
      lockBoard = false;
    }, 800);
  }
}

function startTimer() {
  clearInterval(countdown);
  countdown = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      endGame();
    }
  }, 1000);
}

function endGame() {
  lockBoard = true;
  timerDisplay.textContent = `시간 종료! ${matchedSets}세트 성공!`;
  restartBtn.style.display = "inline-block";
  fitBoardToViewport();
}

restartBtn.addEventListener("click", initGame);
window.addEventListener("resize", fitBoardToViewport);

initGame();
