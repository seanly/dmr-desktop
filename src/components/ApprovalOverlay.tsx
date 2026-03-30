interface Approval {
  id: string;
  message: string;
  type: string;
}

interface ApprovalOverlayProps {
  approvals: Approval[];
}

export function ApprovalOverlay({ approvals }: ApprovalOverlayProps) {
  if (approvals.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-white mb-4">需要审批</h2>
        {approvals.map((approval) => (
          <div key={approval.id} className="mb-4">
            <p className="text-gray-300 mb-3">{approval.message}</p>
            <div className="flex space-x-2">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
                批准
              </button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">
                拒绝
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
