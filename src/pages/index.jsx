import Layout from "./Layout.jsx";

import ClientDashboard from "./ClientDashboard";

import DesignerDashboard from "./DesignerDashboard";

import AdminDashboard from "./AdminDashboard";

import JobIntake from "./JobIntake";

import JobDetail from "./JobDetail";

import AdminSettings from "./AdminSettings";

import Home from "./Home";

import Analytics from "./Analytics";

import DesignPackageOrder from "./DesignPackageOrder";

import DesignPackageSuccess from "./DesignPackageSuccess";

import ManagerDashboard from "./ManagerDashboard";

import ArchivedJobs from "./ArchivedJobs";

import ClientSurvey from "./ClientSurvey";

import SurveyResults from "./SurveyResults";

import WordPressLogin from "./WordPressLogin";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    ClientDashboard: ClientDashboard,
    
    DesignerDashboard: DesignerDashboard,
    
    AdminDashboard: AdminDashboard,
    
    JobIntake: JobIntake,
    
    JobDetail: JobDetail,
    
    AdminSettings: AdminSettings,
    
    Home: Home,
    
    Analytics: Analytics,
    
    DesignPackageOrder: DesignPackageOrder,
    
    DesignPackageSuccess: DesignPackageSuccess,
    
    ManagerDashboard: ManagerDashboard,
    
    ArchivedJobs: ArchivedJobs,
    
    ClientSurvey: ClientSurvey,
    
    SurveyResults: SurveyResults,
    
    WordPressLogin: WordPressLogin,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<ClientDashboard />} />
                
                
                <Route path="/ClientDashboard" element={<ClientDashboard />} />
                
                <Route path="/DesignerDashboard" element={<DesignerDashboard />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/JobIntake" element={<JobIntake />} />
                
                <Route path="/JobDetail" element={<JobDetail />} />
                
                <Route path="/AdminSettings" element={<AdminSettings />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/DesignPackageOrder" element={<DesignPackageOrder />} />
                
                <Route path="/DesignPackageSuccess" element={<DesignPackageSuccess />} />
                
                <Route path="/ManagerDashboard" element={<ManagerDashboard />} />
                
                <Route path="/ArchivedJobs" element={<ArchivedJobs />} />
                
                <Route path="/ClientSurvey" element={<ClientSurvey />} />
                
                <Route path="/SurveyResults" element={<SurveyResults />} />
                
                <Route path="/WordPressLogin" element={<WordPressLogin />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}