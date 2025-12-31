import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [displayState, setDisplayState] = useState<DisplayState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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

    // Initial fetch
    fetchDisplayState();

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
    <div className="min-h-screen  p-8">
      {/* Connection Status */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            isConnected ? "bg-acemc-green" : "bg-acemc-red"
          }`}
        />
        <span className="text-sm font-medium text-slate-700">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img
            src="https://i0.wp.com/acemclegazpi.com/wp-content/uploads/2023/07/cropped-cropped-Modern_annual_report__3__-_Copy-removebg-preview.png?fit=289%2C115&ssl=1"
            alt="ACE Medical Center Logo"
            className="h-20 w-auto"
          />
          <div className="text-left">
            <h1 className="text-4xl font-bold text-acemc-green">
              ACE Medical Center Legazpi
            </h1>
            <p className="text-sm font-light text-slate-500 mt-1">
              Daraga Legazpi Diversion Road, Brgy. Bogtong, Legazpi City, Albay
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="text-5xl font-semibold text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Main Content Grid: 40-60 split */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6">
        {/* Left Column: Services (40%) */}
        <div className="space-y-6">
          {/* Services Stack */}
          {displayState.services.map((service) => (
            <div
              key={service.counterType}
              className="rounded-2xl bg-white p-6 shadow-xl border-2 border-acemc-green/20"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-acemc-green">
                  {service.counterType}
                </h2>
                <div className="rounded-full bg-acemc-green/10 px-3 py-1">
                  <span className="text-sm font-semibold text-acemc-green">
                    {service.serving.length > 0 ? "SERVING" : "IDLE"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {service.serving.length > 0 ? (
                  service.serving.map((queueId) => (
                    <Card
                      key={queueId}
                      className="animate-pulse rounded-lg  bg-acemc-green to-acemc-green-light border-0 shadow-md"
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
                      No clients being served
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Waiting Queue */}
          <div className="rounded-xl bg-white p-4 shadow-lg border-2 border-acemc-green/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-600">
                Waiting in Queue
              </p>
              <Badge className="bg-acemc-red text-white">
                {displayState.waiting.length}
              </Badge>
            </div>
            {displayState.waiting.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {displayState.waiting.slice(0, 5).map((queueId) => (
                  <Badge
                    key={queueId}
                    variant="outline"
                    className="text-acemc-green border-acemc-green font-medium"
                  >
                    {queueId}
                  </Badge>
                ))}
                {displayState.waiting.length > 5 && (
                  <Badge variant="secondary" className="text-white ">
                    +{displayState.waiting.length - 5} more
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No waiting queues</p>
            )}
          </div>
        </div>

        {/* Right Column: Video (60%) */}
        <div className="rounded-2xl bg-white p-6 shadow-xl border-2 border-acemc-green/20">
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-center text-slate-500 mt-4 text-sm">
            Healthcare Information Video
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;
