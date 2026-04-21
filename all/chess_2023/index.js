import { initGame } from "./Data/data.js";
import { GlobalEvent, getInTurn, setInTurn, resetInteractionState } from "./Events/global.js";
import { initGameRender } from "./Render/main.js";
import { initHistory, initHistoryControls, recordSnapshot } from "./Helper/history.js";

// will be usefull till game ends
const globalState = initGame();
let keySquareMapper = {};

globalState.flat().forEach((square) => {
  keySquareMapper[square.id] = square;
});

initGameRender(globalState);
initHistory({ globalState, keySquareMapper, setInTurn, resetInteractionState });
initHistoryControls();
recordSnapshot({ inTurn: getInTurn() });
GlobalEvent();

String.prototype.replaceAt = function (index, replacement) {
  return (
    this.substring(0, index) +
    replacement +
    this.substring(index + replacement.length)
  );
};

export { globalState, keySquareMapper };
