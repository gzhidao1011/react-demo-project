---
name: data-export
description: Implement data export functionality including CSV, Excel, PDF export, and print functionality. Use when implementing export features or generating reports.
---

# Data Export

Implement data export functionality for CSV, Excel, PDF, and print.

## Quick Checklist

When implementing export:

- [ ] **Export format** selected (CSV, Excel, PDF)
- [ ] **Data transformation** implemented
- [ ] **File download** configured
- [ ] **Error handling** added
- [ ] **Loading state** shown
- [ ] **Print functionality** (if needed)

## CSV Export

### 1. CSV Export Utility

```typescript
// packages/utils/src/export.ts
export interface CSVExportOptions {
  filename?: string;
  headers?: string[];
  delimiter?: string;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: CSVExportOptions = {}
): void {
  const {
    filename = "export.csv",
    headers,
    delimiter = ",",
  } = options;

  // Generate headers
  const csvHeaders =
    headers ||
    (data.length > 0 ? Object.keys(data[0]) : []);

  // Generate CSV rows
  const rows = data.map((item) =>
    csvHeaders
      .map((header) => {
        const value = item[header];
        // Handle values with commas or quotes
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(delimiter) || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(delimiter)
  );

  // Combine headers and rows
  const csvContent = [csvHeaders.join(delimiter), ...rows].join("\n");

  // Add BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### 2. Usage

```tsx
import { exportToCSV } from "@repo/utils";

export function UserList({ users }: { users: User[] }) {
  const handleExport = () => {
    exportToCSV(users, {
      filename: `users-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["id", "name", "email", "role"],
    });
  };

  return (
    <div>
      <button onClick={handleExport}>导出 CSV</button>
      {/* ... */}
    </div>
  );
}
```

## Excel Export

### 1. Install xlsx

```bash
pnpm add xlsx
```

### 2. Excel Export Utility

```typescript
// packages/utils/src/export.ts
import * as XLSX from "xlsx";

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  headers?: string[];
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExcelExportOptions = {}
): void {
  const {
    filename = "export.xlsx",
    sheetName = "Sheet1",
    headers,
  } = options;

  // Prepare data
  const worksheetData = headers
    ? data.map((item) =>
        headers.reduce((acc, header) => {
          acc[header] = item[header];
          return acc;
        }, {} as Record<string, unknown>)
      )
    : data;

  // Create workbook
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Download
  XLSX.writeFile(workbook, filename);
}
```

### 3. Usage

```tsx
import { exportToExcel } from "@repo/utils";

export function ProductList({ products }: { products: Product[] }) {
  const handleExport = () => {
    exportToExcel(products, {
      filename: `products-${Date.now()}.xlsx`,
      sheetName: "Products",
      headers: ["id", "name", "price", "category"],
    });
  };

  return <button onClick={handleExport}>导出 Excel</button>;
}
```

## PDF Export

### 1. Install jsPDF

```bash
pnpm add jspdf jspdf-autotable
```

### 2. PDF Export Utility

```typescript
// packages/utils/src/export.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFExportOptions {
  filename?: string;
  title?: string;
  headers?: string[];
  columnWidths?: number[];
}

export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  options: PDFExportOptions = {}
): void {
  const {
    filename = "export.pdf",
    title = "Export",
    headers,
    columnWidths,
  } = options;

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 22);

  // Prepare table data
  const tableHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);
  const tableData = data.map((item) =>
    tableHeaders.map((header) => String(item[header] || ""))
  );

  // Generate table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 30,
    columnStyles: columnWidths
      ? tableHeaders.reduce((acc, _, index) => {
          acc[index] = { cellWidth: columnWidths[index] };
          return acc;
        }, {} as Record<number, { cellWidth: number }>)
      : undefined,
  });

  // Download
  doc.save(filename);
}
```

### 3. Usage

```tsx
import { exportToPDF } from "@repo/utils";

export function ReportView({ reportData }: { reportData: ReportItem[] }) {
  const handleExport = () => {
    exportToPDF(reportData, {
      filename: `report-${new Date().toISOString().split("T")[0]}.pdf`,
      title: "月度报告",
      headers: ["日期", "收入", "支出", "利润"],
    });
  };

  return <button onClick={handleExport}>导出 PDF</button>;
}
```

## Print Functionality

### 1. Print Hook

```tsx
// packages/hooks/src/usePrint.ts
import { useCallback } from "react";

export function usePrint() {
  const print = useCallback(() => {
    window.print();
  }, []);

  const printElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            body { font-family: Arial, sans-serif; }
            @media print {
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, []);

  return { print, printElement };
}
```

### 2. Usage

```tsx
import { usePrint } from "@repo/hooks";

export function InvoiceView({ invoice }: { invoice: Invoice }) {
  const { print } = usePrint();

  return (
    <div>
      <button onClick={print}>打印</button>
      <div id="invoice-content">
        {/* Invoice content */}
      </div>
    </div>
  );
}
```

## Export Hook

### 1. Combined Export Hook

```tsx
// packages/hooks/src/useExport.ts
import { useState, useCallback } from "react";
import { exportToCSV, exportToExcel, exportToPDF } from "@repo/utils";

type ExportFormat = "csv" | "excel" | "pdf";

export function useExport<T extends Record<string, unknown>>(
  data: T[],
  options: {
    filename?: string;
    headers?: string[];
  } = {}
) {
  const [exporting, setExporting] = useState(false);

  const exportData = useCallback(
    async (format: ExportFormat) => {
      try {
        setExporting(true);

        switch (format) {
          case "csv":
            exportToCSV(data, options);
            break;
          case "excel":
            exportToExcel(data, options);
            break;
          case "pdf":
            exportToPDF(data, options);
            break;
        }
      } catch (error) {
        console.error("Export failed:", error);
        throw error;
      } finally {
        setExporting(false);
      }
    },
    [data, options]
  );

  return {
    exportData,
    exporting,
  };
}
```

### 2. Usage

```tsx
import { useExport } from "@repo/hooks";

export function DataTable({ data }: { data: DataItem[] }) {
  const { exportData, exporting } = useExport(data, {
    filename: "data-export",
    headers: ["id", "name", "value"],
  });

  return (
    <div>
      <button onClick={() => exportData("csv")} disabled={exporting}>
        {exporting ? "导出中..." : "导出 CSV"}
      </button>
      <button onClick={() => exportData("excel")} disabled={exporting}>
        导出 Excel
      </button>
      <button onClick={() => exportData("pdf")} disabled={exporting}>
        导出 PDF
      </button>
    </div>
  );
}
```

## Best Practices

### ✅ Good Practices

- Provide multiple export formats
- Show loading state during export
- Handle large datasets efficiently
- Format data before export
- Use appropriate file names
- Handle errors gracefully
- Support print functionality

### ❌ Anti-Patterns

- Don't export without user confirmation (for large datasets)
- Don't skip error handling
- Don't export raw data without formatting
- Don't forget loading states
- Don't use generic file names

## Related Rules

- API Development: `.cursor/skills/api-development/SKILL.md`
- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
