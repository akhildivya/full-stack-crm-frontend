import React, { useState } from 'react'
import Layout from '../../components/layout/Layout'
import Adminmenu from '../../components/layout/Adminmenu'
import Table from 'react-bootstrap/Table';

function Allusers() {
    const [searchTerm, setSearchTerm] = useState("");
    const employees = [
        { id: 1, name: "Alice Johnson", email: "alice@example.com", phone: "123-456-7890" },
        { id: 2, name: "Bob Smith", email: "bob@example.com", phone: "987-654-3210" },
        { id: 3, name: "Charlie Davis", email: "charlie@example.com", phone: "555-123-4567" },
        // Add more entries as needed
    ];

    const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm)
    );
    return (
        <Layout title={"CRM - All Users"}>

            <div className="container-fluid m-3 p-3 admin-root">
                <div className="row">
                    <aside className="col-md-3"><Adminmenu /></aside>
                    <main className="col-md-9">
                        <div className="card admin-card p-4">
                            <div className="mb-3">
                                
                                <input
                                    type="text"
                                    className="form-control search-input"
                                    placeholder="Search employees..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="table-responsive">
                                <Table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(emp => (
                                            <tr key={emp.id}>
                                                <td>{emp.id}</td>
                                                <td>{emp.name}</td>
                                                <td>{emp.email}</td>
                                                <td>{emp.phone}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-danger">Verify</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    )
}

export default Allusers