// src/pages/admin/Uploadsheet.jsx  (or same path you use)
import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import * as XLSX from 'xlsx';
import axios from 'axios';
import '../../css/uploadsheet.css';
import { toast } from 'react-toastify';

const ALLOWED = ['name', 'email', 'phone', 'course', 'place'];
const IGNORE_HEADERS = ['slno', 'sno', 's.no', 'srno', 'serialno', 'serial', 'id'];

/* Utilities */
function normalizeCell(cell) {
  if (cell === null || cell === undefined) return '';
  return String(cell).trim();
}

function fillHeaderBlanks(headers) {
  const out = [];
  let lastNonEmpty = '';
  for (let h of headers) {
    const hn = normalizeCell(h);
    if (hn !== '') {
      lastNonEmpty = hn;
      out.push(hn);
    } else {
      out.push(lastNonEmpty);
    }
  }
  return out;
}

function fillVerticalBlanks(rows, fillCols = []) {
  if (!rows || rows.length === 0) return rows;
  const numCols = rows[0].length;
  const lastSeen = new Array(numCols).fill('');
  return rows.map(row => {
    return row.map((cell, cidx) => {
      const val = normalizeCell(cell);
      if (val === '' && fillCols.includes(cidx)) {
        return lastSeen[cidx];
      } else {
        if (val !== '') lastSeen[cidx] = val;
        return val;
      }
    });
  });
}

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const hasNonEmpty = row.some(c => normalizeCell(c) !== '');
    if (hasNonEmpty) {
      return i;
    }
  }
  return 0;
}

