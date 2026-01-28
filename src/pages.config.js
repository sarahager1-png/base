import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Schedule from './pages/Schedule';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import Community from './pages/Community';
import Maintenance from './pages/Maintenance';
import Printing from './pages/Printing';


export const PAGES = {
    "Dashboard": Dashboard,
    "Journal": Journal,
    "Schedule": Schedule,
    "Tasks": Tasks,
    "Attendance": Attendance,
    "Community": Community,
    "Maintenance": Maintenance,
    "Printing": Printing,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
};