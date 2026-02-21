# Services — API Client

This folder contains the centralized API communication layer.

## api.js

Single file that configures Axios and exports API endpoint functions grouped by feature.

### Axios Instance Configuration

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:7000/api',
  headers: { 'Content-Type': 'application/json' },
});
```

### Request Interceptor

Automatically adds the JWT token to every outgoing request:
```
Authorization: Bearer <token from localStorage>
```

If no token exists, the request goes out without the header (for public endpoints like login/register).

### Response Interceptor

Processes date strings in API responses to ensure consistent UTC handling:
- Finds ISO 8601 date strings that are missing the "Z" suffix
- Appends "Z" to ensure JavaScript's `new Date()` treats them as UTC
- This prevents timezone mismatches when displaying dates on the calendar

### Exported API Objects

Each export groups related endpoints:

#### `authAPI`
| Method | Function | Endpoint |
|--------|----------|----------|
| POST | `register(data)` | `/auth/register` |
| POST | `login(data)` | `/auth/login` |
| GET | `getCurrentUser()` | `/auth/me` |

#### `sessionsAPI`
| Method | Function | Endpoint |
|--------|----------|----------|
| GET | `getAll(params)` | `/sessions?from=&to=&classTypeId=` |
| GET | `getById(id)` | `/sessions/{id}` |
| POST | `create(data)` | `/sessions` |
| POST | `createBulk(data)` | `/sessions/bulk` |
| PUT | `update(id, data)` | `/sessions/{id}` |
| DELETE | `delete(id)` | `/sessions/{id}` |
| PATCH | `updateStatus(id, data)` | `/sessions/{id}/status` |
| POST | `bulkComplete()` | `/sessions/bulk-complete` |

#### `studentsAPI`
| Method | Function | Endpoint |
|--------|----------|----------|
| GET | `getAll(params)` | `/students?activeOnly=&search=` |
| GET | `getById(id)` | `/students/{id}` |
| POST | `create(data)` | `/students` |
| PUT | `update(id, data)` | `/students/{id}` |
| DELETE | `delete(id)` | `/students/{id}` |
| PUT | `linkToUser(id, data)` | `/students/{id}/link` |
| GET | `searchUsers(q)` | `/students/search-users?q=` |

#### `usersAPI`
| Method | Function | Endpoint |
|--------|----------|----------|
| GET | `getAll(params)` | `/users?search=` |
| PUT | `assignRole(userId, data)` | `/users/{id}/roles` |
| DELETE | `removeRole(userId, role)` | `/users/{id}/roles/{role}` |

#### `linkRequestsAPI`
| Method | Function | Endpoint |
|--------|----------|----------|
| GET | `searchStudents(name)` | `/studentlinkrequests/search-students?name=` |
| POST | `claim(data)` | `/studentlinkrequests/claim` |
| POST | `createStudent(data)` | `/studentlinkrequests/create-student` |
| GET | `getMyRequests()` | `/studentlinkrequests/my` |
| GET | `getAll(status)` | `/studentlinkrequests/all?status=` |
| GET | `getPending()` | `/studentlinkrequests/pending` |
| GET | `getPendingCount()` | `/studentlinkrequests/pending-count` |
| PUT | `approve(id)` | `/studentlinkrequests/{id}/approve` |
| PUT | `reject(id, data)` | `/studentlinkrequests/{id}/reject` |
| DELETE | `clearResolved()` | `/studentlinkrequests/clear-resolved` |

#### `attendanceAPI`
| Method | Function | Endpoint |
|--------|----------|----------|
| GET | `getSessionAttendance(sessionId)` | `/attendance/session/{id}` |
| POST | `markAttendance(sessionId, data)` | `/attendance/session/{id}` |
| PUT | `updateAttendance(id, data)` | `/attendance/{id}` |
| DELETE | `deleteAttendance(id)` | `/attendance/{id}` |
| GET | `getStudentAttendance(studentId)` | `/attendance/student/{id}` |
| GET | `getStudentSummary(studentId)` | `/attendance/student/{id}/summary` |
| GET | `getMy()` | `/attendance/my` |

#### `classTypesAPI`
| Method | Function | Endpoint |
|--------|----------|----------|
| GET | `getAll(params)` | `/classtypes?includeInactive=` |
| GET | `getById(id)` | `/classtypes/{id}` |
| POST | `create(data)` | `/classtypes` |
| PUT | `update(id, data)` | `/classtypes/{id}` |
| DELETE | `delete(id)` | `/classtypes/{id}` |

#### `packageDefinitionsAPI`
| Method | Function | Endpoint |
|--------|----------|----------|
| GET | `getAll(params)` | `/packagedefinitions?classTypeId=&activeOnly=` |
| POST | `create(data)` | `/packagedefinitions` |
| PUT | `update(id, data)` | `/packagedefinitions/{id}` |
| DELETE | `delete(id)` | `/packagedefinitions/{id}` |

#### `billingAPI`
| Method | Function | Endpoint |
|--------|----------|----------|
| GET | `getPackages(params)` | `/billing/packages?year=&month=&studentId=` |
| POST | `enrollPackage(data)` | `/billing/packages` |
| POST | `bulkEnrollPackage(data)` | `/billing/packages/bulk` |
| DELETE | `deletePackage(id)` | `/billing/packages/{id}` |
| GET | `getPayments(params)` | `/billing/payments?studentId=&from=&to=` |
| POST | `recordPayment(data)` | `/billing/payments` |
| DELETE | `deletePayment(id)` | `/billing/payments/{id}` |
| GET | `getSummary(params)` | `/billing/summary?year=&month=` |
| GET | `getStudentBalance(studentId)` | `/billing/student/{id}` |
| GET | `getMyBilling()` | `/billing/my` |

### Default Export

The raw Axios instance is also exported as the default export, for any one-off API calls not covered by the named exports:
```javascript
import api from '../services/api';
const res = await api.get('/some-endpoint');
```
