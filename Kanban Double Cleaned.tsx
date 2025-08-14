
import React, { useEffect, useState, useRef, Suspense } from "react";
import { FixedSizeList as List } from "react-window";

// Lazy load components to reduce initial bundle size
const OrderCard = React.lazy(() => import("./OrderCard"));

const AIAssistant = () => {
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  // Throttled polling with visibility check
  useEffect(() => {
    const fetchIfVisible = () => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    };

    intervalRef.current = setInterval(fetchIfVisible, 5000);
    document.addEventListener("visibilitychange", fetchIfVisible);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", fetchIfVisible);
    };
  }, []);

  // Cap message history
  useEffect(() => {
    if (messages.length > 30) {
      setMessages(prev => prev.slice(-30));
    }
  }, [messages]);

  // Handle sending message
  const handleSend = () => {
    const text = inputRef.current?.value.trim();
    if (text) {
      setMessages(prev => [...prev, { sender: "user", text }]);
      inputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Assistant Dashboard</h1>

      <div className="mb-4">
        <input
          type="text"
          ref={inputRef}
          placeholder="Type a message..."
          className="border p-2 w-full rounded"
        />
        <button
          onClick={handleSend}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>

      <div className="border rounded p-2 h-96 overflow-auto mb-6">
        <h2 className="font-semibold mb-2">Orders</h2>
        <Suspense fallback={<div>Loading orders...</div>}>
          <List
            height={300}
            itemCount={orders.length}
            itemSize={80}
            width={"100%"}
          >
            {({ index, style }) => (
              <div style={style}>
                <OrderCard order={orders[index]} />
              </div>
            )}
          </List>
        </Suspense>
      </div>
    </div>
  );
};

export default AIAssistant;
