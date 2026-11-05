import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { GameView } from "../../shared/game.js";
import { api } from "./api.js";

interface GameState {
  game: GameView | null;
  leveledUp: boolean;
  dismissLevelUp: () => void;
  refresh: () => void;
}

const Ctx = createContext<GameState>({ game: null, leveledUp: false, dismissLevelUp: () => {}, refresh: () => {} });

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameView | null>(null);
  const [leveledUp, setLeveledUp] = useState(false);
  const prevLevel = useRef<number | null>(null);

  const refresh = useCallback(() => {
    api
      .game()
      .then((g) => {
        if (prevLevel.current !== null && g.level.level > prevLevel.current) setLeveledUp(true);
        prevLevel.current = g.level.level;
        setGame(g);
      })
      .catch(() => {});
  }, []);

  useEffect(refresh, [refresh]);

  const dismissLevelUp = useCallback(() => setLeveledUp(false), []);

  return <Ctx.Provider value={{ game, leveledUp, dismissLevelUp, refresh }}>{children}</Ctx.Provider>;
}

export function useGame(): GameState {
  return useContext(Ctx);
}
