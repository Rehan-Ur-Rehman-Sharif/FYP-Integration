import React, { useEffect } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from "../App"
import Login from "../pages/Auth/Login"
import StudentDashboard from '../pages/Student/StudentDashboard'
import TeacherDashboard from '../pages/Teacher/TeacherDashboard'
import OrganizationalAdminDashboard from '../pages/OrganizationalAdmin/OrganizationalAdminDashboard'
import EventAdminDashboard from '../pages/EventAdminDashboard'
import Signup from '../pages/Auth/SignUp'
import AdminDashboard from '../pages/AdminDashboard'
import ParticipantDashboard from '../pages/Participant/ParticipantDashboard'
import Home from '../pages/landing/Main'

const RootRedirect = () => {
    useEffect(() => {
        try {
            // Keep persisted app data (e.g., attendance requests). Only clear auth.
            localStorage.removeItem("currentUser");
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
            { path: "forgot-password", element: <Navigate to="/login" replace /> },
            { path: "student", element: <StudentDashboard/> },
            { path: "teacher", element: <TeacherDashboard/> },
            { path:"admin",element: <AdminDashboard/>},
            {path:"eventadmin",element:<EventAdminDashboard/>},
            {path:"signup",element:<Signup/>},
            {path:"orgadmin",element:<OrganizationalAdminDashboard/>},
            {path:"participant",element:<ParticipantDashboard/>},
            { path: "*", element: <Navigate to="/login" replace /> },
            { path: "home", element: <Home /> },
        ]
    },
])

export default router