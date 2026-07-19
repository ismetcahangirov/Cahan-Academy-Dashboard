# Jitsi Meet inteqrasiyası — Dizayn Sənədi

> **Layihə:** Cahan Academy Dashboard
> **Tarix:** 2026-07-19
> **Mənbə istinad:** `C:/Users/cahan/projects/alievs-space-lms` (meet funksiyası)
> **Status:** Təsdiq gözlənilir

---

## 1. Məqsəd və Kontekst

Cədvəldəki **online** dərslərə videokonfrans (meet) inteqrasiyası. Dərs vaxtı çatanda cədvəldə **"Qoşul"** düyməsi aktivləşir; kliklədikdə istifadəçi (müəllim/tələbə) həmin dərsin video otağına qoşulur — mənbə layihədəki (`alievs-space-lms`) təcrübəyə uyğun, **lakin dərs qeydiyyatı (recording) OLMADAN** və **0 büdcə** ilə.

### 1.1. Niyə Jitsi (LiveKit deyil)

Mənbə layihə **LiveKit (media SFU) + daimi Go WebSocket Hub (chat/moderasiya) + LiveKit egress (recording)** istifadə edir. Hazırkı layihənin reallığı:

- **Backend Vercel serverless-də işləyir** (`server.js` yalnız `NODE_ENV !== 'production'`-da `app.listen()` çağırır, əks halda `app` export olunur). Serverless funksiyalar **uzunömürlü WebSocket** saxlaya bilmir → mənbənin chat/moderasiya Hub-u burada işləyə bilməz.
- **0 büdcə**: LiveKit Cloud pulsuz tarifi ayda ~5,000 iştirakçı-dəqiqəsi (≈ ayda 5 dərs) verir, sonra dayanır → real akademiyaya davamlı yetmir. Self-host LiveKit/Jitsi isə pullu server tələb edir.

**Nəticə:** `meet.jit.si` (embedded Jitsi) — tam pulsuz, limitsiz, yeni infrastruktur yox. Video, səs, ekran paylaşımı, chat, iştirakçı siyahısı, mute/kick moderasiya, grid görünüş, əl qaldırma — hamısı Jitsi otağının içində hazırdır. Recording toolbar-dan çıxarılır.

### 1.2. Təsdiqlənmiş qərarlar

| Sual | Qərar |
|---|---|
| Video provayder | **Jitsi (embedded, meet.jit.si)** |
| "Qoşul" pəncərəsi | **Dərsdən 10 dəqiqə əvvəldən** dərs bitənə qədər |
| Prejoin ekranı | **Bəli** — mikrofon/kamera seçim ekranı |
| Vaxt zonası | **Asia/Baku** (həm client, həm server) |
| Meeting modeli | **Bəli** — hər occurrence DB-də qeyd olunur (stateless HMAC deyil) |
| Recording | **Yox** |

---

## 2. Ümumi Arxitektura

```
┌────────────────────────────────────────────────────────────┐
│  Client (React JS/JSX + RTK Query)                         │
│                                                            │
│  Schedule.jsx ── <JoinClassButton/>                        │
│     │  (online + vaxt pəncərəsi daxilində aktiv)           │
│     ▼  klik → naviqasiya                                   │
│  /meeting/:scheduleId?date=YYYY-MM-DD                      │
│     │                                                      │
│  MeetingRoom.jsx (tam ekran)                              │
│     │  1) POST join-or-create → { roomName, ... }         │
│     │  2) JitsiMeetExternalAPI(domain, {roomName,...})     │
│     ▼  prejoin → otaq → readyToClose → /schedule          │
└──────────────────────────┬─────────────────────────────────┘
                           │ HTTPS (Bearer JWT)
                           ▼
┌────────────────────────────────────────────────────────────┐
│  Server (Node/Express + MongoDB, Vercel serverless)        │
│  POST /api/meetings/join-or-create/:scheduleId             │
│     access + online + vaxt yoxlaması → Meeting upsert      │
│  POST /api/meetings/:id/leave (istəyə bağlı)               │
│                                                            │
│  Meeting model (Mongo) ── ref → Schedule, Group, User      │
└──────────────────────────┬─────────────────────────────────┘
                           ▼
              meet.jit.si  (media/otaq — pulsuz, xarici)
```

**Prinsiplər:**
- Yeni daimi bağlantı (WebSocket) YOX → serverless uyğun.
- Otaq adı təsadüfi (`crypto.randomUUID`), Meeting qeydinə bağlı → təxmin edilə bilməz.
- Provayder domeni env ilə dəyişdirilə bilər → gələcəkdə self-host Jitsi-yə keçid yalnız env dəyişikliyidir.

