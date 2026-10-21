import React, { useState } from 'react';
import type { PackerItem } from '../../types/domain';

interface JsonItemImporterProps {
  onItemsImported: (items: PackerItem[]) => void;
  disabled?: boolean;
}

export const JsonItemImporter: React.FC<JsonItemImporterProps> = ({ onItemsImported, disabled }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleImport = () => {
    try {
      setError('');
      if (!jsonText.trim()) {
        setError('Please paste JSON data first.');
        return;
      }

      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON data must be an array of item objects.');
      }

      const mappedItems: PackerItem[] = parsed.map((item: any, index: number) => {
        if (!item.ItemCode) {
          throw new Error(`Item at index ${index + 1} is missing 'ItemCode'.`);
        }

        return {
          ItemCode: String(item.ItemCode).trim(),
          ItemReference: String(item.ItemReference || item.ItemCode).trim(),
          Width: Number(item.Width) || 0,
          Length: Number(item.Length) || 0,
          Depth: Number(item.Depth) || 0,
          Weight: Number(item.Weight) || 0,
          Quantity: Number(item.Quantity) || 1, // Default quantity
          BoxGroup: item.BoxGroup ? String(item.BoxGroup).trim() : '',
          Fragile: Boolean(item.Fragile),
        };
      });

      onItemsImported(mappedItems);
      setIsOpen(false);
      setJsonText('');
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format.');
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-xl border border-[#b6d8f6] bg-[#eff7ff] px-3 py-2 text-xs font-semibold text-[#217fc7] hover:bg-[#e1f0fc] disabled:opacity-50 transition-colors"
      >
        <span>📥 Import items via JSON</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#dce6ef] bg-white p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#172f50]">Import Items List (JSON)</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#71849a] hover:text-[#172f50] text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#70839c] mb-2">
              Paste your JSON array matching the standard format:
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              placeholder={`[\n  {\n    "ItemCode": "ITM-001",\n    "ItemReference": "Widget A",\n    "Width": 100,\n    "Length": 200,\n    "Depth": 50,\n    "Weight": 1,\n    "BoxGroup": "GROUP-A"\n  }\n]`}
              className="w-full rounded-xl border border-[#dce6ef] bg-[#f8fbff] p-3 text-xs font-mono text-[#172f50] focus:border-[#2686d5] focus:outline-none"
            />

            {error && <p className="mt-2 text-xs text-[#b64641] font-medium">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#71849a] hover:bg-[#f4f7fb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-xl bg-[#2686d5] px-4 py-2 text-xs font-bold text-white hover:bg-[#1f77be]"
              >
                Import Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};