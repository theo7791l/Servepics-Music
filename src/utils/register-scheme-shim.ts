
/**
 * This is a placeholder shim for the register-scheme package
 * to avoid build errors when the actual package can't be installed
 */

export default function registerScheme() {
  console.warn('register-scheme functionality is not available in this environment');
  return false;
}
