'use strict';
// Presentation-only helpers: never modify the puzzle's saved game state.
window.PuzzleInteraction={
 hints(board,external={}){const valid=v=>Array.isArray(v)&&v.length===4&&v.every(s=>typeof s==='string'&&s.trim());return valid(external?.[board.id])?external[board.id]:valid(board.hints)?board.hints:[];},
 hintCount(value){return Number.isInteger(value)&&value>=0&&value<=4?value:0;}
};
