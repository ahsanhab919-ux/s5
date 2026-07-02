import FacebookAccountSelectionScreen from "@/components/(primary-layout)/(marketing-automation-page)/FacebookAccountSelectionScreen";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const PublishSelectAccountPage = () => {
  return (
    <AuthWrapper>
      <div>
        <FacebookAccountSelectionScreen />
      </div>
    </AuthWrapper>
  );
};

export default PublishSelectAccountPage;
