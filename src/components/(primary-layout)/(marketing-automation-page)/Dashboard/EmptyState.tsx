"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target } from "lucide-react";
import Link from "next/link";

export default function EmptyState() {
  return (
    <Card className="container mx-auto my-auto p-12 text-center">
      <div className="bg-muted mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
        <Target className="text-muted-foreground h-10 w-10" />
      </div>
      <h2 className="text-foreground mb-2 text-2xl font-bold">
        No Published Campaigns Yet
      </h2>
      <p className="text-muted-foreground mx-auto mb-6 max-w-md">
        Publish your first campaign to Meta to see performance insights and
        AI-powered optimization suggestions.
      </p>
      <Link href="/marketing-automation">
        <Button>Go to Projects</Button>
      </Link>
    </Card>
  );
}
