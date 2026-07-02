import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { cn } from "@/lib/utils";
import { useSaveEditedSheetDataMutation } from "@/redux/api/sheet/sheetApi";
import {
  selectActiveChatId,
  selectActiveSavePoint,
  selectSheet,
  selectSheetStatus,
  setSheetData,
  setSheetStatus,
  switchToGeneration,
  switchToSavePoint,
} from "@/redux/slices/sheetSlice";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Download,
  Edit,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Share,
  Table,
} from "lucide-react";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { DataGrid } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from "xlsx";
import ShareSheetModal from "../share/ShareSheetModal";
import SavePointsDropdown from "./SavePointsDropDown";

// Editable Cell Component
const EditableCell = ({
  value,
  onValueChange,
  row,
  column,
  isEditing,
  onEdit,
}) => {
  const [editValue, setEditValue] = useState(value || "");
  const [isLocalEditing, setIsLocalEditing] = useState(false);
  const isMobile = useIsMobile();

  const handleSave = () => {
    onValueChange(row, column, editValue);
    setIsLocalEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsLocalEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleDoubleClick = () => {
    setIsLocalEditing(true);
    setEditValue(value || "");
  };

  const enterEditMode = () => {
    setIsLocalEditing(true);
    setEditValue(value || "");
  };

  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  if (isLocalEditing || isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="border-primary h-8 w-full px-2 text-sm"
      />
    );
  }

  return (
    <div
      className="hover:bg-accent flex h-full w-full cursor-pointer items-center px-2 py-1"
      onDoubleClick={handleDoubleClick}
      onClick={isMobile ? enterEditMode : undefined}
    >
      <p className="w-full overflow-hidden text-sm text-ellipsis whitespace-nowrap">
        {value || "—"}
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 h-6 w-6 opacity-0 transition-opacity hover:opacity-100"
        onClick={enterEditMode}
      >
        <Edit className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

const EditModeHelpButton = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const button = (
    <Button
      variant="outline"
      size="sm"
      className="rounded-lg border-2 px-4 py-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={(e) => {
        // Desktop: let Radix handle hover/focus normally
        if (!isMobile) return;

        // Mobile: toggle tooltip on tap
        e.preventDefault();
        setOpen((prev) => !prev);
      }}
    >
      <Edit className="mr-2 h-4 w-4" />
      Edit Mode
    </Button>
  );

  // Mobile: controlled tooltip (tap to open/close)
  if (isMobile) {
    return (
      <TooltipProvider>
        <Tooltip open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Toggle edit mode - Double-click cells to edit</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Desktop: default hover/focus tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Toggle edit mode - Double-click cells to edit</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Status indicator component
const StatusChip = ({ status, title, rowCount = 0 }) => {
  const getStatusProps = () => {
    switch (status) {
      case "generating":
        return {
          variant: "secondary",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: "Generating",
        };
      case "completed":
        return {
          variant: "default",
          icon: <CheckCircle className="h-4 w-4" />,
          label: `Complete (${rowCount} rows)`,
        };
      case "error":
        return {
          variant: "destructive",
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Error",
        };
      case "cancelled":
        return {
          variant: "outline",
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Cancelled",
        };
      default:
        return {
          variant: "outline",
          icon: <Play className="h-4 w-4" />,
          label: "Ready",
        };
    }
  };

  const statusProps = getStatusProps();

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={statusProps.variant}
        className="flex items-center gap-1 font-medium"
      >
        {statusProps.icon}
        {statusProps.label}
      </Badge>
      {title && (
        <p className="text-muted-foreground max-w-[300px] overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          {title}
        </p>
      )}
    </div>
  );
};

// Custom Row Component with proper styling
const CustomRow = forwardRef(function CustomRow(props, ref) {
  const {
    className,
    row,
    viewportColumns,
    selectedCellIdx,
    isRowSelected,
    onRowClick,
    style,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      className={cn(
        className,
        isRowSelected && "rdg-row-selected",
        "relative",
        isRowSelected && "bg-primary/5 ring-primary ring-2 ring-inset",
      )}
      style={style}
      onClick={onRowClick}
      {...rest}
    >
      {/* Render cells */}
      {viewportColumns.map((column, cellIdx) => {
        const { key, renderCell } = column;
        const value = row[key];

        return (
          <div
            key={key}
            className={cn(
              "rdg-cell relative",
              cellIdx === selectedCellIdx && "rdg-cell-selected",
            )}
            style={{
              gridColumnStart: cellIdx + 1,
            }}
          >
            {renderCell ? renderCell({ row, column }) : value}
          </div>
        );
      })}

      {/* Action button overlay for selected rows */}
      {isRowSelected && (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            alert(`Action clicked for row ${row.id}`);
          }}
          className="pointer-events-auto absolute top-1/2 right-2 z-[1001] -translate-y-1/2 px-2 py-1 text-xs shadow-md"
        >
          Action
        </Button>
      )}
    </div>
  );
});

