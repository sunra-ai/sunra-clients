"use client";

import { sunra } from "@sunra/client";
import { useState } from "react";

sunra.config({
  proxyUrl: "/api/sunra/proxy",
});

const DEFAULT_ENDPOINT_ID = "sunra/lcm/text-to-image";
const DEFAULT_INPUT = `{
  "prompt": "A beautiful sunset over the ocean"
}`;

export default function Home() {
  // Input state
  const [endpointId, setEndpointId] = useState<string>(DEFAULT_ENDPOINT_ID);
  const [input, setInput] = useState<string>(DEFAULT_INPUT);
  // Result state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const reset = () => {
    setLoading(false);
    setResult(null);
    setLogs([]);
    setElapsedTime(0);
  };

  const run = async () => {
    reset();
    setLoading(true);
    const start = Date.now();
    try {
      const result = await sunra.subscribe(endpointId, {
        input: JSON.parse(input),
        logs: true,
        // mode: "streaming",
        mode: "polling",
        pollInterval: 1000,
        onQueueUpdate(update) {
          console.log("queue update");
          console.log(update);
          setElapsedTime(Date.now() - start);
          if (
            update.status === "IN_PROGRESS" ||
            update.status === "COMPLETED"
          ) {
            if (update.logs && update.logs.length > logs.length) {
              setLogs((update.logs || []).map((log) => log.message));
            }
          }
        },
      });
      setResult(result);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
      setElapsedTime(Date.now() - start);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="container flex w-full flex-1 flex-col items-center justify-center space-y-8 py-10 text-gray-900 dark:text-gray-50">
        <h1 className="mb-8 text-4xl font-bold">
          <code className="font-light text-pink-600">sunra</code>
          <code>queue</code>
        </h1>
        <div className="w-full text-lg">
          <label htmlFor="prompt" className="mb-2 block text-current">
            Endpoint ID
          </label>
          <input
            className="w-full rounded border border-black/20 bg-black/10 p-2 text-base dark:border-white/10 dark:bg-white/5"
            id="endpointId"
            name="endpointId"
            autoComplete="off"
            placeholder="Endpoint ID"
            value={endpointId}
            spellCheck={false}
            onChange={(e) => setEndpointId(e.target.value)}
          />
        </div>
        <div className="w-full text-lg">
          <label htmlFor="prompt" className="mb-2 block text-current">
            JSON Input
          </label>
          <textarea
            className="w-full rounded border border-black/20 bg-black/10 p-2 font-mono text-sm dark:border-white/10 dark:bg-white/5"
            id="input"
            name="Input"
            placeholder="JSON"
            value={input}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
          ></textarea>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            run();
          }}
          className="focus:shadow-outline mx-auto rounded bg-indigo-600 py-3 px-6 text-lg font-bold text-white hover:bg-indigo-700 focus:outline-none"
          disabled={loading}
        >
          {loading ? "Running..." : "Run"}
        </button>

        <div className="flex w-full flex-col space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-light">JSON Result</h3>
            <p className="text-current/80 text-sm">
              {`Elapsed Time (seconds): ${(elapsedTime / 1000).toFixed(2)}`}
            </p>
            <pre className="h-60 w-full overflow-auto whitespace-pre rounded bg-black/70 font-mono text-sm text-white/80">
              {result
                ? JSON.stringify(result, null, 2)
                : "// result pending..."}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-light">Logs</h3>
            <pre className="h-60 w-full overflow-auto whitespace-pre rounded bg-black/70 font-mono text-sm text-white/80">
              {logs.join("\n")}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
