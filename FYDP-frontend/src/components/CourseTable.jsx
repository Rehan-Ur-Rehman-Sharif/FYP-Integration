import React from "react";

const CourseTable = ({ courses }) => {
  return (
    <div className="course-table-wrapper">
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Attendance</th>
            <th>Classes (Present / Total)</th>
          </tr>
        </thead>

        <tbody>
          {courses.map((course, index) => (
            <tr key={index}>
              <td className="code">{course.code}</td>

              <td className="name">{course.name}</td>

              <td>
                <div className="bar-group">
                  <span>{course.attendance}%</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${course.attendance}%` }}
                    />
                  </div>
                </div>
              </td>

              <td>
                <div className="bar-group">
                  <span>
                    {course.present}/{course.total}
                  </span>
                  <div className="progress-bar light">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${course.total > 0 ? (course.present / course.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseTable;