// Data processing utilities
const processSheetData = (sheetData, onCellValueChange, editingCell) => {
  if (!sheetData || !Array.isArray(sheetData)) {
    return { columns: [], rows: [] };
  }

  if (sheetData.length === 0) {
    return { columns: [], rows: [] };
  }

  // Get all possible keys from the data
  const allKeys = new Set();
  sheetData.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key !== "id") {
        allKeys.add(key);
      }
    });
  });

  const headers = Array.from(allKeys);

  // Create columns without drag handle
  const columns = headers.map((header) => ({
    key: header,
    name: header.charAt(0).toUpperCase() + header.slice(1).replace(/_/g, " "),
    width: Math.max(250, Math.min(350, header.length * 15)),
    resizable: true,
    sortable: true,
    renderCell: (params) => {
      const value = params.row[header];
      const cellKey = `${params.row.id}-${header}`;
      const isEditing = editingCell === cellKey;

      return (
        <EditableCell
          value={value}
          onValueChange={onCellValueChange}
          row={params.row}
          column={header}
          isEditing={isEditing}
        />
      );
    },
  }));

  // Process rows with proper IDs - ensure IDs match the original data
  const rows = sheetData.map((row, index) => {
    // Preserve the original row structure and ensure ID consistency
    return {
      ...row,
      id: row.id !== undefined ? row.id : `row-${index}`,
      _index: index, // Add index for easier row finding
    };
  });

  return { columns, rows };
};

