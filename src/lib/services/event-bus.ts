import { EventEmitter } from "events";

const jobEvents = new EventEmitter();
jobEvents.setMaxListeners(50);

export { jobEvents };
