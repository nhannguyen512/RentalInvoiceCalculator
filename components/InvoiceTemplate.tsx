import React from 'react';
import { ICONS } from '../constants';

interface InvoiceTemplateProps {
  rent: number;
  managementFee: number;
  waterBill: number;
  electricityBill: number;
  parkingFee: number;
  total: number;
  formatCurrency: (value: number) => string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ 
  rent, 
  managementFee, 
  waterBill, 
  electricityBill,
  parkingFee, 
  total,
  formatCurrency 
}) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const renderInvoiceRow = (label: string, value: number) => {
    if (value <= 0) return null;
    return (
        <div className="flex justify-between items-center py-4 border-b border-gray-100">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
        </div>
    );
  };

  return (
    <div className="bg-white p-4 sm:p-6 font-sans">
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RENTAL INVOICE</h1>
          <p className="text-gray-500 mt-1 text-sm">Date: {formattedDate}</p>
        </div>
        <div className="text-blue-600">
          {ICONS.invoice}
        </div>
      </header>

      <main className="mt-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Payment Details</h2>
        <div className="space-y-0.5">
          {renderInvoiceRow("Rent for 2 months", rent)}
          {renderInvoiceRow("Management Fee", managementFee)}
          {renderInvoiceRow("Water Bill", waterBill)}
          {renderInvoiceRow("Electricity Bill", electricityBill)}
          {renderInvoiceRow("Parking Fee", parkingFee)}
        </div>
      </main>

      <footer className="mt-6">
         <div className="border-t-2 border-dashed border-gray-300 my-4"></div>
        <div className="flex justify-end items-center">
          <div className="text-right">
            <p className="text-base font-semibold text-gray-600">TOTAL</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">{formatCurrency(total)}</p>
          </div>
        </div>
        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>Thank you for your prompt payment.</p>
          <p>If you have any questions, please contact Phuong Duy Tran at 0987484464</p>
        </div>
      </footer>
    </div>
  );
};
