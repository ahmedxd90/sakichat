// @ts-nocheck
import { useState, useCallback } from "react";
import type { ModalAlertData } from "../components/ModalAlert";

export function useModalAlert() {
  const [alert, setAlert] = useState<ModalAlertData | null>(null);

  const showAlert = useCallback((data: ModalAlertData) => {
    setAlert(data);
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const showSuccess = useCallback((title: string, message: string, autoClose = 2500) => {
    setAlert({ type: "success", title, message, autoClose });
  }, []);

  const showError = useCallback((title: string, message: string, autoClose = 4000) => {
    setAlert({ type: "error", title, message, autoClose });
  }, []);

  const showWarning = useCallback((title: string, message: string, autoClose = 3500) => {
    setAlert({ type: "warning", title, message, autoClose });
  }, []);

  const showMuteAlert = useCallback((mutedByName: string) => {
    setAlert({
      type: "mute",
      title: "🔇 أنت مكتوم الصوت",
      message: `تم كتم صوتك من طرف ${mutedByName}`,
      icon: "🔇",
      autoClose: 3500,
    });
  }, []);

  const showChatMuteAlert = useCallback((mutedByName: string) => {
    setAlert({
      type: "chat_mute",
      title: "💬 أنت مكتوم في الدردشة",
      message: `تم كتم دردشتك من طرف ${mutedByName}`,
      icon: "🚫",
      autoClose: 3500,
    });
  }, []);

  return { alert, showAlert, hideAlert, showSuccess, showError, showWarning, showMuteAlert, showChatMuteAlert };
}
