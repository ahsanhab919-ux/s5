import { Card, CardContent } from "@/components/ui/card";

interface AvatarPreviewProps {
  personaImage: string;
  personaName: string;
  personaId: string;
}

export default function AvatarPreview({
  personaImage,
  personaName,
  personaId,
}: AvatarPreviewProps) {
  return (
    <Card className="justify-center rounded-xl p-4 align-middle">
      <CardContent className="mx-auto flex items-center gap-6 p-0">
        <img
          src={personaImage}
          alt={personaName}
          className="h-50 w-40 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="text-foreground font-semibold">{personaName}</h3>
          <p className="text-muted-foreground text-sm">{personaId}</p>
        </div>
        {/* <div className="flex gap-2"> */}
        {/* __Play Button__: Video playback functionality */}
        {/* <Button variant="ghost" size="icon">
            <Play className="h-5 w-5" />
          </Button> */}
        {/* __Settings Button__: Avatar settings/customization modal */}
        {/* <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button> */}
        {/* __Delete Button__: Avatar deletion/removal logic */}
        {/* <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-5 w-5" />
          </Button> */}
        {/* </div> */}
      </CardContent>
    </Card>
  );
}
