import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CurrencyInput } from './components/CurrencyInput';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { ICONS } from './constants';
import html2canvas from 'html2canvas';

declare const jspdf: any;

// Custom hook for debounce
function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  const callback = useRef<() => void>(undefined);
  useEffect(() => {
    callback.current = effect;
  }, [effect]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (callback.current) callback.current();
    }, delay);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

const STORAGE_KEY = 'rental_invoice_form';

const App: React.FC = () => {
  const [view, setView] = useState<'form' | 'review'>('form');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [rent, setRent] = useState<string>('');
  const [managementFee, setManagementFee] = useState<string>('');
  const [waterBill, setWaterBill] = useState<string>('');
  const [electricityBill, setElectricityBill] = useState<string>('');
  const [parkingFee, setParkingFee] = useState<string>('');

  const parseValue = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const total = useMemo(() => {
    return parseValue(rent) + parseValue(managementFee) + parseValue(waterBill) + parseValue(electricityBill) + parseValue(parkingFee);
  }, [rent, managementFee, waterBill, electricityBill, parkingFee]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleProceedToReview = () => {
    setView('review');
    window.scrollTo(0, 0);
  };
  
  const handleGoBackToForm = () => {
    setView('form');
  };

  const handleGenerateImage = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 3 });
      const link = document.createElement('a');
      link.download = 'rental-invoice.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);
    try {
        const { jsPDF } = jspdf;
        const canvas = await html2canvas(invoiceRef.current, { scale: 3 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        const imgWidth = pdfWidth - 20; // with margin
        const imgHeight = imgWidth / ratio;

        let position = 10; // top margin
        if (imgHeight > pdfHeight) {
          position = 0; // if image is too tall, no margin
        }
        
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        pdf.save('rental-invoice.pdf');
    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsGenerating(false);
    }
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (typeof data === 'object' && data) {
          if (data.rent) setRent(data.rent);
          if (data.managementFee) setManagementFee(data.managementFee);
          if (data.waterBill) setWaterBill(data.waterBill);
          if (data.electricityBill) setElectricityBill(data.electricityBill);
          if (data.parkingFee) setParkingFee(data.parkingFee);
        }
      } catch {}
    }
  }, []);

  // Debounce save to localStorage khi các trường thay đổi
  useDebouncedEffect(() => {
    const data = {
      rent,
      managementFee,
      waterBill,
      electricityBill,
      parkingFee
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [rent, managementFee, waterBill, electricityBill, parkingFee], 3000);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto lg:flex lg:gap-8">
        {/* --- FORM SECTION (Left Column on Desktop) --- */}
        <div className={`w-full lg:w-5/12 lg:max-w-md ${view === 'review' ? 'hidden' : 'block'} lg:block`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-gray-300/20 overflow-hidden sticky top-8">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Invoice Calculator</h1>
                <p className="text-gray-500 mt-2 text-sm">Enter costs to see the invoice update in real-time.</p>
              </div>

              <div className="space-y-5">
                <CurrencyInput id="rent" label="Rent" value={rent} onChange={setRent} icon={ICONS.rent} />
                <CurrencyInput id="managementFee" label="Management Fee" value={managementFee} onChange={setManagementFee} icon={ICONS.management} />
                <CurrencyInput id="waterBill" label="Water Bill" value={waterBill} onChange={setWaterBill} icon={ICONS.water} />
                <CurrencyInput id="electricityBill" label="Electricity Bill" value={electricityBill} onChange={setElectricityBill} icon={ICONS.electricity} />
                <CurrencyInput id="parkingFee" label="Parking Fee" value={parkingFee} onChange={setParkingFee} icon={ICONS.parking} />
              </div>
            </div>
            
            <div className="bg-gray-50 px-8 py-6 mt-4">
              <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-600">Total:</span>
                  <span className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</span>
              </div>

              <button
                  onClick={handleProceedToReview}
                  className="w-full mt-6 bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 shadow-lg flex items-center justify-center text-lg gap-2 lg:hidden"
              >
                  {ICONS.invoice}
                  Create Invoice
              </button>
            </div>
          </div>
        </div>

        {/* --- INVOICE REVIEW SECTION (Right Column on Desktop) --- */}
        <div className={`w-full lg:w-7/12 mt-8 lg:mt-0 ${view === 'form' ? 'hidden' : 'block'} lg:block`}>
          <div className="p-4 bg-white rounded-2xl shadow-lg">
              <div ref={invoiceRef}>
                <InvoiceTemplate 
                    rent={parseValue(rent)}
                    managementFee={parseValue(managementFee)}
                    waterBill={parseValue(waterBill)}
                    electricityBill={parseValue(electricityBill)}
                    parkingFee={parseValue(parkingFee)}
                    total={total}
                    formatCurrency={formatCurrency}
                />
              </div>
          </div>
          
          {/* Action buttons */}
          <div className="mt-8">
            {/* --- Mobile Buttons --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:hidden">
              <button
                  onClick={handleGoBackToForm}
                  className="w-full bg-white text-gray-700 font-bold py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 flex items-center justify-center text-base gap-2"
              >
                  {ICONS.back}
                  Go Back
              </button>
              <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-all duration-300 flex items-center justify-center text-base gap-2 disabled:bg-teal-300"
              >
                  {ICONS.image}
                  {isGenerating ? 'Generating...' : 'Generate Image'}
              </button>
              <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerating}
                  className="w-full bg-rose-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-300 transition-all duration-300 flex items-center justify-center text-base gap-2 disabled:bg-rose-300"
              >
                  {ICONS.pdf}
                  {isGenerating ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>

            {/* --- Desktop Buttons --- */}
            <div className="hidden lg:flex lg:justify-end lg:gap-4">
              <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="bg-teal-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-all duration-300 flex items-center justify-center text-base gap-2 disabled:bg-teal-300"
              >
                  {ICONS.image}
                  {isGenerating ? 'Generating...' : 'Generate Image'}
              </button>
              <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerating}
                  className="bg-rose-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-300 transition-all duration-300 flex items-center justify-center text-base gap-2 disabled:bg-rose-300"
              >
                  {ICONS.pdf}
                  {isGenerating ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
