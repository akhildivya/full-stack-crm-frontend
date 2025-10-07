import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASEURL } from '../../service/baseUrl';
import '../../css/notification.css';
import { useAuth } from '../../context/auth';
import { Button, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';

function Notifications() {
  const [auth] = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [newStudentIds, setNewStudentIds] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(`${BASEURL}/assigned-students/${date}`, {
          headers: { Authorization: auth?.token || localStorage.getItem("authToken") },
        });

        if (response.data.success) {
          const students = response.data.students;
          const dismissedKey = `dismissed_notification_${date}`;
          const dismissedTimestamp = localStorage.getItem(`${dismissedKey}_timestamp`) || 0;

          const newStudents = students.filter(
            s => new Date(s.assignedAt).getTime() > dismissedTimestamp
          );
          setNewStudentIds(newStudents.map(s => s._id));

          const visibleStudents = students.filter(
            s => new Date(s.assignedAt).getTime() > dismissedTimestamp
          );
          setAssignedStudents(visibleStudents);

          if (visibleStudents.length > 0) {
            setIsDismissed(false);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStudents();
    const interval = setInterval(fetchStudents, 10000);
    return () => clearInterval(interval);
  }, [date, auth?.token]);

  const handleDeleteNotification = () => {
    setAssignedStudents([]);
    setIsDismissed(true);

    const dismissedKey = `dismissed_notification_${date}`;
    const latestTimestamp = assignedStudents.length
      ? Math.max(...assignedStudents.map(s => new Date(s.assignedAt).getTime()))
      : Date.now();

    localStorage.setItem(dismissedKey, "true");
    localStorage.setItem(`${dismissedKey}_timestamp`, latestTimestamp);

    toast.info("Notification dismissed!");
  };

  if (isDismissed && assignedStudents.length === 0) return null;

  return (
    <div className="notification-container">
      <Card className="notification-card shadow-lg rounded-lg p-3 mb-4">
        <Card.Body>
          <h5 className="text-primary">Duty assigned on {date}</h5>
          <p>Total assigned contacts = <strong>{assignedStudents.length}</strong></p>

          {assignedStudents.length > 0 ? (
            <>
              <Button
                variant="info"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="mb-2"
              >
                {showDetails ? "Hide Details" : "View More"}
              </Button>

              {showDetails && (
                <ul className="notification-list">
                  {assignedStudents.map((student) => (
                    <li
                      key={student._id}
                      className={`list-group-item ${newStudentIds.includes(student._id) ? 'list-group-item-warning' : ''}`}
                    >
                      {student.name} - Assigned at {new Date(student.assignedAt).toLocaleTimeString()}
                    </li>
                  ))}
                </ul>
              )}

              <Button
                variant="danger"
                size="sm"
                className="mt-2"
                onClick={handleDeleteNotification}
              >
                Delete Notification
              </Button>
            </>
          ) : (
            <p>No assignments found for this date.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Notifications;
