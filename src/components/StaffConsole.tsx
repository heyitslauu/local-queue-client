import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CounterType = "BILLING" | "LAB" | "CASHIER";

interface QueueItem {
  id: string;
  counterType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const StaffConsole = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userCounterType = user?.counterType || "CASHIER";

  const [selectedCounter, setSelectedCounter] =
    useState<CounterType>(userCounterType);
  const [currentQueues, setCurrentQueues] = useState<
    Record<CounterType, QueueItem | null>
  >({
    BILLING: null,
    LAB: null,
    CASHIER: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const counters: CounterType[] = ["BILLING", "LAB", "CASHIER"];
  const currentQueue = currentQueues[selectedCounter];

  // Set selected counter to user's counter type on mount
  useEffect(() => {
    if (userCounterType) {
      setSelectedCounter(userCounterType);
    }
  }, [userCounterType]);

  // Fetch current serving queue on mount and when counter changes
  useEffect(() => {
    const fetchCurrentQueue = async () => {
      try {
        const response = await axios.get("http://localhost:3000/queue");
        const displayState = response.data;

        // Find serving queue for each counter
        const newQueues: Record<CounterType, QueueItem | null> = {
          BILLING: null,
          LAB: null,
          CASHIER: null,
        };

        for (const service of displayState.services) {
          if (service.serving.length > 0) {
            // Get the full queue item for the serving ID
            const servingId = service.serving[0];
            // We need to fetch the full queue details, but for now we can reconstruct
            newQueues[service.counterType as CounterType] = {
              id: servingId,
              counterType: service.counterType,
              status: "SERVING",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
        }

        setCurrentQueues(newQueues);
      } catch (error) {
        console.error("Error fetching current queue:", error);
      }
    };

    fetchCurrentQueue();
  }, []);

  // Text-to-speech function to announce queue number
  const announceQueue = (queueId: string, counterType: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const announceText = `Now serving ${queueId} at ${counterType}`;
      let repeatCount = 0;

      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(announceText);
        utterance.lang = "en-US";
        utterance.rate = 0.6; // Slower speed
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
          repeatCount++;
          if (repeatCount < 2) {
            speak(); // Repeat
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      speak();
    }
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response = await axios.get(
        `http://localhost:3000/queue/next?counterType=${selectedCounter}`
      );
      setCurrentQueues({
        ...currentQueues,
        [selectedCounter]: response.data,
      });
      setMessage({ type: "success", text: `Called: ${response.data.id}` });

      // Announce the queue number with text-to-speech
      announceQueue(response.data.id, selectedCounter);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "No queues available",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!currentQueue) {
      setMessage({ type: "error", text: "No active queue to finish" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await axios.patch(
        `http://localhost:3000/queue/${currentQueue.id}/finish`
      );
      setMessage({ type: "success", text: `Finished: ${currentQueue.id}` });
      setCurrentQueues({
        ...currentQueues,
        [selectedCounter]: null,
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to finish queue",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img
                src="https://i0.wp.com/acemclegazpi.com/wp-content/uploads/2023/07/cropped-cropped-Modern_annual_report__3__-_Copy-removebg-preview.png?fit=289%2C115&ssl=1"
                alt="ACE Medical Center Logo"
                className="h-16 w-auto"
              />
              <div className="text-left">
                <h1 className="text-3xl font-bold text-acemc-green">
                  Staff Console
                </h1>
                <p className="text-sm font-light text-slate-500 mt-1">
                  Queue Management System
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">{user?.email}</p>
              <p className="text-xs text-acemc-green font-semibold mb-2">
                {userCounterType} Counter
              </p>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Counter Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-acemc-green">Select Counter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {counters.map((counter) => {
                const isUserCounter = counter === userCounterType;
                const isDisabled = !isUserCounter;

                return (
                  <Button
                    key={counter}
                    onClick={() => !isDisabled && setSelectedCounter(counter)}
                    variant={
                      selectedCounter === counter ? "default" : "outline"
                    }
                    disabled={isDisabled}
                    className={`flex-1 rounded-lg px-8 py-6 text-lg font-semibold transition-all ${
                      selectedCounter === counter
                        ? "bg-acemc-green text-white shadow-lg scale-105 hover:bg-acemc-green-light"
                        : isDisabled
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {counter}
                    {isUserCounter && (
                      <Badge className="ml-2 bg-white text-acemc-green text-xs">
                        You
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Queue Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-acemc-green">Current Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQueue ? (
              <div className="text-center py-8">
                <Badge className="mb-4 text-xs bg-acemc-green">
                  {currentQueue.counterType}
                </Badge>
                <div className="text-6xl font-bold text-acemc-green mb-2">
                  {currentQueue.id}
                </div>
                <p className="text-sm text-slate-500">
                  Status: {currentQueue.status}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                No active queue
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            onClick={handleNext}
            disabled={loading}
            className="bg-acemc-green text-white rounded-lg px-12 py-8 text-2xl font-bold hover:bg-acemc-green-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg h-auto cursor-pointer"
          >
            {loading ? "Loading..." : "NEXT"}
          </Button>
          <Button
            onClick={handleFinish}
            disabled={loading || !currentQueue}
            className="bg-acemc-red text-white rounded-lg px-12 py-8 text-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg h-auto cursor-pointer"
          >
            {loading ? "Loading..." : "FINISH"}
          </Button>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`rounded-lg p-4 text-center font-semibold ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffConsole;
