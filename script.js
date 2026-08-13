const gameBoard = document.getElementById("gameBoard");
const timerDisplay = document.getElementById("timer");
const restartBtn = document.getElementById("restartBtn");

const languageScreen = document.getElementById("languageScreen");
const gameScreen = document.getElementById("gameScreen");

const koreanBtn = document.getElementById("koreanBtn");
const englishBtn = document.getElementById("englishBtn");

const switchKorean = document.getElementById("switchKorean");
const switchEnglish = document.getElementById("switchEnglish");

const languageTitle = document.getElementById("languageTitle");
const gameTitle = document.getElementById("gameTitle");

const totalTime = 20;
const PREVIEW_SECONDS = 10;
const GRID_COLS = 4;
const GRID_ROWS = 4;
const CANDIDATE_IMAGE_COUNT = 18;
const PAIR_COUNT = (GRID_COLS * GRID_ROWS) / 2;

let countdown;
let previewInterval;
let timeLeft = totalTime;

let currentLanguage = localStorage.getItem("gameLanguage");

const candidateImages = [];

for (let i = 1; i <= CANDIDATE_IMAGE_COUNT; i++) {
  candidateImages.push(`img/${i}.jpg`);
}

let flippedCards = [];
let lockBoard = false;
let matchedSets = 0;


/* =========================
   언어 설정
========================= */

const translations = {
  ko: {
    languageTitle: "언어를 선택해주세요",
    gameTitle: "💙 Chungcheong 2027 💙<br>카드 맞추기 게임",
    preview: seconds => `미리보기 ${seconds}초`,
    timeLeft: seconds => `남은 시간: ${seconds}초`,
    timeUp: sets => `시간 종료! ${sets}세트 성공!`,
    success: sets => `🎉 게임 완료! ${sets}세트 모두 성공!`,
    restart: "다시 시작"
  },

  en: {
    languageTitle: "Please select your language",
    gameTitle: "💙 Chungcheong 2027 💙<br>Memory Matching Game",
    preview: seconds => `Preview ${seconds} sec`,
    timeLeft: seconds => `Time left: ${seconds} sec`,
    timeUp: sets => `Time's up! ${sets} pairs matched!`,
    success: sets => `🎉 Game Complete! All ${sets} pairs matched!`,
    restart: "Restart"
  }
};


function setLanguage(language) {
  currentLanguage = language;

  // 브라우저에 언어 저장
  localStorage.setItem("gameLanguage", language);

  updateLanguage();

  // 언어 선택 화면 숨기고 게임 화면 표시
  languageScreen.style.display = "none";
  gameScreen.style.display = "block";

  initGame();
}


function updateLanguage() {
  const t = translations[currentLanguage];

  languageTitle.textContent = t.languageTitle;
  gameTitle.innerHTML = t.gameTitle;
  restartBtn.textContent = t.restart;

  document.documentElement.lang =
    currentLanguage === "ko" ? "ko" : "en";
}


/* =========================
   언어 버튼
========================= */

koreanBtn.addEventListener("click", () => {
  setLanguage("ko");
});

englishBtn.addEventListener("click", () => {
  setLanguage("en");
});

switchKorean.addEventListener("click", () => {
  if (currentLanguage !== "ko") {
    setLanguage("ko");
  }
});

switchEnglish.addEventListener("click", () => {
  if (currentLanguage !== "en") {
    setLanguage("en");
  }
});


/* =========================
   카드 랜덤 섞기
========================= */

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}


/* =========================
   카드 생성
========================= */

function createDeck() {

  // 반드시 각 그룹에서 최소 1장씩 선택
  const groups = [
    [1, 2, 3],
    [4, 5],
    [6, 7, 8, 9, 10, 11, 12, 13],
    [14, 15, 16, 17, 18]
  ];

  // 각 그룹에서 랜덤으로 1장씩 선택
  let selectedNumbers = groups.map(group => {
    return group[Math.floor(Math.random() * group.length)];
  });

  // 이미 선택된 카드를 제외한 나머지
  const remainingNumbers = [];

  for (let i = 1; i <= CANDIDATE_IMAGE_COUNT; i++) {
    if (!selectedNumbers.includes(i)) {
      remainingNumbers.push(i);
    }
  }

  // 나머지 4장 랜덤 선택
  shuffle(remainingNumbers);

  selectedNumbers = selectedNumbers.concat(
    remainingNumbers.slice(
      0,
      PAIR_COUNT - selectedNumbers.length
    )
  );

  // 최종 8장의 순서도 랜덤
  shuffle(selectedNumbers);

  // 이미지 경로로 변환
  const selectedImages = selectedNumbers.map(
    number => `img/${number}.jpg`
  );

  // 각각 2장씩 만들어 총 16장
  return shuffle(
    selectedImages.flatMap(src => [src, src])
  );
}


/* =========================
   화면 크기에 맞게 카드 조정
========================= */

