# API.md — REST API Sənədləşməsi

> **Base URL (dev):** `http://localhost:5000/api`  
> **Base URL (prod):** `https://lms-cahan-academy.vercel.app/api`  
> **Format:** JSON  
> **Auth:** Bearer Token (JWT)  
> **Son yenilənmə:** 2026

---

## Ümumi Qaydalar

### Auth Header
Qorunan endpointlər üçün hər sorğuya aşağıdakı header əlavə edilməlidir:
```
Authorization: Bearer <access_token>
```

### Standart Cavab Formatı

```json
// Uğurlu
{
  "success": true,
  "message": "Əməliyyat uğurla tamamlandı",
  "data": { }
}

// Siyahı (pagination ilə)
{
  "success": true,
  "message": "Məlumatlar əldə edildi",
  "data": [ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}

// Xəta
{
  "success": false,
  "message": "Xəta mesajı",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

### HTTP Status Kodları

| Kod | Məna |
|---|---|
| `200` | Uğurlu |
| `201` | Yaradıldı |
| `400` | Yanlış sorğu (validation xətası) |
| `401` | Autentifikasiya tələb olunur |
| `403` | İcazə yoxdur |
| `404` | Tapılmadı |
| `409` | Konflikt (artıq mövcuddur) |
| `429` | Çox sorğu (rate limit) |
| `500` | Server xətası |

### Pagination Query Parametrləri
```
GET /api/teachers?page=1&limit=10&search=ali&sort=name&order=asc
```

| Parametr | Default | Məna |
|---|---|---|
| `page` | `1` | Səhifə nömrəsi |
| `limit` | `10` | Hər səhifədə neçə nəticə |
| `search` | — | Ad/email üzrə axtarış |
| `sort` | `createdAt` | Sıralama sahəsi |
| `order` | `desc` | `asc` / `desc` |

---

## AUTH ENDPOİNTLƏRİ

### `POST /api/auth/register`
**Açıqlama:** Yeni istifadəçi qeydiyyatı  
**Auth:** Tələb olunmur  

**Request Body:**
```json
{
  "name": "Əli Həsənov",
  "email": "ali@example.com",
  "password": "StrongPass123!",
  "confirmPassword": "StrongPass123!"
}
```

**Uğurlu Cavab `201`:**
```json
{
  "success": true,
  "message": "Qeydiyyat uğurla tamamlandı",
  "data": {
    "user": {
      "_id": "64a...",
      "name": "Əli Həsənov",
      "email": "ali@example.com",
      "role": "student"
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

### `POST /api/auth/login`
**Açıqlama:** Email və şifrə ilə giriş  
**Auth:** Tələb olunmur  

**Request Body:**
```json
{
  "email": "ali@example.com",
  "password": "StrongPass123!"
}
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "message": "Giriş uğurlu oldu",
  "data": {
    "user": {
      "_id": "64a...",
      "name": "Əli Həsənov",
      "email": "ali@example.com",
      "role": "admin",
      "avatar": "https://..."
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

### `POST /api/auth/google`
**Açıqlama:** Google OAuth ilə giriş/qeydiyyat  
**Auth:** Tələb olunmur  

**Request Body:**
```json
{
  "googleToken": "ya29.a0ARrd..."
}
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "message": "Google ilə giriş uğurlu oldu",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

### `POST /api/auth/logout`
**Açıqlama:** Çıxış  
**Auth:** Tələb olunur  

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "message": "Çıxış uğurlu oldu"
}
```

---

### `POST /api/auth/refresh-token`
**Açıqlama:** Access token-i yenilə  
**Auth:** Tələb olunmur  

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci..."
  }
}
```

---

### `POST /api/auth/forgot-password`
**Açıqlama:** Şifrəni sıfırlama emaili göndər  
**Auth:** Tələb olunmur  

**Request Body:**
```json
{
  "email": "ali@example.com"
}
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "message": "Şifrə sıfırlama linki emailinizə göndərildi"
}
```

---

### `POST /api/auth/reset-password/:token`
**Açıqlama:** Şifrəni sıfırla  
**Auth:** Tələb olunmur  

**Request Body:**
```json
{
  "password": "NewStrongPass123!",
  "confirmPassword": "NewStrongPass123!"
}
```

---

## İSTİFADƏÇİ ENDPOİNTLƏRİ

### `GET /api/users/me`
**Açıqlama:** Öz profilini gör  
**Auth:** Tələb olunur — `[admin, teacher, student]`  

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "64a...",
    "name": "Əli Həsənov",
    "email": "ali@example.com",
    "role": "teacher",
    "avatar": "https://...",
    "isActive": true,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

---

### `PUT /api/users/me`
**Açıqlama:** Öz profilini yenilə  
**Auth:** Tələb olunur — `[admin, teacher, student]`  

**Request Body:**
```json
{
  "name": "Əli Həsənov",
  "email": "ali@example.com"
}
```

---

### `PUT /api/users/me/password`
**Açıqlama:** Şifrəni dəyiş  
**Auth:** Tələb olunur — `[admin, teacher, student]`  

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

---

### `POST /api/users/me/avatar`
**Açıqlama:** Avatar yüklə  
**Auth:** Tələb olunur — `[admin, teacher, student]`  
**Content-Type:** `multipart/form-data`  

**Form Data:**
```
avatar: <image file> (max 2MB, jpg/png/webp)
```

---

## MÜƏLLİM ENDPOİNTLƏRİ

### `GET /api/teachers`
**Açıqlama:** Bütün müəllimlərin siyahısı  
**Auth:** Tələb olunur — `[admin]`  

**Query Parametrləri:**
```
?page=1&limit=10&search=ali&sort=name&order=asc
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a...",
      "name": "Leyla Məmmədova",
      "email": "leyla@example.com",
      "avatar": "https://...",
      "isActive": true,
      "groupCount": 3,
      "studentCount": 45,
      "createdAt": "2026-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "pages": 2
  }
}
```

---

### `GET /api/teachers/:id`
**Açıqlama:** Tək müəllimin məlumatları  
**Auth:** Tələb olunur — `[admin]`  

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "64a...",
    "name": "Leyla Məmmədova",
    "email": "leyla@example.com",
    "avatar": "https://...",
    "groups": [
      { "_id": "...", "name": "A Qrupu" }
    ],
    "isActive": true,
    "createdAt": "2026-01-10T08:00:00Z"
  }
}
```

---

### `POST /api/teachers/invite`
**Açıqlama:** Müəllimə dəvət emaili göndər  
**Auth:** Tələb olunur — `[admin]`  

**Request Body:**
```json
{
  "email": "yeni.muellim@example.com"
}
```

**Uğurlu Cavab `201`:**
```json
{
  "success": true,
  "message": "Dəvət emaili göndərildi",
  "data": {
    "invitationId": "64b...",
    "email": "yeni.muellim@example.com",
    "expiresAt": "2026-02-01T10:00:00Z"
  }
}
```

---

### `PUT /api/teachers/:id`
**Açıqlama:** Müəllim məlumatlarını yenilə  
**Auth:** Tələb olunur — `[admin]`  

**Request Body:**
```json
{
  "name": "Leyla Əliyeva",
  "isActive": true
}
```

---

### `DELETE /api/teachers/:id`
**Açıqlama:** Müəllimi sistemdən sil  
**Auth:** Tələb olunur — `[admin]`  

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "message": "Müəllim uğurla silindi"
}
```

