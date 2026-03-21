import { InteractionContext } from "../config/models/InteractionContext";

export class InteractionContextManager {
  private static instance: InteractionContextManager;
  private context: InteractionContext = { type: "none" };

  static getInstance() {
    if (!this.instance) {
      this.instance = new InteractionContextManager();
    }
    return this.instance;
  }

  setContext(context: InteractionContext) {
    this.context = context;
  }

  getContext(): InteractionContext {
    return this.context;
  }

  clear() {
    this.context = { type: "none" };
  }
}
