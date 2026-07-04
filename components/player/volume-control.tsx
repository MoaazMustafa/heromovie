"use client";

/** Volume button + slider group. */
import { memo } from "react";
import { Button, Slider, Tooltip } from "@heroui/react";

import { VolumeHighIcon, VolumeMutedIcon } from "@/components/player/player-icons";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export const VolumeControl = memo(function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div className="group flex items-center gap-1">
      <Tooltip>
        <Button
          isIconOnly
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="text-white"
          size="sm"
          variant="ghost"
          onPress={onToggleMute}
        >
          {effectiveVolume === 0 ? (
            <VolumeMutedIcon size={20} />
          ) : (
            <VolumeHighIcon size={20} />
          )}
        </Button>
        <Tooltip.Content>{isMuted ? "Unmute (m)" : "Mute (m)"}</Tooltip.Content>
      </Tooltip>

      <Slider
        aria-label="Volume"
        className="w-0 overflow-hidden transition-all duration-200 group-hover:w-20 group-focus-within:w-20 sm:w-20"
        maxValue={1}
        minValue={0}
        step={0.05}
        value={effectiveVolume}
        onChange={(value) =>
          onVolumeChange(Array.isArray(value) ? value[0] : value)
        }
      >
        <Slider.Track className="h-1 cursor-pointer">
          <Slider.Fill className="bg-white" />
          <Slider.Thumb aria-label="Volume level" className="h-3 w-3" />
        </Slider.Track>
      </Slider>
    </div>
  );
});
