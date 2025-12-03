import { useState, useEffect, useRef } from 'react';
import moment from 'moment-jalaali';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// Set Jalaali mode
moment.loadPersian({usePersianDigits: false});

const PersianDatePicker = ({ value, onChange, placeholder = "انتخاب تاریخ", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentDate, setCurrentDate] = useState(moment());
  const dropdownRef = useRef(null);

  // Persian month names
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  // Persian day names
  const persianDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  useEffect(() => {
    if (value) {
      const persianDate = moment(value).format('jYYYY/jMM/jDD');
      setDisplayValue(persianDate);
      setCurrentDate(moment(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleTouchOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, []);

  const handleDateSelect = (day, e) => {
    e.preventDefault();
    e.stopPropagation();
    const selectedDate = currentDate.clone().jDate(day);
    const gregorianDate = selectedDate.format('YYYY-MM-DD');
    
    onChange(gregorianDate);
    setDisplayValue(selectedDate.format('jYYYY/jMM/jDD'));
    setIsOpen(false);
  };

  const goToPreviousMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(currentDate.clone().subtract(1, 'jMonth'));
  };

  const goToNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(currentDate.clone().add(1, 'jMonth'));
  };

  const renderCalendar = () => {
    const startOfMonth = currentDate.clone().startOf('jMonth');
    const endOfMonth = currentDate.clone().endOf('jMonth');
    const startOfWeek = startOfMonth.clone().startOf('week');
    const endOfWeek = endOfMonth.clone().endOf('week');

    const days = [];
    let current = startOfWeek.clone();

    // Add empty cells for days before month start
    while (current.isBefore(startOfMonth)) {
      days.push(<div key={current.format()} className="p-2"></div>);
      current.add(1, 'day');
    }

    // Add days of the month
    while (current.isSameOrBefore(endOfMonth)) {
      const day = current.jDate();
      const isToday = current.isSame(moment(), 'day');
      const isSelected = value && current.isSame(moment(value), 'day');
      
      days.push(
        <button
          key={current.format()}
          onClick={(e) => handleDateSelect(day, e)}
          className={`
            p-2 text-sm rounded-lg hover:bg-blue-100 transition-colors touch-manipulation select-none min-h-[40px] min-w-[40px] flex items-center justify-center
            ${isToday ? 'bg-blue-50 border border-blue-200' : ''}
            ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
          `}
          type="button"
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        >
          {day}
        </button>
      );
      current.add(1, 'day');
    }

    return days;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className={`relative ${className}`}>
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
        />
        <Calendar 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" 
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[300px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation select-none"
              type="button"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <div className="text-center flex-1">
              <div className="font-semibold text-gray-900 select-none">
                {persianMonths[currentDate.jMonth()]} {currentDate.jYear()}
              </div>
            </div>
            
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation select-none"
              type="button"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {persianDays.map((day) => (
              <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          {/* Today button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const today = moment();
                const todayGregorian = today.format('YYYY-MM-DD');
                onChange(todayGregorian);
                setDisplayValue(today.format('jYYYY/jMM/jDD'));
                setCurrentDate(today);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              type="button"
            >
              امروز ({moment().format('jYYYY/jMM/jDD')})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersianDatePicker; 