import { getElapsedSeconds } from "../frontend/src/utils/utilidades.jsx";

const now = new Date("2026-04-29T18:20:00.000Z").toISOString();
const pauseState = { workHours: { startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 } };

const base = {
  status: "Pausado",
  accumulatedSeconds: 1200,
  pauseStartedAt: new Date("2026-04-29T18:00:00.000Z").toISOString(),
  cleaningSite: "C3",
};

const authorizedCase = {
  ...base,
  pauseAuthorizedSeconds: 600,
};
const noAuthorizedCase = {
  ...base,
  pauseAuthorizedSeconds: 0,
};

const result = {
  authorizedExpected: 1200 + (1200 - 600),
  authorizedActual: getElapsedSeconds(authorizedCase, now, pauseState),
  noAuthorizedExpected: 1200,
  noAuthorizedActual: getElapsedSeconds(noAuthorizedCase, now, pauseState),
};

console.log(JSON.stringify(result, null, 2));
