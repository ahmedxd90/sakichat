import { createContext, useContext, useRef, useState, ReactNode } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface BackgroundRoom {
  roomId: Id<"rooms">;
  roomName: string;
  coverUrl?: string;
  zegoChannel: string;
  zegoUserId: string;
  zegoUserName: string;
}

interface BackgroundRoomContextType {
  bgRoom: BackgroundRoom | null;
  setBgRoom: (room: BackgroundRoom | null) => void;
  returnToRoom: (() => void) | null;
  setReturnToRoom: (fn: (() => void) | null) => void;
}

const BackgroundRoomContext = createContext<BackgroundRoomContextType>({
  bgRoom: null,
  setBgRoom: () => {},
  returnToRoom: null,
  setReturnToRoom: () => {},
});

export function BackgroundRoomProvider({ children }: { children: ReactNode }) {
  const [bgRoom, setBgRoomState] = useState<BackgroundRoom | null>(null);
  const returnFnRef = useRef<(() => void) | null>(null);
  const [tick, setTick] = useState(0);

  const setBgRoom = (room: BackgroundRoom | null) => {
    setBgRoomState(room);
  };

  const setReturnToRoom = (fn: (() => void) | null) => {
    returnFnRef.current = fn;
    setTick((t) => t + 1);
  };

  return (
    <BackgroundRoomContext.Provider value={{
      bgRoom,
      setBgRoom,
      returnToRoom: returnFnRef.current,
      setReturnToRoom,
    }}>
      {children}
    </BackgroundRoomContext.Provider>
  );
}

export function useBackgroundRoom() {
  return useContext(BackgroundRoomContext);
}
