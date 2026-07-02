import MindMapView from "@/components/(primary-layout)/(marketing-automation-page)/MindMapView";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const InsightsMindmapPage = () => {
  return (
    <AuthWrapper>
      <div>
        <MindMapView />
      </div>
    </AuthWrapper>
  );
};

export default InsightsMindmapPage;
