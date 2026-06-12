import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminWorkspace from './AdminWorkspace';
import AdminEtlServer from './AdminEtlServer';

const AdminRouter: React.FC = () => {
  return (
    <Routes>
      <Route index element={<AdminWorkspace />} />
      <Route path="integrations/etl-server" element={<AdminEtlServer />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default AdminRouter;
