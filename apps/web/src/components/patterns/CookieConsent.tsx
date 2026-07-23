"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-full duration-300">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 rounded-2xl bg-surface-container-high px-6 py-4 shadow-xl ring-1 ring-outline-variant sm:flex-row">
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-sm font-semibold text-on-surface">
            Chính sách Cookie
          </h3>
          <p className="mt-1 text-xs text-on-surface-variant">
            Chúng tôi sử dụng cookie để cải thiện trải nghiệm của bạn trên trang
            web. Bằng cách tiếp tục duyệt trang web, bạn đồng ý với việc sử dụng
            cookie của chúng tôi.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            className="text-xs"
          >
            Từ chối
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAccept}
            className="text-xs"
          >
            Đồng ý
          </Button>
        </div>
      </div>
    </div>
  );
}
