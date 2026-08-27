// @ts-nocheck
import BombFloatingIcon from "./BombFloatingIcon";
import PKFloatingIcon from "./PKFloatingIcon";
import { MillionaireIcon } from "./MillionaireSeats";

interface RoomSocialBarProps {
  isCp: boolean;
  isMusic: boolean;
  isPK: boolean;
  isMillionaire?: boolean;
  isCinema?: boolean;
  roomId: string;
  isOwner: boolean;
  isAdmin: boolean;
  hasActiveMillionaireGame?: boolean;
  hasActiveRouletteSession?: boolean;
  onShowSocial: () => void;
  onShowBomb: () => void;
  onShowPKDetails: () => void;
  onShowMillionaire?: () => void;
  onShowRoulette?: () => void;
  onShowYoutube?: () => void;
}

export default function RoomSocialBar({
  isCp, isMusic, isPK, isMillionaire, isCinema, roomId, isOwner, isAdmin,
  hasActiveMillionaireGame, hasActiveRouletteSession,
  onShowSocial, onShowBomb, onShowPKDetails, onShowMillionaire, onShowRoulette, onShowYoutube,
}: RoomSocialBarProps) {

  return (
    <div className="flex-shrink-0 px-3 pb-1.5 pt-1 flex items-center gap-2">
      {isPK && <PKFloatingIcon roomId={roomId} onClick={onShowPKDetails} />}

      {isMillionaire && onShowMillionaire && (
        <MillionaireIcon onClick={onShowMillionaire} hasActiveGame={!!hasActiveMillionaireGame} />
      )}

      {/* Cinema YouTube button removed — owner controls video from the screen itself */}

      {/* Spacer */}
      <div className="flex-1" />

      {/* bomb removed */}
    </div>
  );
}
