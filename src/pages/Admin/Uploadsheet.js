import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import * as XLSX from 'xlsx';
import axios from 'axios';
import '../../css/uploadsheet.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {BASEURL} from '../../service/baseUrl'
const ALLOWED = ['name', 'email', 'phone', 'course', 'place'];
const IGNORE_HEADERS = ['slno', 'sno', 's.no', 'srno', 'serialno', 'serial', 'id'];

function normalizeCell(cell) {
  if (cell === null || cell === undefined) return '';
  return String(cell).trim();
}
function normalizeEmail(e) {
  if (!e) return '';
  return String(e).toLowerCase().trim();
}
function normalizePhone(p) {
  if (!p) return '';
  return String(p).replace(/\s+/g, '').trim();
}
function normalizeText(s) {
  if (!s) return '';
  return String(s).toLowerCase().replace(/\s+/g, ' ').trim();
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
  return null;  // changed: return null if no header row found
}

function Uploadsheet() {
  const [excelFile, setExcelFile] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [previewRecords, setPreviewRecords] = useState([]);
  const [rawPreviews, setRawPreviews] = useState([]);
  const [columnsWarning, setColumnsWarning] = useState('');
  const [isValidColumns, setIsValidColumns] = useState(false);
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
  const [hasDuplicatesOrErrors, setHasDuplicatesOrErrors] = useState(false);
  const [hasOnlyHeaders, setHasOnlyHeaders] = useState(false);
  const [noHeadersFound, setNoHeadersFound] = useState(false);

  const handleFile = (e) => {
    setTypeError(null);
    setPreviewRecords([]);
    setRawPreviews([]);
    setColumnsWarning('');
    setIsValidColumns(false);
    setMessage('');
    setErrorDetails([]);
    setHasDuplicatesOrErrors(false);
    setHasOnlyHeaders(false);
    setNoHeadersFound(false);

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
    setHasOnlyHeaders(false);
    setNoHeadersFound(false);

    if (!excelFile) {
      setMessage('No file loaded.');
      return;
    }

    try {
      const workbook = XLSX.read(excelFile, { type: 'buffer' });
      let allCleaned = [];  // all valid records with sheet + row info
      let previews = [];
      let headersFoundSet = new Set();
      let allFieldErrors = [];
      let duplicateRows = [];
      let missingValueRows = [];

      let headersDetectedAtLeastOnce = false;

      workbook.SheetNames.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }); // array of arrays
        if (!rows || rows.length === 0) {
          return;
        }

        const rowsFilled = fillVerticalBlanks(rows);
        const headerRowIndex = findHeaderRow(rowsFilled);

        if (headerRowIndex === null) {
          // no non-empty row at all in this sheet => no headers
          return;
        }
        // we have some header row
        headersDetectedAtLeastOnce = true;

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

        // collect detected headers
        filteredHeaders.forEach(h => {
          if (h) headersFoundSet.add(h);
        });

        const dataRows = rowsFilled.slice(headerRowIndex + 1); // rows after header
        const objs = dataRows.map((row, rowIdxInSlice) => {
          const obj = {};
          for (let ci = 0; ci < filteredHeaders.length; ci++) {
            const fh = filteredHeaders[ci];
            if (!fh) continue;
            obj[fh] = normalizeCell(row[ci]);
          }
          const anyNonEmpty = Object.values(obj).some(v => v !== '');
          return anyNonEmpty
            ? { rec: obj, sheetName, rowIdxInSheet: headerRowIndex + 1 + rowIdxInSlice }
            : null;
        }).filter(r => r !== null);

        const cleaned = objs.map(o => {
          const rec = { sheetName: o.sheetName, rowIdxInSheet: o.rowIdxInSheet };
          ALLOWED.forEach(field => {
            if (o.rec[field] !== undefined) {
              rec[field] = String(o.rec[field]).trim();
            } else {
              const foundKey = Object.keys(o.rec).find(k => k.includes(field));
              rec[field] = foundKey ? String(o.rec[foundKey]).trim() : '';
            }
          });
          rec._normEmail = normalizeEmail(rec.email);
          rec._normPhone = normalizePhone(rec.phone);
          rec._nameCoursePlace = `${normalizeText(rec.name)}|${normalizeText(rec.course)}|${normalizeText(rec.place)}`;
          return rec;
        });

        previews.push({ sheetName, headerRow: filteredHeaders, records: cleaned.slice(0, 20) });
        allCleaned = allCleaned.concat(cleaned);
      });

      setRawPreviews(previews);

      if (!headersDetectedAtLeastOnce) {
        // no headers found in any sheet
        setNoHeadersFound(true);
        setMessage('No headers found in the uploaded file. Please ensure the file has a header row with column names.');
        setIsValidColumns(false);
        return;
      }

      // check if there is any valid data row at all
      const totalValidRows = allCleaned.length;
      if (totalValidRows === 0) {
        // Only headers, no data
        setHasOnlyHeaders(true);
        setPreviewRecords([]);  // so table shows headers but no rows
        setMessage('No data rows found. Only headers are present.');
        setIsValidColumns(false);
        setHasDuplicatesOrErrors(false);
        return;
      }

      // check required columns
      const headersFound = Array.from(headersFoundSet);
      const missingRequiredColumns = ALLOWED.filter(a => !headersFound.includes(a));
      if (missingRequiredColumns.length > 0) {
        setColumnsWarning(`Missing required columns: ${missingRequiredColumns.join(', ')}`);
        setIsValidColumns(false);
        setMessage('Column mismatch detected. Fix headers before previewing data.');
        setHasDuplicatesOrErrors(true);
        return;
      }

      // Validate each record’s fields
      allCleaned.forEach(rec => {
        const errs = [];
        if (!rec.name) {
          errs.push('name missing');
        } else if (!/^[A-Za-z\s\'-]{2,50}$/.test(rec.name)) {
          errs.push('name invalid; only letters, spaces, hyphens/apostrophes; length 2-50');
        }
        if (!rec.email) {
          errs.push('email missing');
        } else if (!/^([\w-.]+@([\w-]+\.)+[\w-]{2,})$/.test(String(rec.email).toLowerCase())) {
          errs.push('email invalid');
        }
        if (!rec.phone) {
          errs.push('phone missing');
        } else if (!/^\d{10}$/.test(rec.phone)) {
          errs.push('phone invalid; must be exactly 10 digits');
        }
        if (!rec.course) {
          errs.push('course missing');
        } else if (!/^[A-Za-z\s]{2,100}$/.test(rec.course)) {
          errs.push('course invalid; only letters and spaces; length 2-100');
        }
        if (!rec.place) {
          errs.push('place missing');
        } else if (!/^[A-Za-z\s]{2,100}$/.test(rec.place)) {
          errs.push('place invalid; only letters and spaces; length 2-100');
        }

        if (errs.length > 0) {
          allFieldErrors.push({ sheetName: rec.sheetName, rowIdxInSheet: rec.rowIdxInSheet, errors: errs, rec });
        }
      });

      // Duplicate and missing checks
      const seenEmails = new Map();
      const seenPhones = new Map();
      allCleaned.forEach(rec => {
        const email = rec._normEmail || '';
        const phone = rec._normPhone || '';
        if (email) {
          if (!seenEmails.has(email)) {
            seenEmails.set(email, rec);
          } else {
            duplicateRows.push({ sheetName: rec.sheetName, rowIdxInSheet: rec.rowIdxInSheet, errors: ['duplicate email'], rec });
          }
        }
        if (phone) {
          if (!seenPhones.has(phone)) {
            seenPhones.set(phone, rec);
          } else {
            duplicateRows.push({ sheetName: rec.sheetName, rowIdxInSheet: rec.rowIdxInSheet, errors: ['duplicate phone'], rec });
          }
        }
        const missingFields = ALLOWED.filter(f => !rec[f] || String(rec[f]).trim() === '');
        if (missingFields.length > 0) {
          missingValueRows.push({ sheetName: rec.sheetName, rowIdxInSheet: rec.rowIdxInSheet, missingFields, rec });
        }
      });

      setErrorDetails([
        ...(duplicateRows.length > 0 ? [{ type: 'duplicates', items: duplicateRows }] : []),
        ...(missingValueRows.length > 0 ? [{ type: 'missing', items: missingValueRows }] : []),
        ...(allFieldErrors.length > 0 ? [{ type: 'fieldErrors', items: allFieldErrors }] : []),
      ]);

      const hasDup = duplicateRows.length > 0;
      const hasMissing = missingValueRows.length > 0;
      const hasFieldErr = allFieldErrors.length > 0;

      let msg = '';
      if (hasDup && hasMissing && hasFieldErr) {
        msg = 'Preview has duplicates, missing values, and invalid field formats. Please fix all.';
      } else if (hasDup && hasMissing) {
        msg = 'Preview has duplicates and missing values. Please correct both.';
      } else if (hasDup && hasFieldErr) {
        msg = 'Preview has duplicates and invalid formats. Please correct.';
      } else if (hasMissing && hasFieldErr) {
        msg = 'Preview has missing values and invalid formats. Please correct.';
      } else if (hasDup) {
        msg = 'Preview has duplicate rows. Please correct duplicates.';
      } else if (hasMissing) {
        msg = 'Preview has missing values. Please fill required fields.';
      } else if (hasFieldErr) {
        msg = 'Preview has invalid field formats. Please correct them.';
      } else {
        msg = 'Preview ready. All rows valid: no duplicates, no missing, formats OK.';
      }

      setPreviewRecords(allCleaned);
      setMessage(msg);
      setHasDuplicatesOrErrors(hasDup || hasMissing || hasFieldErr);
      setIsValidColumns(!(hasDup || hasMissing || hasFieldErr));

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
      toast.error('Cannot save: duplicate/missing/invalid rows or invalid columns.');
      return;
    }
    if (previewRecords.length === 0) {
      toast.info('No data to save.');
      return;
    }

    const payload = previewRecords.map(rec => {
      const out = {};
      ALLOWED.forEach(f => {
        out[f] = rec[f] !== undefined && rec[f] !== null ? String(rec[f]).trim() : '';
      });
      return out;
    });

    const emailToRec = new Map();
    const phoneToRec = new Map();
    const namecpToRec = new Map();
    previewRecords.forEach((r, idx) => {
      const ne = normalizeEmail(r.email);
      const np = normalizePhone(r.phone);
      const ncp = r._nameCoursePlace || '';
      if (ne) emailToRec.set(ne, r);
      if (np) phoneToRec.set(np, r);
      if (ncp) namecpToRec.set(ncp, r);
      r._payloadIndex = idx;
    });

    try {
      const response = await axios.post(`${BASEURL}/admin/upload-sheet`, { data: payload }, { timeout: 60000 });
      const resp = response.data;
      console.debug('server alreadyExisting:', resp.alreadyExisting);
      const msgParts = [];
      if (resp.insertedCount !== undefined) msgParts.push(`Inserted: ${resp.insertedCount}`);
      if (resp.modifiedCount !== undefined) msgParts.push(`Modified: ${resp.modifiedCount}`);
      if (resp.invalidCount !== undefined) msgParts.push(`Invalid rows: ${resp.invalidCount}`);

      if (resp.alreadyExisting && Array.isArray(resp.alreadyExisting) && resp.alreadyExisting.length > 0) {
        const serverItems = resp.alreadyExisting;
        const rowsListArr = serverItems.map((e, idx) => {
          let sheet = e.sheetName || e.sheet || null;
          let rowNum = null;
          if (e.rowIdxInSheet !== undefined && e.rowIdxInSheet !== null) {
            const parsed = Number(e.rowIdxInSheet);
            if (!Number.isNaN(parsed)) rowNum = parsed + 1;
          } else if (e.rowIndex !== undefined && e.rowIndex !== null) {
            const parsed = Number(e.rowIndex);
            if (!Number.isNaN(parsed)) rowNum = parsed + 1;
          } else if (e.row !== undefined && e.row !== null) {
            const parsed = Number(e.row);
            if (!Number.isNaN(parsed)) rowNum = parsed + 1;
          } else if (e.index !== undefined && e.index !== null) {
            const parsed = Number(e.index);
            if (!Number.isNaN(parsed)) rowNum = parsed + 1;
          }

          const keyEmail = normalizeEmail(e.email || e.mail || e._email || '');
          const keyPhone = normalizePhone(e.phone || e._phone || '');
          const keyNameCP = normalizeText((e.name || e.fullname || e.name_full || '') + '|' + (e.course || '') + '|' + (e.place || ''));

          let matched = null;
          if (keyEmail && emailToRec.has(keyEmail)) matched = emailToRec.get(keyEmail);
          else if (keyPhone && phoneToRec.has(keyPhone)) matched = phoneToRec.get(keyPhone);
          else if (keyNameCP && namecpToRec.has(keyNameCP)) matched = namecpToRec.get(keyNameCP);

          if (!matched) {
            try {
              const s = JSON.stringify(e).toLowerCase();
              for (let pr of previewRecords) {
                if (pr._normEmail && s.includes(pr._normEmail)) { matched = pr; break; }
                if (pr._normPhone && s.includes(pr._normPhone)) { matched = pr; break; }
                if (pr._nameCoursePlace) {
                  const frags = pr._nameCoursePlace.split('|').filter(Boolean);
                  let foundFrag = false;
                  for (let f of frags) {
                    if (f && s.includes(f)) { foundFrag = true; break; }
                  }
                  if (foundFrag) { matched = pr; break; }
                }
              }
            } catch (ex) {
              // ignore
            }
          }

          if (!matched && serverItems.length === payload.length) {
            const pr = previewRecords[idx];
            if (pr) matched = pr;
          }

          if (matched) {
            sheet = sheet || matched.sheetName;
            if (!rowNum && matched.rowIdxInSheet) {
              rowNum = matched.rowIdxInSheet;
            }
          }

          sheet = sheet || 'UnknownSheet';
          rowNum = rowNum !== null && rowNum !== undefined ? rowNum : 'UnknownRow';

          return `${sheet} Row ${rowNum}`;
        });

        const short = rowsListArr.slice(0, 10).join(', ');
        const suffix = rowsListArr.length > 10 ? `, and ${rowsListArr.length - 10} more...` : '';
        const shortTrimmed = short.slice(0, 10);
        toast.info(`Rows already existed: ${shortTrimmed}${suffix}`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",

        });
        msgParts.push(`Already existing rows: ${rowsListArr.join(', ')}`);
      }

      const overallMessage = msgParts.join('. ') || 'Save completed.';
      setMessage(overallMessage);
      toast.success('Save completed.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",

      });
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
        <ToastContainer limit={3} />
        <div className="row">
          <aside className="col-md-3"><Adminmenu /></aside>
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

              {(previewRecords.length > 0 && !hasOnlyHeaders) && (
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
                {noHeadersFound ? (
                  <div className="alert alert-warning">
                    No headers found in the file. Please add a header row with column names like: {ALLOWED.join(', ')}.
                  </div>
                ) : ((previewRecords.length > 0 || hasOnlyHeaders) ? (
                  <div className="table-container">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Sheet</th>
                          {ALLOWED.map((h, idx) => (
                            <th key={idx}>{h}</th>
                          ))}
                          <th>Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRecords.length > 0 ? (
                          previewRecords.map(rec => {
                            const dupErr = errorDetails.find(block => block.type === 'duplicates')?.items.find(e => (e.sheetName === rec.sheetName && e.rowIdxInSheet === rec.rowIdxInSheet));
                            const missErr = errorDetails.find(block => block.type === 'missing')?.items.find(e => (e.sheetName === rec.sheetName && e.rowIdxInSheet === rec.rowIdxInSheet));
                            const fldErr = errorDetails.find(block => block.type === 'fieldErrors')?.items.find(e => (e.sheetName === rec.sheetName && e.rowIdxInSheet === rec.rowIdxInSheet));

                            const errMessages = [];
                            if (dupErr) errMessages.push(...dupErr.errors);
                            if (missErr) errMessages.push(`missing: ${missErr.missingFields.join(', ')}`);
                            if (fldErr) errMessages.push(...fldErr.errors);

                            const rowClass = dupErr ? 'duplicate-row' : fldErr ? 'field-error-row' : '';

                            return (
                              <tr key={`${rec.sheetName}-${rec.rowIdxInSheet}`} className={rowClass}>
                                <td>{rec.sheetName} (Row {rec.rowIdxInSheet})</td>
                                {ALLOWED.map((field, fidx) => (
                                  <td key={fidx}>{rec[field]}</td>
                                ))}
                                <td>{errMessages.join('; ')}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={ALLOWED.length + 2} style={{ textAlign: 'center' }}>
                              No data rows to display.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info mt-3" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>No preview yet.</div>
                ))}
              </div>

              {errorDetails.length > 0 && (
                <div className="alert alert-danger mt-3">
                  {errorDetails.map((block, bi) => {
                    if (block.type === 'duplicates') {
                      return (
                        <div key={bi}>
                          <h5>Duplicate Rows</h5>
                          <ul>
                            {block.items.map((e, i) => (
                              <li key={i}>
                                Sheet: <strong>{e.sheetName}</strong>, Row: <strong>{e.rowIdxInSheet}</strong> — {e.errors.join(', ')}
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
                                Sheet: <strong>{e.sheetName}</strong>, Row: <strong>{e.rowIdxInSheet}</strong> — missing: {e.missingFields.join(', ')}
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
                                Sheet: <strong>{e.sheetName}</strong>, Row: <strong>{e.rowIdxInSheet}</strong> — errors: {e.errors.join('; ')}
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

              {message && <div className="alert alert-info mt-3" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message}</div>}

            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Uploadsheet;

