// utils/passwordValidator.js
export default function validatePassword(password) {
  if (typeof password !== "string") return false;
  // Must contain at least 8 chars, 1 lower, 1 upper, 1 number
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPassword.test(password);
}
