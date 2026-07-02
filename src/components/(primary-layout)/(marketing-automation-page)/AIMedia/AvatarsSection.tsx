import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import CreatorStylesModal from "./CreatorStylesModal";
import VideoGenerationPage from "./VideoGenerationPage";

interface AvatarsSectionProps {
  onToolClick: (toolId: string) => void;
}

interface Creator {
  _id: string;
  creator_name: string;
  gender: string;
  age_range: string;
  type: string;
  style_count: number;
  styles: string[];
  preview_image: string;
  preview_video: string;
}

interface SelectedPersona {
  id: string;
  name: string;
  image: string;
}

interface CreatorCardProps {
  creator: Creator;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function CreatorCard({
  creator,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: CreatorCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch((error) => {
        });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered]);

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <Card className="relative mb-2 aspect-[3/4] overflow-hidden shadow-lg">
        <img
          src={creator.preview_image}
          alt={creator.creator_name}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-300",
            isHovered ? "opacity-0" : "opacity-100 group-hover:scale-105",
          )}
        />
        <video
          ref={videoRef}
          src={creator.preview_video}
          loop
          muted
          playsInline
          preload="metadata"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-300",
            isHovered ? "opacity-100 group-hover:scale-105" : "opacity-0",
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Style count badge */}
        <div className="bg-primary text-primary-foreground absolute top-3 right-3 rounded-full px-2 py-1 text-xs font-bold">
          {creator.style_count} {creator.style_count === 1 ? "Style" : "Styles"}
        </div>
      </Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-primary h-2 w-2 rounded-full"></span>
          <span className="text-foreground text-sm font-medium capitalize">
            {creator.creator_name}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AvatarsSection({ onToolClick }: AvatarsSectionProps) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"realistic" | "styled">(
    "realistic",
  );
  const [filters, setFilters] = useState({
    age_range: "all",
    gender: "all",
    location: "all",
  });
  const [hoveredCreator, setHoveredCreator] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] =
    useState<SelectedPersona | null>(null);
  const pageSize = 50;

  const fetchCreators = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (filters.age_range && filters.age_range !== "all")
          params.append("age_range", filters.age_range);
        if (filters.gender && filters.gender !== "all")
          params.append("gender", filters.gender);
        if (filters.location && filters.location !== "all")
          params.append("location", filters.location);

        // Add type filter based on active tab
        params.append("type", activeTab);

        params.append("page", page.toString());
        params.append("pageSize", pageSize.toString());

        const queryString = params.toString();

        const { data: result } = await api.get(
          `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}media/avatars?${queryString}`,
        );

        if (result.data && result.data.results) {
          // debug logging removed
        }

        // DEBUG: Check if we have date information in response headers or metadata

        if (result.success && result.data) {
          const fetchedCreators = result.data.results || [];

          if (append) {
            setCreators((prev) => [...prev, ...fetchedCreators]);
          } else {
            setCreators(fetchedCreators);
          }

          setTotalCount(result.data.count || 0);
          setHasMore(result.data.next !== null);
          setCurrentPage(page);
        }
      } catch (err: unknown) {
        console.error("Error fetching creators:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load creators";
        setError(errorMessage);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, activeTab, pageSize],
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchCreators(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchCreators(currentPage + 1, true);
    }
  };

  // const handleNewArrivalClick = () => {
  //   setFilters(prev => ({
  //     ...prev,
  //     new_arrival: !prev.new_arrival
  //   }));
  // };

  // Show video generation page if persona is selected
  if (selectedPersona) {
    return (
      <VideoGenerationPage
        personaId={selectedPersona.id}
        personaName={selectedPersona.name}
        personaImage={selectedPersona.image}
        onBack={() => setSelectedPersona(null)}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      <div>
        <div className="mb-4">
          <h2 className="text-foreground text-xl font-bold md:text-2xl">
            Avatars
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Generate realistic avatars for your campaigns
          </p>
        </div>

        {/* Avatar Tabs */}
        <div className="mb-6">
          <div className="border-border flex items-center gap-4 border-b">
            <Button
              onClick={() => setActiveTab("realistic")}
              variant="ghost"
              className={cn(
                "rounded-b-none px-4 py-3 font-medium transition-colors",
                activeTab === "realistic"
                  ? "border-primary text-foreground border-b-2"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Realistic Avatars
            </Button>
            <Button
              onClick={() => setActiveTab("styled")}
              variant="ghost"
              className={cn(
                "rounded-b-none px-4 py-3 font-medium transition-colors",
                activeTab === "styled"
                  ? "border-primary text-foreground border-b-2"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Styled Avatar
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filters.gender}
            onValueChange={(value) => setFilters({ ...filters, gender: value })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="m">Male</SelectItem>
              <SelectItem value="f">Female</SelectItem>
              <SelectItem value="nb">Non-Binary</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.age_range}
            onValueChange={(value) =>
              setFilters({ ...filters, age_range: value })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Ages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="teen">Teen</SelectItem>
              <SelectItem value="adult">Adult</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.location}
            onValueChange={(value) =>
              setFilters({ ...filters, location: value })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
              <SelectItem value="fantasy">Fantasy</SelectItem>
              <SelectItem value="indoor">Indoor</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {(filters.gender !== "all" ||
            filters.age_range !== "all" ||
            filters.location !== "all") && (
            <Button
              onClick={() =>
                setFilters({ age_range: "all", gender: "all", location: "all" })
              }
              variant="outline"
              className="border-destructive/50 bg-destructive/20 text-destructive hover:bg-destructive/30"
            >
              Clear Filters
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* <Button
            variant={filters.new_arrival ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
            onClick={handleNewArrivalClick}
          >
            <Sparkles className="h-4 w-4" />
            New Arrival
          </Button> */}
          {/* <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <span>📑</span>
            Saved
          </Button> */}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="py-12 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchCreators(1, false)}>Try Again</Button>
        </div>
      )}

      {/* Creators Grid */}
      {!loading && !error && creators.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {creators.map((creator) => (
            <CreatorCard
              key={creator._id}
              creator={creator}
              isHovered={hoveredCreator === creator._id}
              onHover={() => setHoveredCreator(creator._id)}
              onLeave={() => setHoveredCreator(null)}
              onClick={() => setSelectedCreator(creator.creator_name)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && creators.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No creators found</p>
        </div>
      )}

      {/* Load More / Results */}
      {!loading && !error && creators.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4 text-sm">
            Showing {creators.length} of {totalCount} creator
            {totalCount !== 1 ? "s" : ""}
          </p>
          {hasMore && (
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              className="mx-auto flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                `Load More (${totalCount - creators.length} remaining)`
              )}
            </Button>
          )}
        </div>
      )}

      {/* Creator Styles Modal */}
      {selectedCreator && (
        <CreatorStylesModal
          creatorName={selectedCreator}
          onClose={() => setSelectedCreator(null)}
          onSelectStyle={(style) => {
            setSelectedPersona({
              id: style.id,
              name: `${style.creator_name} - ${style.video_scene}`,
              image: style.preview_image_9_16,
            });
            setSelectedCreator(null);
          }}
        />
      )}
    </div>
  );
}
