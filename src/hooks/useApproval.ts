import { useState } from 'react';

interface Approval {
  id: string;
  message: string;
  type: string;
}

export function useApproval() {
  const [approvals, setApprovals] = useState<Approval[]>([]);

  const addApproval = (approval: Approval) => {
    setApprovals((prev) => [...prev, approval]);
  };

  const removeApproval = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  return {
    approvals,
    addApproval,
    removeApproval,
  };
}
