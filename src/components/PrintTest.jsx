import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const PrintTest = () => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'تست-چاپ',
  });

  return (
    <div dir="rtl" className="p-8">
      <button 
        onClick={handlePrint}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded no-print"
      >
        چاپ تست
      </button>
      
      <div ref={componentRef} className="bg-white p-8 border">
        <h1 className="text-2xl font-bold mb-4">تست چاپ فاکتور</h1>
        <p className="mb-4">این یک تست ساده برای چاپ است.</p>
        
        <table className="w-full border-collapse border border-gray-400 mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2">ردیف</th>
              <th className="border border-gray-400 p-2">نام</th>
              <th className="border border-gray-400 p-2">قیمت</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2">1</td>
              <td className="border border-gray-400 p-2">محصول تست</td>
              <td className="border border-gray-400 p-2">1000 تومان</td>
            </tr>
          </tbody>
        </table>
        
        <p className="text-sm text-gray-600">
          تاریخ: {new Date().toLocaleDateString('fa-IR')}
        </p>
      </div>
      
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          table {
            border-collapse: collapse !important;
          }
          
          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
          }
          
          th {
            background-color: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintTest; 