function Uploadsheet() {
  // state
  const [excelFile, setExcelFile] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [previewRecords, setPreviewRecords] = useState([]);
  const [rawPreviews, setRawPreviews] = useState([]);
  const [columnsWarning, setColumnsWarning] = useState('');
  const [isValidColumns, setIsValidColumns] = useState(false);
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
  const [hasDuplicatesOrErrors, setHasDuplicatesOrErrors] = useState(false);

  const handleFile = (e) => {
    setTypeError(null);
    setPreviewRecords([]);
    setRawPreviews([]);
    setColumnsWarning('');
    setIsValidColumns(false);
    setMessage('');
    setErrorDetails([]);
    setHasDuplicatesOrErrors(false);

    const file = e.target.files[0];
    if (!file) {
      setTypeError('Please select a file.');
      return;
    }
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.type) || file.name.match(/\.(xlsx|xls|csv)$/i)) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = (ev) => {
        setExcelFile(ev.target.result);
      }
      reader.onerror = () => {
        setTypeError('Error reading file.');
      }
    } else {
      setTypeError('Please select only Excel (xlsx / xls) or CSV files.');
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    // reset
    setMessage('');
    setColumnsWarning('');
    setPreviewRecords([]);
    setRawPreviews([]);
    setIsValidColumns(false);
    setErrorDetails([]);
    setHasDuplicatesOrErrors(false);

    if (!excelFile) {
      setMessage('No file loaded.');
      return;
    }

    try {
      const workbook = XLSX.read(excelFile, { type: 'buffer' });
      let allCleaned = [];
      let previews = [];

      let headersFoundSet = new Set();

      workbook.SheetNames.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!rows || rows.length === 0) return;

        const rowsFilled = fillVerticalBlanks(rows);
        const headerRowIndex = findHeaderRow(rowsFilled);
        const rawHeaders = rowsFilled[headerRowIndex].map(c => normalizeCell(c));
        const headersFilled = fillHeaderBlanks(rawHeaders).map(h => h.toLowerCase().trim());

        const headerKeys = headersFilled.map(h => {
          if (!h) return '';
          return h.replace(/\s+/g, '').replace(/[^\w]/g, '').toLowerCase();
        });

        const filteredHeaders = headerKeys.map(h => {
          if (!h) return '';
          if (IGNORE_HEADERS.includes(h)) return '';
          return h;
        });

        filteredHeaders.forEach(h => {
          if (h) headersFoundSet.add(h);
        });

        const dataRows = rowsFilled.slice(headerRowIndex + 1);
        const objs = dataRows.map(row => {
          const obj = {};
          for (let ci = 0; ci < filteredHeaders.length; ci++) {
            const fh = filteredHeaders[ci];
            if (!fh) continue;
            obj[fh] = normalizeCell(row[ci]);
          }
          const anyNonEmpty = Object.values(obj).some(v => v !== '');
          return anyNonEmpty ? obj : null;
        }).filter(r => r !== null);

        const cleaned = objs.map(o => {
          const rec = {};
          ALLOWED.forEach(field => {
            let val = '';
            if (o[field] !== undefined) {
              val = String(o[field]).trim();
            } else {
              const foundKey = Object.keys(o).find(k => k.includes(field));
              if (foundKey) val = String(o[foundKey]).trim();
            }
            rec[field] = val;
          });
          return rec;
        });

        previews.push({ sheetName, headerRow: filteredHeaders, records: cleaned.slice(0, 20) });
        allCleaned = allCleaned.concat(cleaned);
      });

      setRawPreviews(previews);

      // columns check (only missing required columns will block)
      const headersFound = Array.from(headersFoundSet);
      const missingRequiredColumns = ALLOWED.filter(a => !headersFound.includes(a));
      if (missingRequiredColumns.length > 0) {
        setColumnsWarning(`Missing required columns: ${missingRequiredColumns.join(', ')}`);
        setIsValidColumns(false);
        setMessage('Column mismatch detected. Fix headers before previewing data.');
        setHasDuplicatesOrErrors(true);
        return;
      }

      // content checks
      const seenEmails = new Map();
      const seenPhones = new Map();
      const duplicateRows = [];
      const missingValueRows = [];

      const flagged = allCleaned.map((rec, idx) => {
        let isDup = false;
        const email = rec.email ? rec.email.toLowerCase().trim() : '';
        const phone = rec.phone ? rec.phone.trim() : '';

        if (email) {
          if (!seenEmails.has(email)) seenEmails.set(email, idx);
          else {
            isDup = true;
            duplicateRows.push({ rowIndex: idx, errors: ['duplicate email'], rec });
          }
        }
        if (phone) {
          if (!seenPhones.has(phone)) seenPhones.set(phone, idx);
          else {
            isDup = true;
            duplicateRows.push({ rowIndex: idx, errors: ['duplicate phone'], rec });
          }
        }

        const missingFields = ALLOWED.filter(f => !rec[f] || String(rec[f]).trim() === '');
        if (missingFields.length > 0) {
          missingValueRows.push({ rowIndex: idx, missingFields, rec });
        }

        return { ...rec, isDuplicate: isDup };
      });

      setPreviewRecords(flagged);

      const hasDup = duplicateRows.length > 0;
      const hasMissing = missingValueRows.length > 0;

      if (hasDup && hasMissing) {
        setErrorDetails([
          { type: 'duplicates', items: duplicateRows },
          { type: 'missing', items: missingValueRows }
        ]);
        setMessage('Preview has duplicate rows and missing values. Please fix both issues.');
        setHasDuplicatesOrErrors(true);
        setIsValidColumns(false);
      } else if (hasDup) {
        setErrorDetails([{ type: 'duplicates', items: duplicateRows }]);
        setMessage('Preview has duplicate rows (same email or phone). Please fix duplicates.');
        setHasDuplicatesOrErrors(true);
        setIsValidColumns(false);
      } else if (hasMissing) {
        setErrorDetails([{ type: 'missing', items: missingValueRows }]);
        setMessage('Preview has missing/null values in required columns. Please fill them.');
        setHasDuplicatesOrErrors(true);
        setIsValidColumns(false);
      } else {
        setErrorDetails([]);
        setMessage('Preview ready. No duplicates, no missing values, and headers match.');
        setIsValidColumns(true);
        setHasDuplicatesOrErrors(false);
      }

    } catch (err) {
      console.error('Error parsing file', err);
      setMessage('Error parsing file. Make sure it is a valid Excel/CSV file.');
      setHasDuplicatesOrErrors(true);
      setIsValidColumns(false);
    }
  };

  const handleSave = async () => {
    setMessage('');
    if (!isValidColumns) {
      toast.error('Cannot save: duplicate/missing rows or invalid columns.');
      return;
    }
    if (previewRecords.length === 0) {
      toast.info('No data to save.');
      return;
    }

    // IMPORTANT: Sanitize — only send allowed fields (no isDuplicate, no internal metadata)
    const payload = previewRecords.map(r => {
      const out = {};
      ALLOWED.forEach(f => {
        // ensure string; backend expects trimmed strings
        out[f] = r[f] !== undefined && r[f] !== null ? String(r[f]).trim() : '';
      });
      return out;
    });

    try {
      const response = await axios.post('http://localhost:4000/admin/upload-sheet', { data: payload }, { timeout: 60000 });
      const resp = response.data;
      let msgParts = [];
      if (resp.insertedCount !== undefined) msgParts.push(`Inserted: ${resp.insertedCount}`);
      if (resp.modifiedCount !== undefined) msgParts.push(`Modified: ${resp.modifiedCount}`);
      if (resp.invalidCount !== undefined) msgParts.push(`Invalid rows: ${resp.invalidCount}`);
      setMessage(msgParts.join('. ') || 'Save completed.');
      toast.success('Save completed.');
    } catch (err) {
      // improved error handling: show server message when available
      if (err.response) {
        console.error('Server responded:', err.response.status, err.response.data);
        setMessage('Error saving: ' + (err.response.data?.message || JSON.stringify(err.response.data)));
        toast.error('Save failed: ' + (err.response.data?.message || `status ${err.response.status}`));
      } else if (err.request) {
        console.error('No response (request sent):', err.request);
        setMessage('No response from server.');
        toast.error('No response from server.');
      } else {
        console.error('Axios error', err.message);
        setMessage('Error: ' + err.message);
        toast.error('Error: ' + err.message);
      }
    }
  };

  return (
    <Layout title={"CRM-Upload Sheet"}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Adminmenu />
          </aside>
          <main className="col-md-9">
            <div className="card admin-card p-4 upload-form">
              <h4>Upload Sheet</h4>
              <form onSubmit={handlePreview} className="form-group custom-form">
                <input
                  type="file"
                  className="form-control"
                  required
                  onChange={handleFile}
                />
                <button type="submit" className="mt-3 btn btn-success btn-md">Preview</button>
              </form>

              {typeError && <div className="alert alert-danger mt-2">{typeError}</div>}
              {columnsWarning && <div className="alert alert-warning mt-2">{columnsWarning}</div>}

              {previewRecords.length > 0 && (
                <div className="mt-3">
                  <button
                    className="btn btn-primary btn-md"
                    disabled={!isValidColumns}
                    onClick={handleSave}
                  >
                    Save
                  </button>
                </div>
              )}

              <div className="viewer mt-3">
                {previewRecords.length > 0 ? (
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        {ALLOWED.map((h, idx) => (
                          <th key={idx}>{h}</th>
                        ))}
                        <th>Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRecords.map((rec, idx) => (
                        <tr
                          key={idx}
                          className={rec.isDuplicate ? 'duplicate-row' : ''}
                        >
                          {ALLOWED.map((field, fidx) => (
                            <td key={fidx}>{rec[field]}</td>
                          ))}
                          <td>
                            {rec.isDuplicate ? 'DUPLICATE' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div>No preview yet.</div>
                )}
              </div>

              {errorDetails && errorDetails.length > 0 && (
                <div className="alert alert-danger mt-3">
                  {errorDetails.map((block, bi) => {
                    if (block.type === 'duplicates') {
                      return (
                        <div key={bi}>
                          <h5>Duplicate Rows</h5>
                          <ul>
                            {block.items.map((e, i) => (
                              <li key={i}>
                                Row: <strong>{e.rowIndex + 1}</strong> — {e.errors.join(', ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    } else if (block.type === 'missing') {
                      return (
                        <div key={bi}>
                          <h5>Rows with missing values</h5>
                          <ul>
                            {block.items.map((e, i) => (
                              <li key={i}>
                                Row: <strong>{e.rowIndex + 1}</strong> — missing fields: {e.missingFields.join(', ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })}
                </div>
              )}

              {message && <div className="alert alert-info mt-3">{message}</div>}

            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Uploadsheet;
