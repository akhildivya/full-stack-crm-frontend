import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import * as XLSX from 'xlsx';
import axios from 'axios';
import '../../css/uploadsheet.css';

const ALLOWED = ['name', 'email', 'phone', 'course', 'place'];
const IGNORE_HEADERS = ['slno', 'sno', 's.no', 'srno', 'serialno', 'serial', 'id'];

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

  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('info');

  const handleFile = (e) => {
    setTypeError(null);
    setPreviewRecords([]);
    setRawPreviews([]);
    setColumnsWarning('');
    setIsValidColumns(false);
    setMessage('');
    setErrorDetails([]);
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

    if (!excelFile) {
      setMessage('No file loaded.');
      return;
    }

    try {
      const workbook = XLSX.read(excelFile, { type: 'buffer' });
      let allCleaned = [];
      let globalExtra = new Set();
      let globalMissing = new Set();

      // parse sheets
      workbook.SheetNames.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!rows || rows.length === 0) return;

        const rowsFilled = fillVerticalBlanks(rows);
        const headerRowIndex = findHeaderRow(rowsFilled);
        const rawHeaders = rowsFilled[headerRowIndex].map(c => normalizeCell(c));
        const headersFilled = fillHeaderBlanks(rawHeaders).map(h => h.toLowerCase().trim());

        const filteredHeaders = headersFilled.map(h => {
          if (!h) return '';
          const cleaned = h.replace(/\s+/g, '').toLowerCase();
          if (IGNORE_HEADERS.includes(cleaned)) return '';
          return h;
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
            const val = o[field] !== undefined && o[field] !== null ? String(o[field]).trim() : '';
            rec[field] = val;
          });
          return rec;
        });

        // you may want to also set rawPreviews if you use it
        rawPreviews.push({ sheetName, headerRow: filteredHeaders, records: cleaned.slice(0, 20) });
        allCleaned = allCleaned.concat(cleaned);
      });

      // After getting allCleaned, detect duplicates
      const seenEmails = new Map();
      const seenPhones = new Map();
      const duplicateRows = [];  // rows that are duplicates
      const flagged = allCleaned.map((rec, idx) => {
        let isDup = false;
        
        const email = rec.email?.toLowerCase().trim();
        const phone = rec.phone?.trim();

        if (email) {
          if (!seenEmails.has(email)) {
            seenEmails.set(email, idx);
          } else {
            isDup = true;
            duplicateRows.push({ rowIndex: idx, errors: ['duplicate email'], rec });
          }
        }
        if (phone) {
          if (!seenPhones.has(phone)) {
            seenPhones.set(phone, idx);
          } else {
            isDup = true;
            duplicateRows.push({ rowIndex: idx, errors: ['duplicate phone'], rec });
          }
        }
        return { ...rec, isDuplicate: isDup };
      });

      setPreviewRecords(flagged);

      if (duplicateRows.length > 0) {
        setErrorDetails(duplicateRows);
        setMessage('Some rows are duplicates (same email or phone) and will be skipped.');
        setIsValidColumns(false);  // prevent save
      } else {
        setMessage('Preview ready. No duplicates found.');
        setIsValidColumns(true);
      }

    } catch (err) {
      console.error('Error parsing file', err);
      setMessage('Error parsing file. Make sure it is valid.');
    }
  };

  const handleSave = async () => {
    setMessage('');
    if (!isValidColumns) {
      setMessage('Cannot save: duplicate rows or invalid columns.');
      return;
    }
    if (previewRecords.length === 0) {
      setMessage('No data to save.');
      return;
    }
    // optionally filter out duplicates from previewRecords before sending
    const filteredForSave = previewRecords.filter(r => !r.isDuplicate);

    try {
      const response = await axios.post('http://localhost:4000/admin/upload-sheet', {
        data: filteredForSave
      }, { timeout: 60000 });
      const resp = response.data;
      let msgParts = [];
      if (resp.insertedCount !== undefined) msgParts.push(`Inserted: ${resp.insertedCount}`);
      if (resp.modifiedCount !== undefined) msgParts.push(`Modified: ${resp.modifiedCount}`);
      if (resp.invalidCount !== undefined) msgParts.push(`Invalid rows: ${resp.invalidCount}`);
      setMessage(msgParts.join('. '));
      // handle resp.invalidRows and other error details if needed
    } catch (err) {
      console.error('Error saving:', err);
      setMessage('Error saving. ' + (err.message || ''));
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
                  <h5>Duplicate Rows</h5>
                  <ul>
                    {errorDetails.map((e, i) => (
                      <li key={i}>
                        Row: <strong>{e.rowIndex + 1}</strong> — {e.errors.join(', ')}
                      </li>
                    ))}
                  </ul>
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
