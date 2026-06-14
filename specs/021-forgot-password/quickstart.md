# Quickstart: Forgot Password (021)

## Validation Scenarios

### Scenario 1: Successful password reset

1. Navigate to `/sign-in`
2. Click "Forgot password?"
3. Enter valid email address
4. Submit form
5. See success message: "If an account exists with that email, a password reset link has been sent."
6. Check email inbox for reset link
7. Click reset link
8. Enter new password (min 8 chars)
9. Confirm new password
10. Submit form
11. See success message: "Your password has been reset."
12. Click "Sign in" button
13. Sign in with new password

### Scenario 2: Email not found (email enumeration protection)

1. Navigate to `/sign-in`
2. Click "Forgot password?"
3. Enter email that doesn't exist in system
4. Submit form
5. See same success message as Scenario 1: "If an account exists with that email, a password reset link has been sent."
6. No email is sent (but user doesn't know this)

### Scenario 3: Expired token

1. Complete Scenario 1 steps 1-6
2. Wait 1 hour (or modify token expiry in test)
3. Click reset link
4. See error: "This link has expired."
5. Click "Request a new link" (or navigate back to forgot-password)

### Scenario 4: Already-used token

1. Complete Scenario 1 steps 1-6
2. Click reset link
3. Complete password reset (Scenario 1 steps 8-11)
4. Try clicking the same reset link again
5. See error: "Invalid or expired reset link."

### Scenario 5: Password mismatch

1. Navigate to `/reset-password/{token}`
2. Enter password in "New password" field
3. Enter different password in "Confirm password" field
4. Submit form
5. See client-side error: "Passwords do not match."

### Scenario 6: Weak password

1. Navigate to `/reset-password/{token}`
2. Enter password shorter than 8 characters
3. Submit form
4. See error: "Password must be at least 8 characters."

### Scenario 7: Multiple reset requests

1. Navigate to `/sign-in`
2. Click "Forgot password?"
3. Enter email address
4. Submit form
5. Check email — receive reset link
6. Repeat steps 1-5
7. Check email — receive new reset link
8. Try clicking the first reset link
9. See error: "Invalid or expired reset link." (previous token invalidated)
10. Click the second reset link
11. Password reset works normally

---

## Edge Cases

- **Email service down**: Server returns 502 with message "Password reset email could not be sent. Please try again."
- **Token expired**: Server returns 404 with message "Invalid or expired reset link."
- **Token already used**: Server returns 404 with message "Invalid or expired reset link."
- **Invalid token format**: Server returns 400 with message "Invalid token"
- **Password too short**: Server returns 400 with message "Password must be at least 8 characters"

---

## Manual Testing Checklist

- [ ] "Forgot password?" link appears on sign-in page
- [ ] Link navigates to `/forgot-password`
- [ ] Email form validates email format
- [ ] Success message appears after submission (regardless of email validity)
- [ ] Reset email is sent when email exists
- [ ] No email is sent when email doesn't exist
- [ ] Reset link works and navigates to `/reset-password/{token}`
- [ ] Password form validates minimum length (8 chars)
- [ ] Password confirmation must match
- [ ] Password is updated on successful reset
- [ ] Token is deleted after successful reset
- [ ] Expired token shows error message
- [ ] Used token shows error message
- [ ] Previous tokens are invalidated when new one requested
- [ ] User can sign in with new password after reset
