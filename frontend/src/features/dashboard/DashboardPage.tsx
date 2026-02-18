import React, { useEffect } from 'react';
import { api } from '@/services/api';

export function DashboardPage() {
  useEffect(() => {
    api.get('/test')
      .then(res => console.log(res.data))
      .catch(err => console.error(err));
  }, []);
  return <div>Dashboard</div>;
}
