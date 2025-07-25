"use client";

// get your API key from https://sunra.ai/dashboard/api-tokens
// sunra client reads the credentials from the environment variable SUNRA_KEY by default

import { createSunraClient } from "@sunra/client";
import { useMemo, useState } from "react";

const sunra = createSunraClient({
  proxyUrl: "/api/sunra/proxy", // the built-int nextjs proxy
});

type ErrorProps = {
  error: any;
};

function Error(props: ErrorProps) {
  if (!props.error) {
    return null;
  }
  return (
    <div
      className="mb-4 rounded bg-red-50 p-4 text-sm text-red-800 dark:bg-gray-800 dark:text-red-400"
      role="alert"
    >
      <span className="font-medium">Error</span> {props.error.message}
    </div>
  );
}

const DEFAULT_PROMPT =
  "(masterpiece:1.4), (best quality), (detailed), Medieval village scene with busy streets and castle in the distance";

export default function Home() {
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const image = useMemo(() => {
    return result?.image ?? result?.images?.[0] ?? null
  }, [result]);

  const reset = () => {
    setLoading(false);
    setError(null);
    setResult(null);
    setLogs("");
    setElapsedTime(0);
  };

  const generateImage = async () => {
    reset();
    // @snippet:start("client.queue.subscribe")
    setLoading(true);
    const start = Date.now();
    try {
      // find more models here: https://sunra.ai/models
      const result = await sunra.subscribe("black-forest-labs/flux-kontext-pro/text-to-image", {
        input: {
          prompt,
        },
        logs: true,
        onQueueUpdate(update) {
          setElapsedTime(Date.now() - start);
          if (
            update.status === "IN_PROGRESS" ||
            update.status === "COMPLETED"
          ) {
            setLogs(update.logs || "");
          }
        },
        mode: "streaming",
      });
      setResult(result);
    } catch (error: any) {
      setError(error);
    } finally {
      setLoading(false);
      setElapsedTime(Date.now() - start);
    }
    // @snippet:end
  };
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="container flex w-full flex-1 flex-col items-center justify-center space-y-8 py-10 text-gray-900 dark:text-gray-50">
        <h1 className="mb-8 text-4xl font-bold">
          Hello <code className="font-light text-pink-600">sunra</code>
        </h1>
        <div className="w-full text-lg">
          <label htmlFor="prompt" className="mb-2 block text-current">
            Prompt
          </label>
          <input
            className="w-full rounded border border-black/20 bg-black/10 p-2 text-lg dark:border-white/10 dark:bg-white/5"
            id="prompt"
            name="prompt"
            placeholder="Imagine..."
            value={prompt}
            autoComplete="off"
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={(e) => setPrompt(e.target.value.trim())}
          />
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            generateImage();
          }}
          className="focus:shadow-outline mx-auto rounded bg-indigo-600 py-3 px-6 text-lg font-bold text-white hover:bg-indigo-700 focus:outline-none"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Image"}
        </button>

        <Error error={error} />

        <div className="flex w-full flex-col space-y-4">
          <div className="mx-auto">
            {image && (
              <img src={image.url} alt="Generated Image" />
            )}
          </div>
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
              {logs}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
