import React from "react";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  hover?: boolean;
  alternating?: boolean;
  index?: number;
  className?: string;
}

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  header?: boolean;
  className?: string;
}


interface TableContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className = "" }) => {
  return (
    <table
      className={`w-full border-collapse text-sm text-[#776B5D] focus:outline-none ${className}`}
    >
      {children}
    </table>
  );
};

const TableContainer: React.FC<TableContainerProps> = ({
  children,
  scrollable = false,
  className = "",
}) => {
  const scrollableClasses = scrollable ? "flex-1 flex flex-col" : "";
  const scrollbarClasses = scrollable ? "custom-scrollbar" : "";

  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden ${scrollableClasses} ${className}`}
    >
      <div
        className={`overflow-x-auto ${
          scrollable ? "flex-1 overflow-y-auto" : ""
        } ${scrollbarClasses}`}
      >
        {children}
      </div>
    </div>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  sticky = false,
  className = "",
}) => {
  const stickyClasses = sticky ? "sticky top-0 z-10" : "";
  return (
    <thead
      className={`bg-[#F3EEEA] border-b-2 border-[#B0A695] focus:outline-none ${stickyClasses} ${className}`}
    >
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className = "" }) => {
  return <tbody className={className}>{children}</tbody>;
};

const TableRow: React.FC<TableRowProps> = ({
  children,
  hover = true,
  alternating = false,
  index = 0,
  className = "",
}) => {
  const hoverClasses = hover ? "hover:bg-[#F3EEEA]/50" : "";
  const alternatingClasses =
    alternating && index % 2 === 1 ? "bg-[#F9F7F6]" : "bg-white";
  const borderClasses = "border-b border-[#B0A695]/20";

  return (
    <tr
      className={`${borderClasses} ${hoverClasses} ${alternatingClasses} ${className}`}
    >
      {children}
    </tr>
  );
};

const TableCell: React.FC<TableCellProps> = ({
  children,
  header = false,
  className = "",
}) => {
  const paddingClasses = "px-6 py-4";
  const textClasses = header
    ? "text-left font-semibold text-[#776B5D]"
    : "text-[#776B5D]";

  if (header) {
    return (
      <th
        className={`${paddingClasses} ${textClasses} focus:outline-none ${className}`}
      >
        {children}
      </th>
    );
  }

  return (
    <td
      className={`${paddingClasses} ${textClasses} focus:outline-none ${className}`}
    >
      {children}
    </td>
  );
};

export { Table, TableContainer, TableHeader, TableBody, TableRow, TableCell };
