import { globalPiece } from "../Render/main.js";

const snapshots = [];
let cursor = -1;
let applying = false;
let promotionPending = false;

let _globalState = null;
let _keySquareMapper = null;
let _setInTurn = null;
let _resetInteractionState = null;

function deepClone(obj) {
  // Pieces/squares are plain objects, so JSON clone is enough here.
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

function takeSnapshot({ inTurn }) {
  return {
    inTurn,
    squares: _globalState.map((row) =>
      row.map((sq) => ({
        id: sq.id,
        piece: sq.piece ? deepClone(sq.piece) : null,
      }))
    ),
  };
}

function rebuildGlobalPiece() {
  const pieces = _globalState
    .flat()
    .filter((sq) => sq.piece)
    .map((sq) => ({ id: sq.id, piece: sq.piece }));

  const byName = (name) =>
    pieces
      .filter((p) => p.piece.piece_name === name)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((p) => p.piece);

  globalPiece.white_king = byName("WHITE_KING")[0] ?? null;
  globalPiece.black_king = byName("BLACK_KING")[0] ?? null;
  globalPiece.white_queen = byName("WHITE_QUEEN")[0] ?? null;
  globalPiece.black_queen = byName("BLACK_QUEEN")[0] ?? null;

  const wr = byName("WHITE_ROOK");
  const br = byName("BLACK_ROOK");
  globalPiece.white_rook_1 = wr[0] ?? null;
  globalPiece.white_rook_2 = wr[1] ?? null;
  globalPiece.black_rook_1 = br[0] ?? null;
  globalPiece.black_rook_2 = br[1] ?? null;

  const wk = byName("WHITE_KNIGHT");
  const bk = byName("BLACK_KNIGHT");
  globalPiece.white_knight_1 = wk[0] ?? null;
  globalPiece.white_knight_2 = wk[1] ?? null;
  globalPiece.black_knight_1 = bk[0] ?? null;
  globalPiece.black_knight_2 = bk[1] ?? null;

  const wb = byName("WHITE_BISHOP");
  const bb = byName("BLACK_BISHOP");
  globalPiece.white_bishop_1 = wb[0] ?? null;
  globalPiece.white_bishop_2 = wb[1] ?? null;
  globalPiece.black_bishop_1 = bb[0] ?? null;
  globalPiece.black_bishop_2 = bb[1] ?? null;

  // Not used elsewhere, but keep them reasonably set.
  globalPiece.white_pawn = byName("WHITE_PAWN")[0] ?? null;
  globalPiece.black_pawn = byName("BLACK_PAWN")[0] ?? null;
}

function renderBoardFromState() {
  _globalState.flat().forEach((sq) => {
    const el = document.getElementById(sq.id);
    if (!el) return;
    el.innerHTML = "";
    el.classList.remove("captureColor", "highlightYellow", "draggingSource");
  });

  _globalState.flat().forEach((sq) => {
    if (!sq.piece) return;
    const el = document.getElementById(sq.id);
    if (!el) return;

    const img = document.createElement("img");
    img.src = sq.piece.img;
    img.classList.add("piece");
    img.draggable = false;
    el.appendChild(img);
  });
}

function applySnapshot(idx) {
  const snap = snapshots[idx];
  if (!snap) return;

  applying = true;
  if (_resetInteractionState) _resetInteractionState();

  snap.squares.flat().forEach((savedSq) => {
    const liveSq = _keySquareMapper[savedSq.id];
    if (!liveSq) return;

    liveSq.piece = savedSq.piece ? deepClone(savedSq.piece) : null;
    liveSq.highlight = null;
    liveSq.captureHighlight = false;
    if (liveSq.piece) liveSq.piece.current_position = savedSq.id;
  });

  rebuildGlobalPiece();
  if (_setInTurn) _setInTurn(snap.inTurn);
  renderBoardFromState();

  cursor = idx;
  applying = false;
  updateButtons();
}

function recordSnapshot({ inTurn }) {
  if (applying || promotionPending) return;
  const snap = takeSnapshot({ inTurn });

  // If we time-traveled and then made a move, discard "future" history.
  if (cursor < snapshots.length - 1) {
    snapshots.splice(cursor + 1);
  }

  snapshots.push(snap);
  cursor = snapshots.length - 1;
  updateButtons();
}

function updateButtons() {
  const startBtn = document.getElementById("historyStart");
  const backBtn = document.getElementById("historyBack");
  const forwardBtn = document.getElementById("historyForward");
  const endBtn = document.getElementById("historyEnd");
  if (!startBtn || !backBtn || !forwardBtn || !endBtn) return;

  startBtn.disabled = cursor <= 0;
  backBtn.disabled = cursor <= 0;
  forwardBtn.disabled = cursor >= snapshots.length - 1;
  endBtn.disabled = cursor >= snapshots.length - 1;
}

function initHistoryControls() {
  const startBtn = document.getElementById("historyStart");
  const backBtn = document.getElementById("historyBack");
  const forwardBtn = document.getElementById("historyForward");
  const endBtn = document.getElementById("historyEnd");

  if (startBtn) startBtn.addEventListener("click", () => applySnapshot(0));
  if (backBtn) backBtn.addEventListener("click", () => applySnapshot(Math.max(0, cursor - 1)));
  if (forwardBtn)
    forwardBtn.addEventListener("click", () =>
      applySnapshot(Math.min(snapshots.length - 1, cursor + 1))
    );
  if (endBtn) endBtn.addEventListener("click", () => applySnapshot(snapshots.length - 1));

  updateButtons();
}

function setPromotionPending(next) {
  promotionPending = Boolean(next);
}

function initHistory({ globalState, keySquareMapper, setInTurn, resetInteractionState }) {
  _globalState = globalState;
  _keySquareMapper = keySquareMapper;
  _setInTurn = setInTurn;
  _resetInteractionState = resetInteractionState;
}

export { initHistory, initHistoryControls, recordSnapshot, setPromotionPending };