function fitBoardToViewport() {

  const cs = getComputedStyle(gameBoard);

  const gap = parseFloat(cs.gap) || 0;

  const padH =
    (parseFloat(cs.paddingLeft) || 0) +
    (parseFloat(cs.paddingRight) || 0);

  const marV =
    (parseFloat(cs.marginTop) || 0) +
    (parseFloat(cs.marginBottom) || 0);

  const maxW = parseFloat(cs.maxWidth) || Infinity;

  const titleH =
    document.querySelector("#gameTitle")?.offsetHeight || 0;

  const timerH =
    timerDisplay?.offsetHeight || 0;

  const restartH =
    restartBtn.style.display !== "none"
      ? restartBtn.offsetHeight + 16
      : 0;

  const availableHeight =
    window.innerHeight -
    titleH -
    timerH -
    restartH -
    marV -
    20;

  const availableWidth =
    Math.min(
      window.innerWidth,
      isFinite(maxW) ? maxW : window.innerWidth
    ) - padH;

  const sizeByWidth = Math.floor(
    (availableWidth - gap * (GRID_COLS - 1)) /
      GRID_COLS
  );

  const sizeByHeight = Math.floor(
    (availableHeight - gap * (GRID_ROWS - 1)) /
      GRID_ROWS
  );

  let size = Math.min(
    sizeByWidth,
    sizeByHeight
  );

  if (!isFinite(size) || size <= 0) {
    size = 60;
  }

  size = Math.max(40, size - 1);

  gameBoard.style.gridTemplateColumns =
    `repeat(${GRID_COLS}, ${size}px)`;
}


/* =========================
   게임 시작
========================= */

function initGame() {

  clearInterval(countdown);
  clearInterval(previewInterval);

  gameBoard.innerHTML = "";

  flippedCards = [];
  lockBoard = true;
  matchedSets = 0;
  timeLeft = totalTime;

  const t = translations[currentLanguage];

  timerDisplay.textContent =
    t.preview(PREVIEW_SECONDS);

  restartBtn.style.display = "none";

  const deck = createDeck();

  deck.forEach(src => {

    const card = document.createElement("div");

    card.classList.add("card");

    card.dataset.image = src;

    card.innerHTML = `
      <div class="card-inner">

        <div class="back">
          <img src="img/back.png" alt="back">
        </div>

        <div class="front">
          <img src="${src}" alt="front">
        </div>

      </div>
    `;

    card.addEventListener(
      "click",
      () => flipCard(card)
    );

    gameBoard.appendChild(card);
  });

  fitBoardToViewport();

  const allCards =
    document.querySelectorAll(".card");

  setTimeout(() => {

    allCards.forEach(card => {
      card.classList.add("flipped");
    });

    startPreviewCountdown(allCards);

  }, 100);
}


/* =========================
   미리보기 카운트다운
========================= */

function startPreviewCountdown(allCards) {

  let remain = PREVIEW_SECONDS;

  const t = translations[currentLanguage];

  timerDisplay.textContent =
    t.preview(remain);

  previewInterval = setInterval(() => {

    remain--;

    if (remain > 0) {

      timerDisplay.textContent =
        t.preview(remain);

    } else {

      clearInterval(previewInterval);

      allCards.forEach(card => {
        card.classList.remove("flipped");
      });

      showStartOverlay();
    }

  }, 1000);
}


/* =========================
   START 표시
========================= */

function showStartOverlay() {

  const overlay =
    document.createElement("div");

  overlay.id = "startOverlay";

  overlay.textContent =
    "START";

  document.body.appendChild(overlay);

  overlay.addEventListener(
    "animationend",
    () => {

      overlay.remove();

      showStartMessage();

    },
    { once: true }
  );
}


/* =========================
   게임 시작 메시지
========================= */

function showStartMessage() {

  const t = translations[currentLanguage];

  timerDisplay.textContent =
    t.timeLeft(timeLeft);

  lockBoard = false;

  startTimer();
}


/* =========================
   카드 뒤집기
========================= */

function flipCard(card) {

  if (
    lockBoard ||
    card.classList.contains("flipped")
  ) {
    return;
  }

  card.classList.add("flipped");

  flippedCards.push(card);

  if (flippedCards.length === 2) {
    checkMatch();
  }
}


/* =========================
   카드 맞추기
========================= */

function checkMatch() {

  lockBoard = true;

  const [card1, card2] =
    flippedCards;

  if (
    card1.dataset.image ===
    card2.dataset.image
  ) {

    matchedSets++;

    flippedCards = [];

    // 모든 8세트를 맞추면 즉시 종료
    if (matchedSets === PAIR_COUNT) {

      clearInterval(countdown);

      endGame(true);

      return;
    }

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


/* =========================
   게임 타이머
========================= */

function startTimer() {

  clearInterval(countdown);

  countdown = setInterval(() => {

    timeLeft--;

    const t =
      translations[currentLanguage];

    timerDisplay.textContent =
      t.timeLeft(timeLeft);

    if (timeLeft <= 0) {

      clearInterval(countdown);

      endGame(false);
    }

  }, 1000);
}


/* =========================
   게임 종료
========================= */

function endGame(isSuccess = false) {

  lockBoard = true;

  clearInterval(countdown);

  const t =
    translations[currentLanguage];

  if (isSuccess) {

    timerDisplay.textContent =
      t.success(matchedSets);

  } else {

    timerDisplay.textContent =
      t.timeUp(matchedSets);
  }

  restartBtn.style.display =
    "inline-block";

  fitBoardToViewport();
}


/* =========================
   다시 시작
========================= */

restartBtn.addEventListener(
  "click",
  initGame
);


/* =========================
   화면 크기 변경
========================= */

window.addEventListener(
  "resize",
  fitBoardToViewport
);


/* =========================
   최초 실행
========================= */

if (currentLanguage) {

  // 이전에 선택한 언어가 있으면
  // 바로 게임 화면으로 이동

  updateLanguage();

  languageScreen.style.display =
    "none";

  gameScreen.style.display =
    "block";

  initGame();

} else {

  // 처음 방문한 경우
  // 언어 선택 화면 표시

  languageScreen.style.display =
    "flex";

  gameScreen.style.display =
    "none";
}
