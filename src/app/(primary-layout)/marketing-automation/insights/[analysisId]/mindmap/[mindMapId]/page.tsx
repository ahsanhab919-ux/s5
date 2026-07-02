import MindMapView from "@/components/(primary-layout)/(marketing-automation-page)/MindMapView";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const MindMapDetails = () => {
  return (
    <AuthWrapper>
      <div>
        <MindMapView />
      </div>
    </AuthWrapper>
  );
};

export default MindMapDetails;
