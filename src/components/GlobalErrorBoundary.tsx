import React from "react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const details = {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      at: new Date().toISOString(),
    };
    (window as any).__sakiLastError = details;
    (window as any).__sakiStartupMark?.("GlobalErrorBoundary captured error");
    console.error("[Saki GlobalErrorBoundary]", details);
  }

  private retry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  private copyDiagnostics = async () => {
    const error = this.state.error;
    const report = JSON.stringify({
      app: "Saki Chat",
      at: new Date().toISOString(),
      message: error?.message,
      stack: error?.stack,
      startup: (window as any).__sakiStartupDiagnostics,
      lastError: (window as any).__sakiLastError,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }, null, 2);
    try {
      await navigator.clipboard.writeText(report);
      window.alert("تم نسخ تفاصيل الخطأ");
    } catch {
      window.prompt("انسخ تفاصيل الخطأ يدويًا", report);
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    const error = this.state.error;
    return (
      <div
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#ffffff",
          color: "#172033",
          fontFamily: "Cairo, Tajawal, sans-serif",
        }}
      >
        <div style={{ width: "min(100%, 460px)", textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>!</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>حدث خطأ في فتح الصفحة</h1>
          <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: 13, lineHeight: 1.8 }}>
            تم إيقاف الشاشة البيضاء. رسالة الخطأ الحقيقية وسجل الإقلاع متاحان في التفاصيل أدناه.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={this.copyDiagnostics} style={{ border: 0, borderRadius: 14, padding: "11px 16px", background: "#172033", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
              نسخ تفاصيل الخطأ
            </button>
            <button type="button" onClick={this.retry} style={{ border: 0, borderRadius: 14, padding: "11px 16px", background: "#ff6a00", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
              إعادة المحاولة
            </button>
          </div>
          <details open style={{ marginTop: 18, textAlign: "left", direction: "ltr", color: "#64748b", fontSize: 10 }}>
            <summary>تفاصيل تقنية</summary>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 220, overflow: "auto" }}>{error.stack || error.message}\n\nComponent stack:\n{(window as any).__sakiLastError?.componentStack || "غير متاح"}\n\nStartup diagnostics:\n{JSON.stringify((window as any).__sakiStartupDiagnostics || {}, null, 2)}</pre>
          </details>
        </div>
      </div>
    );
  }
}

export { GlobalErrorBoundary };
