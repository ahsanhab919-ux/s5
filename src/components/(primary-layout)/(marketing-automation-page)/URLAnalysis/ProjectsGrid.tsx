"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  Clock,
  Folder,
  Image,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Loader2,
  Megaphone,
  Trash2,
  Sparkles,
  Target,
  MessageSquare,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
  _id: string;
  url: string;
  analysis_id: string;
  product: {
    title: string;
    brand: string;
    category: string;
    description: string;
  };
  createdAt: string;
}

interface ProjectsGridProps {
  projects: Project[];
  loadingProjects: boolean;
  deletingProject: string | null;
  onDeleteProject: (projectId: string, e: React.MouseEvent) => void;
}

const ProjectCard = ({ project, deletingProject, onDeleteProject }) => {
  const navigationSteps = [
    {
      label: "AI Media Studio",
      icon: Image,
      href: `/marketing-automation/media/${project._id}`,
      description: "Manage assets",
    },
    {
      label: "Ad Canvas",
      icon: Megaphone,
      href: `/marketing-automation/canvas/${project._id}`,
      description: "Create & design ads",
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: `/marketing-automation/dashboard/${project._id}`,
      description: "Monitor performance",
    },
    {
      label: "Insights",
      icon: Lightbulb,
      href: `/marketing-automation/insights/${project.analysis_id}?state=${encodeURIComponent(
        JSON.stringify({ projectId: project._id }),
      )}`,
      description: "AI-powered analysis",
    },
  ];

  return (
    <Card className="group hover:border-primary/50 relative h-full transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg">
      <CardContent className="flex h-full flex-col px-4 md:px-6">
        {/* Header Section */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="border-primary/30 bg-primary/10 text-primary inline-block rounded-lg border px-2.5 py-1 text-xs font-medium capitalize">
                {project.product.category}
              </span>
              <Button
                onClick={(e) => onDeleteProject(project._id, e)}
                disabled={deletingProject === project._id}
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                {deletingProject === project._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="text-destructive h-4 w-4" />
                )}
              </Button>
            </div>
            <h3 className="text-foreground group-hover:text-primary mt-3 text-lg font-bold transition-colors">
              {project.product.title}
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              by {project.product.brand}
            </p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="mb-6 space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.url}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              {new Date(project.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Navigation Steps */}
        <div className="border-border mt-auto space-y-1.5 border-t pt-4">
          {navigationSteps?.map((step, index) => {
            const Icon = step.icon;
            return (
              <Link key={step.label} href={step.href}>
                <div className="group/item hover:border-primary/20 hover:bg-primary/5 flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-all">
                  <div className="bg-primary/10 group-hover/item:bg-primary/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors">
                    <Icon className="text-primary h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground group-hover/item:text-primary truncate text-sm font-medium transition-colors">
                        {step.label}
                      </p>
                    </div>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {step.description}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 opacity-100 transition-all group-hover/item:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ProjectsGrid({
  projects,
  loadingProjects,
  deletingProject,
  onDeleteProject,
}: ProjectsGridProps) {
  const router = useRouter();

  return (
    <div className="mt-16">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl shadow-lg">
            <Folder className="text-primary-foreground h-6 w-6" />
          </div>
          <div>
            <h2 className="text-foreground text-xl font-bold tracking-tight md:text-3xl">
              Your Projects
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs md:text-sm">
              Manage and track your campaigns
            </p>
          </div>
        </div>
        <span className="border-border bg-card/60 text-foreground shrink-0 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md">
          {projects.length} {projects.length !== 1 ? "Projects" : "Project"}
        </span>
      </div>

      {loadingProjects ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="relative rounded-3xl border border-dashed border-primary/20 bg-card/30 p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <Sparkles className="text-primary h-8 w-8" />
            </div>

            <h3 className="text-foreground text-2xl font-bold mb-3">
              Ready to launch your first campaign?
            </h3>
            <p className="text-muted-foreground mb-8 text-base">
              Start by analyzing a product URL above. Our AI will automatically generate:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-background/40 backdrop-blur-sm p-4 rounded-xl border border-border/50">
                <div className="bg-blue-500/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <Target className="text-blue-500 h-4 w-4" />
                </div>
                <h4 className="font-semibold text-sm mb-1">Target Audience</h4>
                <p className="text-muted-foreground text-xs">Detailed buyer personas and interests</p>
              </div>

              <div className="bg-background/40 backdrop-blur-sm p-4 rounded-xl border border-border/50">
                <div className="bg-purple-500/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <MessageSquare className="text-purple-500 h-4 w-4" />
                </div>
                <h4 className="font-semibold text-sm mb-1">Ad Copy</h4>
                <p className="text-muted-foreground text-xs">High-converting headlines and primary text</p>
              </div>

              <div className="bg-background/40 backdrop-blur-sm p-4 rounded-xl border border-border/50">
                <div className="bg-amber-500/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <BarChart2 className="text-amber-500 h-4 w-4" />
                </div>
                <h4 className="font-semibold text-sm mb-1">Market Strategy</h4>
                <p className="text-muted-foreground text-xs">Competitor analysis and trend insights</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 2xl:grid-cols-3">
          {projects.map((project) => (
            <div key={project._id} className="group relative">
              {/* Glow effect */}
              <div className="bg-primary/20 absolute -inset-0.5 rounded-2xl opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100"></div>

              <ProjectCard
                project={project}
                deletingProject={deletingProject}
                onDeleteProject={onDeleteProject}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
