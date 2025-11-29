'use client';

import React, { useState, useCallback } from 'react';
import { DollarSign, FileText, CheckCircle, Eye, EyeOff } from 'lucide-react';

// TODO: integrasikan dengan payment gateway API
// TODO: tambahkan verifikasi bank account
// TODO: implementasikan payment method setup wizard

interface PaymentInformationData {
  bankAccount: string;
  walletAddress: string;
  taxRegistration: string;
}

interface PaymentInformationSectionProps {
  data: PaymentInformationData;
  onUpdate: (data: Partial<PaymentInformationData>) => void;
}

const PaymentInformationSection: React.FC<PaymentInformationSectionProps> = ({
  data,
  onUpdate,
}) => {
  const [showBankAccount, setShowBankAccount] = useState(false);

  // handler untuk toggle visibility bank account
  const toggleBankAccountVisibility = useCallback(() => {
    setShowBankAccount((prev) => !prev);
  }, []);

  // handler untuk update field
  const handleFieldChange = useCallback(
    (field: keyof PaymentInformationData, value: string) => {
      onUpdate({ [field]: value });
    },
    [onUpdate]
  );

  return (
    <div className="bg-white rounded-2xl shadow-modern p-6 gpu-accelerate">
      {/* header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Payment Information</h2>
      </div>

      {/* bank account details */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Bank Account Details
        </label>
        <div className="relative">
          <input
            type={showBankAccount ? 'text' : 'password'}
            value={data.bankAccount}
            onChange={(e) => handleFieldChange('bankAccount', e.target.value)}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth text-gray-900 font-semibold placeholder:text-gray-500 placeholder:font-normal"
            placeholder="**** **** **** 1234"
          />
          <button
            onClick={toggleBankAccountVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-smooth"
            aria-label="Toggle bank account visibility"
          >
            {showBankAccount ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1 font-medium">
          <CheckCircle className="w-3 h-3" />
          Your Bank Account Is Securely Encrypted
        </p>
      </div>

      {/* crypto wallet address */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Crypto Wallet Address (For Escrow Payments)
        </label>
        <input
          type="text"
          value={data.walletAddress}
          onChange={(e) => handleFieldChange('walletAddress', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth text-gray-900 font-mono text-sm placeholder:text-gray-500 placeholder:font-normal"
          placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
        />
        <p className="text-xs text-gray-600 mt-2 font-medium">
          🔐 Your Ethereum wallet address to receive payments from blockchain escrow.
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline ml-1"
          >
            Get MetaMask wallet →
          </a>
        </p>
      </div>

      {/* tax registration number */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Tax Registration Number
        </label>
        <input
          type="text"
          value={data.taxRegistration}
          onChange={(e) => handleFieldChange('taxRegistration', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth text-gray-900 font-semibold placeholder:text-gray-500 placeholder:font-normal"
          placeholder="TXID-XXXXXXXXX"
        />
        <p className="text-xs text-gray-600 mt-2 font-medium">
          Required For Tax Reporting And Compliance
        </p>
      </div>
    </div>
  );
};

export default PaymentInformationSection;
