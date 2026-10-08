// UI history only. Geometry and export remain owned by their existing modules.
export function createProjectHistory(initial, limit = 80) {
  let current = initial,
    past = [],
    future = [],
    transaction = null,
    recorded = false;
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  return {
    get current() {
      return current;
    },
    read() {
      return current;
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    begin() {
      if (!transaction) {
        transaction = current;
        recorded = false;
      }
    },
    end() {
      transaction = null;
      recorded = false;
    },
    replace(next) {
      current = next;
      past = [];
      future = [];
      transaction = null;
      recorded = false;
    },
    commit(next) {
      if (equal(next, current)) return current;
      if (!transaction || !recorded) {
        past.push(transaction || current);
        if (past.length > limit) past.shift();
        recorded = true;
      }
      future = [];
      current = next;
      return current;
    },
    undo() {
      this.end();
      if (past.length) {
        future.push(current);
        current = past.pop();
      }
      return current;
    },
    redo() {
      this.end();
      if (future.length) {
        past.push(current);
        current = future.pop();
      }
      return current;
    },
  };
}
