const apiKey = "d8fCzh7cY0kCTBVFC1lwEbqRSnqGWe80KQ3ngZDkbdzxQlTS1QZIIcxy";

let rows = 4;
let cols = 4;
let timerInterval;
let timeElapsed = 0;
let currentPage = 1;
let isFetching = false;

document.getElementById("photoSearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchPhotos();
  }
});

document.getElementById("searchButton").addEventListener("click", searchPhotos);
document
  .getElementById("difficulty")
  .addEventListener("change", updateDifficulty);
document
  .getElementById("newGameButton")
  .addEventListener("click", () => location.reload());

function searchPhotos() {
  const query = document.getElementById("photoSearch").value.trim();

  if (!query) {
    alert("Please enter a search term!");
    return;
  }

  document.getElementById("gameTitle").style.display = "none";
  document.getElementById("controls").style.display = "none";

  document.getElementById("photoResultsHeading").style.display = "block";
  document.getElementById("photoResults").style.display = "flex";
  currentPage = 1;
  fetchPhotos(query);
}

function fetchPhotos(query) {
  if (isFetching) return;
  isFetching = true;

  fetch(
    `https://api.pexels.com/v1/search?query=${query}&per_page=10&page=${currentPage}`,
    { headers: { Authorization: apiKey } }
  )
    .then((response) => response.json())
    .then((data) => {
      displayPhotos(data.photos);
      isFetching = false;
    })
    .catch(() => {
      alert("Failed to load images. Please try again.");
      isFetching = false;
    });
}

function displayPhotos(photos) {
  const photoResults = document.getElementById("photoResults");
  photos.forEach((photo) => {
    const img = document.createElement("img");
    img.src = photo.src.medium;
    img.alt = photo.alt;
    img.addEventListener("click", () => startPuzzle(photo.src.large));
    photoResults.appendChild(img);
  });

  setupInfiniteScroll();
}

function setupInfiniteScroll() {
  const photoResults = document.getElementById("photoResults");
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      currentPage++;
      fetchPhotos(document.getElementById("photoSearch").value.trim());
    }
  });

  const lastPhoto = photoResults.lastChild;
  if (lastPhoto) observer.observe(lastPhoto);
}

function startPuzzle(imageSrc) {
  document.getElementById("photoResultsHeading").style.display = "none";
  document.getElementById("photoResults").style.display = "none";
  document.getElementById("puzzleArea").style.display = "block";
  document.getElementById("scoreboard").style.display = "block";
  document.getElementById("newGameButton").style.display = "block";

  const puzzleGrid = document.getElementById("puzzleGrid");
  puzzleGrid.innerHTML = "";

  const img = new Image();
  img.src = imageSrc;
  img.onload = () => {
    const puzzleWidth = img.naturalWidth;
    const puzzleHeight = img.naturalHeight;

    const pieceWidth = puzzleWidth / cols;
    const pieceHeight = puzzleHeight / rows;

    puzzleGrid.style.width = `${puzzleWidth}px`;
    puzzleGrid.style.height = `${puzzleHeight}px`;
    puzzleGrid.style.gridTemplateColumns = `repeat(${cols}, ${pieceWidth}px)`;
    puzzleGrid.style.gridTemplateRows = `repeat(${rows}, ${pieceHeight}px)`;

    const pieces = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const piece = document.createElement("div");
        piece.className = "puzzle-piece";
        piece.style.width = `${pieceWidth}px`;
        piece.style.height = `${pieceHeight}px`;
        piece.style.backgroundImage = `url(${imageSrc})`;
        piece.style.backgroundSize = `${puzzleWidth}px ${puzzleHeight}px`;
        piece.style.backgroundPosition = `${-col * pieceWidth}px ${
          -row * pieceHeight
        }px`;
        piece.dataset.originalPosition = `${row}-${col}`;
        pieces.push(piece);
      }
    }

    shuffle(pieces).forEach((piece) => puzzleGrid.appendChild(piece));
    enableDragAndDrop();
    startTimer();
  };
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function enableDragAndDrop() {
  const pieces = document.querySelectorAll(".puzzle-piece");
  let draggedPiece = null;

  pieces.forEach((piece) => {
    piece.draggable = true;

    piece.addEventListener("dragstart", () => {
      draggedPiece = piece;
    });

    piece.addEventListener("dragover", (e) => e.preventDefault());

    piece.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetPiece = e.target;

      if (targetPiece.classList.contains("puzzle-piece")) {
        const parent = draggedPiece.parentNode;
        const draggedClone = draggedPiece.cloneNode(true);
        const targetClone = targetPiece.cloneNode(true);

        parent.replaceChild(draggedClone, targetPiece);
        parent.replaceChild(targetClone, draggedPiece);

        enableDragAndDrop();
        checkProgress();
      }
    });
  });
}

function checkProgress() {
  const pieces = Array.from(document.querySelectorAll(".puzzle-piece"));
  let correctCount = 0;

  pieces.forEach((piece, index) => {
    const currentRow = Math.floor(index / cols);
    const currentCol = index % cols;
    const currentPosition = `${currentRow}-${currentCol}`;
    const originalPosition = piece.dataset.originalPosition;

    if (currentPosition === originalPosition) {
      correctCount++;
    }
  });

  document.getElementById("correctPieces").textContent = correctCount;

  if (correctCount === rows * cols) {
    clearInterval(timerInterval);
    addToScoreboard();
    alert(`Congratulations! You solved the puzzle in ${timeElapsed} seconds!`);
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timeElapsed = 0;
  document.getElementById("timer").textContent = timeElapsed;

  timerInterval = setInterval(() => {
    timeElapsed++;
    document.getElementById("timer").textContent = timeElapsed;
  }, 1000);
}

function addToScoreboard() {
  const scoreboard = document.getElementById("scoreList");
  const scoreItem = document.createElement("li");
  scoreItem.textContent = `Time: ${timeElapsed} seconds (Difficulty: ${rows}x${cols})`;
  scoreboard.appendChild(scoreItem);
}

function updateDifficulty() {
  const difficulty = document.getElementById("difficulty").value;
  rows = parseInt(difficulty, 10);
  cols = parseInt(difficulty, 10);
}
