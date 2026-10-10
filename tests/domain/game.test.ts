import { describe, expect, it } from "vitest";
import {
  GameError,
  createGame,
  currentNode,
  elapsedMs,
  giveUp,
  jumpsOf,
  remainingJumps,
  selectNode,
  startGame,
  type GameState,
} from "@/domain/game";
import { MAX_JUMPS, clubSeasonNode, playerNode } from "@/domain/types";
import {
  COPETTI,
  DI_MARIA,
  MESSI,
  PSG_2021,
  ROSARIO_2025,
  messiToCopetti,
} from "../fixtures/mini-graph";

const T0 = 1_000_000;

function winningRun(): GameState {
  let s = startGame(createGame(messiToCopetti), T0);
  s = selectNode(s, clubSeasonNode(PSG_2021), T0 + 1000);
  s = selectNode(s, playerNode(DI_MARIA), T0 + 2000);
  s = selectNode(s, clubSeasonNode(ROSARIO_2025), T0 + 3000);
  return selectNode(s, playerNode(COPETTI), T0 + 4000);
}

describe("createGame / startGame", () => {
  it("crea la partida lista, sin cronómetro y con el origen como nodo actual", () => {
    const s = createGame(messiToCopetti);
    expect(s.status).toBe("ready");
    expect(s.path).toEqual([playerNode(MESSI)]);
    expect(s.startedAt).toBeNull();
    expect(s.finishedAt).toBeNull();
    expect(jumpsOf(s)).toBe(0);
    expect(currentNode(s)).toEqual(playerNode(MESSI));
  });

  it("el cronómetro no corre antes de Start", () => {
    const s = createGame(messiToCopetti);
    expect(elapsedMs(s, T0 + 60_000)).toBe(0);
  });

  it("Start inicia el cronómetro en 0", () => {
    const s = startGame(createGame(messiToCopetti), T0);
    expect(s.status).toBe("playing");
    expect(s.startedAt).toBe(T0);
    expect(elapsedMs(s, T0)).toBe(0);
    expect(elapsedMs(s, T0 + 5000)).toBe(5000);
  });

  it("no se puede hacer Start dos veces", () => {
    const s = startGame(createGame(messiToCopetti), T0);
    expect(() => startGame(s, T0 + 1)).toThrow(GameError);
    expect(() => startGame(s, T0 + 1)).toThrow(/ALREADY_STARTED/);
  });
});

