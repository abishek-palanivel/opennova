import { Routes, Route } from 'react-router-dom';
import UserLayout from './UserLayout';
import Dashboard from './Dashboard';
import BrowseEstablishments from './BrowseEstablishments';
import MyBookings from './MyBookings';
import AddEstablishmentRequest from './AddEstablishmentRequest';
import EstablishmentDetails from './EstablishmentDetails';
import Reviews from './Reviews';

const UserDashboard = () => {
  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/browse" element={<BrowseEstablishments />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/request" element={<AddEstablishmentRequest />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/establishment/:id" element={<EstablishmentDetails />} />
      </Routes>
    </UserLayout>
  );
};

export default UserDashboard;