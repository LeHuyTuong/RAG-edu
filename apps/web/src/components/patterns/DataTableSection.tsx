"use client";

import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Pagination } from "../ui/Pagination";
import { Table } from "../ui/Table";
import { usePagination } from "@/hooks";
import { statusLabelMap, tableRows, styleGuideLabels } from "@/data/mockData";
import type { FC } from "react";
import type { TableColumn } from "../ui/Table";

export interface DataTableSectionProps {
  readonly title: string;
}

export const DataTableSection: FC<DataTableSectionProps> = ({ title }) => {
  const pagination = usePagination({ totalPages: 10 });

  const columns: readonly TableColumn[] = [
    {
      key: "index",
      label: styleGuideLabels.table.columns[0] ?? "",
      sortable: true,
    },
    { key: "name", label: styleGuideLabels.table.columns[1] ?? "" },
    { key: "email", label: styleGuideLabels.table.columns[2] ?? "" },
    { key: "status", label: styleGuideLabels.table.columns[3] ?? "" },
    {
      key: "actions",
      label: styleGuideLabels.table.columns[4] ?? "",
      align: "right",
    },
  ];

  const rows = tableRows.map((row, index) => {
    const imageUrl = "avatarUrl" in row ? row.avatarUrl : undefined;
    const initials = "initials" in row ? row.initials : undefined;
    const tone = "avatarTone" in row ? row.avatarTone : undefined;

    return {
      id: row.id,
      highlighted: row.id === 2,
      cells: [
        index + 1,
        <div key={`name-${row.id}`} className="flex items-center gap-3">
          {imageUrl ? (
            <Avatar imageUrl={imageUrl} size="sm" />
          ) : (
            <Avatar
              initials={initials}
              size="sm"
              tone={tone as "secondary" | "tertiary" | undefined}
            />
          )}
          <span>{row.name}</span>
        </div>,
        <span key={`email-${row.id}`} className="text-on-surface-variant">
          {row.email}
        </span>,
        <Badge
          key={`status-${row.id}`}
          tone={row.status as "success" | "warning" | "error"}
        >
          {statusLabelMap[row.status] ?? row.status}
        </Badge>,
        <div key={`actions-${row.id}`} className="text-right">
          <button className="rounded-full p-1 text-primary hover:text-primary-container">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button className="rounded-full p-1 text-error hover:text-on-error-container">
            <span className="material-symbols-outlined text-[20px]">
              delete
            </span>
          </button>
        </div>,
      ],
    };
  });

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
      <h3 className="mb-6 font-headline-md text-headline-md">{title}</h3>
      <Table columns={columns} rows={rows} />
      <div className="mt-4 flex items-center justify-between text-sm text-on-surface-variant">
        <span>{styleGuideLabels.table.showing}</span>
        <Pagination
          currentPage={pagination.page}
          totalPages={10}
          onPageChange={pagination.goTo}
        />
      </div>
    </div>
  );
};
