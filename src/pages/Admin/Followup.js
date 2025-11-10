import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { BASEURL } from '../../service/baseUrl';
import '../../css/followup.css'
import { Dropdown, Button } from 'react-bootstrap';
import { FaTrash, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
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

        // Determine title based on mode
        const title =
            mode === 'admission'
                ? 'Admission Report'
                : 'Contact Later Report';

        // Center the title text
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const textWidth =
            (doc.getStringUnitWidth(title) * doc.internal.getFontSize()) /
            doc.internal.scaleFactor;
        const textX = (pageWidth - textWidth) / 2;
        doc.text(title, textX, 20);

        // Define table headers
        const head = [['Sl. No', 'Name', 'Email', 'Phone', 'Course', 'Place', 'Moved At']];

        // Prepare table body
        const body = rows.map((r, index) => [
            index + 1,
            r.name,
            r.email,
            r.phone,
            r.course,
            r.place,
            new Date(r.movedAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            }),
        ]);

        // Add table with footer callback for page numbers
        autoTable(doc, {
            startY: 30,
            head,
            body,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [52, 58, 64], textColor: 255 },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
                const pageHeight = doc.internal.pageSize.getHeight();

                // Add footer text (page numbers)
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    `Page ${currentPage} of ${pageCount}`,
                    pageWidth - 40,
                    pageHeight - 10
                );
            },
        });

        // Save with descriptive filename
        const fileName =
            mode === 'admission'
                ? 'CRM-Admission-Followup-Report.pdf'
                : 'CRM-ContactLater-Followup-Report.pdf';

        doc.save(fileName);
    };

    const handleExportExcel = () => {
        if (rows.length === 0) {
            toast.info("No data available to export", {
                position: "top-center"
            });
            return;
        }

        const data = rows.map((r, index) => ({
            "Sl. No": index + 1,
            "Name": r.name,
            "Email": r.email,
            "Phone": r.phone,
            "Course": r.course,
            "Place": r.place,
            "Moved At": new Date(r.movedAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            }),
        }));

        // Create the worksheet with json data (headers will be auto)
        const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: false });

        // Insert a title at the top. For example one row with the report title
        const sheetTitle = mode === 'admission'
            ? 'CRM – Admission Follow-up Report'
            : 'CRM – Contact Later Follow-up Report';

        // Add the title row at the very top (row 1)
        XLSX.utils.sheet_add_aoa(worksheet, [[sheetTitle]], { origin: "A1" });

        // Then shift the data down one row so headers appear from row 2
        // We can reposition the data with origin: "A2"
        XLSX.utils.sheet_add_json(
            worksheet,
            data,
            { skipHeader: true, origin: "A2" }
        );

        // Optionally, you could remove the original data from row 1 if it duplicated,
        // or you can skip the first json_to_sheet step and build with AOA + JSON entirely.

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Followup Data');

        const fileName = mode === 'admission'
            ? 'CRM-Admission-Followup-Report.xlsx'
            : 'CRM-ContactLater-Follow-up-Report.xlsx';

        XLSX.writeFile(workbook, fileName);
    };



    // derived paginated rows
    const totalPages = Math.ceil(totalCount / rowsPerPage);


    const handleDelete = async (id) => {
        // Define the custom toast component
        const ConfirmDeleteToast = ({ closeToast }) => (
            <div>
                <p>Are you sure you want to delete this record?</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={async () => {
                            closeToast(); // Close the toast immediately
                            try {
                                await axios.delete(`${BASEURL}/admin/followup/${mode}/${id}`);
                                setRows(prev => prev.filter(r => r._id !== id));
                                setTotalCount(prev => prev - 1);
                                toast.success('Record deleted successfully', {
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
                                console.error('Error deleting record', err);
                                toast.error('Failed to delete record', {
                                    position: "top-center",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: "light",

                                });
                            }
                        }}
                        style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}
                    >
                        Confirm
                    </button>
                    <button
                        onClick={() => {
                            closeToast(); // Close the toast immediately
                            toast.info('Deletion cancelled', {
                                position: "top-center",
                                autoClose: 5000,
                                hideProgressBar: false,
                                closeOnClick: false,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: "light",

                            });
                        }}
                        style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );

        // Show the custom toast
        toast(<ConfirmDeleteToast />, {
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            position: 'top-center',
        });
    };
    return (
        <Layout title={"CRM - Follow Up"}>
            <div className="container-fluid m-3 p-3 admin-root">
                <div className="row">
                    <aside className="col-md-3">
                        <Adminmenu />
                    </aside>
                    <main className="col-md-9">
                        <div className="card admin-card p-4">
                            {/* Controls Toolbar */}
                            <div className="mb-3">
                                <div className="d-flex flex-wrap gap-2">
                                    {/* Search Input */}
                                    <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                                        <input
                                            id="searchInput"
                                            type="text"
                                            className="form-control w-100"
                                            placeholder="Search…"
                                            value={searchTerm}
                                            onChange={e => {
                                                setSearchTerm(e.target.value);
                                                setPage(1);
                                            }}
                                        />
                                    </div>

                                    {/* Select Table Dropdown */}
                                    <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                                        <Dropdown onSelect={(value) => { setMode(value); setPage(1); }}>
                                            <Dropdown.Toggle variant="secondary" className="w-100">
                                                {mode === 'admission'
                                                    ? 'Admission'
                                                    : mode === 'contactLater'
                                                        ? 'Contact Later'
                                                        : 'Select Table'}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item eventKey="admission">Admission</Dropdown.Item>
                                                <Dropdown.Item eventKey="contactLater">Contact Later</Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>

                                    {/* Sort By Dropdown */}
                                    <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                                        <Dropdown onSelect={(value) => setSortKey(value)}>
                                            <Dropdown.Toggle variant="secondary" className="w-100">
                                                {sortKey === 'name'
                                                    ? 'Name'
                                                    : sortKey === 'email'
                                                        ? 'Email'
                                                        : sortKey === 'course'
                                                            ? 'Course'
                                                            : sortKey === 'movedAt'
                                                                ? 'Moved At'
                                                                : 'Sort By'}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item eventKey="name">Name</Dropdown.Item>
                                                <Dropdown.Item eventKey="email">Email</Dropdown.Item>
                                                <Dropdown.Item eventKey="course">Course</Dropdown.Item>
                                                <Dropdown.Item eventKey="movedAt">Moved At</Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>

                                    {/* Sort Order Dropdown */}
                                    <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                                        <Dropdown onSelect={(value) => setSortDir(value)}>
                                            <Dropdown.Toggle variant="secondary" className="w-100">
                                                {sortDir === 'asc'
                                                    ? 'Ascending'
                                                    : sortDir === 'desc'
                                                        ? 'Descending'
                                                        : 'Order'}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item eventKey="asc">Ascending</Dropdown.Item>
                                                <Dropdown.Item eventKey="desc">Descending</Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>
                                </div>
                            </div>

                            <h5 className="mb-3 text-center">
                                {mode === 'admission' ? 'Admission Table' : 'Contact Later Table'}
                            </h5>

                            {/* Table */}
                            <div className="table-responsive">
                                <table className="table custom-table table-hover">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Course</th>
                                            <th>Place</th>
                                            <th>Moved At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="no-data-cell">No data found.</td>
                                            </tr>
                                        ) : (
                                            rows.map((r, i) => (
                                                <tr key={r._id}>
                                                    <td>{(page - 1) * rowsPerPage + i + 1}</td>
                                                    <td>
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={
                                                                <Tooltip id={`tooltip-${r._id}`}>
                                                                    {mode === 'admission'
                                                                        ? `Plan Type: ${r.planType || 'N/A'}`
                                                                        : `Current Assignee: ${r.assigneeName || 'N/A'}`}
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <span>{r.name}</span>
                                                        </OverlayTrigger>
                                                    </td>
                                                    <td>{r.email}</td>
                                                    <td>{r.phone}</td>
                                                    <td>{r.course}</td>
                                                    <td>{r.place}</td>
                                                    <td>{new Date(r.movedAt).toLocaleString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: true
                                                    })}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDelete(r._id)}
                                                            title="Delete record"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <button
                                        className="btn btn-outline-primary me-2"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page <= 1}
                                    >
                                        &lsaquo;
                                    </button>
                                    <button
                                        className="btn btn-outline-primary ms-2"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= totalPages}
                                    >
                                        &rsaquo;
                                    </button>
                                </div>

                                <div>
                                    <Dropdown>
                                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                                            {rowsPerPage === totalCount ? 'All' : rowsPerPage}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {ROWS_PER_PAGE_OPTIONS.map(opt => (
                                                <Dropdown.Item
                                                    key={opt}
                                                    active={opt === rowsPerPage}
                                                    onClick={() => {
                                                        setRowsPerPage(opt);
                                                        setPage(1);
                                                    }}
                                                >
                                                    {opt}
                                                </Dropdown.Item>
                                            ))}
                                            <Dropdown.Item
                                                key={totalCount}
                                                active={totalCount === rowsPerPage}
                                                onClick={() => {
                                                    setRowsPerPage(totalCount);
                                                    setPage(1);
                                                }}
                                            >
                                                All
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            </div>

                            {/* Export Button */}
                            <div className="me-2 mt-2 d-flex gap-2" style={{ flex: '0 0 auto' }}>
                                <Button
                                    variant="outline-primary"
                                    className="icon-only-btn d-flex align-items-center justify-content-center p-2"
                                    onClick={handleExportPDF}
                                    aria-label="Download PDF"
                                    title="Download PDF"
                                >
                                    <FaFilePdf size={16} />
                                </Button>

                                <Button
                                    variant="outline-success"
                                    className="icon-only-btn d-flex align-items-center justify-content-center p-2"
                                    onClick={handleExportExcel}
                                    aria-label="Download Excel"
                                    title="Download Excel"
                                >
                                    <FaFileExcel size={16} />
                                </Button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </Layout>



    );
}

export default Followup;
