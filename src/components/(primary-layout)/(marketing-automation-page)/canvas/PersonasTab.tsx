"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ad, Persona } from "@/types/campaign";
import { Users } from "lucide-react";

interface PersonasTabProps {
  personas: Persona[];
  ads: Ad[];
}

export default function PersonasTab({ personas, ads }: PersonasTabProps) {
  if (personas.length === 0) {
    return (
      <Card className="md:p-12 text-center">
        <Users className="text-primary mx-auto mb-4 h-16 w-16" />
        <h3 className="text-foreground mb-2 text-lg font-semibold">
          No Personas Yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Chat with AI to identify buyer personas for your product
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {personas.map((persona, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <CardTitle className="mb-2 text-2xl font-bold">
                  {persona.name}
                </CardTitle>
                <p className="text-muted-foreground">{persona.description}</p>
              </div>
              <div className="border-primary/30 bg-primary/20 flex size-10 shrink-0 items-center justify-center rounded-xl border">
                <Users className="text-primary h-6 w-6" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h4 className="text-foreground mb-3 text-sm font-semibold">
                  Pain Points
                </h4>
                <ul className="space-y-2">
                  {persona.pain_points?.map((pain, idx) => (
                    <li
                      key={idx}
                      className="text-foreground flex items-start gap-2 text-sm"
                    >
                      <span className="text-destructive">•</span>
                      {pain}
                    </li>
                  )) || (
                    <li className="text-muted-foreground text-sm italic">
                      No pain points defined
                    </li>
                  )}
                </ul>
              </Card>
              <Card className="p-4">
                <h4 className="text-foreground mb-3 text-sm font-semibold">
                  Motivations
                </h4>
                <ul className="space-y-2">
                  {persona.motivations?.map((motivation, idx) => (
                    <li
                      key={idx}
                      className="text-foreground flex items-start gap-2 text-sm"
                    >
                      <span className="text-primary">•</span>
                      {motivation}
                    </li>
                  )) || (
                    <li className="text-muted-foreground text-sm italic">
                      No motivations defined
                    </li>
                  )}
                </ul>
              </Card>
            </div>

            <div className="mt-4 border-t pt-4">
              <p className="text-muted-foreground text-sm">
                Ads for this persona:{" "}
                <span className="text-foreground font-semibold">
                  {ads.filter((ad) => ad.persona === persona.name).length}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
