'use client';

import { GameClient } from "@/components/game/GameClient";
import { useParams } from "next/navigation";

export default function PlayPage() {
    const params = useParams();
    const roomId = params.roomId as string;

    return <GameClient roomId={roomId} isSpectator={false} />;
}
