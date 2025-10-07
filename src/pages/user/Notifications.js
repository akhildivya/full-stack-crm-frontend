
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASEURL } from '../../service/baseUrl';
import '../../css/notification.css'
function Notifications() {
    const [assignedStudents, setAssignedStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      try {
        const response = await axios.get(`${BASEURL}/assigned-students/${date}`);
        setAssignedStudents(response.data.students);
      } catch (error) {
        console.error('Error fetching assigned students:', error);
      }
    };

    fetchAssignedStudents();
  }, [date]);

  return (
    <div className="notification">
      <h3>Assigned Students on {date}</h3>
      <ul>
        {assignedStudents.map(student => (
          <li key={student._id}>
            {student.name} - Assigned at {new Date(student.assignedAt).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Notifications