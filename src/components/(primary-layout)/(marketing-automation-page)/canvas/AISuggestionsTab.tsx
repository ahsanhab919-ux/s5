import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignSuggestion } from "@/types/campaign";
import { Lightbulb } from "lucide-react";

interface AISuggestionsTabProps {
  initialSuggestions: CampaignSuggestion | null;
}

export default function AISuggestionsTab({
  initialSuggestions,
}: AISuggestionsTabProps) {
  if (!initialSuggestions) {
    return null;
  }

  return (
    <>
      {/* AI Suggestions Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="mb-4 flex items-center gap-2 text-2xl font-bold">
            <Lightbulb className="text-primary h-6 w-6" />
            AI-Generated Campaign Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-4">
              <p className="text-muted-foreground mb-1 text-sm">
                Campaign Name
              </p>
              <p className="text-foreground font-semibold">
                {initialSuggestions.campaign.name}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-muted-foreground mb-1 text-sm">Objective</p>
              <p className="text-foreground font-semibold capitalize">
                {initialSuggestions.campaign.objective}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-muted-foreground mb-1 text-sm">
                Recommended Budget
              </p>
              <p className="text-foreground font-semibold">
                ${initialSuggestions.campaign.budget_recommendation.daily_min} -
                ${initialSuggestions.campaign.budget_recommendation.daily_max}
                /day
              </p>
            </Card>
          </div>
          <Card className="p-4">
            <p className="text-muted-foreground mb-2 text-sm">
              Budget Reasoning
            </p>
            <p className="text-foreground text-sm">
              {initialSuggestions.campaign.budget_recommendation.reasoning}
            </p>
          </Card>
        </CardContent>
      </Card>

      {/* Ad Concepts Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="mb-4 text-xl font-bold">
            Ad Concepts ({initialSuggestions.ad_concepts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid max-h-[600px] grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2">
            {initialSuggestions.ad_concepts.map((concept, index) => (
              <Card
                key={index}
                className="hover:border-primary/50 transition-border px-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="bg-primary/20 text-primary border-primary/30 rounded border px-2 py-1 text-xs font-medium">
                    {concept.format.replace("_", " ")}
                  </span>
                  <span className="bg-primary/20 text-primary border-primary/30 rounded border px-2 py-1 text-xs font-medium">
                    {concept.awareness_stage.replace("_", " ")}
                  </span>
                  <span className="bg-primary/20 text-primary border-primary/30 rounded border px-2 py-1 text-xs font-medium">
                    {concept.persona}
                  </span>
                </div>
                <h4 className="text-foreground mb-2 font-bold">
                  {concept.headline}
                </h4>
                <p className="text-muted-foreground mb-2 text-sm">
                  {concept.primary_text}
                </p>
                <p className="text-muted-foreground text-xs italic">
                  Hook: "{concept.hook}"
                </p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategy Notes */}
      {initialSuggestions?.strategy_notes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="mb-4 text-xl font-bold">
              Strategy Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {initialSuggestions.strategy_notes.map((note, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-foreground">{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