---

## TƏLƏBƏ ENDPOİNTLƏRİ

### `GET /api/students`
**Açıqlama:** Bütün tələbələrin siyahısı  
**Auth:** Tələb olunur — `[admin, teacher]`  
> Müəllim yalnız öz qrupundakı tələbələri görür

**Query Parametrləri:**
```
?page=1&limit=10&search=kamran&groupId=64a...
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64c...",
      "name": "Kamran Rəsulов",
      "email": "kamran@example.com",
      "avatar": "https://...",
      "group": { "_id": "...", "name": "A Qrupu" },
      "isActive": true
    }
  ],
  "pagination": { ... }
}
```

---

### `GET /api/students/:id`
**Açıqlama:** Tək tələbənin məlumatları  
**Auth:** Tələb olunur — `[admin, teacher]`  

---

### `POST /api/students/invite`
**Açıqlama:** Tələbəyə dəvət emaili göndər  
**Auth:** Tələb olunur — `[admin]`  

**Request Body:**
```json
{
  "email": "yeni.telebe@example.com",
  "groupId": "64a..."
}
```

---

### `PUT /api/students/:id`
**Auth:** Tələb olunur — `[admin]`  

---

### `DELETE /api/students/:id`
**Auth:** Tələb olunur — `[admin]`  

