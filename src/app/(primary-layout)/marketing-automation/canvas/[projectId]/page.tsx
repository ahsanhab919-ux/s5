import Canvas from "@/components/(primary-layout)/(marketing-automation-page)/Canvas";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const ProjectCanvasPage = () => {
  return (
    <AuthWrapper>
      <div className="flex flex-1 flex-col md:min-h-[calc(100vh-4rem)]">
        <Canvas />
      </div>
    </AuthWrapper>
  );
};

export default ProjectCanvasPage;
