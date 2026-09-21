/**
 * Undo / Redo Manager for state history
 */
export class UndoRedoManager {
  constructor(maxHistory = 20) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
  }

  push(state) {
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    this.history.push(JSON.parse(JSON.stringify(state)));
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo(currentState) {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return currentState;
  }

  redo(currentState) {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return currentState;
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
}
