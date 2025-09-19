import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import * as XLSX from 'xlsx';
import axios from 'axios';
import '../../css/uploadsheet.css';
import { toast } from 'react-toastify';

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
  const [excelFile, setExcelFile] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [previewRecords, setPreviewRecords] = useState([]);  // Records + maybe rowErrors
  const [rawPreviews, setRawPreviews] = useState([]);
  const [columnsWarning, setColumnsWarning] = useState('');
  const [isValidColumns, setIsValidColumns] = useState(false);
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);  // to store duplicates, missing, field validation errors
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
      };
      reader.onerror = () => {
        setTypeError('Error reading file.');
      };
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
      let allErrors = [];  // <--- new: collect field validation errors per row

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
        const objs = dataRows.map((row, rowIdxInSheet) => {
          const obj = {};
          for (let ci = 0; ci < filteredHeaders.length; ci++) {
            const fh = filteredHeaders[ci];
            if (!fh) continue;
            obj[fh] = normalizeCell(row[ci]);
          }
          const anyNonEmpty = Object.values(obj).some(v => v !== '');
          return anyNonEmpty ? { rec: obj, sheetName, rowIdxInSheet } : null;
        }).filter(r => r !== null);

        // Map objs to cleaned (with only ALLOWED fields) + run per-row field validations
        const cleanedWithErrors = objs.map(o => {
          const rec = {};
          ALLOWED.forEach(field => {
            if (o.rec[field] !== undefined) {
              rec[field] = String(o.rec[field]).trim();
            } else {
              // fuzzy match
              const foundKey = Object.keys(o.rec).find(k => k.includes(field));
              rec[field] = foundKey ? String(o.rec[foundKey]).trim() : '';
            }
          });

          // --- START ROW VALIDATION CODE ----
          const rowErrors = [];
          // name
          if (!rec.name) {
            rowErrors.push('name missing');
          } else if (!/^[A-Za-z\s'-]{2,50}$/.test(rec.name)) {
            rowErrors.push('name invalid; only letters, spaces, hyphens/apostrophes; length 2-50');
          }
          // email
          if (!rec.email) {
            rowErrors.push('email missing');
          } else if (!/^([\w-.]+@([\w-]+\.)+[\w-]{2,})$/.test(String(rec.email).toLowerCase())) {
            rowErrors.push('email invalid');
          }
          // phone
          if (!rec.phone) {
            rowErrors.push('phone missing');
          } else if (!/^\d{10}$/.test(rec.phone)) {
            rowErrors.push('phone invalid; must be exactly 10 digits');
          }
          // course
          if (!rec.course) {
            rowErrors.push('course missing');
          } else if (!/^[A-Za-z\s]{2,100}$/.test(rec.course)) {
            rowErrors.push('course invalid; only letters and spaces; length 2-100');
          }
          // place
          if (!rec.place) {
            rowErrors.push('place missing');
          } else if (!/^[A-Za-z\s]{2,100}$/.test(rec.place)) {
            rowErrors.push('place invalid; only letters and spaces; length 2-100');
          }

          if (rowErrors.length > 0) {
            allErrors.push({
              sheet: o.sheetName,
              rowIndex: o.rowIdxInSheet,  // zero-based
              errors: rowErrors,
              rec
            });
          }
          // --- END ROW VALIDATION CODE ----

          return { ...rec, sheet: o.sheetName, rowIdxInSheet: o.rowIdxInSheet };
        });

        previews.push({ sheetName, headerRow: filteredHeaders, records: cleanedWithErrors.slice(0, 20) });
        allCleaned = allCleaned.concat(cleanedWithErrors);
      });

      setRawPreviews(previews);

      // COLUMN CHECK
      const headersFound = Array.from(headersFoundSet);
      const missingRequiredColumns = ALLOWED.filter(a => !headersFound.includes(a));
      if (missingRequiredColumns.length > 0) {
        setColumnsWarning(`Missing required columns: ${missingRequiredColumns.join(', ')}`);
        setIsValidColumns(false);
        setMessage('Column mismatch detected. Fix headers before previewing data.');
        setHasDuplicatesOrErrors(true);
        return;
      }

      // CONTENT CHECKS: duplicates + missing values (fields on required fields) + field validation errors
      const seenEmails = new Map();
      const seenPhones = new Map();
      const duplicateRows = [];
      const missingValueRows = [];
      // note: field validation errors are already in allErrors

      const flagged = allCleaned.map((rec, idx) => {
        let isDup = false;
        const email = rec.email ? rec.email.toLowerCase().trim() : '';
        const phone = rec.phone ? rec.phone.trim() : '';

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

        const missingFields = ALLOWED.filter(f => !rec[f] || String(rec[f]).trim() === '');
        if (missingFields.length > 0) {
          missingValueRows.push({ rowIndex: idx, missingFields, rec });
        }

        return { ...rec, isDuplicate: isDup };
      });

      setPreviewRecords(flagged);

      const hasDup = duplicateRows.length > 0;
      const hasMissing = missingValueRows.length > 0;
      const hasFieldErrors = allErrors.length > 0;

      // Decide the message and what to show based on combinations
      const errorsToDisplay = [];

      if (hasDup) errorsToDisplay.push({ type: 'duplicates', items: duplicateRows });
      if (hasMissing) errorsToDisplay.push({ type: 'missing', items: missingValueRows });
      if (hasFieldErrors) errorsToDisplay.push({ type: 'fieldErrors', items: allErrors });

      if (hasDup || hasMissing || hasFieldErrors) {
        // you can decide priority / combination
        let msg = '';
        if (hasDup && hasMissing && hasFieldErrors) {
          msg = 'Preview has duplicates, missing values, and invalid field formats. Please fix all.';
        } else if (hasDup && hasMissing) {
          msg = 'Preview has duplicates and missing values. Please correct both.';
        } else if (hasDup && hasFieldErrors) {
          msg = 'Preview has duplicates and invalid formats. Please correct.';
        } else if (hasMissing && hasFieldErrors) {
          msg = 'Preview has missing values and invalid formats. Please correct.';
        } else if (hasDup) {
          msg = 'Preview has duplicate rows. Please correct duplicates.';
        } else if (hasMissing) {
          msg = 'Preview has missing values. Please fill required fields.';
        } else if (hasFieldErrors) {
          msg = 'Preview has invalid field formats. Please correct them.';
        }

        setErrorDetails(errorsToDisplay);
        setMessage(msg);
        setHasDuplicatesOrErrors(true);
        setIsValidColumns(false);
      } else {
        setErrorDetails([]);
        setMessage('Preview ready. All rows valid: no duplicates, no missing, formats OK.');
        setHasDuplicatesOrErrors(false);
        setIsValidColumns(true);
      }

    } catch (err) {
      console.error('Error parsing file:', err);
      setMessage('Error parsing file. Make sure it is a valid Excel/CSV file.');
      setHasDuplicatesOrErrors(true);
      setIsValidColumns(false);
    }
  };

  const handleSave = async () => {
    setMessage('');
    if (!isValidColumns) {
      toast.error('Cannot save: there are duplicate/missing/invalid rows or invalid columns.');
      return;
    }
    if (previewRecords.length === 0) {
      toast.info('No data to save.');
      return;
    }

    const payload = previewRecords.map(r => {
      const out = {};
      ALLOWED.forEach(f => {
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
      if (resp.alreadyExisting && resp.alreadyExisting.length > 0) {
        const rows = resp.alreadyExisting.map(e => (e.rowIndex + 1)).join(', ');
        msgParts.push(`Already existing rows: ${rows}`);
        toast.info(`Rows already existed: ${rows}`);
      }

      const overallMessage = msgParts.join('. ') || 'Save completed.';
      setMessage(overallMessage);
      toast.success('Save completed.');
    } catch (err) {
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
                        <th>Flags / Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRecords.map((rec, idx) => {
                        // see if this row had field errors
                        const errObj = errorDetails.find(block => block.type === 'fieldErrors')?.items.find(e => e.rowIndex === idx);
                        const hasFieldErr = !!errObj;
                        return (
                          <tr
                            key={idx}
                            className={
                              rec.isDuplicate 
                                ? 'duplicate-row' 
                                : hasFieldErr 
                                  ? 'field-error-row' 
                                  : ''
                            }
                          >
                            {ALLOWED.map((field, fidx) => (
                              <td key={fidx}>{rec[field]}</td>
                            ))}
                            <td>
                              {rec.isDuplicate && 'DUPLICATE'}
                              {hasFieldErr && ` ERR: ${errObj.errors.join('; ')}`}
                            </td>
                          </tr>
                        );
                      })}
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
                    } else if (block.type === 'fieldErrors') {
                      return (
                        <div key={bi}>
                          <h5>Rows with invalid field formats</h5>
                          <ul>
                            {block.items.map((e, i) => (
                              <li key={i}>
                                Row: <strong>{e.rowIndex + 1}</strong> — Errors: {e.errors.join('; ')}
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
