'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '../../../hooks/useTranslation';
import Link from 'next/link'
import VenderForm from '@/components/VenderForm'



type PropertyRow = string[];

export default function PropertyDetailPage() {
  const { t } = useTranslation();
  const { numero } = useParams<{ numero: string }>();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [showSellModal, setShowSellModal] = useState(false)


  const [headers, setHeaders] = useState<string[]>([]);
  const [row, setRow] = useState<PropertyRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [showExtras, setShowExtras] = useState(false);

  // índices fixos
  const saleDateIdx = 34;
  const photoIdx = 33;

  // carrega dados
  useEffect(() => {
    if (!numero) return;
    (async () => {
      try {
        const res = await fetch('/api/propriedades', { cache: 'no-store' });
        const body = (await res.json()) as { ok: boolean; rows?: PropertyRow[] };
        if (!body.ok) return;
        const allRows = body.rows || [];
        if (!allRows.length) return;
        setHeaders(allRows[0]);
        const content = allRows.slice(1);
        const found = content.find(r => r[2] === numero) || null;
        setRow(found);
        if (found) {
          setPreviewUrl(found[photoIdx]);
          const initial: Record<number, string> = {};
          found.forEach((cell, idx) => { initial[idx] = cell; });
          setEditValues(initial);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [numero]);

  if (!row) {
    return <p className="p-6 text-white">{t('loading')}</p>;
  }

  const saleDateRaw = (row[saleDateIdx] || '').trim();
  const isSold = Boolean(saleDateRaw);
  const statusLabel = isSold ? t('statusVendido') : t('statusDisponível');

  const handleChangeField = (i: number, v: string) =>
    setEditValues(prev => ({ ...prev, [i]: v }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { uploadUrl, publicUrl } = await fetch(
        `/api/propriedades/upload-url?filename=${encodeURIComponent(file.name)}` +
        `&contentType=${encodeURIComponent(file.type)}`
      ).then(res => res.json());
      

      // 2) Envio direto ao bucket
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error('Falha no upload ao bucket');

      // 3) Atualizo a planilha com a publicUrl
      const res = await fetch('/api/propriedades/upload-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero, url: publicUrl }),
      });
      const body = await res.json();
      if (!body.ok) {
        alert(`${t('photoUploadError')}: ${body.message}`);
        return;
      }

      // 4) Atualizo o preview e o estado local
      setPreviewUrl(body.url);
      setRow(prev => {
        if (!prev) return prev;
        const updated = [...prev];
        updated[photoIdx] = body.url;
        return updated;
      });
      setEditValues(prev => ({ ...prev, [photoIdx]: body.url }));
    } catch (err: any) {
      console.error(err);
      alert(`${t('photoUploadError')}: ${err.message || err}`);
    }
  };

  const handleSave = async () => {
    const res = await fetch('/api/propriedades/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, updates: editValues }),
    });
    const result = await res.json();
    if (!result.ok) {
      alert(`${t('saveError')}: ${result.message}`);
      return;
    }
    setIsEditing(false);
    router.refresh();
  };

  const stripClasses = (el: HTMLElement) => {
    el.removeAttribute('class')
    Array.from(el.children).forEach(c =>
      c instanceof HTMLElement && stripClasses(c)
    )
  }

  const printCard = () => {
    if (!cardRef.current) return;
    const clone = cardRef.current.cloneNode(true) as HTMLElement;
  
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
  
    // puxa todo o head (tailwind, fonts etc)
    const head = document.head.innerHTML;
  
    // injeta CSS extra para print
    const style = `
      <style>
        @page { margin: 10mm; }
        @media print {
          body, html { margin:0; padding:0; }
          *,
          *::before,
          *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden !important; }
          #to-print, #to-print * { visibility: visible !important; }
          #to-print {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: black !important;
          }
        }
      </style>
    `;
  
    const html = `
      <!doctype html>
      <html>
        <head>
          ${head}
          ${style}
        </head>
        <body>
          <div id="to-print">${clone.outerHTML}</div>
        </body>
      </html>
    `;
  
    win.document.open();
    win.document.write(html);
    win.document.close();
  
    win.onload = () => {
      win.focus();
      win.print();
      win.close();
    };
  };
  
  

  // Definição de seções
  // dentro do seu componente
// defina as sessões com os índices corretos:
const availableSections = [
  { title: t('sectionPropertyInfo'), indices: [4, 5, 6, 7, 24, 21] },
  { title: t('sectionSize'),           indices: [8, 9, 12, 23] },
  { title: t('sectionZoning'),         indices: [10, 11, 22] },
  { title: t('sectionUtilities'),      indices: [14, 15, 16, 17, 18, 19] },
  { title: t('sectionFlood'),          indices: [20] },
  { title: t('sectionHOA'),            indices: [26, 27, 28, 29] },
  { title: t('sectionTax'),            indices: [13] },  // imposto anual por último
];

// Definição de seções “vendido”
const soldSections = [
  { title: t('sectionPropertyInfo'), indices: [4, 5, 6, 7, 24, 21] },
  { title: t('sectionSize'),           indices: [8, 9, 12, 23] },
  { title: t('sectionPurchaseInfo'), indices: [ 1, 44,48 ] },

  // nova seção: Informações de Venda
  { title: t('sectionSaleInfo'),       indices: [34,50,40, 59] },
  // nova seção: Dados Financeiros
  { title: t('sectionFinancial'),      indices: [51, 52,53,54 ] },
  { title: t('sectionZoning'),         indices: [10, 11, 22] },
  { title: t('sectionUtilities'),      indices: [14, 15, 16, 17, 18, 19] },
  { title: t('sectionFlood'),          indices: [20] },
  { title: t('sectionHOA'),            indices: [26, 27, 28, 29] },
  { title: t('sectionTax'),            indices: [13] },  // imposto anual por último
]


  return (
    <div className="min-h-screen bg-[#1F1F1F] px-4 py-6">
      <div
        ref={cardRef}
        className="relative bg-[#2C2C2C] rounded-2xl p-6 shadow-lg max-w-3xl mx-auto flex flex-col"
      >
        {/* Título e status */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] border-b border-[#D4AF37] pb-2 mb-6">
          {t('property')} #{numero}
        </h1>
        <span
          className={`absolute top-6 right-6 px-2 py-1 rounded-full text-xs font-bold ${
            isSold ? 'bg-red-500 text-white' : 'bg-green-400 text-black'
          }`}
        >
          {statusLabel}
        </span>

{/* Imagem e ações */}
<div className="mt-8 flex flex-col items-end">
  {previewUrl && (
    <img
      src={previewUrl}
      alt={t('photoAlt')}
      className="w-full max-h-60 object-cover rounded-lg mb-4"
    />
  )}
  {isEditing && (
    <input
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="mb-4 w-full sm:w-auto text-white text-sm"
    />
  )}
</div>

{/* Venda da Propriedade & Condições de Pagamento */}
<div className="bg-black rounded-2xl p-6 shadow-lg mt-8">
  {/* Venda da Propriedade */}
  <section>
    <h2 className="text-lg font-semibold text-white border-b border-gray-600 pb-1 mb-4">
      {t('sectionSaleValue')}
    </h2>
    <div className="flex items-start space-x-2 text-white">
      <span className="font-medium text-gray-300 whitespace-nowrap">
        {headers[50]}:
      </span>
      <span className="break-words">
        {row[50] || '—'}
      </span>
    </div>
  </section>

  {/* Condições de Pagamento */}
<section className="mt-6">
  <h2 className="text-lg font-semibold text-white border-b border-gray-600 pb-1 mb-4">
    {t('sectionPaymentTerms')}
  </h2>
  <div className="flex flex-wrap gap-x-6 gap-y-2 text-white">
    {[56, 57, 58].map(idx => (
      <div key={idx} className="flex items-start space-x-1">
        <span className="font-medium text-gray-300 whitespace-nowrap">
          {t(headers[idx])}:
        </span>
        {isEditing ? (
          <input
            type="text"
            value={editValues[idx] || ''}
            onChange={e => handleChangeField(idx, e.target.value)}
            className="bg-black border border-gray-600 px-2 py-1 rounded text-white text-sm break-words"
          />
        ) : (
          <span className="break-words">
            {row[idx] || '—'}
          </span>
        )}
      </div>
      ))}
    </div>
  </section>
</div>

{/* Demais seções na ordem desejada */}
<div className="space-y-8 mt-8">
  {isSold ? (
    <>
      {/* Renderiza até Dados Financeiros */}
      {soldSections.slice(0, 5).map(({ title, indices }) => (
        <section key={title}>
          <h2 className="text-lg font-bold text-[#D4AF37] border-b border-gray-600 pl-2 mb-4">
            {title}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-white">
          {indices.map(idx => {
  const raw = row[idx] ?? '0';
  // remove tudo que não seja dígito, ponto ou sinal de negativo
  const cleaned = raw.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned) || 0;
  const financialIdx = [51, 52, 53, 54]; // ajuste caso use outros índices

  return (
    <div key={idx} className="flex items-start space-x-1">
      <span className="font-medium text-gray-300 flex-shrink-0 whitespace-nowrap">
        {headers[idx] || `Col ${idx}`}:
      </span>

      {isEditing ? (
        <input
          type="text"
          value={editValues[idx] || ''}
          onChange={e => handleChangeField(idx, e.target.value)}
          className="bg-black border border-gray-600 px-2 py-1 rounded text-white text-sm break-words"
        />
      ) : (
        <span
          className={`break-words ${
            financialIdx.includes(idx)
              ? num > 0
                ? 'text-green-400'
                : 'text-red-500'
              : 'text-white'
          }`}
        >
          {raw}
        </span>
      )}
    </div>
  );
})}
          </div>
        </section>
      ))}

      {/* Botão para mostrar/ocultar extras */}
      <button
        onClick={() => setShowExtras(prev => !prev)}
        className="mt-4 flex items-center text-sm text-[#D4AF37] hover:underline"
      >
        {showExtras ? '▼' : '▶'} {showExtras ? t('showLess') : t('showMore')}
      </button>

      {/* Seções extras (renderiza apenas se showExtras for true) */}
      {showExtras &&
        soldSections.slice(5).map(({ title, indices }) => (
          <section key={title}>
            <h2 className="text-lg font-bold text-[#D4AF37] border-b border-gray-600 pl-2 mb-4">
              {title}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-white">
              {indices.map(idx => (
                <div key={idx} className="flex items-start space-x-1">
                  <span className="font-medium text-gray-300 flex-shrink-0 whitespace-nowrap">
                    {headers[idx] || `Col ${idx}`}:
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editValues[idx] || ''}
                      onChange={e => handleChangeField(idx, e.target.value)}
                      className="bg-black border border-gray-600 px-2 py-1 rounded text-white text-sm break-words"
                    />
                  ) : (
                    <span className="text-white break-words">
                      {row[idx] || '—'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
      ))}
    </>
  ) : (
    /* Fluxo “disponível” continua igual */
    availableSections.map(({ title, indices }) => (
      <section key={title}>
        <h2 className="text-lg font-bold text-[#D4AF37] border-b border-gray-600 pl-2 mb-4">
          {title}
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-white">
          {indices.map(idx => (
            <div key={idx} className="flex items-start space-x-1">
              <span className="font-medium text-gray-300 flex-shrink-0 whitespace-nowrap">
                {headers[idx] || `Col ${idx}`}:
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={editValues[idx] || ''}
                  onChange={e => handleChangeField(idx, e.target.value)}
                  className="bg-black border border-gray-600 px-2 py-1 rounded text-white text-sm break-words"
                />
              ) : (
                <span className="text-white break-words">
                  {row[idx] || '—'}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    ))
  )}
</div>


        {/* Botões de ação */}
<div className="mt-6 flex justify-end space-x-2 print:hidden">
  {!isEditing && (
    <button
      onClick={printCard}
      className="self-end bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition text-sm"
    >
      {t('print')}
    </button>
  )}
  <button
    onClick={() => router.back()}
    className="bg-[#D4AF37] text-black px-3 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 text-sm"
  >
    ← {t('back')}
  </button>

  {/* botão Vender (apenas fora do modo edição) */}
  {!isEditing && (
    <button
    onClick={() => setShowSellModal(true)}
    className="bg-green-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-600 transition text-sm"
        >
 {t('sellProperty')}
     </button>
  )}

  {isEditing ? (
    <>
      <button
        onClick={handleSave}
        className="bg-green-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-600 text-sm"
      >
        {t('save')}
      </button>
      <button
        onClick={() => setIsEditing(false)}
        className="bg-gray-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-700 text-sm"
      >
        {t('cancel')}
      </button>
    </>
  ) : (
    <button
      onClick={() => setIsEditing(true)}
      className="bg-blue-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-600 transition text-sm"
    >
      {t('edit')}
    </button>
  )}
</div>

{/* ——————— AQUI: modal de venda ——————— */}
{showSellModal && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={() => setShowSellModal(false)}
  >
    <div
      className="bg-[#2C2C2C] p-6 rounded-2xl shadow-lg max-w-lg w-full"
      onClick={e => e.stopPropagation()}
    >
      <VenderForm
        numero={numero}
        onClose={() => setShowSellModal(false)}
              />
            </div>
          </div>
        )}

      </div>  {/* fecha o container interno do card */}
    </div> 
  )}