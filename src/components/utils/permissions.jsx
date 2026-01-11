/**
 * Granular permission system for job management
 * Defines what actions each role can perform
 */

export const PERMISSIONS = {
  // Job viewing
  VIEW_ALL_JOBS: ['admin', 'manager'],
  VIEW_ASSIGNED_JOBS: ['designer'],
  VIEW_OWN_JOBS: ['client'],
  
  // Job editing
  EDIT_JOB_DETAILS: ['admin', 'manager'],
  EDIT_ASSIGNED_JOB: ['designer'],
  
  // Designer assignment
  ASSIGN_DESIGNER: ['admin', 'manager'],
  
  // Status management
  CHANGE_ANY_STATUS: ['admin', 'manager'],
  CHANGE_ASSIGNED_JOB_STATUS: ['designer'],
  
  // Proof management
  SEND_PROOF: ['admin', 'manager', 'designer'],
  APPROVE_PROOF: ['client'],
  REQUEST_REVISIONS: ['client'],
  
  // File management
  UPLOAD_FILES: ['admin', 'manager', 'designer', 'client'],
  DELETE_FILES: ['admin', 'manager'],
  
  // Communication
  SEND_MESSAGES: ['admin', 'manager', 'designer', 'client'],
  
  // Job completion
  COMPLETE_JOB: ['admin', 'manager', 'designer'],
  REOPEN_JOB: ['admin', 'manager'],
  
  // User management
  MANAGE_USERS: ['admin'],
  VIEW_ALL_USERS: ['admin', 'manager'],
  
  // Department management
  MANAGE_DEPARTMENTS: ['admin'],
  
  // Analytics
  VIEW_ANALYTICS: ['admin', 'manager'],
  
  // Support emails
  MANAGE_SUPPORT_EMAILS: ['admin', 'manager', 'designer'],
  
  // Manual status override
  TOGGLE_AUTO_STATUS: ['admin', 'manager'],
  
  // Delete jobs
  DELETE_JOB: ['admin'],
  DELETE_DRAFT: ['admin', 'client'],
  
  // Archive jobs
  ARCHIVE_JOB: ['admin', 'manager'],
  VIEW_ARCHIVED_JOBS: ['admin', 'manager']
};

/**
 * Check if user can edit a specific job
 */
export function canEditJob(user, job) {
  if (!user || !job) return false;
  
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }
  
  if (user.role === 'designer' && job.designer_id === user.id) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can change job status
 */
export function canChangeStatus(user, job) {
  if (!user || !job) return false;
  
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }
  
  if (user.role === 'designer' && job.designer_id === user.id) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can assign/reassign designer
 */
export function canAssignDesigner(user) {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'manager';
}

/**
 * Check if user can send proofs
 */
export function canSendProof(user, job) {
  if (!user || !job) return false;
  
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }
  
  if (user.role === 'designer' && job.designer_id === user.id) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can complete a job
 */
export function canCompleteJob(user, job) {
  if (!user || !job) return false;
  
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }
  
  if (user.role === 'designer' && job.designer_id === user.id) {
    return true;
  }
  
  return false;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles ? allowedRoles.includes(user.role) : false;
}

/**
 * Get available status options for a user
 */
export function getAvailableStatuses(user, job) {
  const allStatuses = [
    'New Job',
    'Job in Progress',
    'Proof Sent',
    'Revisions Requested',
    'On Hold',
    'Stuck or Client Response Needed',
    'Small Change',
    'Job Complete'
  ];
  
  if (!user || !job) return [];
  
  if (user.role === 'admin' || user.role === 'manager') {
    return allStatuses;
  }
  
  if (user.role === 'designer' && job.designer_id === user.id) {
    return allStatuses;
  }
  
  return [];
}