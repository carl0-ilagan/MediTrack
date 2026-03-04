import React from 'react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';

const REQUEST_TESTS = [
  { name: 'CBC with Platelet', price: '₱550.00' },
  { name: 'Urinalysis', price: '₱150.00' },
  { name: 'Pregnancy Test', price: '₱150.00' },
  { name: 'Fecalysis', price: '₱150.00' },
  { name: 'Fecal Occult Blood Test', price: '₱250.00' },
  { name: 'Hepa B Screening', price: '₱250.00' },
  { name: 'Sputum', price: '₱250.00' },
  { name: 'Typhi Dot', price: '₱150.00' },
  { name: 'FBS/RBS', price: '₱150.00' },
  { name: 'Triglycerides', price: '₱160.00' },
  { name: 'Cholesterol', price: '₱300.00' },
  { name: 'BUN', price: '₱160.00' },
  { name: 'Uric Acid', price: '₱160.00' },
  { name: 'Serum Creatinine', price: '₱300.00' },
  { name: 'SGPT', price: '₱160.00' },
  { name: 'SGOT', price: '₱160.00' },
  { name: 'ABO Blood Typing', price: '₱150.00' },
  { name: 'HDL', price: '₱160.00' },
  { name: 'COVID-19 ANTIGEN', price: '₱700.00' },
  { name: 'LIPID PROFILE', price: '₱600.00' },
  { name: 'CHEM 8', price: '₱700.00' },
  { name: 'Serum Electrolytes', price: '₱1,000.00' },
  { name: 'Gram Stain', price: '₱500.00' },
  { name: 'HIV', price: '₱500.00' },
  { name: 'KOH', price: '₱500.00' },
  { name: 'Prothrombin Time', price: '₱700.00' },
  { name: 'aPTT', price: '₱700.00' },
  { name: 'NS1', price: '₱500.00' },
  { name: 'Dengue Duo', price: '₱1,200.00' },
];

const renderCheckboxGrid = (tests) =>
  tests
    .map(
      (test) => `
        <div class="lr-line-item">
          <span class="lr-box"></span>
          <span class="lr-test">${test.name}</span>
          <span class="lr-price">- ${test.price}</span>
        </div>
      `
    )
    .join('');

const renderPrintableCoupon = ({
  logoMunicipal,
  logoHospital,
  patientName,
  patientAge,
  patientSex,
  formattedDate,
  copyLabel,
}) => `
  <div class="lr-coupon">
    <div class="lr-copy">${copyLabel}</div>
    <div class="lr-header">
      <img src="${logoMunicipal}" alt="Municipal Logo" class="lr-logo" />
      <div class="lr-center">
        <p>REPUBLIC OF THE PHILIPPINES</p>
        <h1>RENATO UMALI REYES HOSPITAL OF BONGABONG</h1>
        <p>Labasan, Bongabong, Oriental Mindoro</p>
        <p>Contact No. 0975 804 4023</p>
      </div>
      <img src="${logoHospital}" alt="Hospital Logo" class="lr-logo" />
    </div>

    <div class="lr-title">LABORATORY REQUEST</div>

    <div class="lr-meta">
      <div>Name: <span class="lr-line">${patientName || ''}</span></div>
      <div>Age: <span class="lr-line">${patientAge || ''}</span></div>
      <div>Sex: <span class="lr-line">${patientSex || ''}</span></div>
      <div>Date: <span class="lr-line">${formattedDate}</span></div>
      <div>OPD <span class="lr-box"></span> Ward <span class="lr-box"></span></div>
      <div>PWD <span class="lr-box"></span> Student <span class="lr-box"></span> Senior <span class="lr-box"></span> Regular <span class="lr-box"></span></div>
    </div>

    <div class="lr-lists">
      ${renderCheckboxGrid(REQUEST_TESTS)}
    </div>

    <div class="lr-footer">
      <div>Requesting Physician: <span class="lr-line" style="min-width: 52mm;"></span></div>
      <div>Administered by: <span class="lr-line" style="min-width: 42mm;"></span></div>
      <div class="lr-total">TOTAL: <span class="lr-line" style="min-width: 30mm;"></span></div>
    </div>
  </div>
`;

