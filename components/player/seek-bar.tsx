"use client";

/**
 * SeekBar — HeroUI Slider with a buffered-range indicator layered into the
 * track. Emits scrub updates continuously and commits the seek on release.
 */
import { memo, useCallback, useState } from "react";
import { Slider } from "@heroui/react";

import { formatTime } from "@/lib/format";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  onSeek: (seconds: number) => void;
}

export const SeekBar = memo(function SeekBar({
  currentTime,
  duration,
  bufferedEnd,
  onSeek,
}: SeekBarProps) {
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const handleChange = useCallback((value: number | number[]) => {
    setScrubTime(Array.isArray(value) ? value[0] : value);
  }, []);

  const handleChangeEnd = useCallback(
    (value: number | number[]) => {
      onSeek(Array.isArray(value) ? value[0] : value);
      setScrubTime(null);
    },
    [onSeek],
  );

  const max = duration > 0 ? duration : 1;
  const value = scrubTime ?? currentTime;
  const bufferedPercent = Math.min((bufferedEnd / max) * 100, 100);

  return (
    <Slider
      aria-label="Seek"
      className="w-full"
      maxValue={max}
      minValue={0}
      step={0.1}
      value={value}
      onChange={handleChange}
      onChangeEnd={handleChangeEnd}
    >
      <Slider.Track className="h-1.5 cursor-pointer">
        {/* Buffered ahead-of-playhead indicator */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 rounded-full bg-white/30"
          style={{ width: `${bufferedPercent}%` }}
        />
        <Slider.Fill className="bg-accent" />
        <Slider.Thumb aria-label={`Position ${formatTime(value)}`} />
      </Slider.Track>
    </Slider>
  );
});
