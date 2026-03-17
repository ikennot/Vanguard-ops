class GameState {
  constructor(initialState = null) {
    this.state = initialState;
    this.subscribers = new Set();
  }

  get() {
    return this.state;
  }

  set(nextState) {
    const previousState = this.state;
    this.state = nextState;
    for (const callback of this.subscribers) {
      callback(nextState, previousState);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }
}

const gameState = new GameState();

export default gameState;
