import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import * as XLSX from 'xlsx';
import axios from 'axios';
import '../../css/uploadsheet.css';


const ALLOWED = ['name', 'email', 'phone', 'course', 'place'];
const IGNORE_HEADERS = ['slno', 'sno', 's.no', 'srno', 'serialno', 'serial', 'id'];
// you can adjust IGNORE_HEADERS to include any you want to exclude

function normalizeCell(cell) {
  if (cell === null || cell === undefined) return '';
  const s = String(cell).trim();
  return s;
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

function fillVerticalBlanks(rows) {
  const numCols = rows[0].length;
  const lastSeen = new Array(numCols).fill('');
  return rows.map(row => {
    return row.map((cell, cidx) => {
      const val = normalizeCell(cell);
      if (val === '') {
        return lastSeen[cidx];
      } else {
        lastSeen[cidx] = val;
        return val;
      }
    });
  });
}

// Find index of the header row: first row in which there is at least one non-empty header (after normalization)
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
  // onchange states
  const [excelFile, setExcelFile] = useState(null);
  const [typeError, setTypeError] = useState(null);

  // submit state
  const [previewRecords, setPreviewRecords] = useState([]); // cleaned, allowed fields only
  const [rawPreviews, setRawPreviews] = useState([]); // for display sheet-by-sheet
  const [columnsWarning, setColumnsWarning] = useState('');
  const [isValidColumns, setIsValidColumns] = useState(false);
  const [message, setMessage] = useState('');

  // onchange event
  const handleFile = (e) => {
    setTypeError(null);
    setPreviewRecords([]);
    setRawPreviews([]);
    setColumnsWarning('');
    setIsValidColumns(false);
    setMessage('');

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
    setMessage('');
    setColumnsWarning('');
    setPreviewRecords([]);
    setRawPreviews([]);
    setIsValidColumns(false);

    if (!excelFile) {
      setMessage('No file loaded.');
      return;
    }

    try {
      const workbook = XLSX.read(excelFile, { type: 'buffer' });
      let allCleaned = [];
      let globalExtra = new Set();
      let globalMissing = new Set();

      const sheetPreviews = [];

      workbook.SheetNames.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        // read as array of arrays
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (!rows || rows.length === 0) {
          return;
        }

        // fill vertical blanks
        const rowsFilled = fillVerticalBlanks(rows);

        // find header row
        const headerRowIndex = findHeaderRow(rowsFilled);
        const rawHeaders = rowsFilled[headerRowIndex].map(c => normalizeCell(c));
        const headersFilled = fillHeaderBlanks(rawHeaders).map(h => h.toLowerCase().trim());

        // map headers ignoring serial/slno etc
        const filteredHeaders = headersFilled.map(h => {
          if (!h) return '';
          const cleaned = h.replace(/\s+/g, '').toLowerCase();
          if (IGNORE_HEADERS.includes(cleaned)) {
            return '';
          }
          return h;
        });

        // data rows
        const dataRows = rowsFilled.slice(headerRowIndex + 1);
        const objs = dataRows.map(row => {
          const obj = {};
          for (let ci = 0; ci < filteredHeaders.length; ci++) {
            const fh = filteredHeaders[ci];
            if (!fh) continue;
            obj[fh] = normalizeCell(row[ci]);
          }
          // drop row if all fields empty
          const anyNonEmpty = Object.values(obj).some(v => v !== '');
          return anyNonEmpty ? obj : null;
        }).filter(r => r !== null);

        // determine keys present
        const presentKeys = new Set();
        objs.forEach(o => {
          Object.keys(o).forEach(k => {
            presentKeys.add(k.toLowerCase().trim());
          });
        });

        // normalize present keys (remove ignored)
        const normalizedPresent = Array.from(presentKeys).filter(k => {
          if (!k) return false;
          if (IGNORE_HEADERS.includes(k.replace(/\s+/g, ''))) return false;
          return true;
        });

        const extra = normalizedPresent.filter(k => !ALLOWED.includes(k));
        const missing = ALLOWED.filter(k => !normalizedPresent.includes(k));

        extra.forEach(e => globalExtra.add(e));
        missing.forEach(m => globalMissing.add(m));

        // clean records: each record only allowed fields, ensure all allowed keys exist (with '' if missing)
        const cleanedObjs = objs.map(o => {
          const rec = {};
          ALLOWED.forEach(field => {
            rec[field] = (o[field] !== undefined ? o[field] : '');
          });
          return rec;
        });

        // for preview
        sheetPreviews.push({ sheetName, headerRow: filteredHeaders, records: cleanedObjs.slice(0, 20) });

        allCleaned = allCleaned.concat(cleanedObjs);
      });

      setRawPreviews(sheetPreviews);

      const extras = Array.from(globalExtra);
      const missings = Array.from(globalMissing);

      if (extras.length > 0 || missings.length > 0) {
        let warn = '';
        if (extras.length > 0) warn += `Extra columns found: ${extras.join(', ')}. `;
        if (missings.length > 0) warn += `Missing required columns: ${missings.join(', ')}. `;
        warn += `Required columns: ${ALLOWED.join(', ')}.`;
        setColumnsWarning(warn);
        setIsValidColumns(false);
      } else {
        setColumnsWarning('');
        setIsValidColumns(true);
      }

      // drop fully blank records
      const filteredClean = allCleaned.filter(o => {
        return Object.values(o).some(v => v !== '');
      });

      setPreviewRecords(filteredClean);

    } catch (err) {
      console.error('Error during preview:', err);
      setMessage('Error parsing Excel/CSV file. Make sure file is not corrupted.');
    }
  };

  // send to backend to insert/upsert
  const handleSave = async () => {
    setMessage('');
    if (!isValidColumns) {
      setMessage('Cannot save: sheet columns do not match required fields.');
      return;
    }
    if (!previewRecords || previewRecords.length === 0) {
      setMessage('No valid data to save.');
      return;
    }
    try {
      setMessage('Saving...');
      const response = await axios.post('http://localhost:4000/admin/upload-sheet', {
        data: previewRecords
      }, { timeout: 60000 });
      const resp = response.data;
      // example expected response: { insertedCount, modifiedCount, invalidCount, invalidRows, ... }
      let msgParts = [];
      if (resp.insertedCount !== undefined) msgParts.push(`Inserted: ${resp.insertedCount}`);
      if (resp.modifiedCount !== undefined) msgParts.push(`Modified (existing updated): ${resp.modifiedCount}`);
      if (resp.invalidCount !== undefined) msgParts.push(`Invalid rows skipped: ${resp.invalidCount}`);
      if (resp.invalidRows) {
        msgParts.push(`Errors in some rows.`);
      }
      setMessage(msgParts.join('. '));
    } catch (err) {
      console.error('Error while saving:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setMessage(`Error: ${errMsg}`);
    }
  };

  return (
    <Layout title={"CRM- Upload Sheet"}>
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
                  >Save</button>
                </div>
              )}

              <div className="viewer mt-3">
                {rawPreviews.length > 0 ? rawPreviews.map(s => (
                  <div key={s.sheetName} style={{ marginBottom: '20px' }}>
                    <h6>Sheet: {s.sheetName}</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            {s.headerRow.map((h, idx) => (
                              <th key={idx}>{h || ''}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {s.records.map((r, ri) => (
                            <tr key={ri}>
                              {s.headerRow.map((h, ci) => {
                                const key = (h || '').toLowerCase().trim();
                                return <td key={ci}>{r[key] || ''}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )) : (
                  <div className="no-data-message">
                    <p>No file is uploaded yet!</p>
                  </div>
                )}
              </div>

              {message && <div className="alert alert-info mt-3">{message}</div>}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Uploadsheet;
