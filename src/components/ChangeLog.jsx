import React from 'react';
import { History } from 'lucide-react';

const ChangeLog = ({ createdBy, createdAt, updatedBy, updatedAt, className }) => {
  if (!createdBy && !updatedBy) {
    return null;
  }

  const createdByName = createdBy?.full_name || 'system';
  const updatedByName = updatedBy?.full_name || 'system';

  return (
    <div className={`text-xs text-slate-500 flex items-center gap-2 ${className}`}>
      <History className="h-3 w-3" />
      <span>
        {updatedAt && updatedBy ? (
          <>
            Updated by <strong>{updatedByName}</strong> on {new Date(updatedAt).toLocaleDateString()}
          </>
        ) : (
          <>
            Added by <strong>{createdByName}</strong> on {new Date(createdAt).toLocaleDateString()}
          </>
        )}
      </span>
    </div>
  );
};

export default ChangeLog;