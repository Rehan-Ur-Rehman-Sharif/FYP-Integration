import { Outlet } from "react-router-dom";
import './App.css';
import Navbar from "./components/Navbar";
import { useEffect } from "react";
import { initStudents } from "./utils/initStudents";
import { initTeachers } from "./utils/initTeachers";

function App() {
  useEffect(()=>{
    initStudents();
    initTeachers();
  },[]);
  return (
    <>
      <Navbar/>
      <Outlet /> 

    </>
  );
}

export default App;
