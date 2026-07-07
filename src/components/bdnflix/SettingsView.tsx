"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Play, Server, Subtitles, Volume2, Gauge, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getSettings, updateSettings, type ProfileSettings } from "@/lib/api-client";
import { STREAM_SOURCES } from "@/lib/streaming";
import { toast } from "sonner";

interface SettingsViewProps {
  profileId: string;
}

export function SettingsView({ profileId }: SettingsViewProps) {
  const [s, setS] = useState<ProfileSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings(profileId).then(({ settings }) => setS(settings));
  }, [profileId]);

  const update = async (patch: Partial<ProfileSettings>) => {
    if (!s) return;
    setS({ ...s, ...patch });
    setSaving(true);
    try {
      const { settings } = await updateSettings(profileId, patch);
      setS(settings);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!s) {
    return (
      <div className="min-h-screen pt-20 px-4 md:px-8 lg:px-12">
        <div className="h-64 rounded-lg skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-7 h-7 bdnflix-red" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Playback Settings</h1>
        </div>

        <div className="space-y-4">
          {/* Autoplay */}
          <SettingRow icon={Play} title="Autoplay" description="Automatically play the next episode.">
            <Switch checked={s.autoplay} onCheckedChange={(v) => update({ autoplay: v })} />
          </SettingRow>

          <Separator className="bg-white/10" />

          {/* Preferred source */}
          <SettingRow icon={Server} title="Default Source" description="Choose your preferred streaming server.">
            <Select value={s.preferredSource} onValueChange={(v) => update({ preferredSource: v })}>
              <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#16161d] border-white/10 text-white">
                {STREAM_SOURCES.map((src) => (
                  <SelectItem key={src.id} value={src.id}>{src.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <Separator className="bg-white/10" />

          {/* Subtitles */}
          <SettingRow icon={Subtitles} title="Subtitle Language" description="Preferred subtitle language code.">
            <Select value={s.preferredSubtitle} onValueChange={(v) => update({ preferredSubtitle: v })}>
              <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#16161d] border-white/10 text-white">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="bn">Bengali</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <Separator className="bg-white/10" />

          {/* Volume */}
          <SettingRow icon={Volume2} title="Default Volume" description={`Default volume level: ${s.volume}%`}>
            <div className="w-48">
              <Slider
                value={[s.volume]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => update({ volume: v[0] })}
                className="[&_[role=slider]]:bg-bdnflix-red"
              />
            </div>
          </SettingRow>

          <Separator className="bg-white/10" />

          {/* Quality */}
          <SettingRow icon={Gauge} title="Preferred Quality" description="Stream quality preference.">
            <Select value={s.quality} onValueChange={(v) => update({ quality: v })}>
              <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#16161d] border-white/10 text-white">
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="1080">1080p</SelectItem>
                <SelectItem value="720">720p</SelectItem>
                <SelectItem value="480">480p</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>

        <div className="mt-8 text-xs text-white/40 flex items-center gap-2">
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Settings are saved automatically."}
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white/70" />
        </div>
        <div>
          <Label className="text-white font-medium">{title}</Label>
          <p className="text-xs text-white/50 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