describe("selectNode", () => {
  it("no permite seleccionar antes de Start", () => {
    const s = createGame(messiToCopetti);
    expect(() => selectNode(s, clubSeasonNode(PSG_2021), T0)).toThrow(/NOT_STARTED/);
  });

  it("cada selección suma exactamente un salto y cambia el nodo actual", () => {
    let s = startGame(createGame(messiToCopetti), T0);
    s = selectNode(s, clubSeasonNode(PSG_2021), T0 + 100);
    expect(jumpsOf(s)).toBe(1);
    expect(currentNode(s)).toEqual(clubSeasonNode(PSG_2021));
    s = selectNode(s, playerNode(DI_MARIA), T0 + 200);
    expect(jumpsOf(s)).toBe(2);
    expect(remainingJumps(s)).toBe(MAX_JUMPS - 2);
  });

  it("no muta el estado anterior", () => {
    const before = startGame(createGame(messiToCopetti), T0);
    const snapshot = JSON.stringify(before);
    selectNode(before, clubSeasonNode(PSG_2021), T0 + 100);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("exige alternar tipos: jugador -> club-temporada -> jugador", () => {
    const s = startGame(createGame(messiToCopetti), T0);
    expect(() => selectNode(s, playerNode(DI_MARIA), T0 + 1)).toThrow(/INVALID_NODE/);
    const s2 = selectNode(s, clubSeasonNode(PSG_2021), T0 + 2);
    expect(() => selectNode(s2, clubSeasonNode(ROSARIO_2025), T0 + 3)).toThrow(/INVALID_NODE/);
  });

  it("volver a un nodo anterior es seleccionarlo de nuevo y cuenta como salto", () => {
    let s = startGame(createGame(messiToCopetti), T0);
    s = selectNode(s, clubSeasonNode(PSG_2021), T0 + 1);
    s = selectNode(s, playerNode(MESSI), T0 + 2);
    expect(jumpsOf(s)).toBe(2);
    expect(currentNode(s)).toEqual(playerNode(MESSI));
    expect(s.status).toBe("playing");
  });
});

describe("victoria", () => {
  it("seleccionar al jugador destino termina la partida con victoria", () => {
    const s = winningRun();
    expect(s.status).toBe("won");
    expect(jumpsOf(s)).toBe(4);
    expect(s.finishedAt).toBe(T0 + 4000);
  });

  it("al ganar el tiempo se congela", () => {
    const s = winningRun();
    expect(elapsedMs(s, T0 + 999_999)).toBe(4000);
  });

  it("no se puede seguir jugando tras ganar", () => {
    const s = winningRun();
    expect(() => selectNode(s, clubSeasonNode(ROSARIO_2025), T0 + 5000)).toThrow(/FINISHED/);
    expect(() => startGame(s, T0 + 5000)).toThrow(GameError);
  });

  it("el club-temporada del destino no gana: hay que elegir al jugador", () => {
    let s = startGame(createGame(messiToCopetti), T0);
    s = selectNode(s, clubSeasonNode(PSG_2021), T0 + 1);
    s = selectNode(s, playerNode(DI_MARIA), T0 + 2);
    s = selectNode(s, clubSeasonNode(ROSARIO_2025), T0 + 3);
    expect(s.status).toBe("playing");
  });
});

describe("derrota por límite de saltos", () => {
  function bounce(jumps: number, challenge = messiToCopetti): GameState {
    let s = startGame(createGame(challenge), T0);
    for (let i = 1; i <= jumps; i++) {
      const node = i % 2 === 1 ? clubSeasonNode(PSG_2021) : playerNode(MESSI);
      s = selectNode(s, node, T0 + i * 1000);
    }
    return s;
  }

  it("con 19 saltos sigue jugando", () => {
    const s = bounce(MAX_JUMPS - 1);
    expect(s.status).toBe("playing");
    expect(remainingJumps(s)).toBe(1);
  });

  it("con 20 saltos sin llegar al destino se pierde y se congela el tiempo", () => {
    const s = bounce(MAX_JUMPS);
    expect(s.status).toBe("lost");
    expect(jumpsOf(s)).toBe(MAX_JUMPS);
    expect(s.finishedAt).toBe(T0 + MAX_JUMPS * 1000);
    expect(elapsedMs(s, T0 + 10_000_000)).toBe(MAX_JUMPS * 1000);
    expect(remainingJumps(s)).toBe(0);
  });

  it("no se puede seguir tras perder", () => {
    const s = bounce(MAX_JUMPS);
    expect(() => selectNode(s, clubSeasonNode(PSG_2021), T0 + 99_000)).toThrow(/FINISHED/);
  });

  it("si el salto 20 es el destino, gana (la victoria prima sobre el límite)", () => {
    const challenge = { ...messiToCopetti, destinationId: DI_MARIA };
    let s = bounce(MAX_JUMPS - 2, challenge); // vuelve a estar en Messi tras 18 saltos
    expect(currentNode(s)).toEqual(playerNode(MESSI));
    s = selectNode(s, clubSeasonNode(PSG_2021), T0 + 19_000);
    s = selectNode(s, playerNode(DI_MARIA), T0 + 20_000);
    expect(jumpsOf(s)).toBe(MAX_JUMPS);
    expect(s.status).toBe("won");
  });
});

describe("rendirse", () => {
  it("termina la partida como derrota, conserva el camino y congela el tiempo", () => {
    let s = startGame(createGame(messiToCopetti), T0);
    s = selectNode(s, clubSeasonNode(PSG_2021), T0 + 1000);
    const over = giveUp(s, T0 + 5000);
    expect(over.status).toBe("lost");
    expect(over.gaveUp).toBe(true);
    expect(over.finishedAt).toBe(T0 + 5000);
    expect(over.path).toEqual(s.path);
    expect(jumpsOf(over)).toBe(1);
    expect(elapsedMs(over, T0 + 999_999)).toBe(5000);
  });

  it("se puede rendir sin haber hecho ningún salto", () => {
    const over = giveUp(startGame(createGame(messiToCopetti), T0), T0 + 2000);
    expect(over.status).toBe("lost");
    expect(jumpsOf(over)).toBe(0);
  });

  it("no muta el estado anterior", () => {
    const before = startGame(createGame(messiToCopetti), T0);
    const snapshot = JSON.stringify(before);
    giveUp(before, T0 + 10);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("no se puede rendir antes de Start ni después de terminar", () => {
    expect(() => giveUp(createGame(messiToCopetti), T0)).toThrow(/NOT_STARTED/);
    expect(() => giveUp(winningRun(), T0 + 9000)).toThrow(/FINISHED/);
  });

  it("después de rendirse no se puede seguir jugando", () => {
    const over = giveUp(startGame(createGame(messiToCopetti), T0), T0 + 1);
    expect(() => selectNode(over, clubSeasonNode(PSG_2021), T0 + 2)).toThrow(/FINISHED/);
  });

  it("una derrota por límite de saltos no figura como rendición", () => {
    let s = startGame(createGame(messiToCopetti), T0);
    for (let i = 1; i <= MAX_JUMPS; i++) {
      s = selectNode(s, i % 2 === 1 ? clubSeasonNode(PSG_2021) : playerNode(MESSI), T0 + i * 1000);
    }
    expect(s.status).toBe("lost");
    expect(s.gaveUp).toBeUndefined();
  });
});
