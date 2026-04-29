import { useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';

export function useDashboardModal() {
  const { isAddPearlOpen, setIsAddPearlOpen } = useDashboard();

  useEffect(() => {
    setIsAddPearlOpen(false);
  }, []);

  return { isAddPearlOpen, openAddPearl: setIsAddPearlOpen };
}
