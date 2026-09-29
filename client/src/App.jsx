import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CheckInPage } from './pages/CheckInPage';
import { TokenStatusPage } from './pages/TokenStatusPage';
import { LoginPage } from './pages/LoginPage';
import { SupervisorPage } from './pages/SupervisorPage';
import { AdminPage } from './pages/AdminPage';

function parseLocation() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'checkin') {
    return {
      page: 'checkin',
      params: {
        clinicId: segments[1] || null,
        doctorId: segments[2] || null,
      },
    };
  }

  if (segments[0] === 'status') {
    return {
      page: 'status',
      params: {
        tokenId: segments[1] || null,
      },
    };
  }

  if (segments[0] === 'login') {
    return { page: 'login', params: {} };
  }

  if (segments[0] === 'supervisor') {
    return { page: 'supervisor', params: {} };
  }

  if (segments[0] === 'admin') {
    return { page: 'admin', params: {} };
  }

  return { page: 'landing', params: {} };
}

function MainApp() {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const [route, setRoute] = useState(parseLocation());

  // Listen to browser popstate (back / forward buttons)
  useEffect(() => {
    function handlePopState() {
      setRoute(parseLocation());
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page, params = {}) => {
    let newPath = '/';
    if (page === 'checkin') {
      if (params.clinicId && params.doctorId) {
        newPath = `/checkin/${params.clinicId}/${params.doctorId}`;
      } else {
        newPath = '/checkin';
      }
    } else if (page === 'status') {
      newPath = `/status/${params.tokenId || ''}`;
    } else if (page === 'login') {
      newPath = '/login';
    } else if (page === 'supervisor') {
      newPath = '/supervisor';
    } else if (page === 'admin') {
      newPath = '/admin';
    }

    window.history.pushState(null, '', newPath);
    setRoute({ page, params });
  };

  // Render Page Content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (route.page === 'checkin') {
      return (
        <CheckInPage
          clinicId={route.params.clinicId}
          doctorId={route.params.doctorId}
          onNavigate={navigate}
        />
      );
    }

    if (route.page === 'status') {
      return (
        <TokenStatusPage
          tokenId={route.params.tokenId}
          onNavigate={navigate}
        />
      );
    }

    if (route.page === 'login') {
      return <LoginPage onNavigate={navigate} />;
    }

    if (route.page === 'supervisor') {
      if (!isAuthenticated) {
        return <LoginPage onNavigate={navigate} />;
      }
      return <SupervisorPage onNavigate={navigate} />;
    }

    if (route.page === 'admin') {
      if (!isAuthenticated) {
        return <LoginPage onNavigate={navigate} />;
      }
      return <AdminPage onNavigate={navigate} />;
    }

    return <LandingPage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar onNavigate={navigate} currentPage={route.page} />
      <main className="flex-1">{renderContent()}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
