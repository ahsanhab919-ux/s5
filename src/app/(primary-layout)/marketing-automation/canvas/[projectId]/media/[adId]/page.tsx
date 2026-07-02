import MediaCanvas from "@/components/(primary-layout)/(marketing-automation-page)/MediaCanvas";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const ProjectMediaAddPage = () => {
  return (
    <AuthWrapper>
      <div>
        <MediaCanvas />
      </div>
    </AuthWrapper>
  );
};

export default ProjectMediaAddPage;
