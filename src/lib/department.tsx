import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Department = 'operations' | 'maintenance' | 'safety' | 'logistics';

export const DEPARTMENT_META: Record<Department, { label: string; icon: string; color: string }> = {
  safety: { label: 'Safety', icon: 'shield', color: '#137333' },
  operations: { label: 'Operations', icon: 'activity', color: '#138FC2' },
  maintenance: { label: 'Maintenance', icon: 'wrench', color: '#B06000' },
  logistics: { label: 'Logistics', icon: 'truck', color: '#5BC0EB' },
};

const STORAGE_KEY = 'hse_department';
const DEFAULT_DEPT: Department = 'safety';

interface DeptCtx {
  department: Department;
  setDepartment: (d: Department) => void;
}

const Ctx = createContext<DeptCtx>({ department: DEFAULT_DEPT, setDepartment: () => {} });

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [department, setDept] = useState<Department>(DEFAULT_DEPT);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'operations' || v === 'maintenance' || v === 'safety' || v === 'logistics') {
        setDept(v);
      }
    });
  }, []);

  const setDepartment = (d: Department) => {
    setDept(d);
    AsyncStorage.setItem(STORAGE_KEY, d);
  };

  return <Ctx.Provider value={{ department, setDepartment }}>{children}</Ctx.Provider>;
}

export function useDepartment() {
  return useContext(Ctx);
}
