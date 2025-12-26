import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface ServiceStatus {
  counterType: string;
  serving: string[];
}

interface DisplayState {
  services: ServiceStatus[];
  waitingCount: number;
  updatedAt: string;
}

interface QueueItem {
  id: string;
  counterType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const DisplayScreen = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [displayState, setDisplayState] = useState<DisplayState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket server
    const socketInstance = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    // Listen for queue events
    socketInstance.on("queueCreated", (queue: QueueItem) => {
      console.log("Queue created:", queue);
      fetchDisplayState();
    });

    socketInstance.on("queueCalled", (queue: QueueItem) => {
      console.log("Queue called:", queue);
      fetchDisplayState();
    });

    socketInstance.on("queueFinished", (queue: QueueItem) => {
      console.log("Queue finished:", queue);
      fetchDisplayState();
    });

    socketInstance.on("queueUpdated", (queue: QueueItem) => {
      console.log("Queue updated:", queue);
      fetchDisplayState();
    });

    socketInstance.on("allQueues", (queues: QueueItem[]) => {
      console.log("All queues:", queues);
    });

    setSocket(socketInstance);

    // Initial fetch
    fetchDisplayState();

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const fetchDisplayState = async () => {
    try {
      const response = await fetch("http://localhost:3000/queue");
      const data: DisplayState = await response.json();
      setDisplayState(data);
    } catch (error) {
      console.error("Error fetching display state:", error);
    }
  };

  if (!displayState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-2xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Connection Status */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm font-medium text-gray-700">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-gray-800">Queue Display</h1>
        <p className="mt-2 text-lg text-gray-600">
          Now Serving - {new Date(displayState.updatedAt).toLocaleTimeString()}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayState.services.map((service) => (
          <div
            key={service.counterType}
            className="rounded-2xl bg-white p-6 shadow-lg transition-transform hover:scale-105"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-indigo-600">
                {service.counterType}
              </h2>
              <div className="rounded-full bg-indigo-100 px-3 py-1">
                <span className="text-sm font-semibold text-indigo-600">
                  {service.serving.length > 0 ? "SERVING" : "IDLE"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {service.serving.length > 0 ? (
                service.serving.map((queueId) => (
                  <div
                    key={queueId}
                    className="animate-pulse rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-center"
                  >
                    <span className="text-3xl font-bold text-white">
                      {queueId}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                  <span className="text-lg text-gray-400">
                    No queue serving
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Waiting Count */}
      <div className="mt-8 text-center">
        <div className="inline-block rounded-2xl bg-white px-8 py-4 shadow-lg">
          <p className="text-lg font-semibold text-gray-600">
            Waiting in Queue
          </p>
          <p className="text-5xl font-bold text-indigo-600">
            {displayState.waitingCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;
