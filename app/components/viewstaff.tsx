import React from "react";
import '../staff.css'

export default function ViewStaff(props: any) {
  const [staffInfo, setStaffInfo] = React.useState<any>(null);

  React.useEffect(() => {
    setStaffInfo(props.staff);
  }, [props.staff]);

  if (!staffInfo) return null;

  return (
    <div className="staff-overlay">
      <div className="staff-card">
        <div className="staff-header">
          <h2>Staff Details</h2>
          <button className="close-btn" onClick={props.hideForm}>×</button>
        </div>

        <div className="staff-body">
          <div className="staff-info">
            <div><strong>Name:</strong> {staffInfo.first_name} {staffInfo.middle_name} {staffInfo.last_name}</div>
            <div><strong>Category:</strong> {staffInfo.category_name}</div>
            <div><strong>Birthday:</strong> {staffInfo.birthday}</div>
            <div><strong>Sex:</strong> {staffInfo.sex}</div>
            <div><strong>Phone:</strong> {staffInfo.phone}</div>
            <div><strong>Email:</strong> {staffInfo.email}</div>
            <div><strong>Username:</strong> {staffInfo.username}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