---

## DƏVƏT ENDPOİNTLƏRİ

### `GET /api/invitations`
**Açıqlama:** Bütün dəvətlərin siyahısı  
**Auth:** Tələb olunur — `[admin]`  

**Query Parametrləri:**
```
?status=pending&role=teacher&page=1&limit=10
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64d...",
      "email": "muellim@example.com",
      "role": "teacher",
      "status": "pending",
      "invitedBy": { "_id": "...", "name": "Admin" },
      "expiresAt": "2026-02-01T10:00:00Z",
      "createdAt": "2026-01-25T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### `POST /api/invitations`
**Açıqlama:** Yeni dəvət göndər  
**Auth:** Tələb olunur — `[admin]`  

**Request Body:**
```json
{
  "email": "yeni@example.com",
  "role": "teacher"
}
```

---

### `GET /api/invitations/accept/:token`
**Açıqlama:** Dəvəti qəbul et (email linkindən gəlir)  
**Auth:** Tələb olunmur  

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "message": "Dəvət qəbul edildi. Qeydiyyatı tamamlayın.",
  "data": {
    "email": "yeni@example.com",
    "role": "teacher"
  }
}
```

---

### `POST /api/invitations/:id/resend`
**Açıqlama:** Dəvəti yenidən göndər  
**Auth:** Tələb olunur — `[admin]`  

---

### `DELETE /api/invitations/:id`
**Açıqlama:** Dəvəti ləğv et  
**Auth:** Tələb olunur — `[admin]`  

---

## QRUP ENDPOİNTLƏRİ

### `GET /api/groups`
**Açıqlama:** Bütün qrupların siyahısı  
**Auth:** Tələb olunur — `[admin, teacher]`  
> Müəllim yalnız öz qruplarını görür

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64e...",
      "name": "A Qrupu",
      "teacher": { "_id": "...", "name": "Leyla Məmmədova" },
      "studentCount": 15,
      "isActive": true,
      "createdAt": "2026-01-05T08:00:00Z"
    }
  ]
}
```

---

### `GET /api/groups/:id`
**Açıqlama:** Tək qrupun detalları (tələbə siyahısı ilə)  
**Auth:** Tələb olunur — `[admin, teacher]`  

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "64e...",
    "name": "A Qrupu",
    "teacher": { "_id": "...", "name": "Leyla Məmmədova" },
    "students": [
      { "_id": "...", "name": "Kamran Rəsulov", "email": "..." }
    ],
    "schedule": [ ... ],
    "isActive": true
  }
}
```

---

### `POST /api/groups`
**Açıqlama:** Yeni qrup yarat  
**Auth:** Tələb olunur — `[admin]`  

**Request Body:**
```json
{
  "name": "B Qrupu",
  "teacherId": "64a..."
}
```

---

### `PUT /api/groups/:id`
**Auth:** Tələb olunur — `[admin]`  

**Request Body:**
```json
{
  "name": "B Qrupu (Yeniləndi)",
  "teacherId": "64b..."
}
```

---

### `DELETE /api/groups/:id`
**Auth:** Tələb olunur — `[admin]`  

---

### `POST /api/groups/:id/students`
**Açıqlama:** Qrupa tələbə əlavə et  
**Auth:** Tələb olunur — `[admin]`  

**Request Body:**
```json
{
  "studentIds": ["64c...", "64d..."]
}
```

---

### `DELETE /api/groups/:id/students/:studentId`
**Açıqlama:** Qrupdan tələbəni çıxar  
**Auth:** Tələb olunur — `[admin]`  

---

## CƏDVƏL ENDPOİNTLƏRİ

### `GET /api/schedule`
**Açıqlama:** Cədvəl siyahısı  
**Auth:** Tələb olunur — `[admin, teacher, student]`  
> Hər rol yalnız öz cədvəlini görür

**Query Parametrləri:**
```
?groupId=64a...&teacherId=64b...&dayOfWeek=1
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "group": { "_id": "...", "name": "A Qrupu" },
      "teacher": { "_id": "...", "name": "Leyla Məmmədova" },
      "subject": "Riyaziyyat",
      "dayOfWeek": 1,
      "dayName": "Bazar ertəsi",
      "startTime": "09:00",
      "endTime": "10:30",
      "room": "201"
    }
  ]
}
```

