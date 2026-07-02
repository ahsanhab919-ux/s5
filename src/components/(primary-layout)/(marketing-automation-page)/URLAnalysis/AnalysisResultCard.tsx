"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductAnalysis } from "@/types/analysis";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

interface AnalysisResultCardProps {
  analysis: ProductAnalysis;
  onOpenCanvas: () => void;
}

export default function AnalysisResultCard({
  analysis,
  onOpenCanvas,
}: AnalysisResultCardProps) {
  return (
    <Card className="border-primary/30 bg-primary/10 mb-8 p-8 shadow-xl sm:p-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl shadow-lg">
            <CheckCircle2 className="text-primary-foreground h-6 w-6" />
          </div>
          <div>
            <h3 className="text-foreground text-2xl font-bold">
              Analysis Complete!
            </h3>
            <p className="text-muted-foreground text-sm">
              Your product analysis is ready for campaign creation
            </p>
          </div>
        </div>
        <Button
          onClick={onOpenCanvas}
          className="flex transform items-center gap-2 transition-all hover:scale-105"
        >
          <Sparkles className="h-5 w-5" />
          Open Canvas
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Product Info */}
        <Card className="border-border bg-card p-6 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-xl font-semibold">
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-muted-foreground text-sm font-medium">
                  Title:
                </span>
                <p className="text-foreground mt-1 font-semibold">
                  {analysis.product.title}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm font-medium">
                  Brand:
                </span>
                <p className="text-foreground mt-1 font-semibold">
                  {analysis.product.brand}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm font-medium">
                  Category:
                </span>
                <p className="text-foreground mt-1 font-semibold capitalize">
                  {analysis.product.category}
                </p>
              </div>
              <div className="md:col-span-2">
                <span className="text-muted-foreground text-sm font-medium">
                  Description:
                </span>
                <p className="text-foreground mt-1 leading-relaxed">
                  {analysis.product.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        {analysis.product.key_features.length > 0 && (
          <Card className="border-border bg-card p-6 shadow-md">
            <CardHeader>
              <CardTitle className="text-foreground text-xl font-semibold">
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {analysis.product.key_features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="bg-primary/20 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                      <CheckCircle2 className="text-primary h-3 w-3" />
                    </div>
                    <span className="text-foreground text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Target Audience */}
        <Card className="border-border bg-card p-6 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-xl font-semibold">
              Target Audience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-muted-foreground text-sm font-medium">
                  Age:
                </span>
                <p className="text-foreground mt-1 font-semibold">
                  {analysis.product.target_audience.age}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm font-medium">
                  Gender:
                </span>
                <p className="text-foreground mt-1 font-semibold">
                  {analysis.product.target_audience.gender}
                </p>
              </div>
              {analysis.product.target_audience.interests.length > 0 && (
                <div className="md:col-span-2">
                  <span className="text-muted-foreground text-sm font-medium">
                    Interests:
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {analysis.product.target_audience.interests.map(
                      (interest, idx) => (
                        <span
                          key={idx}
                          className="border-primary/30 bg-primary/10 text-primary rounded-full border px-3 py-1 text-sm font-medium"
                        >
                          {interest}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Market Analysis */}
        <Card className="border-border bg-card p-6 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground text-xl font-semibold">
              Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground text-sm font-medium">
                  Trend:
                </span>
                <p className="text-foreground mt-1 font-semibold capitalize">
                  {analysis.market.trend}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm font-medium">
                  Competition:
                </span>
                <p className="text-foreground mt-1 font-semibold capitalize">
                  {analysis.market.competition_level}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm font-medium">
                  Seasonality:
                </span>
                <p className="text-foreground mt-1 font-semibold capitalize">
                  {analysis.market.seasonality}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm font-medium">
                  Maturity:
                </span>
                <p className="text-foreground mt-1 font-semibold capitalize">
                  {analysis.market.market_maturity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}