---

## 3. Backend Dizaynı

### 3.1. Yeni model: `server/models/Meeting.js`

```js
const meetingSchema = new mongoose.Schema({
  schedule:       { type: ObjectId, ref: 'Schedule', required: true, index: true },
  group:          { type: ObjectId, ref: 'Group' },
  teacher:        { type: ObjectId, ref: 'User' },
  subject:        { type: String },
  occurrenceDate: { type: String, required: true }, // "YYYY-MM-DD" (Asia/Baku)
  roomName:       { type: String, required: true, unique: true }, // "cahanacademy-<uuid>"
  startTime:      { type: String }, // "HH:mm"
  endTime:        { type: String },
  status:         { type: String, enum: ['active', 'ended'], default: 'active' },
  participants: [{
    user:     { type: ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    leftAt:   { type: Date },
  }],
}, { timestamps: true });

meetingSchema.index({ schedule: 1, occurrenceDate: 1 }, { unique: true });
```

`(schedule, occurrenceDate)` üzrə unikal indeks → eyni dərsin eyni günü üçün **bir otaq**; upsert ilə race-condition qorunur.

### 3.2. Yeni controller: `server/controllers/meetingController.js`

**A) `joinOrCreateMeeting`** — `POST /api/meetings/join-or-create/:scheduleId`, body: `{ date?: "YYYY-MM-DD" }`, `protect`.

Addımlar:
1. `Schedule.findById(scheduleId).populate('group', 'name students teacher').populate('teacher','name')`; yoxdursa → 404.
2. `schedule.type !== 'online'` → 400 (`"Bu dərs online deyil"`).
3. **occurrenceDate**: `date` verilməyibsə serverdə Asia/Baku-da bugünkü tarixi hesabla. Verilibsə format yoxla (`YYYY-MM-DD`).
4. **Tarix uyğunluğu**:
   - `repetitionType === 'weekly'`: occurrenceDate-in həftə günü (Asia/Baku, 0=B.e konvensiyası) `schedule.dayOfWeek`-ə bərabər olmalıdır.
   - `repetitionType === 'once'`: occurrenceDate `schedule.specificDate`-in Asia/Baku tarixinə bərabər olmalıdır.
   - Uyğun deyilsə → 400.
5. **Giriş yoxlaması** (`canAccessSchedule`): `admin` **VƏ YA** `schedule.teacher._id == user._id` **VƏ YA** `user._id ∈ schedule.group.students`. Deyilsə → 403.
6. **Vaxt pəncərəsi** (`isWithinJoinWindow`): Asia/Baku-da cari vaxt occurrenceDate günündə **[startTime − 10dəq, endTime]** aralığında olmalıdır. Deyilsə → 403 (`"Dərs hələ başlamayıb və ya bitib"`).
7. **Upsert**:
   ```js
   const meeting = await Meeting.findOneAndUpdate(
     { schedule: scheduleId, occurrenceDate },
     { $setOnInsert: { schedule, group, teacher, subject, occurrenceDate,
                       roomName: `cahanacademy-${crypto.randomUUID()}`,
                       startTime, endTime, status: 'active' } },
     { upsert: true, new: true, setDefaultsOnInsert: true }
   );
   ```
8. **Participant əlavəsi**: bu user artıq açıq (leftAt olmayan) qeyddə yoxdursa → `participants`-ə `{ user, joinedAt }` push.
9. Cavab:
   ```json
   { "success": true, "data": {
       "meetingId": "...", "roomName": "cahanacademy-<uuid>",
       "subject": "<subject>", "displayName": "<user.name>",
       "jitsiDomain": "meet.jit.si" } }
   ```
   `jitsiDomain` serverdə `process.env.JITSI_DOMAIN || 'meet.jit.si'`.

**B) `leaveMeeting`** (istəyə bağlı) — `POST /api/meetings/:id/leave`, `protect`. Cari user-in son açıq participant qeydinə `leftAt = now` yazır. (Client `readyToClose` event-ində çağırır; uğursuz olsa kritik deyil.)

### 3.3. Yardımçı: `server/utils/academyTime.js`

Asia/Baku üçün `Intl.DateTimeFormat` əsaslı funksiyalar (mənbədəki `nowInTimezone` məntiqinin portu):
- `nowInAcademyTz()` → `{ dateStr: "YYYY-MM-DD", hour, minute, dayOfWeek }` (dayOfWeek: **0=B.e … 6=Bazar**, mövcud `Schedule.jsx` konvensiyası ilə: `jsDay===0 ? 6 : jsDay-1`).
- `dateStrInAcademyTz(date)` → verilmiş `Date`-in Asia/Baku-da `YYYY-MM-DD`-i.
- Timezone: `process.env.ACADEMY_TIMEZONE || 'Asia/Baku'`.

