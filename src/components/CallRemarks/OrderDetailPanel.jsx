import {
  Package,
  Calendar,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Store,
  Hash,
} from "lucide-react";
import { useState } from "react";

const OrderDetailsPanel = ({ orderData = [], customerData }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Status color
  const getStatusColor = (status) => {
    if (!status) return "text-gray-600 bg-gray-50";
    const s = status.toLowerCase();
    if (s.includes("delivered") || s.includes("completed"))
      return "text-green-600 bg-green-50";
    if (s.includes("pending") || s.includes("processing"))
      return "text-yellow-600 bg-yellow-50";
    if (s.includes("cancelled") || s.includes("canceled"))
      return "text-red-600 bg-red-50";
    if (s.includes("shipped")) return "text-blue-600 bg-blue-50";
    return "text-gray-600 bg-gray-50";
  };

  const getStatusIcon = (status) => {
    if (!status) return <Clock className="w-3 h-3 mr-1" />;
    const s = status.toLowerCase();
    if (s.includes("delivered") || s.includes("completed"))
      return <CheckCircle className="w-3 h-3 mr-1" />;
    if (s.includes("cancelled") || s.includes("canceled"))
      return <XCircle className="w-3 h-3 mr-1" />;
    if (s.includes("shipped")) return <Truck className="w-3 h-3 mr-1" />;
    return <Clock className="w-3 h-3 mr-1" />;
  };

  const formatDate = (d) =>
    !d || d === "N/A"
      ? "N/A"
      : new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

  const formatCurrency = (amt) => {
  if (amt === null || amt === undefined || amt === "N/A") return "N/A";
  const n = typeof amt === "string" ? parseFloat(amt.replace(/[^\d.-]/g, "")) : amt;
  if (isNaN(n)) return amt;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

  const sortedOrders = [...orderData].sort((a, b) => {
  const dateA = new Date(a.orderDate || a.CreatedDate).getTime();
  const dateB = new Date(b.orderDate || b.CreatedDate).getTime();

  // Sort by most recent first
  if (dateB !== dateA) return dateB - dateA;

  // If same date, sort by BranchId or POS name
  return (a.branchId || a.posName || "").localeCompare(b.branchId || b.posName || "");
});

  if (!orderData || orderData.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 mb-2">No Orders Found</h4>
          <p className="text-sm text-gray-500">
            This customer has no previous orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Package className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">Order History</h4>
          <p className="text-sm text-gray-500">
            {customerData?.name || "Customer"} — {orderData.length} Orders
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {sortedOrders.map((order, index) => (
          <div
            key={order.orderId || index}
            className="border rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Summary Row */}
            <button
              onClick={() =>
                setExpandedOrder(expandedOrder === index ? null : index)
              }
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <div>
                <p className="font-medium text-gray-900">
                  #{order.orderId || "N/A"}
                </p>
                <p className="text-xs text-gray-500">
                  {order.posName || "N/A"} • {formatDate(order.orderDate)}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.deliveryStatus
                  )}`}
                >
                  {getStatusIcon(order.deliveryStatus)}
                  {order.deliveryStatus || "Unknown"}
                </span>
                {expandedOrder === index ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedOrder === index && (
              <div className="border-t p-4 bg-gray-50 space-y-4">
                {/* Order Summary */}
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Branch: {order.branchId || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Date: {formatDate(order.orderDate)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Total: {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Delivery Charge: {formatCurrency(order.deliveryCharge)}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                {order.items && order.items.length > 0 && (
                  <div>
                    <h6 className="font-medium text-gray-800 mb-2 text-sm">
                      Items ({order.items.length})
                    </h6>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">
                              Item
                            </th>
                            <th className="text-center px-3 py-2 font-medium text-gray-700">
                              Qty
                            </th>
                            <th className="text-center px-3 py-2 font-medium text-gray-700">
                              Rate
                            </th>
                            <th className="text-center px-3 py-2 font-medium text-gray-700">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, i) => (
                            <tr
                              key={i}
                              className="border-t hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-3 py-2 text-gray-800">
                                {item.itemName}{" "}
                                <span className="text-xs text-gray-500">
                                  ({item.uom})
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center text-gray-600">
                                {item.qty}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-600">
                                {formatCurrency(item.rate)}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-900 font-medium">
                                {formatCurrency(item.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderDetailsPanel;
