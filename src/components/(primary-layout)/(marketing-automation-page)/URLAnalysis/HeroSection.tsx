export default function HeroSection() {
  return (
    <div className="relative py-6 text-center">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/20 animate-blob absolute top-1/2 left-1/4 h-[500px] w-[500px] rounded-full opacity-40 blur-3xl filter"></div>
        <div className="bg-primary/20 animate-blob animation-delay-2000 absolute top-1/2 right-1/4 h-[500px] w-[500px] rounded-full opacity-40 blur-3xl filter"></div>
        <div className="bg-primary/20 animate-blob animation-delay-4000 absolute bottom-1/2 left-1/2 h-[500px] w-[500px] rounded-full opacity-40 blur-3xl filter"></div>
      </div>

      <div className="border-primary/30 bg-primary/5 hover:bg-primary/10 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm transition-all">
        <span className="relative flex h-2 w-2">
          <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
          <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
        </span>
        <span className="text-primary text-xs font-semibold tracking-wider uppercase">
          AI-Powered Analysis
        </span>
      </div>

      <h1 className="text-foreground mb-2 text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
        Meta Ads Automation
        <span className="from-primary via-primary to-primary block bg-gradient-to-r bg-clip-text text-transparent">
          Suite
        </span>
      </h1>
      <p className="text-muted-foreground mx-auto max-w-2xl text-sm font-light sm:text-base">
        From AI analysis to campaign launch—everything you need to create,
        optimize, and scale Meta ads with intelligent automation
      </p>
    </div>
  );
}
