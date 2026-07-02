import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AdvancedSettingsProps {
  // Avatar settings
  avatarStyle: "circle" | "normal";
  setAvatarStyle: (style: "circle" | "normal") => void;
  avatarScale: number;
  setAvatarScale: (scale: number) => void;
  avatarOffsetX: number;
  setAvatarOffsetX: (offset: number) => void;
  avatarOffsetY: number;
  setAvatarOffsetY: (offset: number) => void;
  avatarHidden: boolean;
  setAvatarHidden: (hidden: boolean) => void;

  // Voice settings
  voiceVolume: number;
  setVoiceVolume: (volume: number) => void;

  // Caption settings
  captionStyle: string;
  setCaptionStyle: (style: string) => void;
  captionOffsetX: number;
  setCaptionOffsetX: (offset: number) => void;
  captionOffsetY: number;
  setCaptionOffsetY: (offset: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontStyle: string;
  setFontStyle: (style: string) => void;
  captionBgColor: string;
  setCaptionBgColor: (color: string) => void;
  captionTextColor: string;
  setCaptionTextColor: (color: string) => void;
  captionHighlightColor: string;
  setCaptionHighlightColor: (color: string) => void;
  captionHidden: boolean;
  setCaptionHidden: (hidden: boolean) => void;

  // Background settings
  backgroundType: "image" | "video";
  setBackgroundType: (type: "image" | "video") => void;
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
  backgroundFit: "cover" | "crop" | "contain";
  setBackgroundFit: (fit: "cover" | "crop" | "contain") => void;
  backgroundEffect: string;
  setBackgroundEffect: (effect: string) => void;

  // Transition effects
  transitionIn: string;
  setTransitionIn: (transition: string) => void;
  transitionOut: string;
  setTransitionOut: (transition: string) => void;

  // Visual style
  visualStyle: string;
  setVisualStyle: (style: string) => void;

  // CTA settings
  ctaLogoUrl: string;
  setCtaLogoUrl: (url: string) => void;
  ctaLogoScale: number;
  setCtaLogoScale: (scale: number) => void;
  ctaLogoOffsetX: number;
  setCtaLogoOffsetX: (offset: number) => void;
  ctaLogoOffsetY: number;
  setCtaLogoOffsetY: (offset: number) => void;
  ctaCaption: string;
  setCtaCaption: (caption: string) => void;
  ctaBackgroundBlur: boolean;
  setCtaBackgroundBlur: (blur: boolean) => void;

  // End screen CTA
  endCtaLogoUrl: string;
  setEndCtaLogoUrl: (url: string) => void;
  endCtaCaption: string;
  setEndCtaCaption: (caption: string) => void;
  endCtaDuration: number;
  setEndCtaDuration: (duration: number) => void;
  endCtaBackgroundUrl: string;
  setEndCtaBackgroundUrl: (url: string) => void;

  // Background music
  musicUrl: string;
  setMusicUrl: (url: string) => void;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;

  // Other settings
  videoName: string;
  setVideoName: (name: string) => void;
  modelVersion: "standard" | "aurora_v1" | "aurora_v1_fast";
  setModelVersion: (
    version: "standard" | "aurora_v1" | "aurora_v1_fast",
  ) => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;

  showAdvancedSettings: boolean;
  setShowAdvancedSettings: (show: boolean) => void;

  // Asset selector handler
  onOpenAssetSelector?: (
    field: "background" | "cta-logo" | "end-cta-logo" | "end-cta-background",
  ) => void;
}

export default function AdvancedSettings(props: AdvancedSettingsProps) {
  return (
    <div className="mb-8">
      <Button
        onClick={() =>
          props.setShowAdvancedSettings(!props.showAdvancedSettings)
        }
        variant="outline"
        className="flex w-full items-center justify-between"
      >
        <span className="font-semibold">⚙️ Advanced Settings</span>
        <svg
          className={cn(
            "h-5 w-5 transition-transform",
            props.showAdvancedSettings && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {props.showAdvancedSettings && (
        <Card className="mt-4 space-y-6 p-6">
          {/* Avatar Settings */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              Avatar Settings
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Style</Label>
                <Select
                  value={props.avatarStyle}
                  onValueChange={(value) =>
                    props.setAvatarStyle(value as "circle" | "normal")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2">Scale</Label>
                <Input
                  type="number"
                  value={props.avatarScale}
                  onChange={(e) =>
                    props.setAvatarScale(parseFloat(e.target.value))
                  }
                  step="0.1"
                  min="0.1"
                  max="2"
                />
              </div>
              <div>
                <Label className="mb-2">Offset X</Label>
                <Input
                  type="number"
                  value={props.avatarOffsetX}
                  onChange={(e) =>
                    props.setAvatarOffsetX(parseInt(e.target.value))
                  }
                />
              </div>
              <div>
                <Label className="mb-2">Offset Y</Label>
                <Input
                  type="number"
                  value={props.avatarOffsetY}
                  onChange={(e) =>
                    props.setAvatarOffsetY(parseInt(e.target.value))
                  }
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={props.avatarHidden}
                onChange={(e) => props.setAvatarHidden(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-muted-foreground text-sm">Hide Avatar</span>
            </label>
          </div>

          {/* Voice Settings */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              Voice Settings
            </CardTitle>
            <div>
              <Label className="mb-2">Volume (0-1)</Label>
              <Input
                type="number"
                value={props.voiceVolume}
                onChange={(e) =>
                  props.setVoiceVolume(parseFloat(e.target.value))
                }
                step="0.1"
                min="0"
                max="1"
              />
            </div>
          </div>

          {/* Caption Settings */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              Caption Settings
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Caption Style</Label>
                <Input
                  type="text"
                  value={props.captionStyle}
                  onChange={(e) => props.setCaptionStyle(e.target.value)}
                  placeholder="normal-black"
                />
              </div>
              <div>
                <Label className="mb-2">Font Family</Label>
                <Input
                  type="text"
                  value={props.fontFamily}
                  onChange={(e) => props.setFontFamily(e.target.value)}
                  placeholder="Montserrat"
                />
              </div>
              <div>
                <Label className="mb-2">Font Size</Label>
                <Input
                  type="number"
                  value={props.fontSize}
                  onChange={(e) => props.setFontSize(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-2">Font Style</Label>
                <Input
                  type="text"
                  value={props.fontStyle}
                  onChange={(e) => props.setFontStyle(e.target.value)}
                  placeholder="font-bold"
                />
              </div>
              <div>
                <Label className="mb-2">Caption Offset X</Label>
                <Input
                  type="number"
                  value={props.captionOffsetX}
                  onChange={(e) =>
                    props.setCaptionOffsetX(parseFloat(e.target.value))
                  }
                  step="0.1"
                />
              </div>
              <div>
                <Label className="mb-2">Caption Offset Y</Label>
                <Input
                  type="number"
                  value={props.captionOffsetY}
                  onChange={(e) =>
                    props.setCaptionOffsetY(parseFloat(e.target.value))
                  }
                  step="0.1"
                />
              </div>
              <div>
                <Label className="mb-2">Background Color</Label>
                <Input
                  type="color"
                  value={props.captionBgColor}
                  onChange={(e) => props.setCaptionBgColor(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="mb-2">Text Color</Label>
                <Input
                  type="color"
                  value={props.captionTextColor}
                  onChange={(e) => props.setCaptionTextColor(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="mb-2">Highlight Color</Label>
                <Input
                  type="color"
                  value={props.captionHighlightColor}
                  onChange={(e) =>
                    props.setCaptionHighlightColor(e.target.value)
                  }
                  className="h-10"
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={props.captionHidden}
                onChange={(e) => props.setCaptionHidden(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-muted-foreground text-sm">
                Hide Captions
              </span>
            </label>
          </div>

          {/* Background Settings */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              Background
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Type</Label>
                <Select
                  value={props.backgroundType}
                  onValueChange={(value) =>
                    props.setBackgroundType(value as "image" | "video")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2">Fit</Label>
                <Select
                  value={props.backgroundFit}
                  onValueChange={(value) =>
                    props.setBackgroundFit(
                      value as "cover" | "crop" | "contain",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="crop">Crop</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="mb-2">Background URL</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={props.backgroundUrl}
                    onChange={(e) => props.setBackgroundUrl(e.target.value)}
                    placeholder="https://example.com/background.jpg"
                    className="flex-1"
                  />
                  {props.onOpenAssetSelector && (
                    <Button
                      onClick={() => props.onOpenAssetSelector?.("background")}
                      size="sm"
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <Label className="mb-2">Background Effect</Label>
                <Input
                  type="text"
                  value={props.backgroundEffect}
                  onChange={(e) => props.setBackgroundEffect(e.target.value)}
                  placeholder="imageSlideLeft"
                />
              </div>
            </div>
          </div>

          {/* Transition Effects */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              Transition Effects
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Transition In</Label>
                <Input
                  type="text"
                  value={props.transitionIn}
                  onChange={(e) => props.setTransitionIn(e.target.value)}
                  placeholder="fade"
                />
              </div>
              <div>
                <Label className="mb-2">Transition Out</Label>
                <Input
                  type="text"
                  value={props.transitionOut}
                  onChange={(e) => props.setTransitionOut(e.target.value)}
                  placeholder="fade"
                />
              </div>
            </div>
          </div>

          {/* Visual Style */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              Visual Style
            </CardTitle>
            <div>
              <Label className="mb-2">Style Preset</Label>
              <Input
                type="text"
                value={props.visualStyle}
                onChange={(e) => props.setVisualStyle(e.target.value)}
                placeholder="FullAvatar"
              />
            </div>
          </div>

          {/* CTA Settings */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              Call to Action (CTA)
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-2">Product Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={props.ctaLogoUrl}
                    onChange={(e) => props.setCtaLogoUrl(e.target.value)}
                    placeholder="https://example.com/product.png"
                    className="flex-1"
                  />
                  {props.onOpenAssetSelector && (
                    <Button
                      onClick={() => props.onOpenAssetSelector?.("cta-logo")}
                      size="sm"
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label className="mb-2">Logo Scale</Label>
                <Input
                  type="number"
                  value={props.ctaLogoScale}
                  onChange={(e) =>
                    props.setCtaLogoScale(parseFloat(e.target.value))
                  }
                  step="0.05"
                  min="0.1"
                  max="1"
                />
              </div>
              <div>
                <Label className="mb-2">Logo Offset X</Label>
                <Input
                  type="number"
                  value={props.ctaLogoOffsetX}
                  onChange={(e) =>
                    props.setCtaLogoOffsetX(parseInt(e.target.value))
                  }
                />
              </div>
              <div>
                <Label className="mb-2">Logo Offset Y</Label>
                <Input
                  type="number"
                  value={props.ctaLogoOffsetY}
                  onChange={(e) =>
                    props.setCtaLogoOffsetY(parseInt(e.target.value))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-2">CTA Caption</Label>
                <Input
                  type="text"
                  value={props.ctaCaption}
                  onChange={(e) => props.setCtaCaption(e.target.value)}
                  placeholder="Shop Now!"
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={props.ctaBackgroundBlur}
                onChange={(e) => props.setCtaBackgroundBlur(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-muted-foreground text-sm">
                Blur Background
              </span>
            </label>
          </div>

          {/* End Screen CTA */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              End Screen CTA
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-2">End Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={props.endCtaLogoUrl}
                    onChange={(e) => props.setEndCtaLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                  {props.onOpenAssetSelector && (
                    <Button
                      onClick={() =>
                        props.onOpenAssetSelector?.("end-cta-logo")
                      }
                      size="sm"
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <Label className="mb-2">End Caption</Label>
                <Input
                  type="text"
                  value={props.endCtaCaption}
                  onChange={(e) => props.setEndCtaCaption(e.target.value)}
                  placeholder="Thank you for watching!"
                />
              </div>
              <div>
                <Label className="mb-2">Duration (seconds)</Label>
                <Input
                  type="number"
                  value={props.endCtaDuration}
                  onChange={(e) =>
                    props.setEndCtaDuration(parseInt(e.target.value))
                  }
                  min="1"
                  max="10"
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-2">End Background URL</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={props.endCtaBackgroundUrl}
                    onChange={(e) =>
                      props.setEndCtaBackgroundUrl(e.target.value)
                    }
                    placeholder="https://example.com/end-bg.jpg"
                    className="flex-1"
                  />
                  {props.onOpenAssetSelector && (
                    <Button
                      onClick={() =>
                        props.onOpenAssetSelector?.("end-cta-background")
                      }
                      size="sm"
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Background Music */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              Background Music
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-2">Music URL</Label>
                <Input
                  type="url"
                  value={props.musicUrl}
                  onChange={(e) => props.setMusicUrl(e.target.value)}
                  placeholder="https://example.com/music.mp3"
                />
              </div>
              <div>
                <Label className="mb-2">Volume (0-1)</Label>
                <Input
                  type="number"
                  value={props.musicVolume}
                  onChange={(e) =>
                    props.setMusicVolume(parseFloat(e.target.value))
                  }
                  step="0.1"
                  min="0"
                  max="1"
                />
              </div>
            </div>
          </div>

          {/* Other Settings */}
          <div>
            <CardTitle className="text-primary mb-4 text-lg font-semibold">
              Other Settings
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-2">Video Name</Label>
                <Input
                  type="text"
                  value={props.videoName}
                  onChange={(e) => props.setVideoName(e.target.value)}
                  placeholder="My Awesome Video"
                />
              </div>
              <div>
                <Label className="mb-2">Model Version</Label>
                <Select
                  value={props.modelVersion}
                  onValueChange={(value) =>
                    props.setModelVersion(
                      value as "standard" | "aurora_v1" | "aurora_v1_fast",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="aurora_v1">Aurora V1</SelectItem>
                    <SelectItem value="aurora_v1_fast">
                      Aurora V1 Fast
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="col-span-2">
                <Label className="mb-2">Webhook URL (Optional)</Label>
                <Input
                  type="url"
                  value={props.webhookUrl}
                  onChange={(e) => props.setWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Receive notification when video generation completes
                </p>
              </div> */}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
