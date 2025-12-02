import { QuizSessionState } from "../types/runtime";

type Listener = (state: QuizSessionState) => void;

/**
 * The Central Memory of the Quiz Engine.
 * Implements a strict Publish/Subscribe pattern.
 * Framework-agnostic (can run in Node/Workers).
 */
export class StateStore {
  private _state: QuizSessionState;
  private _listeners: Set<Listener>;

  constructor(initialState: QuizSessionState) {
    this._state = initialState;
    this._listeners = new Set();
  }

  /**
   * Returns the current snapshot of the state.
   * Treat this as Read-Only.
   */
  public getState(): QuizSessionState {
    return this._state;
  }

  /**
   * Updates the state and notifies all subscribers.
   * @param newState The completely new state tree (Immutability enforced by caller)
   */
  public setState(newState: QuizSessionState): void {
    if (newState === this._state) return; // No change detected
    
    this._state = newState;
    this.notify();
  }

  /**
   * Subscribes to changes.
   * @returns Unsubscribe function
   */
  public subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    // Return cleanup function
    return () => {
      this._listeners.delete(listener);
    };
  }

  private notify() {
    this._listeners.forEach((listener) => listener(this._state));
  }

  /**
   * Utilities for specific lookups (Performance helpers)
   */
  public getNode(id: string) {
    return this._state.nodes[id];
  }

  public getGlobalVariable(key: string) {
    return this._state.variables[key];
  }
}