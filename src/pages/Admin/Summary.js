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

  const columns = useMemo(
    () => [
      { Header: '#', accessor: 'slno', Cell: ({ row }) => row.index + 1 },
      { Header: 'Name', accessor: 'name' },
      { Header: 'Email', accessor: 'email' },
      { Header: 'Phone', accessor: 'phone' },
      { Header: 'Total Contacts Assigned', accessor: 'totalContacts' },
      { Header: 'Completed', accessor: 'completed' },
      { Header: 'Total Call Duration', accessor: 'totalDuration' },
    ],
    []
  );

  const data = useMemo(() => userSummary, [userSummary]);

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
    const doc = new jsPDF();
    autoTable(doc, {
      head: [
        [
          'Name',
          'Email',
          'Phone',
          'Total Contacts Assigned',
          'Completed',
          'Total Call Duration',
        ],
      ],
      body: userSummary.map((user) => [
        user.name,
        user.email,
        user.phone,
        user.totalContacts,
        user.completed,
        user.totalDuration,
      ]),
    });
    doc.save('user_summary.pdf');
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
              <div>
                <input
                  type="text"
                  value={globalFilter || ''}
                  onChange={(e) => setGlobalFilter(e.target.value || undefined)}
                  placeholder="Search..."
                  className="form-control mb-3"
                />



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