---

### `POST /api/schedule`
**Açıqlama:** Cədvələ yeni dərs əlavə et  
**Auth:** Tələb olunur — `[admin]`  

**Request Body:**
```json
{
  "groupId": "64a...",
  "teacherId": "64b...",
  "subject": "Riyaziyyat",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:30",
  "room": "201"
}
```

---

### `PUT /api/schedule/:id`
**Auth:** Tələb olunur — `[admin]`  

---

### `DELETE /api/schedule/:id`
**Auth:** Tələb olunur — `[admin]`  

---

## EV TAPŞIRIĞI ENDPOİNTLƏRİ

### `GET /api/homeworks`
**Açıqlama:** Tapşırıqlar siyahısı  
**Auth:** Tələb olunur — `[admin, teacher, student]`  

**Query Parametrləri:**
```
?groupId=64a...&status=active&page=1&limit=10
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64g...",
      "title": "Fəsil 3 məsələləri",
      "description": "Səh 45-50 məsələlər",
      "group": { "_id": "...", "name": "A Qrupu" },
      "teacher": { "_id": "...", "name": "Leyla Məmmədova" },
      "dueDate": "2026-02-10T23:59:59Z",
      "attachments": ["https://..."],
      "submissionCount": 8,
      "totalStudents": 15,
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ]
}
```

---

### `GET /api/homeworks/:id`
**Auth:** Tələb olunur — `[admin, teacher, student]`  

---

### `POST /api/homeworks`
**Açıqlama:** Yeni tapşırıq yarat  
**Auth:** Tələb olunur — `[admin, teacher]`  

**Request Body:**
```json
{
  "title": "Fəsil 3 məsələləri",
  "description": "Səh 45-50 məsələlər həll edin",
  "groupId": "64a...",
  "dueDate": "2026-02-10T23:59:59Z"
}
```

---

### `PUT /api/homeworks/:id`
**Auth:** Tələb olunur — `[admin, teacher]`  

---

### `DELETE /api/homeworks/:id`
**Auth:** Tələb olunur — `[admin, teacher]`  

---

### `POST /api/homeworks/:id/submit`
**Açıqlama:** Tələbə tapşırığı təhvil verir  
**Auth:** Tələb olunur — `[student]`  
**Content-Type:** `multipart/form-data`  

**Form Data:**
```
files: <files> (max 5 fayl, hər biri max 10MB)
note: "Əlavə qeydim var"
```

---

### `PUT /api/homeworks/:id/grade/:studentId`
**Açıqlama:** Tələbənin tapşırığını qiymətləndir  
**Auth:** Tələb olunur — `[admin, teacher]`  

**Request Body:**
```json
{
  "grade": 85,
  "feedback": "Yaxşı iş, lakin 3-cü məsələdə xəta var"
}
```

---

## SİNİF İŞİ ENDPOİNTLƏRİ

### `GET /api/classworks`
**Auth:** Tələb olunur — `[admin, teacher, student]`  

### `GET /api/classworks/:id`
**Auth:** Tələb olunur — `[admin, teacher, student]`  

### `POST /api/classworks`
**Auth:** Tələb olunur — `[admin, teacher]`  

**Request Body:**
```json
{
  "title": "Mövzu 5 — Müzakirə",
  "description": "Sinif daxili tapşırıq",
  "groupId": "64a...",
  "date": "2026-02-05T09:00:00Z"
}
```

### `PUT /api/classworks/:id`
**Auth:** Tələb olunur — `[admin, teacher]`  

### `DELETE /api/classworks/:id`
**Auth:** Tələb olunur — `[admin, teacher]`  

---

## İMTAHAN ENDPOİNTLƏRİ

### `GET /api/exams`
**Açıqlama:** İmtahanlar siyahısı  
**Auth:** Tələb olunur — `[admin, teacher, student]`  

