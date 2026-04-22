import RevenueCard from "@/components/admin/RevenueCard";
import SalesByCategory from "@/components/admin/SalesByCategory";
import SmartChat from "@/components/admin/SmartChat";
import StatCard from "@/components/admin/StatCard";
import TopProductCard from "@/components/admin/TopProductCard";

const DashboardPage = () => {
  return (
    <>
      <h1 className="sr-only">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueCard />
        </div>
        <TopProductCard />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="New products"
          value="2,340"
          delta={12.5}
          data={[40, 55, 48, 70, 60, 82, 75]}
        />
        <StatCard
          label="Users"
          value="4,420"
          delta={-3.4}
          data={[60, 70, 50, 80, 65, 90, 72]}
        />
        <StatCard
          label="Users"
          value="4,420"
          delta={3.4}
          data={[80, 60, 90, 50, 75, 65, 85]}
          variant="horizontal"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SmartChat />
        <SalesByCategory />
      </div>
    </>
  );
};

export default DashboardPage;