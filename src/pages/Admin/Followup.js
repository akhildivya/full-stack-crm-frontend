import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { BASEURL } from '../../service/baseUrl';
import '../../css/followup.css'
const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

function Followup() {
    const [mode, setMode] = useState('admission'); // 'admission' or 'contactLater'
    const [rows, setRows] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('');
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // fetch data when mode/search/sort/page/rowsPerPage change
    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = `${BASEURL}/admin/followup/${mode}`;  // mode = 'admission' or 'contactLater'
                const params = {
                    search: searchTerm || undefined,
                    sortKey: sortKey || undefined,
                    sortDir,
                    page,
                    limit: rowsPerPage
                };
                const resp = await axios.get(url, { params });
                setRows(resp.data.rows);
                setTotalCount(resp.data.total);
            } catch (err) {
                console.error('Error loading follow-up data', err);
            }
        };
        fetchData();
    }, [mode, searchTerm, sortKey, sortDir, page, rowsPerPage]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const head = [['Name', 'Email', 'Phone', 'Course', 'Place', 'Moved At']];
        const body = rows.map(r => [
            r.name,
            r.email,
            r.phone,
            r.course,
            r.place,
            new Date(r.movedAt).toLocaleString()
        ]);
        autoTable(doc, { head, body });
        doc.save(`${mode === 'admission' ? 'Admission' : 'ContactLater'}Report.pdf`);
    };

    // derived paginated rows
    const totalPages = Math.ceil(totalCount / rowsPerPage);

    return (
        <Layout title={"CRM- Follow Up"}>
            <div className="container-fluid m‐3 p‐3 admin-root">
                <div className="row">
                    <aside className="col-md-3">
                        <Adminmenu />
                    </aside>
                    <main className="col-md-9">
                        <div className="card admin-card p-4">

                            {/* Dropdown for mode */}
                            <div className="mb-3">
                                <label>Select Table: </label>
                                <select
                                    className="form-select w-auto d-inline-block ms-2"
                                    value={mode}
                                    onChange={e => {
                                        setMode(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="admission">Admission</option>
                                    <option value="contactLater">Contact Later</option>
                                </select>
                            </div>

                            {/* Search / Sort toolbar */}
                            {/* Search / Sort toolbar */}
                            <div className="mb-3 d-flex flex-wrap gap-2">
                                <div className="d-flex flex-column flex-sm-row gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search…"
                                        className="form-control flex-grow-1"
                                        value={searchTerm}
                                        onChange={e => {
                                            setSearchTerm(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                    <select
                                        className="form-select w-auto"
                                        value={sortKey}
                                        onChange={e => setSortKey(e.target.value)}
                                    >
                                        <option value="">Sort By</option>
                                        <option value="name">Name</option>
                                        <option value="email">Email</option>
                                        <option value="course">Course</option>
                                        <option value="movedAt">Moved At</option>
                                    </select>
                                    <select
                                        className="form-select w-auto"
                                        value={sortDir}
                                        onChange={e => setSortDir(e.target.value)}
                                    >
                                        <option value="asc">Ascending</option>
                                        <option value="desc">Descending</option>
                                    </select>
                                </div>

                                <button className="btn btn-success ms-auto" onClick={handleExportPDF}>
                                    Export to PDF
                                </button>
                            </div>


                            {/* Table */}
                            <div className="table-responsive">
                                <table className="table custom-table table-hover">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th><th>Email</th><th>Phone</th><th>Course</th><th>Place</th><th>Moved At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.length === 0 ? (
                                            <tr><td colSpan="7" className="no-data-cell">No data found.</td></tr>
                                        ) : (
                                            rows.map((r, i) => (
                                                <tr key={r._id}>
                                                    <td>{(page - 1) * rowsPerPage + i + 1}</td>
                                                    <td>{r.name}</td>
                                                    <td>{r.email}</td>
                                                    <td>{r.phone}</td>
                                                    <td>{r.course}</td>
                                                    <td>{r.place}</td>
                                                    <td>{new Date(r.movedAt).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination & rows per page */}
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <button
                                        className="btn btn-outline-primary me-2"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page <= 1}
                                    >
                                        Previous
                                    </button>

                                    <button
                                        className="btn btn-outline-primary ms-2"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= totalPages}
                                    >
                                        Next
                                    </button>
                                </div>

                                <div>

                                    <select
                                        className="form-select w-auto d-inline-block ms-2"
                                        value={rowsPerPage}
                                        onChange={e => {
                                            setRowsPerPage(Number(e.target.value));
                                            setPage(1);
                                        }}
                                    >
                                        {ROWS_PER_PAGE_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value={totalCount}>All</option>
                                    </select>
                                </div>
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
}

export default Followup;
