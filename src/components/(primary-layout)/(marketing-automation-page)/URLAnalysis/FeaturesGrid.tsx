"use client";

import { CheckCircle2, Facebook, Globe, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FeaturesGrid() {
  const features = [
    {
      icon: Globe,
      title: "Product & Competitor Intelligence",
      description:
        "Paste any product link and watch our AI analyze your competitors, extract market insights, and generate detailed buyer personas",
    },
    {
      icon: Zap,
      title: "Smart Targeting",
      description:
        "AI-powered audience segmentation with real-time demographic analysis and behavioral insights",
    },
    {
      icon: CheckCircle2,
      title: "Campaign Automation",
      description:
        "Automated campaign creation with optimized ad copy, budget allocation, and performance tracking",
    },
    {
      icon: Facebook,
      title: "Meta Integration",
      description:
        "Seamless connection to Facebook & Instagram with one-click campaign publishing and real-time sync",
    },
  ];

  return (
    <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {features.map((feature, idx) => (
        <div key={idx} className="group relative">
          {/* Glow effect on hover */}
          <div className="absolute -inset-0.5 rounded-2xl bg-primary/20 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100"></div>

          <Card className="relative h-full transition-all duration-300 hover:translate-y-[-4px] hover:border-primary/50">
            <CardContent className="p-6">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shadow-lg transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-base font-bold leading-tight text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed font-light text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
