import AIMedia from "@/components/(primary-layout)/(marketing-automation-page)/AIMedia";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const MediaPage = () => {
  return (
    <AuthWrapper>
      <div className="flex flex-1 flex-col md:min-h-[calc(100vh-4rem)]">
        <AIMedia />
      </div>
    </AuthWrapper>
  );
};

export default MediaPage;
