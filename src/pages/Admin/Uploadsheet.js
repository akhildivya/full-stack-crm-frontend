import React, { useState } from 'react';
import Layout from '../../components/layout/Layout'
import Adminmenu from '../../components/layout/Adminmenu'
import * as XLSX from 'xlsx';
import '../../css/uploadsheet.css'

function Uploadsheet() {
    // onchange states
    const [excelFile, setExcelFile] = useState(null);
    const [typeError, setTypeError] = useState(null);

    // submit state
    const [excelData, setExcelData] = useState(null);

    // onchange event
    const handleFile = (e) => {
        let fileTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
        let selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile && fileTypes.includes(selectedFile.type)) {
                setTypeError(null);
                let reader = new FileReader();
                reader.readAsArrayBuffer(selectedFile);
                reader.onload = (e) => {
                    setExcelFile(e.target.result);
                }
            }
            else {
                setTypeError('Please select only excel file types');
                setExcelFile(null);
            }
        }
        else {
            console.log('Please select your file');
        }
    }

    // submit event
    const handleFileSubmit = (e) => {
        e.preventDefault();
        if (excelFile !== null) {
            const workbook = XLSX.read(excelFile, { type: 'buffer' });
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            setExcelData(data.slice(0, 10));
        }
    }
    return (
        <Layout title={"CRM- Upload Details"}>
            <div className="container-fluid m-3 p-3 admin-root">
                <div className="row">
                    <aside className="col-md-3">
                        <Adminmenu />
                    </aside>
                    <main className="col-md-9">
                        <div className="card admin-card p-4 upload-form">
                            <h4>Upload Sheet</h4>
                            <form className="form-group custom-form" onSubmit={handleFileSubmit}>
                                <input
                                    type="file"
                                    className="form-control"
                                    required
                                    onChange={handleFile}
                                />
                                <button type="submit" className="mt-3 btn btn-success btn-md">
                                    Upload
                                </button>
                                {typeError && (
                                    <div className="alert alert-danger" role="alert">
                                        {typeError}
                                    </div>
                                )}
                            </form>

                            <div className="viewer">
                                {excelData && excelData.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    {Object.keys(excelData[0]).map((key) => (
                                                        <th key={key}>{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {excelData.map((row, idx) => (
                                                    <tr key={idx}>
                                                        {Object.keys(row).map((key) => (
                                                            <td key={key}>{row[key]}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="no-data-message">
                                        <p>No file is uploaded yet!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    )
}

export default Uploadsheet