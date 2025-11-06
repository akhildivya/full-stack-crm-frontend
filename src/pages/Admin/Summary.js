import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Adminmenu from '../../components/layout/Adminmenu';
import { BASEURL } from '../../service/baseUrl';
import axios from 'axios';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { Dropdown } from 'react-bootstrap';

// Import Recharts components
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Button } from 'react-bootstrap';
import { FaFilePdf } from 'react-icons/fa';
function Summary() {
  const [userSummary, setUserSummary] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);

 
  

  useEffect(() => {
    axios
      .get(`${BASEURL}/admin/users-summary-report`)
      .then((res) => setUserSummary(res.data))
      .catch((err) => console.error('Error fetching user summary', err));
  }, []);



  function formatMinSecFromSeconds(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins} min ${secs} sec`;
  }

  const columns = useMemo(() => [
    { Header: '#', accessor: 'slno', Cell: ({ row }) => row.index + 1 },
    { Header: 'Name', accessor: 'name' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Phone', accessor: 'phone' },
    { Header: 'Assigned', accessor: 'totalContacts' },
    {
      Header: 'Completed',
      accessor: 'completed',
      Cell: ({ row }) => {
        const { completed, totalContacts } = row.original;
        // Show number only if all tasks completed (i.e., match total) => therefore verified tasks only scenario
        return (completed > 0 && completed === totalContacts) ? completed : 'Pending';
      }
    },
    {
      Header: 'Total Call Duration',
      accessor: 'totalDuration',
      Cell: ({ value, row }) => {
        const { completed, totalContacts } = row.original;
        const allDone = (completed > 0 && completed === totalContacts);
        const totalMinutes = Number(value) || 0;
        const totalSecs = Math.floor(totalMinutes * 60);
        const formattedMinSec = formatMinSecFromSeconds(totalSecs);

        return (
          <span
            title={allDone ? `${formattedMinSec} (${totalSecs} sec)` : 'User tasks not yet verified/completed'}
            style={{ color: allDone ? '#000' : '#888' }}
          >
            {totalMinutes.toFixed(2)}
          </span>
        );
      }
    },
    { Header: 'Assigned At', accessor: 'assignedAt' },
    {
      Header: 'Completed At',
      accessor: 'completedAt',
      Cell: ({ value, row }) =>  {
        const { completed, totalContacts } = row.original;
        const allDone = (completed > 0 && completed === totalContacts);
        return allDone ? (value || '—') : 'Pending';
      }
    }
  ], []);


  const data = useMemo(() =>
    userSummary.map((u, idx) => ({
      ...u,
      slno: idx + 1,
      completed: u.completed ?? 0,
      completedAt: u.completedAt ?? ''
    }))
    , [userSummary]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, globalFilter },
    setGlobalFilter,
    gotoPage,
    setPageSize,
    canPreviousPage,
    canNextPage,
    pageCount,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
        pageSize: itemsPerPage,
      },
      manualPagination: false,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    setPageSize(itemsPerPage);
    gotoPage(0);
  }, [itemsPerPage, setPageSize, gotoPage]);

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4'); // points, A4 portrait
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    const title = 'User Summary Report';
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 40, { align: 'center' });

    // Headers
    const headers = [
      'Sl No',
      'Name',
      'Email',
      'Phone',
      'Assigned',
      'Completed',
      'Total Call Duration (min)',                 // numeric (original)
      'Total Call Duration (min:sec | sec)',      // formatted tooltip-style column
      'Assigned At',
      'Completed At'
    ];

    // Build tableData
    const tableData = userSummary.map((user, idx) => {
      const totalMinutes = Number(user.totalDuration) || 0; // assume minutes
      const totalSecs = Math.floor(totalMinutes * 60);
      const formattedMinSec = formatMinSecFromSeconds(totalSecs);
      const formattedTooltipLike = `${formattedMinSec} (${totalSecs} sec)`;

      return [
        idx + 1,
        user.name || '',
        user.email || '',
        user.phone || '',
        user.totalContacts ?? '',
        user.completed ?? '',
        Number.isFinite(totalMinutes) ? totalMinutes.toFixed(4) : String(user.totalDuration || ''),
        formattedTooltipLike,
        user.assignedAt || '',
        user.completedAt || ''
      ];
    });

    // Margins and usable width
    const margin = { left: 10, right: 10, top: 70, bottom: 40 };
    const usablePageWidth = pageWidth - margin.left - margin.right;

    // Proportions for each column (must match headers length).
    // Adjust these numbers to change relative widths.
    // Sum of proportions doesn't need to be 1; we normalize them below.
    const proportions = [0.04, 0.16, 0.26, 0.10, 0.07, 0.07, 0.08, 0.14, 0.07, 0.06];

    // Normalize and compute widths (ensure min widths)
    const totalProp = proportions.reduce((a, b) => a + b, 0);
    const rawWidths = proportions.map(p => (p / totalProp) * usablePageWidth);

    // Minimum widths to avoid columns being too narrow
    const minWidths = [30, 70, 120, 50, 40, 40, 60, 90, 60, 60];

    // Final widths: max(raw, min)
    const finalWidths = rawWidths.map((w, i) => Math.max(w, minWidths[i]));

    // If final widths sum exceed usablePageWidth (due to minWidth bumps), scale down proportionally
    const sumFinal = finalWidths.reduce((a, b) => a + b, 0);
    if (sumFinal > usablePageWidth) {
      const scale = usablePageWidth / sumFinal;
      for (let i = 0; i < finalWidths.length; i++) finalWidths[i] = Math.floor(finalWidths[i] * scale);
      // last column gets remaining pixels to make total exact
      const diff = usablePageWidth - finalWidths.reduce((a, b) => a + b, 0);
      if (diff > 0) finalWidths[finalWidths.length - 1] += diff;
    } else {
      // if there's leftover space, give a little extra to the Email and formatted duration columns
      const leftover = usablePageWidth - sumFinal;
      if (leftover > 0) finalWidths[2] += Math.floor(leftover * 0.6); // email
      finalWidths[7] += Math.floor(leftover * 0.4); // formatted duration
    }

    // Prepare columnStyles for autoTable (index keys)
    const columnStyles = {};
    for (let i = 0; i < finalWidths.length; i++) {
      columnStyles[i] = { cellWidth: finalWidths[i] };
      // Align certain columns
      if (i === 0) columnStyles[i].halign = 'center';
      if (i === 6) columnStyles[i].halign = 'right';
      if (i === 3 || i === 4 || i === 5) columnStyles[i].halign = 'center';
    }

    // autoTable options
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: margin.top, // leaves space for title
      margin: { left: margin.left, right: margin.right },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles,
      tableWidth: 'auto',
      showHead: 'everyPage',
      didDrawPage: (data) => {
        // footer: page number
        const pageCount = doc.internal.getNumberOfPages();
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
        const footerText = `Page ${pageNumber} of ${pageCount}`;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(footerText, pageWidth - margin.right, pageHeight - 20, { align: 'right' });
      }
    });

    // Save PDF
    doc.save('CRM-users-workreport-summary.pdf');
  };





  // Prepare data for the chart: for example map each user to an object
  // Could also sort/group by name etc
  const chartData = useMemo(() => {
    // Filter out entries lacking name or duration if needed
    return userSummary.map(user => ({
      name: user.name,
      totalDuration: user.totalDuration,
    }));
  }, [userSummary]);

  return (
    <Layout title={'CRM - Summary Report'}>
      <div className="container-fluid m-3 p-3 admin-root">
        <div className="row">
          <aside className="col-md-3">
            <Adminmenu />
          </aside>
          <main className="col-md-9">
            <div className="card admin-card p-4">


              {/* Chart section */}
              <div style={{ width: '100%', height: 300, marginBottom: '2rem' }}>
                <ResponsiveContainer>
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalDuration"
                      name="Total Call Duration"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <input
                    type="text"
                    value={globalFilter || ''}
                    onChange={(e) => setGlobalFilter(e.target.value || undefined)}
                    placeholder="Search..."
                    className="form-control w-100 mb-2 mb-md-0"
                  />
                </div>

                
              </div>
              {/* Table section */}
              <div className="table-responsive">
                <table {...getTableProps()} className="table custom-table">
                  <thead>
                    {headerGroups.map((headerGroup) => (
                      <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                          <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                            {column.render('Header')}
                            <span>
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? ' 🔽'
                                  : ' 🔼'
                                : ''}
                            </span>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody {...getTableBodyProps()}>
                    {page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()}>
                          {row.cells.map((cell) => (
                            <td {...cell.getCellProps()} data-label={cell.column.Header}>
                              {cell.render('Cell')}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <button
                    className="btn btn-outline-primary me-2"
                    onClick={() => gotoPage(pageIndex - 1)}
                    disabled={!canPreviousPage}
                  >
                    &lsaquo;
                  </button>
                  <button
                    className="btn btn-outline-primary ms-2"
                    onClick={() => gotoPage(pageIndex + 1)}
                    disabled={!canNextPage}
                  >
                    &rsaquo;
                  </button>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Dropdown className="d-flex align-items-center gap-2">
                    <Dropdown.Toggle variant="outline-secondary" size="sm">
                      {itemsPerPage}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {[2, 5, 10, 15, 20, 25, 30, 35, 40, 50, 100].map((size) => (
                        <Dropdown.Item
                          key={size}
                          active={size === itemsPerPage}
                          onClick={() => setItemsPerPage(size)}
                        >
                          {size}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
              <div className='me-2 mt-2'>
                <Button
                  variant="outline-primary"
                  className="icon-only-btn p-0"
                  onClick={handleExportPDF}
                  aria-label="Download PDF"
                  title="Download PDF"
                >
                  <FaFilePdf size={14} />
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Summary;
