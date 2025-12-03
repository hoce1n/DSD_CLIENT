import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Package, Users, ShoppingCart, X } from 'lucide-react';
import { 
  performSearch, 
  clearSearchResults, 
  addToSearchHistory,
  clearSearchHistory 
} from '../store/slices/searchSlice';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { 
    results, 
    loading, 
    searchHistory, 
    error 
  } = useSelector((state) => state.search);

  // بستن نتایج جستجو با کلیک خارج از کامپوننت
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // جستجو با تاخیر
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim().length >= 2) {
        dispatch(performSearch(query.trim()));
        setIsOpen(true);
      } else if (query.trim().length === 0) {
        dispatch(clearSearchResults());
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, dispatch]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (query.trim().length >= 2 || searchHistory.length > 0) {
      setIsOpen(true);
    }
  };

  const handleResultClick = (result) => {
    // اضافه کردن به تاریخچه جستجو
    dispatch(addToSearchHistory(query));
    
    // انتقال به صفحه مربوطه
    switch (result.type) {
      case 'customer':
        navigate(`/customers/${result.id}`);
        break;
      case 'order':
        navigate(`/orders/${result.id}`);
        break;
      case 'product':
        navigate(`/products/${result.id}`);
        break;
      default:
        break;
    }
    
    // بستن نتایج و پاک کردن ورودی
    setIsOpen(false);
    setQuery('');
    setIsFocused(false);
  };

  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    dispatch(clearSearchHistory());
  };

  const handleClearInput = () => {
    setQuery('');
    dispatch(clearSearchResults());
    inputRef.current?.focus();
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'customer':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-green-500" />;
      case 'product':
        return <Package className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const getResultTypeText = (type) => {
    switch (type) {
      case 'customer':
        return 'مشتری';
      case 'order':
        return 'سفارش';
      case 'product':
        return 'محصول';
      default:
        return '';
    }
  };

  const highlightQuery = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span> : 
        part
    );
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      {/* Input Field */}
      <div className={`relative transition-all duration-200 ${
        isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="جستجو در سیستم..."
          className="block w-full !px-10 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-0 transition-colors text-sm sm:text-base placeholder-gray-500"
        />
        {query && (
          <button
            onClick={handleClearInput}
            className="absolute inset-y-0 left-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 sm:max-h-96 overflow-hidden">
          <div className="max-h-80 sm:max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
                <span className="mr-2 text-sm text-gray-500">در حال جستجو...</span>
              </div>
            ) : query.trim().length >= 2 && results.length > 0 ? (
              <div>
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">نتایج جستجو برای "{query}"</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-right hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {highlightQuery(result.title, query)}
                            </p>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0 mr-2">
                              {getResultTypeText(result.type)}
                            </span>
                          </div>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {highlightQuery(result.description, query)}
                            </p>
                          )}
                          {result.metadata && (
                            <div className="flex items-center gap-2 mt-1">
                              {result.metadata.map((meta, metaIndex) => (
                                <span key={metaIndex} className="text-xs text-gray-400">
                                  {meta}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : query.trim().length >= 2 && results.length === 0 ? (
              <div className="px-4 py-6 sm:py-8 text-center">
                <Search className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">نتیجه‌ای یافت نشد</p>
                <p className="text-xs text-gray-400 mt-1">
                  برای "{query}" چیزی پیدا نکردیم
                </p>
              </div>
            ) : searchHistory.length > 0 ? (
              <div>
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">جستجوهای اخیر</p>
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    پاک کردن
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {searchHistory.slice(0, 5).map((historyItem, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(historyItem)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-right hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">
                          {historyItem}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 sm:py-8 text-center">
                <Search className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">شروع به تایپ کنید</p>
                <p className="text-xs text-gray-400 mt-1">
                  حداقل 2 کاراکتر وارد کنید
                </p>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="px-4 py-3 border-t border-gray-100 bg-red-50">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch; 