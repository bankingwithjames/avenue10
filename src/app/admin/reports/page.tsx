"use client";

import {
  FileBarChart,
  DollarSign,
  CalendarCheck,
  CreditCard,
  Receipt,
  Package,
  BarChart3,
  TrendingUp,
  Star,
  Wrench,
  FileText,
  Download,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";

interface ReportCard {
  title: string;
  description: string;
  icon: LucideIcon;
}

const reports: ReportCard[] = [
  {
    title: "Monthly P&L",
    description: "Revenue, expenses, and net profit by month",
    icon: DollarSign,
  },
  {
    title: "Booking Report",
    description: "All bookings with guest, dates, and revenue",
    icon: CalendarCheck,
  },
  {
    title: "Payout Report",
    description: "Platform payouts and processing fees",
    icon: CreditCard,
  },
  {
    title: "Expense Report",
    description: "All expenses by category and vendor",
    icon: Receipt,
  },
  {
    title: "Inventory Report",
    description: "Stock levels, replacement costs, and usage",
    icon: Package,
  },
  {
    title: "Occupancy Report",
    description: "Booking rates and availability analysis",
    icon: BarChart3,
  },
  {
    title: "Revenue by Channel",
    description: "Revenue breakdown by booking source",
    icon: TrendingUp,
  },
  {
    title: "Guest Review Report",
    description: "All reviews with ratings and responses",
    icon: Star,
  },
  {
    title: "Maintenance Report",
    description: "Work orders, costs, and vendor summary",
    icon: Wrench,
  },
  {
    title: "Tax Report",
    description: "Tax-deductible expenses by category",
    icon: FileText,
  },
];

export default function ReportsPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal font-light mb-6">
        Reports
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <ReportCardItem key={report.title} report={report} />
        ))}
      </div>
    </div>
  );
}

function ReportCardItem({ report }: { report: ReportCard }) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const Icon = report.icon;

  const handleExport = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      alert("Export coming soon");
      if (selectRef.current) {
        selectRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white border border-light-gray p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon className="w-4 h-4 text-warm-gray" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-charcoal">{report.title}</h3>
          <p className="text-xs text-warm-gray mt-1">{report.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <select
          ref={selectRef}
          defaultValue=""
          onChange={handleExport}
          className="border border-light-gray text-charcoal text-xs hover:bg-cream transition px-3 py-2 bg-white appearance-none cursor-pointer pr-7 relative"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          <option value="" disabled>
            Export...
          </option>
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
        </select>

        <button
          onClick={() => alert("Report generation coming soon")}
          className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5"
        >
          Generate
        </button>
      </div>
    </div>
  );
}
