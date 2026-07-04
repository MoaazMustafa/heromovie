/** SVG icon set for the custom video player. */
import type { IconSvgProps } from "@/types";

const base = {
  fill: "currentColor",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

export const PlayIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86Z" />
  </svg>
);

export const PauseIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <path d="M7 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Zm10 0a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Z" />
  </svg>
);

export const StopIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <rect height="12" rx="2" width="12" x="6" y="6" />
  </svg>
);

export const SkipForwardIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg fill="none" height={size} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={size} aria-hidden {...props}>
    <path d="M12 4a8 8 0 1 0 8 8" strokeLinecap="round" />
    <path d="M20 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    <text fill="currentColor" fontSize="7" stroke="none" textAnchor="middle" x="12" y="15">
      10
    </text>
  </svg>
);

export const SkipBackIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg fill="none" height={size} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={size} aria-hidden {...props}>
    <path d="M12 4a8 8 0 1 1-8 8" strokeLinecap="round" />
    <path d="M4 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
    <text fill="currentColor" fontSize="7" stroke="none" textAnchor="middle" x="12" y="15">
      10
    </text>
  </svg>
);

export const VolumeHighIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <path d="M4 9v6h4l5 4V5L8 9H4Zm12.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.47 4.47 0 0 0 16.5 12ZM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77Z" />
  </svg>
);

export const VolumeMutedIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <path d="M4 9v6h4l5 4V5L8 9H4Zm12.59 3 2.7-2.7-1.42-1.41-2.7 2.7-2.7-2.7-1.41 1.41 2.7 2.7-2.7 2.7 1.41 1.41 2.7-2.7 2.7 2.7 1.42-1.41-2.7-2.7Z" />
  </svg>
);

export const FullscreenIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <path d="M7 14H5v5h5v-2H7v-3Zm-2-4h2V7h3V5H5v5Zm12 7h-3v2h5v-5h-2v3ZM14 5v2h3v3h2V5h-5Z" />
  </svg>
);

export const ExitFullscreenIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <path d="M5 16h3v3h2v-5H5v2Zm3-8H5v2h5V5H8v3Zm6 11h2v-3h3v-2h-5v5Zm2-11V5h-2v5h5V8h-3Z" />
  </svg>
);

export const PipIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <path d="M19 7h-8v6h8V7Zm4-4H1v18h22V3Zm-2 16H3V5h18v14Z" />
  </svg>
);

export const CaptionsIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1Zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1Z" />
  </svg>
);

export const SettingsIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg fill="none" height={size} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={size} aria-hidden {...props}>
    <circle cx="12" cy="12" r="3" />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SpeedIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg fill="none" height={size} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={size} aria-hidden {...props}>
    <path d="M12 6a9 9 0 0 0-9 9m18 0a9 9 0 0 0-4.5-7.79" strokeLinecap="round" />
    <path d="m12 15 4-6" strokeLinecap="round" />
    <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const UploadIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg fill="none" height={size} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={size} aria-hidden {...props}>
    <path d="M12 16V4m0 0 4 4m-4-4L8 8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
  </svg>
);

export const PlayCircleIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg height={size} width={size} {...base} {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-2 14.5v-9l6 4.5-6 4.5Z" />
  </svg>
);

export const TrashIcon = ({ size = 24, ...props }: IconSvgProps) => (
  <svg fill="none" height={size} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width={size} aria-hidden {...props}>
    <path d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
