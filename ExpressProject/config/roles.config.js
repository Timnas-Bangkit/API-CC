/*
 * job == Post
 */

const enumPermissions = {
  createJob: 'create_job',
  readJob: 'read_job',
  updateJob: 'update_job',
  deleteJob: 'delete_job',
  listJobs: 'list_jobs',
  listAllJobs: 'list_all_jobs',
  interractAllJobs: 'interract_all_jobs',
  updateProfile: 'update_profile',
  createAppliedJob: 'create_applied_job',
  deleteAppliedJob: 'delete_applied_job',
  listAppliedJob: 'list_applied_job',
  listAllUsers: 'list_all_users',
  readUser: 'read_user',
  createCV: 'create_cv',
  readCV: 'read_cv',
}

const roles = [
  {
    name: 'admin',
    permissions: [
      enumPermissions.readUser,
    ]
  },
  {
    name: 'user',
    permissions: [
      
    ]
  },
  {
    name: 'owner',
    permissions: [
      enumPermissions.listAllUsers,
      enumPermissions.readUser,

      enumPermissions.readCV,

      'create_job', 
      'read_job',
      'update_job',
      'delete_job',
      'list_jobs',

      'list_all_jobs',
      'interract_all_jobs',

      'update_profile',
    ]
  },
  {
    name: 'techWorker',
    permissions: [
      enumPermissions.listAllUsers,
      enumPermissions.readUser,

      enumPermissions.createCV,
      enumPermissions.readCV,

      'read_job',

      'list_all_jobs',
      'interract_all_jobs',

      'create_applied_job',
      'delete_applied_job',
      'list_applied_job',
      
      'update_profile',
    ]
  }
];

module.exports = { roles, enumPermissions };
