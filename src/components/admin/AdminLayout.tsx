import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
