"use client";

import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { toast } from "sonner";
import { Spinner } from "../ui/Spinner";
import { Skeleton } from "../ui/Skeleton";
import { Tooltip } from "../ui/Tooltip";
import { useModalState } from "@/hooks";
import { styleGuideLabels } from "@/data/mockData";
import type { FC } from "react";

export interface FeedbackSectionProps {
  readonly title: string;
}

export const FeedbackSection: FC<FeedbackSectionProps> = ({ title }) => {
  const modal = useModalState({ initialOpen: true });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="p-6 relative overflow-hidden h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 bg-inverse-surface/20 backdrop-blur-sm" />
        <Modal
          open={modal.isOpen}
          title={styleGuideLabels.feedback.modalTitle}
          description={styleGuideLabels.feedback.modalDescription}
          onCancel={modal.close}
          onConfirm={modal.close}
          cancelLabel={styleGuideLabels.feedback.modalCancel}
          confirmLabel={styleGuideLabels.feedback.modalConfirm}
        />
      </Card>

      <div className="flex flex-col gap-8">
        <Card className="p-6 flex items-center justify-center h-[140px] relative">
          <h3 className="font-headline-md text-headline-md absolute top-4 left-6">
            {styleGuideLabels.feedback.toastTitle}
          </h3>
          <Button
            onClick={() =>
              toast.success(styleGuideLabels.feedback.toastMessage)
            }
          >
            Hiển thị Toast
          </Button>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 flex flex-col items-center justify-center gap-6">
            <h3 className="font-headline-md text-headline-md self-start w-full">
              {styleGuideLabels.feedback.loadingTitle}
            </h3>
            <div className="flex items-center gap-4 w-full">
              <Spinner size="md" />
              <div className="flex-1">
                <Skeleton lines={2} />
              </div>
            </div>
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center">
            <h3 className="font-headline-md text-headline-md self-start w-full mb-6">
              {styleGuideLabels.feedback.tooltipTitle}
            </h3>
            <Tooltip text={styleGuideLabels.feedback.tooltipText}>
              <span className="material-symbols-outlined text-on-surface-variant cursor-help">
                info
              </span>
            </Tooltip>
          </Card>
        </div>
      </div>
    </div>
  );
};
