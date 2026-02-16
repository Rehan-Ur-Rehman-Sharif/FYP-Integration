import React from "react";

const CourseTable=({courses})=>{
    return(
         <div className="course-table">
    
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Course Name</th>
            <th>Attendance</th>
            <th>Classes (Present/Total)</th>
          </tr>
        </thead>

        <tbody>
          {courses.map((course, index) => (
            <tr key={index}>
              <td>{course.code}</td>
              <td>{course.name}</td>
              <td>{course.attendance}%</td>
              <td>{course.present}/{course.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    );
};

export default CourseTable;