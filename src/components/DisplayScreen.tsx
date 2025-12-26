import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceStatus {
  counterType: string;
  serving: string[];
}

interface DisplayState {
  services: ServiceStatus[];
  waiting: string[];
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
    <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      {/* Connection Status */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            isConnected ? "bg-[#136334]" : "bg-[#A21926]"
          }`}
        />
        <span className="text-sm font-medium text-slate-700">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-[#136334]">
          ACEMC Queue Display
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Now Serving - {new Date(displayState.updatedAt).toLocaleTimeString()}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayState.services.map((service) => (
          <div
            key={service.counterType}
            className="rounded-2xl bg-white p-6 shadow-xl border-2 border-[#136334]/20 transition-transform hover:scale-105"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#136334]">
                {service.counterType}
              </h2>
              <div className="rounded-full bg-[#136334]/10 px-3 py-1">
                <span className="text-sm font-semibold text-[#136334]">
                  {service.serving.length > 0 ? "SERVING" : "IDLE"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {service.serving.length > 0 ? (
                service.serving.map((queueId) => (
                  <Card
                    key={queueId}
                    className="animate-pulse rounded-lg bg-gradient-to-r from-[#136334] to-[#1a7d42] border-0 shadow-md"
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-3xl font-bold text-white">
                        {queueId}
                      </span>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center">
                  <span className="text-lg text-slate-400">
                    No queue serving
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Waiting Queue */}
      <div className="mt-8 text-center">
        <div className="inline-block rounded-2xl bg-white px-8 py-4 shadow-xl border-2 border-[#136334]/20 min-w-[300px]">
          <p className="text-lg font-semibold text-slate-600 mb-3">
            Waiting in Queue ({displayState.waiting.length})
          </p>
          {displayState.waiting.length > 0 ? (
            <div className="space-y-2">
              {displayState.waiting.slice(0, 5).map((queueId) => (
                <Card
                  key={queueId}
                  className="rounded-lg bg-slate-50 border border-slate-200"
                >
                  <CardContent className="p-3 text-center">
                    <span className="text-xl font-semibold text-[#136334]">
                      {queueId}
                    </span>
                  </CardContent>
                </Card>
              ))}
              {displayState.waiting.length > 5 && (
                <div className="text-lg font-medium text-[#A21926] pt-2">
                  .. and {displayState.waiting.length - 5} more
                </div>
              )}
            </div>
          ) : (
            <p className="text-2xl font-bold text-slate-400">
              No waiting queues
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;
