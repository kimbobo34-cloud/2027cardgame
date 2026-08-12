 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/script.js b/script.js
index d0cad05f616207fb5a9fd3a77432c823272cff27..4571b42037c16826f47e81a24d043aa337b0bd9e 100644
--- a/script.js
+++ b/script.js
@@ -1,95 +1,101 @@
 const gameBoard = document.getElementById("gameBoard");
 const timerDisplay = document.getElementById("timer");
 const restartBtn = document.getElementById("restartBtn");
 
 const totalTime = 20;
 const PREVIEW_SECONDS = 5;
 const GRID_COLS = 4;
 const GRID_ROWS = 4;
+const CANDIDATE_IMAGE_COUNT = 18;
+const PAIR_COUNT = (GRID_COLS * GRID_ROWS) / 2;
 
 let countdown;          
 let previewInterval;    
 let timeLeft = totalTime;
 
-const images = [];
-for (let i = 1; i <= 8; i++) {
-  images.push(`img/${i}.jpg`);
-  images.push(`img/${i}.jpg`);
+const candidateImages = [];
+for (let i = 1; i <= CANDIDATE_IMAGE_COUNT; i++) {
+  candidateImages.push(`img/${i}.jpg`);
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
 
+function createDeck() {
+  const selectedImages = shuffle([...candidateImages]).slice(0, PAIR_COUNT);
+  return shuffle(selectedImages.flatMap(src => [src, src]));
+}
+
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
 
-  const shuffled = shuffle([...images]);
+  const deck = createDeck();
 
-  shuffled.forEach(src => {
+  deck.forEach(src => {
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
 
EOF
)
