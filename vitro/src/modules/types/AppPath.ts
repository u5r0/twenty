export enum AppPath {
  // Not logged-in
  Verify = '/verify',
  SignIn = '/sign-in',
  SignUp = '/sign-up',
  Invite = '/invite/:workspaceInviteHash',

  // Onboarding
  CreateWorkspace = '/create/workspace',
  CreateProfile = '/create/profile',

  // Onboarded
  Index = '/',
  TasksPage = '/tasks',
  OpportunitiesPage = '/objects/opportunities',
  RecordTablePage = '/objects/:objectNamePlural',

  RecordShowPage = '/object/:objectNameSingular/:objectMetadataId',

  SettingsCatchAll = `/settings/*`,
  DevelopersCatchAll = `/developers/*`,

  // Impersonate
  Impersonate = '/impersonate/:userId',

  // 404 page not found
  NotFoundWildcard = '*',
  NotFound = '/not-found',
}
