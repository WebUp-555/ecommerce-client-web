import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders } from "../api/api";
import "./MyOrdersPage.css";

function MyOrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const limit = 10;

  const statusOptions = [
    { value: "", label: "All Orders" },
    { value: "pending_payment", label: "Pending Payment" },
    { value: "paid", label: "Paid" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "failed", label: "Failed" },
  ];

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = { page, limit };
      if (statusFilter) params.status = statusFilter;

      // ✅ Expected api.js returns res.data.data
      const data = await getMyOrders(params);
      const payload = data?.data ? data.data : data;

      setOrders(payload?.orders || []);
      setTotalOrders(payload?.total || 0);

      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err?.response?.data?.message || err.message || "Failed to fetch orders");
      setOrders([]);
      setTotalOrders(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || "";

    switch (s) {
      case "pending_payment":
        return "status-pending";
      case "paid":
        return "status-paid";
      case "processing":
        return "status-processing";
      case "shipped":
        return "status-shipped";
      case "delivered":
        return "status-delivered";
      case "cancelled":
        return "status-cancelled";
      case "failed":
        return "status-failed";
      default:
        return "status-default";
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const totalPages = Math.ceil(totalOrders / limit);
  const isLastPage = page >= totalPages && totalPages !== 0;

  return (
    <div className="my-orders-page">
      <div className="orders-container">
        {/* Header */}
        <div className="page-header">
          <h1>My Orders</h1>
          <p>View and track all your orders</p>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="filter-select"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet.</p>
            <button onClick={() => navigate("/products")} className="btn-start-shopping">
              Start Shopping
            </button>
          </div>
        )}

        {/* Orders List */}
        {!loading && orders.length > 0 && (
          <div className="orders-grid">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => navigate(`/orders/my/${order._id}`)}
                className="order-card"
              >
                <div className="card-header">
                  <div className="order-id">
                    <h3>Order #{order._id?.slice(-8).toUpperCase() || "N/A"}</h3>
                    <p className="order-date">{formatDate(order.createdAt)}</p>
                  </div>

                  <span className={`status-badge ${getStatusColor(order.status)}`}>
                    {order.status || "pending_payment"}
                  </span>
                </div>

                <div className="card-body">
                  <div className="order-detail">
                    <span className="label">Items</span>
                    <span className="value">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="order-detail">
                    <span className="label">Total Amount</span>
                    <span className="value amount">₹{order.amount || 0}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <button className="btn-view-details">View Details →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="pagination-btn"
            >
              ← Previous
            </button>

            <span className="page-info">
              Page {page} {totalPages > 0 ? `of ${totalPages}` : ""}
            </span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isLastPage}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrdersPage;
