"use client";

/**
 * PlayerControls — the overlay control bar assembled from HeroUI primitives
 * (Button, Tooltip, Dropdown, Slider). Pure presentational component; all
 * behavior is injected through props to keep re-renders cheap.
 */
import { memo, type ChangeEvent, type RefObject } from "react";
import { Button, Dropdown, Tooltip } from "@heroui/react";

import type { VideoPlayerActions, VideoPlayerState } from "@/hooks/use-video-player";

import { PLAYBACK_RATES, SEEK_STEP_SECONDS } from "@/lib/constants";
import { formatTime } from "@/lib/format";
import { SeekBar } from "@/components/player/seek-bar";
import { VolumeControl } from "@/components/player/volume-control";
import {
  CaptionsIcon,
  ExitFullscreenIcon,
  FullscreenIcon,
  PauseIcon,
  PipIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SpeedIcon,
  StopIcon,
  UploadIcon,
} from "@/components/player/player-icons";

interface PlayerControlsProps {
  state: VideoPlayerState;
  actions: VideoPlayerActions;
  hasSubtitles: boolean;
  subtitleInputRef: RefObject<HTMLInputElement | null>;
  onSubtitleFile: (event: ChangeEvent<HTMLInputElement>) => void;
  pipSupported: boolean;
}

function IconButton({
  label,
  onPress,
  children,
  isActive = false,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          aria-label={label}
          className={isActive ? "text-accent" : "text-white"}
          size="sm"
          variant="ghost"
          onPress={onPress}
        >
          {children}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

export const PlayerControls = memo(function PlayerControls({
  state,
  actions,
  hasSubtitles,
  subtitleInputRef,
  onSubtitleFile,
  pipSupported,
}: PlayerControlsProps) {
  return (
    <div className="flex flex-col gap-1 px-3 pt-8 [padding-bottom:max(0.5rem,env(safe-area-inset-bottom))]">
      <SeekBar
        bufferedEnd={state.bufferedEnd}
        currentTime={state.currentTime}
        duration={state.duration}
        onSeek={actions.seekTo}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton
            label={state.isPlaying ? "Pause (space)" : "Play (space)"}
            onPress={actions.togglePlay}
          >
            {state.isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
          </IconButton>

          <IconButton label="Stop" onPress={actions.stop}>
            <StopIcon size={18} />
          </IconButton>

          <IconButton
            label={`Back ${SEEK_STEP_SECONDS}s (←)`}
            onPress={() => actions.seekBy(-SEEK_STEP_SECONDS)}
          >
            <SkipBackIcon size={20} />
          </IconButton>

          <IconButton
            label={`Forward ${SEEK_STEP_SECONDS}s (→)`}
            onPress={() => actions.seekBy(SEEK_STEP_SECONDS)}
          >
            <SkipForwardIcon size={20} />
          </IconButton>

          <VolumeControl
            isMuted={state.isMuted}
            volume={state.volume}
            onToggleMute={actions.toggleMute}
            onVolumeChange={actions.setVolume}
          />

          <span className="ml-1 select-none text-xs tabular-nums text-white/90 sm:text-sm">
            {formatTime(state.currentTime)}
            <span className="text-white/50"> / {formatTime(state.duration)}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Dropdown>
            <Dropdown.Trigger>
              <Button
                aria-label="Playback speed"
                className="text-white"
                size="sm"
                variant="ghost"
              >
                <SpeedIcon size={18} />
                <span className="hidden text-xs sm:inline">
                  {state.playbackRate}×
                </span>
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="Playback speed"
                selectedKeys={[String(state.playbackRate)]}
                selectionMode="single"
                onAction={(key) => actions.setPlaybackRate(Number(key))}
              >
                {PLAYBACK_RATES.map((rate) => (
                  <Dropdown.Item key={String(rate)} id={String(rate)} textValue={`${rate}x`}>
                    {rate}×
                    <Dropdown.ItemIndicator />
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <IconButton
            isActive={state.captionsVisible}
            label={
              hasSubtitles ? "Toggle captions (c)" : "Upload subtitles first"
            }
            onPress={actions.toggleCaptions}
          >
            <CaptionsIcon size={20} />
          </IconButton>

          <IconButton
            label="Upload subtitles (.vtt)"
            onPress={() => subtitleInputRef.current?.click()}
          >
            <UploadIcon size={18} />
          </IconButton>
          <input
            ref={subtitleInputRef}
            accept=".vtt,text/vtt"
            aria-hidden
            className="hidden"
            type="file"
            onChange={onSubtitleFile}
          />

          {pipSupported && (
            <IconButton
              isActive={state.isPip}
              label="Picture in picture (p)"
              onPress={actions.togglePip}
            >
              <PipIcon size={18} />
            </IconButton>
          )}

          <IconButton
            label={state.isFullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
            onPress={actions.toggleFullscreen}
          >
            {state.isFullscreen ? (
              <ExitFullscreenIcon size={20} />
            ) : (
              <FullscreenIcon size={20} />
            )}
          </IconButton>
        </div>
      </div>
    </div>
  );
});
