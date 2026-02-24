"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: string;
}

export function ErrorLogger() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error: ErrorLog = {
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
      };
      setErrors((prev) => [...prev, error]);
      setShow(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error: ErrorLog = {
        message: `Unhandled Promise: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
      };
      setErrors((prev) => [...prev, error]);
      setShow(true);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  if (!show || errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-destructive bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              <CardTitle className="text-sm">Erros Detectados ({errors.length})</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setShow(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-auto">
          {errors.map((error, index) => (
            <div key={index} className="rounded-lg bg-background p-3 text-xs">
              <p className="font-semibold text-destructive mb-1">{error.message}</p>
              <p className="text-muted-foreground text-[10px]">
                {new Date(error.timestamp).toLocaleTimeString()}
              </p>
              {error.stack && (
                <pre className="mt-2 text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              const errorText = errors
                .map(
                  (e) =>
                    `[${e.timestamp}] ${e.message}\n${e.stack || ""}`
                )
                .join("\n\n");
              navigator.clipboard?.writeText(errorText);
              alert("Erros copiados para área de transferência!");
            }}
          >
            Copiar Erros
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
