import { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "../components/DashboardCard";

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    orders: 0
  });
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch products, users, and orders in parallel
        const [productsRes, usersRes, ordersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/products`,{ headers }),
          axios.get(`${API_BASE_URL}/admin/users`, { headers }),
          axios.get(`${API_BASE_URL}/orders`, { headers })
        ]);

        const ordersData = ordersRes.data?.data || ordersRes.data;

        setStats({
          products: productsRes.data?.products?.length || 0,
          users: usersRes.data?.users?.length || 0,
          orders: ordersData?.orders?.length || ordersData?.total || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-300">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Total Products" value={stats.products} />
        <DashboardCard title="Total Users" value={stats.users} />
        <DashboardCard title="Total Orders" value={stats.orders} />
      </div>
    </div>
  );
}
