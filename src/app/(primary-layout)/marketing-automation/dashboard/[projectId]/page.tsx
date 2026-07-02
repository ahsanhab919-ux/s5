import Dashboard from "@/components/(primary-layout)/(marketing-automation-page)/Dashboard";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const DashboardPage = () => {
  return (
    <AuthWrapper>
      <div>
        <Dashboard />
      </div>
    </AuthWrapper>
  );
};

export default DashboardPage;