### 3.4. Route qeydiyyatı

- Yeni fayl: `server/routes/meetingRoutes.js` → `POST /join-or-create/:scheduleId`, `POST /:id/leave` (hər ikisi `protect`).
- `server.js`: `import meetingRoutes` + `app.use('/api/meetings', meetingRoutes)`.

### 3.5. Env dəyişənləri (yeni)

| Dəyişən | Default | Təyinat |
|---|---|---|
| `ACADEMY_TIMEZONE` | `Asia/Baku` | Vaxt pəncərəsi hesablaması |
| `JITSI_DOMAIN` | `meet.jit.si` | Jitsi provayder domeni |

`docs/DEPLOYMENT.md`-ə əlavə olunur.

---

## 4. Frontend Dizaynı

### 4.1. RTK Query: `client/src/features/meetings/meetingsApi.js`

`apiSlice.injectEndpoints` ilə:
- `joinOrCreateMeeting` — `mutation`, `POST /meetings/join-or-create/:scheduleId`, body `{ date }`, `transformResponse: r => r.data`.
- `leaveMeeting` — `mutation`, `POST /meetings/:id/leave`.
- `apiSlice`-in `tagTypes`-ına `'Meeting'` əlavə olunur.

### 4.2. Komponent: `client/src/components/schedule/JoinClassButton.jsx`

- Props: `entry` (schedule entry).
- Yalnız `entry.type === 'online'` üçün render.
- Yardımçı `client/src/utils/academyTime.js` (server ilə eyni məntiq) ilə **Asia/Baku**-da cari vaxtı hesablayır.
- `shouldShow`: occurrence günü uyğundursa (weekly → dayOfWeek; once → specificDate) və cari vaxt **[start − 10dəq, end]** aralığındadırsa.
- `useEffect` + `setInterval(30_000)` → hər 30 saniyədə yenidən hesablanır ki, dərs başlayanda düymə avtomatik peyda olsun (və bitəndə itsin).
- Aktiv olduqda: yaşıl **"Qoşul"** düyməsi. Klik → `navigate('/meeting/' + entry._id + '?date=' + occurrenceDateStr)`.
- Aktiv deyilsə → heç nə (və ya offline dərsdə `room` göstərilir — mövcud davranış saxlanılır).

`Schedule.jsx`-də dəyişiklik: online badge-in yanına `<JoinClassButton entry={entry} />` əlavə olunur (kart strukturu qorunur).

### 4.3. Səhifə: `client/src/pages/meeting/MeetingRoom.jsx` (tam ekran)

1. `useParams` → `scheduleId`; `useSearchParams` → `date`.
2. `useJoinOrCreateMeetingMutation` çağırılır (mount-da bir dəfə) → `{ roomName, subject, displayName, jitsiDomain }`.
   - Xəta (403/400) → `toast.error(mesaj)` + `navigate('/schedule')`.
3. Jitsi yüklənməsi:
   - `https://<jitsiDomain>/external_api.js` skripti dinamik yüklənir (bir dəfə; qlobal `window.JitsiMeetExternalAPI` yoxlanır).
   - `new JitsiMeetExternalAPI(jitsiDomain, options)`:
     ```js
     {
       roomName,
       parentNode: containerRef.current,
       width: '100%', height: '100%',
       userInfo: { displayName, email },
       configOverwrite: {
         prejoinPageEnabled: true,           // mikrofon/kamera seçim ekranı
         prejoinConfig: { enabled: true },   // yeni Jitsi üçün
         disableDeepLinking: true,
         disableThirdPartyRequests: true,
         // recording/livestream funksiyaları söndürülür
       },
       interfaceConfigOverwrite: {
         TOOLBAR_BUTTONS: [ /* recording, livestreaming, __ çıxarılıb */
           'microphone','camera','desktop','fullscreen','fodeviceselection',
           'hangup','chat','raisehand','participants-pane','tileview','select-background','settings'
         ],
       },
     }
     ```
4. Event-lər:
   - `readyToClose` / `videoConferenceLeft` → `leaveMeeting` (best-effort) + `api.dispose()` + `navigate('/schedule')`.
5. Cleanup: unmount-da `api.dispose()` və skript listener-ləri təmizlənir.
6. Yüklənmə vəziyyəti: `<Spinner/>` (mövcud komponent).

### 4.4. Route: `client/src/App.jsx`

