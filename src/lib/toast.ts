// ── Wrapper لـ sonner toast يُنظّف رسائل الخطأ تلقائياً ──
import { toast as sonnerToast } from "sonner";
import { cleanErrorMessage } from "./errorMessages";

// دالة قابلة للاستدعاء المباشر + تحتوي على methods
function toastFn(msg: string, opts?: any) {
  return sonnerToast(msg, opts);
}

toastFn.success = (msg: string, opts?: any) => sonnerToast.success(msg, opts);
toastFn.info = (msg: string, opts?: any) => sonnerToast.info(msg, opts);
toastFn.warning = (msg: string, opts?: any) => sonnerToast.warning(msg, opts);
toastFn.loading = (msg: string, opts?: any) => sonnerToast.loading(msg, opts);
toastFn.dismiss = (id?: string | number) => sonnerToast.dismiss(id);
toastFn.error = (msgOrError: any, opts?: any) => {
  const cleaned = cleanErrorMessage(msgOrError);
  return sonnerToast.error(cleaned, opts);
};

export const toast = toastFn;
export default toast;
