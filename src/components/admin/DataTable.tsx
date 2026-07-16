"use client";

import { useMemo, useState, ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  /** Value used for sorting & searching. Defaults to row[key]. */
  accessor?: (row: T) => string | number | null | undefined;
  /** Cell renderer. Defaults to String(accessor(row)). */
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  /** Hide below breakpoint, e.g. "hidden md:table-cell" */
  responsiveClass?: string;
}

export interface DataTableFilter<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Returns true if row matches the selected filter value */
  match: (row: T, value: string) => boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** Extra filter dropdowns rendered next to search */
  filters?: DataTableFilter<T>[];
  /** Placeholder for the search box */
  searchPlaceholder?: string;
  /** Disable the built-in search box (if the page provides its own) */
  hideSearch?: boolean;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Default page size */
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  /** Default sort */
  defaultSort?: { key: string; dir: "asc" | "desc" };
  /** Empty-state message */
  emptyMessage?: string;
  /** Max height for vertical scroll (sticky header). E.g. "60vh" */
  maxHeight?: string;
  /** Extra toolbar content (right side) */
  toolbar?: ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  filters = [],
  searchPlaceholder = "Search...",
  hideSearch = false,
  onRowClick,
  defaultPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  defaultSort,
  emptyMessage = "No records found.",
  maxHeight = "65vh",
  toolbar,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSort?.dir ?? "asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const getVal = (row: T, col: DataTableColumn<T>): string | number => {
    const v = col.accessor ? col.accessor(row) : (row as any)[col.key];
    return v ?? "";
  };

  const processed = useMemo(() => {
    let out = rows;

    // filters
    for (const f of filters) {
      const val = filterValues[f.key];
      if (val && val !== "all") out = out.filter((r) => f.match(r, val));
    }

    // search across all columns
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((r) =>
        columns.some((c) => String(getVal(r, c)).toLowerCase().includes(q))
      );
    }

    // sort
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        out = [...out].sort((a, b) => {
          const av = getVal(a, col);
          const bv = getVal(b, col);
          const an = typeof av === "number" ? av : parseFloat(String(av));
          const bn = typeof bv === "number" ? bv : parseFloat(String(bv));
          let cmp: number;
          if (!isNaN(an) && !isNaN(bn) && String(av).trim() !== "" && String(bv).trim() !== "") {
            cmp = an - bn;
          } else {
            cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
          }
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, filters, filterValues, search, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = processed.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const from = processed.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min((safePage + 1) * pageSize, processed.length);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const btnCls = "border border-light-gray bg-white text-charcoal p-1.5 hover:bg-cream transition disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div>
      {/* Toolbar: search + filters + page size */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {!hideSearch && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder}
              className="w-full border border-light-gray bg-white pl-8 pr-3 py-2 text-xs text-charcoal focus:outline-none focus:border-charcoal"
            />
          </div>
        )}
        {filters.map((f) => (
          <select
            key={f.key}
            value={filterValues[f.key] || "all"}
            onChange={(e) => { setFilterValues((p) => ({ ...p, [f.key]: e.target.value })); setPage(0); }}
            className="border border-light-gray bg-white px-2.5 py-2 text-xs text-charcoal focus:outline-none focus:border-charcoal cursor-pointer"
          >
            <option value="all">{f.label}: All</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {toolbar}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            className="border border-light-gray bg-white px-2 py-2 text-xs text-charcoal focus:outline-none focus:border-charcoal cursor-pointer"
            title="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-light-gray overflow-x-auto" style={{ maxHeight, overflowY: "auto" }}>
        <table className="w-full text-sm min-w-[600px]">
          <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_#e8e6e1]">
            <tr className="border-b border-light-gray">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable === false ? undefined : () => toggleSort(col.key)}
                  className={`text-left px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium whitespace-nowrap select-none ${col.sortable === false ? "" : "cursor-pointer hover:text-charcoal"} ${col.headerClassName || ""} ${col.responsiveClass || ""}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      sortKey === col.key
                        ? sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                        : <ChevronsUpDown size={10} className="opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-xs text-warm-gray">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-light-gray/60 last:border-0 hover:bg-cream/40 transition ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className || ""} ${col.responsiveClass || ""}`}>
                      {col.render ? col.render(row) : String(getVal(row, col))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <p className="text-[10px] text-warm-gray">
          Showing {from}–{to} of {processed.length}
          {processed.length !== rows.length && ` (filtered from ${rows.length})`}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(0)} disabled={safePage === 0} className={btnCls} title="First page">
            <ChevronsLeft size={13} />
          </button>
          <button onClick={() => setPage(safePage - 1)} disabled={safePage === 0} className={btnCls} title="Previous page">
            <ChevronLeft size={13} />
          </button>
          <span className="text-[10px] text-charcoal px-2">
            Page {safePage + 1} of {totalPages}
          </span>
          <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages - 1} className={btnCls} title="Next page">
            <ChevronRight size={13} />
          </button>
          <button onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1} className={btnCls} title="Last page">
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