`ProtectedRoute` daxilində, **`AppLayout`-dan kənar** (tam ekran, sidebar-sız):
```jsx
<Route element={<ProtectedRoute />}>
  <Route path="/meeting/:scheduleId" element={<MeetingRoom />} />
  <Route element={<AppLayout />}> ... </Route>
</Route>
```
`MeetingRoom` lazy-load olunur.

### 4.5. i18n (az / en / ru)

`client/src/i18n/locales/*.json`-a əlavə:
- `schedule.join` ("Qoşul" / "Join" / "Присоединиться")
- `meeting.connecting`, `meeting.joinFailed`, `meeting.notStarted`, `meeting.leave` və s.

### 4.6. Yardımçı: `client/src/utils/academyTime.js`

Server `academyTime.js` ilə eyni məntiqin JS portu (Intl, Asia/Baku, 0=B.e konvensiyası). Client və server eyni nəticəni verir → düymə göründükdə server də icazə verir.

---

## 5. Təhlükəsizlik və Məhdudiyyətlər (dürüst)

✅ **Təmin olunur:**
- Otaq adı təsadüfidir (`randomUUID`) və yalnız server tərəfindən — access + online + vaxt yoxlamasından keçdikdən sonra — verilir.
- Vaxt pəncərəsi həm client (UX), həm server (məcburi) tərəfdə tətbiq olunur.
- COOP header artıq `same-origin-allow-popups`-dır (Jitsi popup-ları ilə uyğun).

⚠️ **Məhdudiyyətlər (`meet.jit.si` ictimai server):**
- Otaq adını əldə edən şəxs (məs. linki paylaşsa) qoşula bilər — Jitsi otağının daxilində server-məcburi kimlik yoxlaması yoxdur.
- **Moderator = otağa ilk qoşulan** şəxsdir; müəllimin həmişə moderator olması ictimai serverdə zəmanətli deyil.
- `meet.jit.si` "production üçün nəzərdə tutulmayıb" (SLA yox); nadir hallarda lobby/təsdiq tələb edə bilər.
- **Güclü nəzarət** (müəllim həmişə moderator, JWT ilə giriş) lazım olduqda → gələcəkdə **self-host Jitsi + JWT**; dizayn buna hazırdır (`JITSI_DOMAIN` env dəyişikliyi + JWT token endpoint-i).

---

## 6. Test Strategiyası

**Backend (vitest + mongodb-memory-server):**
- `joinOrCreateMeeting`: admin/teacher/student(qrupda) → uğur; kənar user → 403.
- online olmayan dərs → 400.
- vaxt pəncərəsi: aralıq daxili → uğur; öncə/sonra → 403.
- tarix uyğunsuzluğu (weekly dayOfWeek / once specificDate) → 400.
- upsert: eyni (schedule, date) üçün iki çağırış → **eyni** `roomName`, bir Meeting sənədi.

**Frontend (vitest + fake timers):**
- `JoinClassButton`: pəncərə daxilində düymə görünür; xaricində görünmür; offline dərsdə görünmür.
- `academyTime.js`: dayOfWeek mapping (Bazar→6), Asia/Baku tarix hesablaması.

---

## 7. Əhatə Dairəsi

**Daxil (bu mərhələ):**
- Meeting modeli + join-or-create/leave endpoint-ləri.
- JoinClassButton + MeetingRoom səhifəsi + route + i18n.
- Prejoin ekranı, recording-siz Jitsi konfiqurasiyası.
- Testlər.

**Kənar (gələcək — model buna hazırdır):**
- Recording (istənilmir).
- Meeting-dən avtomatik davamiyyət (mövcud `Attendance` ilə əlaqələndirmə).
- Meeting tarixçəsi/siyahısı səhifəsi (admin/teacher).
- Self-host Jitsi + JWT ilə moderator nəzarəti.

---

## 8. Fayl Dəyişiklikləri (xülasə)

**Backend — yeni:**
- `server/models/Meeting.js`
- `server/controllers/meetingController.js`
- `server/routes/meetingRoutes.js`
- `server/utils/academyTime.js`

**Backend — dəyişən:**
- `server/server.js` (route qeydiyyatı)

**Frontend — yeni:**
- `client/src/features/meetings/meetingsApi.js`
- `client/src/components/schedule/JoinClassButton.jsx`
- `client/src/pages/meeting/MeetingRoom.jsx`
- `client/src/utils/academyTime.js`

**Frontend — dəyişən:**
- `client/src/pages/schedule/Schedule.jsx` (düymə əlavəsi)
- `client/src/App.jsx` (route)
- `client/src/app/api/apiSlice.js` (`'Meeting'` tag)
- `client/src/i18n/locales/{az,en,ru}.json`

**Sənəd — dəyişən:**
- `docs/DEPLOYMENT.md` (yeni env dəyişənləri)
