"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Tentar salvar no localStorage para debug
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      localStorage.setItem("acdocs_last_error", JSON.stringify(errorLog));
    } catch (e) {
      console.error("Failed to save error log:", e);
    }
  }

  copyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim();
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorText).then(() => {
        alert("Erro copiado! Cole aqui no chat.");
      });
    } else {
      // Fallback para iOS antigo
      const textArea = document.createElement("textarea");
      textArea.value = errorText;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        alert("Erro copiado! Cole aqui no chat.");
      } catch (err) {
        alert("Não foi possível copiar. Tire um screenshot.");
      }
      document.body.removeChild(textArea);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-6 text-destructive" />
                <CardTitle className="text-destructive">Erro na Aplicação</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-destructive/10 p-4">
                <p className="font-mono text-sm text-destructive break-words">
                  {this.state.error?.message}
                </p>
              </div>
              
              <details className="text-xs">
                <summary className="cursor-pointer font-semibold mb-2">
                  Detalhes técnicos
                </summary>
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold">User Agent:</p>
                    <p className="font-mono text-muted-foreground break-all">
                      {navigator.userAgent}
                    </p>
                  </div>
                  {this.state.error?.stack && (
                    <div>
                      <p className="font-semibold">Stack:</p>
                      <pre className="font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap text-[10px]">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>

              <div className="flex gap-2">
                <Button onClick={this.copyError} className="flex-1">
                  Copiar Erro
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Recarregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
