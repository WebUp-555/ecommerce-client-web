export default function DashboardCard({ title, value }) {
  return (
    <div className="bg-white shadow-md p-6 rounded-lg text-center">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
