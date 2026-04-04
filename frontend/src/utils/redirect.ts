/**
 * Returns the redirection path based on the user's role.
 * Maps 'ADMIN' or 'ROLE_ADMIN' -> '/admin/moderation'
 * Maps 'ORGANIZER' or 'ROLE_ORGANIZER' -> '/organizer/dashboard'
 * Default -> '/'
 */
export const getRedirectPathByRole = (roleName?: string | null) => {
  const normalized = (roleName ?? "").toUpperCase().replace("ROLE_", "");
  switch (normalized) {
    case "ORGANIZER":
      return "/organizer/dashboard";
    case "ADMIN":
      return "/admin/moderation";
    case "USER":
    default:
      return "/";
  }
};
