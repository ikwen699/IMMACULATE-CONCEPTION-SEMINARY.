# ICS School Portal — Master Testing Checklist

This document is the authoritative source of truth for testing the ICS School Portal.
Every user journey, role, and workflow is mapped below. Use the bug table in BUGS.md
to track findings.

---

## Roles & Their Journeys

### Student
- [ ] Log in
- [ ] View dashboard
- [ ] View profile
- [ ] View courses/subjects
- [ ] View results/grades
- [ ] View result history
- [ ] Change password
- [ ] Log out

### Teacher
- [ ] Log in
- [ ] View assigned classes/subjects
- [ ] View students
- [ ] Enter scores
- [ ] Edit scores
- [ ] Submit results
- [ ] Verify/approve results
- [ ] View submitted results
- [ ] Log out

### Principal/Admin
- [ ] Log in
- [ ] Manage students
- [ ] Manage teachers
- [ ] Manage classes
- [ ] Manage subjects
- [ ] Configure sessions/terms
- [ ] Review results
- [ ] Approve/publish results
- [ ] View reports
- [ ] Manage fees
- [ ] View payments
- [ ] Manage users
- [ ] Change system settings

### Parent
- [ ] Log in
- [ ] See children
- [ ] View fees
- [ ] Make payment
- [ ] View payment history
- [ ] View results
- [ ] Download receipts (if available)
- [ ] Receive notifications

### Accountant
- [ ] Log in
- [ ] View fee structure
- [ ] Manage fees
- [ ] Review payments
- [ ] View reports

---

## Result Procedure (Full Lifecycle)

- [ ] Principal creates session
- [ ] Principal creates term
- [ ] Teacher is assigned subject
- [ ] Teacher sees assigned class
- [ ] Teacher sees students
- [ ] Teacher enters CA
- [ ] Teacher enters exam
- [ ] System calculates total
- [ ] Teacher saves
- [ ] Teacher submits
- [ ] Principal reviews
- [ ] Principal approves
- [ ] Principal publishes
- [ ] Student sees result
- [ ] Student downloads result

---

## Payment Procedure (Full Lifecycle)

- [ ] Principal/Accountant creates fee
- [ ] Student/parent sees fee
- [ ] Payment initiated
- [ ] Payment processed
- [ ] Payment verified
- [ ] Transaction recorded
- [ ] Outstanding balance updated
- [ ] Receipt generated
- [ ] Payment history updated
- [ ] Principal sees payment

### Payment Edge Cases
- [ ] Payment succeeds
- [ ] Payment fails
- [ ] Payment is cancelled
- [ ] User refreshes during payment
- [ ] User clicks Pay twice
- [ ] Network disconnects
- [ ] Duplicate payment prevented
- [ ] Wrong amount handled
- [ ] Already-paid fee detected
- [ ] Partial payment
- [ ] Outstanding balance

---

## Security Testing

- [ ] Student cannot access admin API
- [ ] Teacher cannot access principal API
- [ ] Student cannot access another student's result
- [ ] Student cannot view teacher dashboard
- [ ] Student cannot view principal dashboard
- [ ] Teacher cannot modify another teacher's records
- [ ] Teacher cannot access principal-only settings
- [ ] Logged-out user redirected from protected pages
- [ ] Ordinary user cannot access admin APIs directly

---

## Form Testing

Test every form with:
- [ ] Empty values
- [ ] Very long text
- [ ] Wrong email format
- [ ] Invalid numbers
- [ ] Negative numbers
- [ ] Zero
- [ ] Extremely large numbers
- [ ] Special characters
- [ ] Spaces
- [ ] Duplicate values
- [ ] Non-existing records
- [ ] Wrong file types
- [ ] Huge files

### Score-Specific Tests
- [ ] CA = -5 (rejected)
- [ ] CA = 101 (rejected)
- [ ] Exam = 500 (rejected)
- [ ] CA = "hello" (rejected)
- [ ] Exam = "" (handled)

---

## Screen Sizes

- [ ] Desktop
- [ ] Laptop
- [ ] Tablet
- [ ] Phone

---

## Network Conditions

- [ ] Fast connection
- [ ] Slow connection
- [ ] Temporary disconnect
- [ ] Refresh during request
- [ ] Back button during request
- [ ] Double-click submit

---

## Automated Test Coverage

### AUTH
- [ ] student can log in
- [ ] teacher can log in
- [ ] principal can log in
- [ ] invalid credentials rejected
- [ ] protected route rejects unauthenticated user

### RESULTS
- [ ] teacher can enter result
- [ ] invalid score rejected
- [ ] result total calculated correctly
- [ ] teacher can submit result
- [ ] principal can approve result
- [ ] student can see published result
- [ ] student cannot see unpublished result

### FEES
- [ ] fee appears for student
- [ ] payment recorded
- [ ] balance updated
- [ ] receipt generated
- [ ] duplicate payment prevented

### SECURITY
- [ ] student cannot access admin API
- [ ] teacher cannot access principal API
- [ ] student cannot access another student's result
