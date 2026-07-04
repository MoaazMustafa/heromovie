"use client";

/**
 * SettingsView — all user preferences: theme, playback defaults, subtitles,
 * cache budget, plus destructive actions (clear history / clear cache).
 */
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Button,
  Card,
  ListBox,
  Select,
  Slider,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";

import { PLAYBACK_RATES } from "@/lib/constants";
import { formatBytes } from "@/lib/format";
import { chunkCache } from "@/services/chunk-cache";
import { clearHistory, useHistory } from "@/stores/history-store";
import { updateSettings, useSettings } from "@/stores/settings-store";
import { TrashIcon } from "@/components/player/player-icons";

const CACHE_SIZE_OPTIONS = [
  128 * 1024 * 1024,
  256 * 1024 * 1024,
  512 * 1024 * 1024,
  1024 * 1024 * 1024,
];

const THEME_OPTIONS = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
];

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
      <div className="flex flex-col">
        <span className="font-medium">{label}</span>
        {description && <span className="text-sm text-muted">{description}</span>}
      </div>
      {children}
    </div>
  );
}

export function SettingsView() {
  const settings = useSettings();
  const history = useHistory();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [cacheUsage, setCacheUsage] = useState<number | null>(null);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    setMounted(true);
    void chunkCache.totalBytes().then(setCacheUsage).catch(() => undefined);
  }, []);

  const clearCache = async () => {
    await chunkCache.clear();
    setCacheUsage(0);
    setCacheCleared(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Appearance */}
      <Card>
        <Card.Header>
          <Card.Title>Appearance</Card.Title>
        </Card.Header>
        <Card.Content className="divide-y divide-separator">
          <SettingRow description="Light, dark or follow your OS." label="Theme">
            {mounted && (
              <ToggleButtonGroup
                aria-label="Theme"
                selectedKeys={[theme ?? "system"]}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const next = [...keys][0];

                  if (next) setTheme(String(next));
                }}
              >
                {THEME_OPTIONS.map((option) => (
                  <ToggleButton key={option.key} id={option.key}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
          </SettingRow>
        </Card.Content>
      </Card>

      {/* Playback */}
      <Card>
        <Card.Header>
          <Card.Title>Playback</Card.Title>
        </Card.Header>
        <Card.Content className="divide-y divide-separator">
          <SettingRow
            description="Start playing as soon as the video is ready."
            label="Autoplay"
          >
            <Switch
              aria-label="Autoplay"
              isSelected={settings.autoplay}
              onChange={(isSelected) => updateSettings({ autoplay: isSelected })}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </SettingRow>

          <SettingRow
            description={`Currently ${Math.round(settings.defaultVolume * 100)}%.`}
            label="Default volume"
          >
            <Slider
              aria-label="Default volume"
              className="w-48"
              maxValue={1}
              minValue={0}
              step={0.05}
              value={settings.defaultVolume}
              onChange={(value) =>
                updateSettings({
                  defaultVolume: Array.isArray(value) ? value[0] : value,
                })
              }
            >
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
          </SettingRow>

          <SettingRow
            description="Speed applied when a video starts."
            label="Playback speed"
          >
            <Select
              aria-label="Playback speed"
              className="w-32"
              selectedKey={String(settings.defaultPlaybackRate)}
              onSelectionChange={(key) =>
                updateSettings({ defaultPlaybackRate: Number(key) })
              }
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {PLAYBACK_RATES.map((rate) => (
                    <ListBox.Item
                      key={String(rate)}
                      id={String(rate)}
                      textValue={`${rate}x`}
                    >
                      {rate}×
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </SettingRow>

          <SettingRow
            description="Show captions automatically when a subtitle file is loaded."
            label="Subtitles"
          >
            <Switch
              aria-label="Subtitles enabled"
              isSelected={settings.subtitlesEnabled}
              onChange={(isSelected) =>
                updateSettings({ subtitlesEnabled: isSelected })
              }
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </SettingRow>
        </Card.Content>
      </Card>

      {/* Storage */}
      <Card>
        <Card.Header>
          <Card.Title>Storage</Card.Title>
          <Card.Description>
            {cacheUsage !== null
              ? `Chunk cache currently uses ${formatBytes(cacheUsage)}.`
              : "Measuring cache usage…"}
          </Card.Description>
        </Card.Header>
        <Card.Content className="divide-y divide-separator">
          <SettingRow
            description="Old chunks are evicted automatically beyond this limit."
            label="Maximum cache size"
          >
            <Select
              aria-label="Maximum cache size"
              className="w-40"
              selectedKey={String(settings.maxCacheBytes)}
              onSelectionChange={(key) =>
                updateSettings({ maxCacheBytes: Number(key) })
              }
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {CACHE_SIZE_OPTIONS.map((bytes) => (
                    <ListBox.Item
                      key={String(bytes)}
                      id={String(bytes)}
                      textValue={formatBytes(bytes)}
                    >
                      {formatBytes(bytes)}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </SettingRow>

          <SettingRow
            description={`${history.length} saved entries with playback positions.`}
            label="Watch history"
          >
            <Button
              isDisabled={history.length === 0}
              size="sm"
              variant="danger-soft"
              onPress={clearHistory}
            >
              <TrashIcon size={16} />
              Clear history
            </Button>
          </SettingRow>

          <SettingRow
            description="Delete every cached video chunk from this device."
            label="Video cache"
          >
            <Button
              isDisabled={cacheCleared || cacheUsage === 0}
              size="sm"
              variant="danger-soft"
              onPress={() => void clearCache()}
            >
              <TrashIcon size={16} />
              {cacheCleared ? "Cache cleared" : "Clear cache"}
            </Button>
          </SettingRow>
        </Card.Content>
      </Card>
    </div>
  );
}