export const openLaboratoryRequestPrintView = ({
  patientName = '',
  patientAge = '',
  patientSex = '',
  requestDate = '',
} = {}) => {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=980,height=1200');
  if (!printWindow) return;

  const formattedDate = requestDate || format(new Date(), 'MMMM d, yyyy');
  const logoMunicipal = `${window.location.origin}/images/bongabong-removebg-preview.png`;
  const logoHospital = `${window.location.origin}/images/umali-removebg-preview.png`;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Laboratory Request Form</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            color: #111827;
            background: #ffffff;
          }
          .lr-sheet {
            min-height: 100vh;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 6mm 0;
          }
          .lr-coupon {
            width: 96mm;
            border: 1px solid #111827;
            border-radius: 6px;
            padding: 3.5mm;
            box-sizing: border-box;
          }
          .lr-header {
            display: grid;
            grid-template-columns: 16mm 1fr 16mm;
            gap: 2mm;
            align-items: center;
            border-bottom: 1px solid #111827;
            padding-bottom: 2mm;
          }
          .lr-logo {
            width: 14mm;
            height: 14mm;
            object-fit: contain;
          }
          .lr-center {
            text-align: center;
            line-height: 1.1;
          }
          .lr-center h1 {
            margin: 0;
            font-size: 9px;
            letter-spacing: 0.01em;
          }
          .lr-center p {
            margin: 0.5mm 0;
            font-size: 7px;
          }
          .lr-title {
            margin-top: 2mm;
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.06em;
          }
          .lr-meta {
            margin-top: 2mm;
            font-size: 8px;
            line-height: 1.2;
          }
          .lr-meta > div {
            margin-top: 1.3mm;
          }
          .lr-line {
            border-bottom: 1px solid #111827;
            display: inline-block;
            min-width: 14mm;
            padding: 0 2px;
          }
          .lr-lists {
            margin-top: 2.5mm;
          }
          .lr-line-item {
            display: grid;
            grid-template-columns: 4mm 1fr auto;
            align-items: start;
            gap: 1.2mm;
            font-size: 8px;
            margin-bottom: 1mm;
          }
          .lr-box {
            width: 2.3mm;
            height: 2.3mm;
            border: 1px solid #111827;
            display: inline-block;
            transform: translateY(0.7mm);
          }
          .lr-test {
            line-height: 1.1;
          }
          .lr-price {
            font-weight: 600;
          }
          .lr-copy {
            text-align: right;
            font-size: 7px;
            color: #4b5563;
            margin-bottom: 1mm;
          }
          .lr-footer {
            margin-top: 2mm;
            font-size: 8px;
            line-height: 1.8;
          }
          .lr-total {
            text-align: right;
          }
          .lr-cut {
            margin: 2mm auto;
            width: 98mm;
            border-top: 1px dashed #9ca3af;
          }
          @media print {
            .lr-sheet {
              padding: 0;
            }
            .lr-break {
              page-break-after: always;
            }
            .lr-break:last-child {
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="lr-sheet lr-break">
          ${renderPrintableCoupon({
            logoMunicipal,
            logoHospital,
            patientName,
            patientAge,
            patientSex,
            formattedDate,
            copyLabel: 'Copy 1 - Patient',
          })}
        </div>
        <div class="lr-sheet lr-break">
          ${renderPrintableCoupon({
            logoMunicipal,
            logoHospital,
            patientName,
            patientAge,
            patientSex,
            formattedDate,
            copyLabel: 'Copy 2 - Clinic',
          })}
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();

  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
};

const LaboratoryRequestTemplate = ({
  patientName = '',
  patientAge = '',
  patientSex = '',
  requestDate = '',
  onPrint,
}) => {
  const formattedDate = requestDate || format(new Date(), 'MMMM d, yyyy');
  const leftTests = REQUEST_TESTS.slice(0, Math.ceil(REQUEST_TESTS.length / 2));
  const rightTests = REQUEST_TESTS.slice(Math.ceil(REQUEST_TESTS.length / 2));

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-3">
          <img
            src="/images/bongabong-removebg-preview.png"
            alt="Bongabong logo"
            className="h-12 w-12 object-contain"
          />
          <div>
            <p className="text-[11px] text-gray-500">Republic of the Philippines</p>
            <p className="text-sm font-semibold text-[#01377D]">RENATO UMALI REYES HOSPITAL OF BONGABONG</p>
            <p className="text-[11px] text-gray-500">Labasan, Bongabong, Oriental Mindoro</p>
          </div>
        </div>
        <img
          src="/images/umali-removebg-preview.png"
          alt="RUR Hospital logo"
          className="h-12 w-12 object-contain"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold tracking-wide text-[#01377D]">LABORATORY REQUEST (Coupon Size)</h3>
        <Button
          type="button"
          size="sm"
          onClick={onPrint}
          className="bg-[#01377D] text-white hover:bg-[#022a5c]"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print 2 Copies
        </Button>
      </div>

      <p className="mt-1 text-xs text-gray-500">Output: dalawang maliit na coupon copy (Patient + Clinic).</p>

      <div className="mt-3 grid gap-2 text-xs text-gray-700 sm:grid-cols-3">
        <p>Name: <span className="font-medium text-[#01377D]">{patientName || '________________'}</span></p>
        <p>Age: <span className="font-medium text-[#01377D]">{patientAge || '____'}</span></p>
        <p>Sex: <span className="font-medium text-[#01377D]">{patientSex || '____'}</span></p>
        <p className="sm:col-span-3">Date: <span className="font-medium text-[#01377D]">{formattedDate}</span></p>
      </div>

      <div className="mt-3 grid gap-x-8 gap-y-1 md:grid-cols-2">
        {[leftTests, rightTests].map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="space-y-1">
            {group.map((test) => (
              <label
                key={test.name}
                className="grid grid-cols-[14px_1fr_auto] items-start gap-2 text-xs text-gray-700"
              >
                <input type="checkbox" className="mt-1 h-3.5 w-3.5 rounded border-gray-400" />
                <span>{test.name}</span>
                <span className="font-medium text-gray-900">{test.price}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LaboratoryRequestTemplate;
