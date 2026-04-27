import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [selectedBranch, setSelectedBranch] = useState(() => {
    try {
      const saved = localStorage.getItem('simba-selected-branch');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setBranches(data || []);
      } catch (err) {
        console.error('Error fetching branches:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const selectBranch = (branch) => {
    setSelectedBranch(branch);
    if (branch) {
      localStorage.setItem('simba-selected-branch', JSON.stringify(branch));
    } else {
      localStorage.removeItem('simba-selected-branch');
    }
  };

  return (
    <BranchContext.Provider value={{
      selectedBranch,
      selectBranch,
      branches,
      loading
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