export default function SheetDataArea() {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // REDUX
  const activeChatId = useSelector(selectActiveChatId);
  const sheetState = useSelector((state) => selectSheet(state, activeChatId));
  const sheetStatus = useSelector((state) =>
    selectSheetStatus(state, activeChatId),
  );
  const currentSavePoint = useSelector(selectActiveSavePoint);


  const dispatch = useDispatch();

  // API mutation for saving edited sheet data
  const [saveEditedSheetData, { isLoading: isSavingData }] =
    useSaveEditedSheetDataMutation();

  // Handle cell value changes
  const handleCellValueChange = useCallback(
    async (rowObj, column, newValue) => {
      // Try multiple approaches to find the row
      let rowIndex = -1;

      // First try: Find by ID
      rowIndex = sheetState.sheet.findIndex((r) => r.id === rowObj.id);

      // Second try: Find by matching all properties (fallback)
      if (rowIndex === -1) {
        rowIndex = sheetState.sheet.findIndex((r) => {
          // Compare all properties except the one being edited
          const keys = Object.keys(r).filter((key) => key !== column);
          return keys.every((key) => r[key] === rowObj[key]);
        });
      }

      // Third try: Find by position if we have an index in the rowObj
      if (rowIndex === -1 && rowObj._index !== undefined) {
        rowIndex = rowObj._index;
      }

      if (rowIndex === -1) {
        console.error("Row not found in sheet data");
        return;
      }

      const oldValue = sheetState.sheet[rowIndex]?.[column];

      const updatedRows = sheetState.sheet.map((r, index) => {
        if (index === rowIndex) {
          return { ...r, [column]: newValue };
        }
        return r;
      });

      // Update Redux store immediately for UI responsiveness
      dispatch(setSheetData({ chatId: activeChatId, sheet: updatedRows }));
      setEditingCell(null);

      // Save to API in the background (optional - UI updates immediately)
      try {
        const currentSavePoint = sheetState.savePoints?.find(
          (sp) => sp.id === sheetState.activeSavePointId,
        );
        if (currentSavePoint && currentSavePoint.generations?.length > 0) {
          const activeGeneration = currentSavePoint.generations.find(
            (g) => g.id === currentSavePoint.activeGenerationId,
          );
          const conversationId = currentSavePoint.id.replace("savepoint-", "");
          const chatId = activeChatId;

          if (conversationId && chatId) {
            // Get column order from the current sheet data
            const columnOrder = Object.keys(sheetState.sheet[0] || {});

            await saveEditedSheetData({
              chatId,
              conversationId,
              sheetData: updatedRows,
              columnOrder,
              rowOrder: updatedRows.map((row) => row.id),
              metadata: {
                ...activeGeneration?.metadata,
                lastEdited: new Date().toISOString(),
                editedBy: "user",
                editType: "cell_edit",
                editedCell: { row: rowIndex, column, oldValue, newValue },
              },
              timestamp: new Date().toISOString(),
            }).unwrap();

          }
        }
      } catch (error) {
        console.warn(
          "API endpoint not available yet - changes saved locally only:",
          error,
        );
        // The UI has already been updated, so the user experience is not affected
        // This is just a warning that the backend API endpoint needs to be implemented
      }
    },
    [
      sheetState.sheet,
      sheetState.savePoints,
      sheetState.activeSavePointId,
      dispatch,
      saveEditedSheetData,
    ],
  );

  // Removed reorder functions - no longer needed

  // Process sheet data for DataGrid
  const { columns, rows } = useMemo(() => {
    return processSheetData(
      sheetState.sheet,
      handleCellValueChange,
      editingCell,
    );
  }, [sheetState.sheet, handleCellValueChange, editingCell]);

  // Check if we have data
  const hasData = rows.length > 0 && columns.length > 0;

  // Prepare data for export (common function)
  const prepareExportData = () => {
    if (!hasData) return null;

    // Create headers
    const headers = columns.map((col) => col.name);

    // Create data rows
    const dataRows = rows.map((row) =>
      columns.map((col) => {
        const value = row[col.key];

        // Handle null/undefined values
        if (value === null || value === undefined) return "";

        // Handle different data types
        if (typeof value === "number" || typeof value === "boolean") {
          return value;
        }

        return String(value);
      }),
    );

    return { headers, dataRows };
  };

  // Handle CSV export
  const handleCSVExport = () => {
    const exportData = prepareExportData();
    if (!exportData) return;

    try {
      const { headers, dataRows } = exportData;

      // Create CSV headers
      const csvHeaders = headers.map((header) => `"${header}"`).join(",");

      // Create CSV rows
      const csvRows = dataRows.map((row) =>
        row
          .map((value) => {
            if (typeof value === "string") {
              // Escape quotes and wrap in quotes
              return `"${value.replace(/"/g, '""')}"`;
            }
            return `"${value}"`;
          })
          .join(","),
      );

      const csvContent = [csvHeaders, ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      downloadFile(blob, "csv");
    } catch (error) {
      console.error("CSV export failed:", error);
    }
  };

  // Handle XLS export
  const handleXLSExport = () => {
    const exportData = prepareExportData();
    if (!exportData) return;

    try {
      const { headers, dataRows } = exportData;

      // Create worksheet data with headers
      const wsData = [headers, ...dataRows];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths based on content
      const colWidths = headers.map((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...dataRows.map((row) => String(row[index] || "").length),
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      ws["!cols"] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet Data");

      // Generate Excel file and download
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadFile(blob, "xlsx");
    } catch (error) {
      console.error("XLS export failed:", error);
    }
  };

  // Common download function
  const downloadFile = (blob, extension) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sheet-data-${
      new Date().toISOString().split("T")[0]
    }.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle export menu
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportOption = (type) => {
    handleExportMenuClose();
    if (type === "csv") {
      handleCSVExport();
    } else if (type === "xlsx") {
      handleXLSExport();
    }
  };

  // Handle View in New Window
  const handleViewInNewWindow = () => {
    if (!hasData) return;

    // Get current sheet data
    const exportData = prepareExportData();
    if (!exportData) return;

    // Create HTML content for the new window
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <title>Generated Sheet - ${currentSavePoint?.title || "Sheet Data"}</title>
        <style>
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0.75rem;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.5;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #1976d2, #1565c0);
            color: white;
            padding: 1rem;
            text-align: center;
          }
          
          .header h1 {
            margin: 0;
            font-size: clamp(1.125rem, 4vw, 1.5rem);
            font-weight: 600;
            word-wrap: break-word;
            hyphens: auto;
          }
          
          .header p {
            margin: 0.5rem 0 0 0;
            opacity: 0.9;
            font-size: clamp(0.75rem, 2.5vw, 0.875rem);
          }
          
          .content {
            padding: 0.75rem;
          }
          
          .metadata {
            background: #f5f5f5;
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: clamp(0.75rem, 2.5vw, 0.875rem);
            color: #666;
          }
          
          .metadata-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.375rem;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          
          .metadata-item:last-child {
            margin-bottom: 0;
          }
          
          .metadata-label {
            font-weight: 600;
            color: #333;
            flex-shrink: 0;
          }
          
          .table-wrapper {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin-top: 1rem;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          table {
            width: 100%;
            min-width: 600px;
            border-collapse: collapse;
            background: white;
          }
          
          th {
            background: #f8f9fa;
            padding: 0.625rem 0.75rem;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e9ecef;
            font-size: clamp(0.75rem, 2.5vw, 0.875rem);
            white-space: nowrap;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          td {
            padding: 0.625rem 0.75rem;
            border-bottom: 1px solid #e9ecef;
            font-size: clamp(0.75rem, 2.5vw, 0.875rem);
            word-wrap: break-word;
            max-width: 300px;
          }
          
          tr:hover {
            background-color: #f8f9fa;
          }
          
          tr:last-child td {
            border-bottom: none;
          }
          
          .footer {
            background: #f8f9fa;
            padding: 0.875rem 1rem;
            text-align: center;
            color: #666;
            font-size: clamp(0.625rem, 2vw, 0.75rem);
            border-top: 1px solid #e9ecef;
          }
          
          .footer p {
            margin: 0;
            word-wrap: break-word;
          }
          
          /* Tablet styles */
          @media (min-width: 640px) {
            body {
              padding: 1.25rem;
            }
            
            .header {
              padding: 1.5rem;
            }
            
            .content {
              padding: 1.25rem;
            }
            
            .metadata {
              padding: 1rem;
            }
            
            th, td {
              padding: 0.75rem 1rem;
            }
          }
          
          /* Desktop styles */
          @media (min-width: 1024px) {
            body {
              padding: 1.5rem;
            }
            
            .header {
              padding: 1.75rem;
            }
            
            .content {
              padding: 1.5rem;
            }
            
            .metadata {
              padding: 1.25rem;
            }
            
            th, td {
              padding: 0.875rem 1.25rem;
            }
          }
          
          /* Print styles */
          @media print {
            body { 
              background: white;
              padding: 0;
            }
            
            .container { 
              box-shadow: none;
              max-width: 100%;
            }
            
            .table-wrapper {
              overflow: visible;
            }
            
            table {
              min-width: 100%;
            }
            
            th {
              position: static;
            }
            
            tr {
              page-break-inside: avoid;
            }
          }
          
          /* Small mobile optimization */
          @media (max-width: 480px) {
            .metadata-item {
              font-size: 0.75rem;
            }
            
            table {
              min-width: 500px;
            }
            
            th, td {
              padding: 0.5rem 0.625rem;
              font-size: 0.75rem;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${currentSavePoint?.title || "Generated Sheet Data"}</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="content">
            <div class="metadata">
              <div class="metadata-item">
                <span class="metadata-label">Total Rows:</span>
                <span>${exportData.dataRows.length}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Total Columns:</span>
                <span>${exportData.headers.length}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Generated By:</span>
                <span>Shothik AI Sheet Generator</span>
              </div>
            </div>
            
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    ${exportData.headers
                      .map((header) => `<th>${header}</th>`)
                      .join("")}
                  </tr>
                </thead>
                <tbody>
                  ${exportData.dataRows
                    .map(
                      (row) => `
                    <tr>
                      ${row.map((value) => `<td>${value || "—"}</td>`).join("")}
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="footer">
            <p>This sheet was generated by Shothik AI • View in New Window Feature</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open new window with the HTML content
    const newWindow = window.open(
      "",
      "_blank",
      "width=1200,height=800,scrollbars=yes,resizable=yes",
    );

    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();

      // Focus the new window
      newWindow.focus();

    } else {
      // Fallback if popup is blocked
      alert(
        "Please allow popups for this site to view the sheet in a new window.",
      );
    }
  };

  // Handle refresh - could trigger a re-generation
  const handleRefresh = () => {

    if (!currentSavePoint) return;

    const activeGen = currentSavePoint.generations.find(
      (g) => g.id === currentSavePoint.activeGenerationId,
    );


    if (sheetStatus === "error") {
      if (activeGen) {
        dispatch(
          switchToGeneration({
            chatId: activeChatId,
            savePointId: currentSavePoint.id,
            generationId: currentSavePoint.activeGenerationId,
          }),
        );
      } else {
        // No generation found, just mark it as idle to allow retry
        dispatch(setSheetStatus({ chatId: activeChatId, status: "idle" }));
      }
    } else {
      dispatch(
        switchToSavePoint({
          chatId: activeChatId,
          savePointId: currentSavePoint.id,
        }),
      );
    }
  };

  // Grid configuration with edit functionality
  const gridProps = useMemo(
    () => ({
      columns,
      rows,
      selectedRows,
      onSelectedRowsChange: setSelectedRows,
      enableVirtualization: rows.length > 100,
      rowHeight: 40,
      headerRowHeight: 45,
      className: "rdg-light",
      style: {
        height: "100%",
        border: "1px solid hsl(var(--border))",
        borderRadius: "4px",
        fontSize: "14px",
        backgroundColor: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      },
      rowKeyGetter: (row) => row.id,
      defaultSortColumns: [],
      onSortColumnsChange: (sortColumns) => {
      },
      // Removed reorder functionality
      enableColumnReordering: false,
      enableRowReordering: false,
      // Use proper components prop instead of renderers
      components: {
        Row: CustomRow,
      },
    }),
    [columns, rows, selectedRows],
  );

  // Render generating state
  if (sheetStatus === "generating") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold">Generating Your Sheet</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Please wait while we process your request...
        </p>
        <Progress value={undefined} className="w-full max-w-md" />
      </div>
    );
  }

  // Render error state
  if (sheetStatus === "error") {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="border-border bg-background max-w-md rounded-lg border p-8 text-center shadow-md">
          <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">Generation Failed</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Something went wrong while generating your sheet. Please try again.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Render data view
  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          {sheetState.savePoints?.length > 0 &&
            sheetState.activeSavePointId && (
              <SavePointsDropdown
                savePoints={sheetState.savePoints || []}
                activeSavePointId={sheetState.activeSavePointId}
                onSavePointChange={(savePoint) => {
                  dispatch(
                    switchToSavePoint({
                      chatId: activeChatId,
                      savePointId: savePoint.id,
                    }),
                  );
                }}
                currentSheetData={sheetState.sheet}
              />
            )}
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Mode Toggle */}
          {/* <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-2 px-4 py-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Mode
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle edit mode - Double-click cells to edit</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}

          <EditModeHelpButton />

          {/* Removed reorder button - no longer needed */}

          {/* View in New Window Button */}
          {/* <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewInNewWindow}
                  disabled={!hasData}
                  className="rounded-lg border-2 px-2 transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-4"
                >
                  <ExternalLink className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">View in New Window</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View generated sheet in new window</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}

          {/* Export Button with Dropdown */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasData}
                      className="rounded-lg border-2 px-2 transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-4"
                    >
                      <Download className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Export</span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportOption("csv")}>
                      <FileText className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Export as CSV</div>
                        <div className="text-muted-foreground text-xs">
                          Normal CSV format
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportOption("xlsx")}
                    >
                      <Table className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Export as Excel</div>
                        <div className="text-muted-foreground text-xs">
                          Microsoft Excel format
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Share Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareModalOpen(true)}
                  disabled={!hasData}
                  className="ml-2 rounded-lg border-2 px-2 transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-4"
                >
                  <Share className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share sheet data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Data Grid */}
      <div className="min-h-0 flex-1">
        {!hasData ? null : <DataGrid {...gridProps} />}
      </div>

      {/* Footer */}
      <div className="border-border mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-2">
        <span className="text-muted-foreground text-xs">
          Last updated:{" "}
          {new Date().toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </span>

        <div className="flex items-center gap-4">
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Edit className="h-3 w-3" />
            Double-click to edit cells
          </span>
          {isSavingData && (
            <span className="text-primary flex items-center gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving changes...
            </span>
          )}
        </div>
      </div>

      {/* Share Sheet Modal */}
      <ShareSheetModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        sheetId={currentSavePoint?.id || "sheet-" + Date.now()}
        sheetData={sheetState.sheet}
        chatId={
          sessionStorage.getItem("activeChatId") ||
          window.location.search.match(/id=([^&]+)/)?.[1] ||
          null
        }
      />
    </div>
  );
}
