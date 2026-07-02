import AIShortsPage from "./AIShortsPage";

interface AIShortsSectionProps {
  onToolClick: (toolId: string) => void;
}

export default function AIShortsSection({ onToolClick }: AIShortsSectionProps) {
  return <AIShortsPage />;
}
