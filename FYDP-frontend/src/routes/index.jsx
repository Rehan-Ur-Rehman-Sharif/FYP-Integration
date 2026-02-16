import React, { useEffect } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from "../App"
import Login from "../pages/Login"
import StudentDashboard from '../pages/StudentDashboard'
import TeacherDashboard from '../pages/TeacherDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import EventAdminDashboard from '../pages/EventAdminDashboard'
import Signup from '../pages/SignUp'

const RootRedirect = () => {
    useEffect(() => {
        try {
            localStorage.clear();
        } catch (e) {}
    }, []);

    return <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <App/>,
        children: [
            { index: true, element: <RootRedirect /> },
            { path: "login", element: <Login/> },
            { path: "student", element: <StudentDashboard/> },
            { path: "teacher", element: <TeacherDashboard/> },
            { path:"admin",element: <AdminDashboard/>},
            {path:"eventadmin",element:<EventAdminDashboard/>},
            {path:"signup",element:<Signup/>},
        ]
    },
])

export default router