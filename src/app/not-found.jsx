import NotFountIcon from "@/components/icons/NotFountIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata = {
  title: "404 Page Not Found || Shothik AI",
  description:
    "Sorry, we couldn't find the page you're looking for. Perhaps you've mistyped the URL?",
};

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h3 className="animate-in fade-in text-3xl font-bold duration-1000">
        Sorry, page not found!
      </h3>

      <p className="text-muted-foreground animate-in fade-in text-center duration-1000">
        Sorry, we couldn't find the page you're looking for. Perhaps you've
        mistyped the URL? Be sure to check your spelling.
      </p>

      <NotFountIcon className={cn("my-5 h-[260px] sm:my-10")} />

      <Button asChild size="lg">
        <Link href="/">Go to Home</Link>
      </Button>
    </div>
  );
}