**Query Parametrləri:**
```
?groupId=64a...&type=written&upcoming=true
```

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64h...",
      "name": "Yarımillik imtahan",
      "group": { "_id": "...", "name": "A Qrupu" },
      "teacher": { "_id": "...", "name": "Leyla Məmmədova" },
      "date": "2026-03-15T09:00:00Z",
      "duration": 90,
      "type": "written",
      "resultsCount": 0,
      "totalStudents": 15
    }
  ]
}
```

---

### `GET /api/exams/:id`
**Auth:** Tələb olunur — `[admin, teacher, student]`  

---

### `POST /api/exams`
**Açıqlama:** Yeni imtahan yarat  
**Auth:** Tələb olunur — `[admin, teacher]`  

**Request Body:**
```json
{
  "name": "Yarımillik imtahan",
  "groupId": "64a...",
  "date": "2026-03-15T09:00:00Z",
  "duration": 90,
  "type": "written"
}
```

---

### `PUT /api/exams/:id`
**Auth:** Tələb olunur — `[admin, teacher]`  

---

### `DELETE /api/exams/:id`
**Auth:** Tələb olunur — `[admin]`  

---

### `GET /api/exams/:id/results`
**Açıqlama:** İmtahan nəticələri  
**Auth:** Tələb olunur — `[admin, teacher]`  
> Tələbə yalnız öz nəticəsini görür

**Uğurlu Cavab `200`:**
```json
{
  "success": true,
  "data": {
    "exam": { "_id": "...", "name": "Yarımillik imtahan" },
    "results": [
      {
        "student": { "_id": "...", "name": "Kamran Rəsulov" },
        "grade": 92,
        "notes": "Əla nəticə"
      }
    ],
    "average": 78.5,
    "highest": 98,
    "lowest": 45
  }
}
```

---

### `POST /api/exams/:id/results`
**Açıqlama:** İmtahan nəticələrini daxil et  
**Auth:** Tələb olunur — `[admin, teacher]`  

**Request Body:**
```json
{
  "results": [
    { "studentId": "64c...", "grade": 92, "notes": "Əla" },
    { "studentId": "64d...", "grade": 75, "notes": "" }
  ]
}
```

---

## DASHBOARD ENDPOİNTLƏRİ

### `GET /api/dashboard/stats`
**Açıqlama:** Dashboard statistikası  
**Auth:** Tələb olunur — `[admin, teacher, student]`  
> Hər rol fərqli statistika alır

**Admin Cavabı `200`:**
```json
{
  "success": true,
  "data": {
    "totalTeachers": 12,
    "totalStudents": 145,
    "totalGroups": 8,
    "totalExams": 24,
    "pendingInvitations": 3,
    "activeHomeworks": 18,
    "recentActivity": [
      {
        "type": "invitation_accepted",
        "message": "Leyla Məmmədova dəvəti qəbul etdi",
        "createdAt": "2026-01-28T14:00:00Z"
      }
    ]
  }
}
```

**Müəllim Cavabı `200`:**
```json
{
  "success": true,
  "data": {
    "myGroups": 3,
    "myStudents": 45,
    "activeHomeworks": 6,
    "upcomingExams": 2,
    "pendingGrades": 12
  }
}
```

**Tələbə Cavabı `200`:**
```json
{
  "success": true,
  "data": {
    "myGroup": { "_id": "...", "name": "A Qrupu" },
    "pendingHomeworks": 3,
    "upcomingExams": 1,
    "averageGrade": 84.5,
    "attendanceRate": 92
  }
}
```

---

## XƏTA KODLARI

| Kod | HTTP Status | Açıqlama |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Daxil edilən məlumat yanlışdır |
| `UNAUTHORIZED` | 401 | Token yoxdur və ya etibarsızdır |
| `TOKEN_EXPIRED` | 401 | Token müddəti bitib |
| `FORBIDDEN` | 403 | Bu əməliyyat üçün icazə yoxdur |
| `NOT_FOUND` | 404 | Resurs tapılmadı |
| `ALREADY_EXISTS` | 409 | Bu məlumat artıq mövcuddur |
| `INVITATION_EXPIRED` | 410 | Dəvətin müddəti bitib |
| `RATE_LIMIT_EXCEEDED` | 429 | Çox sorğu göndərildi |
| `INTERNAL_ERROR` | 500 | Server xətası |

---

## RATE LİMİTİNG

| Endpoint Qrupu | Limit | Müddət |
|---|---|---|
| `POST /api/auth/login` | 5 sorğu | 15 dəqiqə |
| `POST /api/auth/register` | 3 sorğu | 1 saat |
| `POST /api/auth/forgot-password` | 3 sorğu | 1 saat |
| Digər auth endpointlər | 20 sorğu | 15 dəqiqə |
| Ümumi API | 100 sorğu | 1 dəqiqə |
