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
        const response = await axios.get(
          `${BASEURL}/assigned-students/${date}`,
          {
            headers: {
              Authorization:
                auth?.token || localStorage.getItem("authToken"),
            },
          }
        );

        if (response.data.success) {
          const students = response.data.students;
          const dismissedKey = `dismissed_notification_${date}`;
          const dismissedTimestamp =
            localStorage.getItem(`${dismissedKey}_timestamp`) || 0;

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

  function formatDateToDDMMMYYYY(dateString) {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, "0");
    const year = d.getFullYear();
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[d.getMonth()];
    return `${day}-${month}-${year}`;
  }

  if (isDismissed && assignedStudents.length === 0) return null;

  return (
    <div className="notification-container">
      <Card className="notification-card shadow-none">
        <Card.Body>
          <div className="notification-header">
            <span className="icon">🔔</span>
            <h6>
              <strong>Duty assigned on {formatDateToDDMMMYYYY(date)}</strong>
            </h6>
          </div>
          <div className="notification-subtitle">
            Total assigned contacts = <strong>{assignedStudents.length}</strong>
          </div>

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
                  {(() => {
                    const total = assignedStudents.length;
                    // If more than 3, show only first 2
                    const toShow = total > 3
                      ? assignedStudents.slice(0, 2)
                      : assignedStudents;
                    const remaining = total > toShow.length
                      ? total - toShow.length
                      : 0;

                    return (
                      <>
                        {toShow.map(student => (
                          <li
                            key={student._id}
                            className={ newStudentIds.includes(student._id) ? "new" : "" }
                          >
                            <span>{student.name}</span>
                            <span className="time">
                              {new Date(student.assignedAt).toLocaleTimeString()}
                            </span>
                          </li>
                        ))}
                        {remaining > 0 && (
                          <li className="more-indicator">
                            +{remaining} more...
                          </li>
                        )}
                      </>
                    );
                  })()}
                </ul>
              )}

              <div className="notification-actions">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteNotification}
                >
                  Dismiss
                </Button>
              </div>
            </>
          ) : (
            <p>No assignments for this date.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Notifications;
