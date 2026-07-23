"use client";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { SelectField } from "@/components/ui/SelectField";
import { useAdminConfig, useUpdateAdminConfig } from "@/features/admin";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AdminCard,
  MaterialIcon,
} from "@/modules/admin/components/AdminPrimitives";

export default function AdminSystemSettingsPage(): React.JSX.Element {
  const [allowedTypes, setAllowedTypes] = useState("");
  const [maxSizeMb, setMaxSizeMb] = useState(20);
  const [autoApproveCron, setAutoApproveCron] = useState("0 * * * * *");
  const [geminiApiKeys, setGeminiApiKeys] = useState("");
  const [cerebrasApiKey, setCerebrasApiKey] = useState("");
  const [activeLlmProvider, setActiveLlmProvider] = useState("CEREBRAS");
  const configQuery = useAdminConfig();
  const updateConfig = useUpdateAdminConfig();
  const loading = configQuery.isLoading;
  const saving = updateConfig.isPending;

  useEffect(() => {
    const config = configQuery.data;
    if (!config) return;

    setAllowedTypes(config.allowedTypes);
    setMaxSizeMb(config.maxSizeMb);
    setAutoApproveCron(config.autoApproveCron || "0 * * * * *");
    setGeminiApiKeys(config.geminiApiKeys || "");
    setCerebrasApiKey(config.cerebrasApiKey || "");
    setActiveLlmProvider(config.activeLlmProvider || "CEREBRAS");
  }, [configQuery.data]);

  useEffect(() => {
    if (configQuery.isError) {
      toast.error("Không thể tải cấu hình hệ thống");
    }
  }, [configQuery.isError]);

  const handleSave = useCallback(async () => {
    try {
      await updateConfig.mutateAsync({
        allowedTypes,
        maxSizeMb,
        autoApproveCron,
        geminiApiKeys,
        cerebrasApiKey,
        activeLlmProvider,
      });
      toast.success("Đã cập nhật cấu hình hệ thống");
    } catch {
      toast.error("Không thể cập nhật cấu hình");
    }
  }, [
    allowedTypes,
    maxSizeMb,
    autoApproveCron,
    geminiApiKeys,
    cerebrasApiKey,
    activeLlmProvider,
    updateConfig,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <MaterialIcon
          name="progress_activity"
          className="animate-spin text-2xl text-on-surface-variant"
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-normal text-on-surface">
          Cấu hình hệ thống
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Quản lý cấu hình upload và tự động duyệt tài liệu.
        </p>
      </div>

      <AdminCard className="p-6">
        <h2 className="mb-1 text-xl font-semibold text-on-surface">
          Cấu hình Upload
        </h2>
        <p className="mb-6 text-sm text-on-surface-variant">
          Các thay đổi sẽ áp dụng ngay cho tất cả người dùng.
        </p>

        <div className="flex flex-col gap-6">
          <InputField
            label="Định dạng cho phép"
            value={allowedTypes}
            onChange={(e) => setAllowedTypes(e.target.value)}
            placeholder="pdf,docx,txt,md"
            helperText="Phân cách bằng dấu phẩy. Ví dụ: pdf,docx,txt,md"
          />

          <InputField
            label="Dung lượng tối đa (MB)"
            type="number"
            min={1}
            max={100}
            value={maxSizeMb}
            onChange={(e) => setMaxSizeMb(Number(e.target.value) || 1)}
            helperText="Tối thiểu 1 MB, tối đa 100 MB"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </AdminCard>

      <AdminCard className="mt-6 p-6">
        <h2 className="mb-1 text-xl font-semibold text-on-surface">
          Tự động duyệt AI
        </h2>
        <p className="mb-6 text-sm text-on-surface-variant">
          Cronjob quét tài liệu Auto-Approved và ingest tự động. Cần restart
          backend sau khi thay đổi.
        </p>

        <div className="flex flex-col gap-6">
          <InputField
            label="Cron Expression"
            value={autoApproveCron}
            onChange={(e) => setAutoApproveCron(e.target.value)}
            placeholder="0 * * * * *"
            helperText={[
              "Mặc định: 0 * * * * * (mỗi phút).",
              "Ví dụ: 0 */5 * * * * (mỗi 5 phút), 0 0 * * * * (mỗi giờ).",
            ].join(" ")}
          />
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </AdminCard>

      <AdminCard className="mt-6 p-6">
        <h2 className="mb-1 text-xl font-semibold text-on-surface">
          Cấu hình AI
        </h2>
        <p className="mb-6 text-sm text-on-surface-variant">
          Quản lý API keys và model AI đang sử dụng.
        </p>

        <div className="flex flex-col gap-6">
          <InputField
            label="Gemini API Keys"
            value={geminiApiKeys}
            onChange={(e) => setGeminiApiKeys(e.target.value)}
            placeholder="AIzaSy..., AIzaSy..."
            helperText="Phân cách bằng dấu phẩy để tự động xoay vòng khi hết quota."
          />

          <InputField
            label="Cerebras API Key"
            value={cerebrasApiKey}
            onChange={(e) => setCerebrasApiKey(e.target.value)}
            placeholder="csk-..."
            helperText="API Key cho Cerebras (model siêu tốc độ)."
            type="password"
          />

          <SelectField
            label="Model AI Mặc định"
            value={activeLlmProvider}
            onChange={setActiveLlmProvider}
            options={[
              { label: "Cerebras (Nhanh nhất)", value: "CEREBRAS" },
              { label: "Groq (Nhanh nhì)", value: "GROQ" },
              { label: "OpenRouter (Fallback)", value: "OPENROUTER" },
            ]}
          />
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </AdminCard>
    </div>
  );
}
