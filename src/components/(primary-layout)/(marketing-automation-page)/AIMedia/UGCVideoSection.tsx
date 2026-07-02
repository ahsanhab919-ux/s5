import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateDialogueAudio } from "@/hooks/(marketing-automation-page)/useAudioApi";
import {
  useGenerateUGCScript,
  useUserAds,
  useVoices,
} from "@/hooks/(marketing-automation-page)/useMediaApi";
import { useSmartAssetsByProject } from "@/hooks/(marketing-automation-page)/useSmartAssetsApi";
import { useGenerateUGCVideo } from "@/hooks/(marketing-automation-page)/useUGCVideoApi";
import { RootState } from "@/redux/store";
import {
  Download,
  Image,
  Loader2,
  Music,
  Settings,
  Sparkles,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import AssetSelectorModal from "./AssetSelectorModal";
import ScriptEditor from "./ScriptEditor";

interface Ad {
  id: string;
  projectId: string;
  headline: string;
  primaryText: string;
  description: string;
  format: string;
  campaignId?: string;
  campaignDataId?: string;
}

export default function UGCVideoSection() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useSelector((state: RootState) => state.auth);

  // TanStack Query hooks
  const { data: groupedVoices, isLoading: loadingVoices } = useVoices();
  const { data: allUserAds = [], isLoading: loadingAds } = useUserAds();
  const generateUGCScriptMutation = useGenerateUGCScript();
  const generateDialogueAudioMutation = useGenerateDialogueAudio();
  const generateUGCVideoMutation = useGenerateUGCVideo();

  // Filter ads to only show those from current project
  const userAds = allUserAds.filter((ad: Ad) => ad.projectId === projectId);

  // Smart Assets
  const { data: assetsData } = useSmartAssetsByProject(
    projectId || "",
    undefined,
  );
  const assets = assetsData?.data || [];

  const [script, setScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [genderFilter, setGenderFilter] = useState<
    "male" | "female" | "non_binary"
  >("male");
  const [selectedAd, setSelectedAd] = useState<string>("");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // UGC Video specific states
  const [videoStyle, setVideoStyle] = useState<string>("authentic");
  const [duration, setDuration] = useState<string>("30");
  const [backgroundType, setBackgroundType] = useState<string>("lifestyle");
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [textPrompt, setTextPrompt] = useState<string>("");
  const [modelVersion, setModelVersion] = useState<
    "aurora_v1" | "aurora_v1_fast"
  >("aurora_v1_fast");

  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Audio generation state
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string>("");
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [selectedDialogueVoice, setSelectedDialogueVoice] =
    useState<string>("Aria");

  // Available voices for ElevenLabs dialogue
  const dialogueVoices = [
    "Aria",
    "Roger",
    "Sarah",
    "Laura",
    "Charlie",
    "George",
    "Callum",
    "River",
    "Liam",
    "Charlotte",
    "Alice",
    "Matilda",
    "Will",
    "Jessica",
    "Eric",
    "Chris",
    "Brian",
    "Daniel",
    "Lily",
    "Bill",
  ];

  useEffect(() => {
    if (selectedAd) {
      const ad = userAds.find((a: Ad) => a.id === selectedAd) as any;
    }
  }, [selectedAd, userAds]);

  const handleGenerateScript = async () => {
    if (!selectedAd) {
      alert("Please select an ad first");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateUGCScriptMutation.mutateAsync({
        projectId: projectId || "",
        adId: selectedAd,
      });

      if (result.success && result.script) {
        setScript(result.script);
        // Auto-fill the visual style prompt if generated
        if (result.visual_style_prompt) {
          setTextPrompt(result.visual_style_prompt);
        }
      }
    } catch (error) {
      console.error("UGC Script generation error:", error);
      alert("Failed to generate UGC script");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!script) {
      alert("Please write or generate a script first");
      return;
    }

    setGeneratingAudio(true);
    try {
      const result = await generateDialogueAudioMutation.mutateAsync({
        script,
        voiceId: selectedDialogueVoice,
      });

      if (result.success && result.audioUrl) {
        setGeneratedAudioUrl(result.audioUrl);
        setNotificationMessage("✨ Audio generated successfully!");
        setShowNotification(true);

        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Audio generation error:", error);
      alert("Failed to generate audio");
    } finally {
      setGeneratingAudio(false);
    }
  };

  const handleGenerateUGCVideo = async () => {
    if (!script) {
      alert("Please write or generate a script first");
      return;
    }

    if (!generatedAudioUrl) {
      alert("Please generate audio first");
      return;
    }

    if (!backgroundUrl) {
      alert("Please select a background image");
      return;
    }

    const selectedAdData = userAds.find((a: Ad) => a.id === selectedAd);

    setGenerating(true);

    try {
      // Prepare Aurora API payload
      const payload = {
        audio: generatedAudioUrl,
        image: backgroundUrl,
        name: `UGC Video - ${new Date().toISOString()}`,
        text_prompt:
          textPrompt ||
          `Create an authentic user-generated content style video. ${videoStyle} style with natural, engaging visuals that complement the voiceover. Professional yet relatable atmosphere.`,
        model_version: modelVersion,
        metadata: {
          userId: user?.id,
          projectId,
          campaignDataId: (selectedAdData as any)?.campaignDataId,
          adId: selectedAdData?.id,
          script,
          voiceId: selectedDialogueVoice,
        },
      };


      const result = await generateUGCVideoMutation.mutateAsync(payload);

      if (result.success) {
        setNotificationMessage(
          "✨ UGC Video generation started! Check the Medias section for updates.",
        );
        setShowNotification(true);

        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      } else {
        throw new Error(result.error || "Failed to generate video");
      }
    } catch (error) {
      console.error("UGC Video generation error:", error);
      alert("Failed to generate UGC video");
    } finally {
      setGenerating(false);
    }
  };

  const handleAdSelect = (adId: string) => {
    setSelectedAd(adId);
  };

  return (
    <div className="bg-background text-foreground xs:p-3 flex flex-1 flex-col overflow-hidden p-2 sm:p-6">
      {/* Header */}
      <div className="border-border border-b pb-3 sm:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground xs:text-xl text-lg font-bold sm:text-2xl">
              AI-Powered UGC Creation
            </h2>
            <p className="text-muted-foreground xs:text-xs mt-1 text-[10px]">
              Transform your scripts into authentic user-generated content with
              AI-powered audio and visuals
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Single Column */}
      <div className="flex-1 overflow-y-auto">
        <div className="xs:space-y-5 xs:px-1 xs:py-5 mx-auto max-w-4xl space-y-4 px-0 py-4 sm:space-y-6 sm:px-4 sm:py-8 sm:pl-16 md:px-18">
          {/* Step 1: Script */}
          <div className="relative sm:pl-4">
            <div className="bg-primary text-primary-foreground xs:h-7 xs:w-7 mb-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-lg sm:absolute sm:top-6 sm:-left-12 sm:mb-0 sm:h-10 sm:w-10 sm:text-base">
              1
            </div>
            <ScriptEditor
              script={script}
              setScript={setScript}
              userAds={userAds}
              selectedAd={selectedAd}
              loadingAds={loadingAds}
              generating={generating}
              onAdSelect={handleAdSelect}
              onTrySample={() => {}}
              onUseScriptWriter={handleGenerateScript}
            />
          </div>

          {/* Step 2: Audio Generation */}
          <div className="relative sm:pl-4">
            <div className="bg-primary text-primary-foreground xs:h-7 xs:w-7 mb-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-lg sm:absolute sm:top-6 sm:-left-12 sm:mb-0 sm:h-10 sm:w-10 sm:text-base">
              2
            </div>
            <Card className="xs:p-4 p-3 shadow-xl sm:p-8">
              <CardHeader className="p-0">
                <div className="xs:mb-4 xs:flex-row xs:items-center xs:justify-between mb-3 flex flex-col gap-2 sm:mb-6">
                  <div>
                    <CardTitle className="xs:gap-2 xs:text-lg flex items-center gap-1.5 text-base font-bold sm:text-xl">
                      <Music className="text-primary xs:h-5 xs:w-5 h-4 w-4" />
                      Generate Audio
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                      Convert your script into natural-sounding dialogue
                    </p>
                  </div>
                  {generatedAudioUrl && (
                    <div className="border-primary/20 bg-primary/10 flex items-center gap-2 rounded-full border px-3 py-1.5">
                      <div className="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
                      <span className="text-primary text-xs font-medium">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Voice Selector */}
                <div className="xs:mb-4 mb-3 sm:mb-6">
                  <Label className="xs:mb-2 xs:text-sm mb-1.5 block text-xs font-medium sm:mb-3">
                    Select Voice
                  </Label>
                  <div className="xs:grid-cols-3 xs:gap-1.5 grid grid-cols-2 gap-1 sm:grid-cols-4 sm:gap-2 md:grid-cols-5">
                    {dialogueVoices.map((voice) => (
                      <Button
                        key={voice}
                        onClick={() => setSelectedDialogueVoice(voice)}
                        variant={
                          selectedDialogueVoice === voice
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="xs:text-xs h-8 px-2 text-[10px] sm:text-sm"
                      >
                        {voice}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerateAudio}
                  disabled={generatingAudio || !script}
                  className="xs:mb-4 xs:gap-2 mb-3 flex w-full items-center justify-center gap-1.5 sm:mb-6 sm:gap-3"
                  size="lg"
                >
                  {generatingAudio ? (
                    <>
                      <Loader2 className="xs:h-4 xs:w-4 h-3.5 w-3.5 shrink-0 animate-spin sm:h-5 sm:w-5" />
                      <span className="xs:text-sm text-xs sm:text-base">
                        Generating...
                      </span>
                    </>
                  ) : (
                    <>
                      <Music className="xs:h-4 xs:w-4 h-3.5 w-3.5 shrink-0 sm:h-5 sm:w-5" />
                      <span className="xs:text-sm text-xs sm:text-base">
                        Generate Audio
                      </span>
                    </>
                  )}
                </Button>

                {generatedAudioUrl && (
                  <Card className="border-border bg-muted/50 space-y-4 p-4">
                    <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
                      <Music className="h-4 w-4" />
                      <span>Generated Audio</span>
                    </div>
                    <audio
                      controls
                      src={generatedAudioUrl}
                      className="h-12 w-full rounded-lg"
                    />
                    <Button
                      asChild
                      variant="outline"
                      className="flex w-full items-center justify-center gap-2"
                    >
                      <a
                        href={generatedAudioUrl}
                        download="ugc-dialogue-audio.mp3"
                      >
                        <Download className="h-4 w-4" />
                        Download Audio File
                      </a>
                    </Button>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Step 3: Video Settings */}
          <div className="relative sm:pl-4">
            <div className="bg-primary text-primary-foreground xs:h-7 xs:w-7 mb-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-lg sm:absolute sm:top-6 sm:-left-12 sm:mb-0 sm:h-10 sm:w-10 sm:text-base">
              3
            </div>
            <Card className="xs:space-y-4 xs:p-4 space-y-3 p-3 shadow-xl sm:space-y-6 sm:p-8">
              <div>
                <CardTitle className="xs:gap-2 xs:text-lg flex items-center gap-1.5 text-base font-bold sm:text-xl">
                  <Settings className="text-primary xs:h-5 xs:w-5 h-4 w-4" />
                  Video Settings
                </CardTitle>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                  Customize your video generation
                </p>
              </div>

              {/* Background Image */}
              <div>
                <Label className="xs:text-sm mb-2 block text-xs font-medium sm:mb-3">
                  Image <span className="text-destructive">*</span>
                </Label>
                <Button
                  onClick={() => setShowBackgroundSelector(true)}
                  variant="outline"
                  className="xs:gap-2 xs:text-sm flex w-full items-center justify-center gap-1.5 text-xs"
                  size="lg"
                >
                  <Image className="xs:h-4 xs:w-4 h-3.5 w-3.5" />
                  {backgroundUrl ? "Change Image" : "Select Image"}
                </Button>

                {backgroundUrl && (
                  <Card className="border-border bg-muted/50 mt-4 p-2">
                    <img
                      src={backgroundUrl}
                      alt="Selected background"
                      className="h-40 w-full rounded-lg object-cover"
                    />
                  </Card>
                )}
              </div>

              {/* Text Prompt */}
              <div>
                <Label className="xs:text-sm mb-2 block text-xs font-medium sm:mb-3">
                  Visual Style{" "}
                  <span className="text-muted-foreground xs:text-xs text-[10px]">
                    (Optional)
                  </span>
                </Label>
                <Textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder="Describe visual style, lighting, mood, etc."
                  rows={2}
                  className="xs:text-sm text-xs"
                />
              </div>

              {/* Model Version */}
              <div>
                <Label className="xs:mb-2 xs:text-sm mb-1.5 block text-xs font-medium sm:mb-3">
                  Quality & Speed
                </Label>
                <div className="xs:gap-2 grid grid-cols-2 gap-1.5 sm:gap-3">
                  <Button
                    onClick={() => setModelVersion("aurora_v1_fast")}
                    variant={
                      modelVersion === "aurora_v1_fast" ? "default" : "outline"
                    }
                    className="xs:min-h-9 xs:gap-1 xs:py-2 flex h-auto min-h-8 flex-col gap-0.5 py-1.5 sm:gap-2"
                  >
                    <div className="xs:text-sm text-xs leading-none font-semibold sm:text-base">
                      Fast
                    </div>
                    <div className="xs:text-[10px] text-[8px] leading-none opacity-75 sm:text-xs">
                      10 cr/15s
                    </div>
                  </Button>
                  <Button
                    onClick={() => setModelVersion("aurora_v1")}
                    variant={
                      modelVersion === "aurora_v1" ? "default" : "outline"
                    }
                    className="xs:min-h-9 xs:gap-1 xs:py-2 flex h-auto min-h-8 flex-col gap-0.5 py-1.5 sm:gap-2"
                  >
                    <div className="xs:text-sm text-xs leading-none font-semibold whitespace-nowrap sm:text-base">
                      High Quality
                    </div>
                    <div className="xs:text-[10px] text-[8px] leading-none opacity-75 sm:text-xs">
                      20 cr/15s
                    </div>
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Final Step: Generate Video */}
          <div className="relative sm:pl-4">
            <div className="bg-primary text-primary-foreground xs:h-7 xs:w-7 mb-2 flex h-6 w-6 animate-pulse items-center justify-center rounded-full text-sm font-bold shadow-lg sm:absolute sm:top-6 sm:-left-12 sm:mb-0 sm:h-10 sm:w-10 sm:text-lg">
              ✓
            </div>
            <Card className="border-primary/20 bg-primary/10 xs:p-4 p-3 shadow-2xl sm:p-8">
              <div className="xs:mb-4 mb-3 text-center sm:mb-6">
                <h3 className="from-primary to-primary xs:mb-2 xs:text-lg mb-1.5 bg-linear-to-r bg-clip-text text-base font-bold text-transparent sm:text-2xl">
                  Ready to Create?
                </h3>
                <p className="text-muted-foreground xs:text-sm text-xs sm:text-base">
                  Generate your UGC video with AI
                </p>
              </div>

              <Button
                onClick={handleGenerateUGCVideo}
                disabled={
                  generating || !script || !generatedAudioUrl || !backgroundUrl
                }
                size="lg"
                className="xs:gap-2 flex w-full items-center justify-center gap-1.5 sm:gap-3"
              >
                {generating ? (
                  <>
                    <Loader2 className="xs:h-5 xs:w-5 h-4 w-4 animate-spin sm:h-6 sm:w-6" />
                    <span className="xs:text-sm text-xs sm:text-base">
                      Generating...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="xs:h-5 xs:w-5 h-4 w-4 sm:h-6 sm:w-6" />
                    <span className="xs:text-sm text-xs sm:text-base">
                      Generate Video
                    </span>
                  </>
                )}
              </Button>

              {/* Validation Messages */}
              <div className="text-muted-foreground xs:mt-4 xs:space-y-1 xs:text-xs mt-3 space-y-0.5 text-center text-[10px] sm:text-sm">
                {!script && <p>• Please write or generate a script first</p>}
                {!generatedAudioUrl && (
                  <p>• Please generate audio from your script</p>
                )}
                {!backgroundUrl && <p>• Please select a background image</p>}
                {script && generatedAudioUrl && backgroundUrl && (
                  <p className="text-primary">
                    ✓ All requirements met - Ready to generate!
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {showNotification && (
        <div className="animate-slide-up fixed right-4 bottom-20 z-50 sm:right-6 sm:bottom-6">
          <Card className="bg-primary text-primary-foreground max-w-[calc(100vw-2rem)] px-4 py-3 shadow-2xl sm:py-4 md:px-6">
            <p className="text-sm font-medium sm:text-base">
              {notificationMessage}
            </p>
          </Card>
        </div>
      )}

      {/* Asset Selector Modal */}
      {showBackgroundSelector && (
        <AssetSelectorModal
          isOpen={showBackgroundSelector}
          assets={assets}
          mode="single"
          onSelect={(urls) => {
            setBackgroundUrl(urls[0] || "");
            setShowBackgroundSelector(false);
          }}
          onClose={() => setShowBackgroundSelector(false)}
          title="Select Background Image"
        />
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        className="hidden"
      />
    </div>
  );
}
