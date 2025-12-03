import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ResponsiveTable = ({ 
  columns, 
  data, 
  loading, 
  emptyMessage = 'داده‌ای یافت نشد',
  emptyIcon: EmptyIcon,
  onRowClick,
  className = '',
  mobileBreakpoint = 'lg' // lg, md, sm
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpansion = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const breakpointClasses = {
    sm: 'sm:table',
    md: 'md:table', 
    lg: 'lg:table'
  };

  const hiddenClass = breakpointClasses[mobileBreakpoint] || 'lg:table';

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 ml-3"></div>
          <span className="text-gray-500">در حال بارگیری...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          {EmptyIcon && <EmptyIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />}
          <p className="text-lg font-medium text-gray-900 mb-2">داده‌ای یافت نشد</p>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Primary columns (shown on mobile)
  const primaryColumns = columns.filter(col => col.primary);
  // Secondary columns (hidden on mobile)
  const secondaryColumns = columns.filter(col => !col.primary);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Desktop Table */}
      <div className={`hidden ${hiddenClass} overflow-x-auto`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 ${column.cellClassName || ''}`}
                  >
                    {column.render ? column.render(row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={`${hiddenClass.replace('table', 'hidden')} space-y-4 p-4`}>
        {data.map((row, rowIndex) => {
          const isExpanded = expandedRows.has(row.id || rowIndex);
          
          return (
            <div
              key={row.id || rowIndex}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Primary info - always visible */}
              <div
                className={`p-4 ${onRowClick ? 'cursor-pointer' : ''} ${
                  secondaryColumns.length > 0 ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (onRowClick) {
                    onRowClick(row);
                  } else if (secondaryColumns.length > 0) {
                    toggleRowExpansion(row.id || rowIndex);
                  }
                }}
              >
                <div className="space-y-2">
                  {primaryColumns.map((column, colIndex) => (
                    <div key={colIndex} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        {column.header}:
                      </span>
                      <div className="text-sm text-gray-900">
                        {column.render ? column.render(row, rowIndex) : row[column.key]}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Expand/Collapse button */}
                {secondaryColumns.length > 0 && !onRowClick && (
                  <div className="flex justify-center mt-3 pt-3 border-t border-gray-100">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Secondary info - expandable */}
              {isExpanded && secondaryColumns.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                  <div className="space-y-2 pt-3">
                    {secondaryColumns.map((column, colIndex) => (
                      <div key={colIndex} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          {column.header}:
                        </span>
                        <div className="text-sm text-gray-900">
                          {column.render ? column.render(row, rowIndex) : row[column.key]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResponsiveTable; 