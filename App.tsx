import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CurrencyInput } from './components/CurrencyInput';
import { InvoiceTemplate } from './components/InvoiceTemplate';
import { ICONS } from './constants';
import { translations } from './translations';
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
const CONFIG_STORAGE_KEY = 'rental_invoice_config';

const App: React.FC = () => {
  const [view, setView] = useState<'form' | 'review' | 'config'>('form');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Form states
  const [rent, setRent] = useState<string>('');
  const [managementFee, setManagementFee] = useState<string>('');
  const [waterBill, setWaterBill] = useState<string>('');
  const [electricityBill, setElectricityBill] = useState<string>('');
  const [parkingFee, setParkingFee] = useState<string>('');
  const [internetFee, setInternetFee] = useState<string>('');

  // Config states
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  const [currency, setCurrency] = useState<'VND' | 'USD'>('VND');
  const [contactName, setContactName] = useState<string>('Phuong Duy Tran');
  const [contactPhone, setContactPhone] = useState<string>('0987484464');
  const [footerMessage, setFooterMessage] = useState<string>('Thank you for your prompt payment.');

  const parseValue = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const total = useMemo(() => {
    return parseValue(rent) + parseValue(managementFee) + parseValue(waterBill) + parseValue(electricityBill) + parseValue(parkingFee) + parseValue(internetFee);
  }, [rent, managementFee, waterBill, electricityBill, parkingFee, internetFee]);
  
  const formatCurrency = (value: number) => {
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    const currencyCode = currency;
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(value);
  };

  const t = translations[language];

  const handleProceedToReview = () => {
    setView('review');
    window.scrollTo(0, 0);
  };
  
  const handleGoBackToForm = () => {
    setView('form');
  };

  const handleGoToConfig = () => {
    setView('config');
  };

  const handleGoBackFromConfig = () => {
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
          if (data.internetFee) setInternetFee(data.internetFee);
        }
      } catch {}
    }

    // Load config from localStorage
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (typeof config === 'object' && config) {
          if (config.language) setLanguage(config.language);
          if (config.currency) setCurrency(config.currency);
          if (config.contactName) setContactName(config.contactName);
          if (config.contactPhone) setContactPhone(config.contactPhone);
          if (config.footerMessage) setFooterMessage(config.footerMessage);
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
      parkingFee,
      internetFee
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [rent, managementFee, waterBill, electricityBill, parkingFee, internetFee], 3000);

  // Debounce save config to localStorage
  useDebouncedEffect(() => {
    const config = {
      language,
      currency,
      contactName,
      contactPhone,
      footerMessage
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }, [language, currency, contactName, contactPhone, footerMessage], 1000);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto lg:flex lg:gap-8">
        {/* --- FORM SECTION (Left Column on Desktop) --- */}
        <div className={`w-full lg:w-5/12 lg:max-w-md ${view === 'review' ? 'hidden' : 'block'} lg:block`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-gray-300/20 overflow-hidden sticky top-8">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">{t.title}</h1>
                <p className="text-gray-500 mt-2 text-sm">{t.subtitle}</p>
              </div>

              <div className="space-y-5">
                <CurrencyInput id="rent" label={t.rent} value={rent} onChange={setRent} icon={ICONS.rent} currency={currency} />
                <CurrencyInput id="managementFee" label={t.managementFee} value={managementFee} onChange={setManagementFee} icon={ICONS.management} currency={currency} />
                <CurrencyInput id="waterBill" label={t.waterBill} value={waterBill} onChange={setWaterBill} icon={ICONS.water} currency={currency} />
                <CurrencyInput id="electricityBill" label={t.electricityBill} value={electricityBill} onChange={setElectricityBill} icon={ICONS.electricity} currency={currency} />
                <CurrencyInput id="parkingFee" label={t.parkingFee} value={parkingFee} onChange={setParkingFee} icon={ICONS.parking} currency={currency} />
                <CurrencyInput id="internetFee" label={t.internetFee} value={internetFee} onChange={setInternetFee} icon={ICONS.internet} currency={currency} />
              </div>
            </div>
            
            <div className="bg-gray-50 px-8 py-6 mt-4">
              <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-600">{t.total}</span>
                  <span className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</span>
              </div>

              <button
                  onClick={handleProceedToReview}
                  className="w-full mt-6 bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 shadow-lg flex items-center justify-center text-lg gap-2 lg:hidden"
              >
                  {ICONS.invoice}
                  {t.createInvoice}
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
                    internetFee={parseValue(internetFee)}
                    total={total}
                    formatCurrency={formatCurrency}
                    language={language}
                    contactName={contactName}
                    contactPhone={contactPhone}
                    footerMessage={footerMessage}
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
                  {t.goBack}
              </button>
              <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-all duration-300 flex items-center justify-center text-base gap-2 disabled:bg-teal-300"
              >
                  {ICONS.image}
                  {isGenerating ? t.generating : t.generateImage}
              </button>
              <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerating}
                  className="w-full bg-rose-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-300 transition-all duration-300 flex items-center justify-center text-base gap-2 disabled:bg-rose-300"
              >
                  {ICONS.pdf}
                  {isGenerating ? t.generating : t.generatePdf}
              </button>
              <button
                  onClick={handleGoToConfig}
                  className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-300 flex items-center justify-center text-base gap-2"
              >
                  {ICONS.settings}
                  {t.settings}
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
                  {isGenerating ? t.generating : t.generateImage}
              </button>
              <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerating}
                  className="bg-rose-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-300 transition-all duration-300 flex items-center justify-center text-base gap-2 disabled:bg-rose-300"
              >
                  {ICONS.pdf}
                  {isGenerating ? t.generating : t.generatePdf}
              </button>
              <button
                  onClick={handleGoToConfig}
                  className="bg-gray-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-300 flex items-center justify-center text-base gap-2"
              >
                  {ICONS.settings}
                  {t.settings}
              </button>
            </div>
          </div>
        </div>

        {/* --- CONFIG SECTION --- */}
        <div className={`w-full ${view === 'config' ? 'block' : 'hidden'}`}>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-gray-300/20 overflow-hidden">
              <div className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">{t.settingsTitle}</h1>
                  <p className="text-gray-500 mt-2 text-sm">{t.settingsSubtitle}</p>
                </div>

                <div className="space-y-6">
                  {/* Language Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">
                      {t.language}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
                      className="w-full p-3 text-lg bg-gray-50 border-2 text-gray-900 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200 outline-none"
                    >
                      <option value="en">English</option>
                      <option value="vi">Tiếng Việt</option>
                    </select>
                  </div>

                  {/* Currency Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">
                      {t.currency}
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'VND' | 'USD')}
                      className="w-full p-3 text-lg bg-gray-50 border-2 text-gray-900 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200 outline-none"
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  {/* Contact Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">
                      {t.contactName}
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full p-3 text-lg bg-gray-50 border-2 text-gray-900 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200 outline-none"
                      placeholder={t.enterContactName}
                    />
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">
                      {t.contactPhone}
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full p-3 text-lg bg-gray-50 border-2 text-gray-900 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200 outline-none"
                      placeholder={t.enterPhoneNumber}
                    />
                  </div>

                  {/* Footer Message */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">
                      {t.footerMessage}
                    </label>
                    <textarea
                      value={footerMessage}
                      onChange={(e) => setFooterMessage(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-lg bg-gray-50 border-2 text-gray-900 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200 outline-none resize-none"
                      placeholder={t.enterFooterMessage}
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleGoBackFromConfig}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 shadow-lg flex items-center justify-center text-lg gap-2"
                  >
                    {t.backToCalculator}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
