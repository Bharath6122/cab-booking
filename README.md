# Cabby — Full-stack cab booking

Cabby is a standalone portfolio/client-ready cab booking application. This project lives in its own `cab-booking` folder and is independent of the portfolio website.

## What works

- Customer registration and login with BCrypt password hashing and expiring JWTs.
- Role-protected administrator access; public registration can only create customer accounts.
- Browse available ride types and receive a server-calculated fare quote.
- Create bookings with a server-calculated fare, lock the cab during reservation, review booking history, and cancel eligible rides.
- Booking status transitions are validated in the service layer. Completed or cancelled rides release the cab and driver.
- Admin tools for users, cabs, drivers, booking status, fleet availability, dashboard metrics, and completed-fare revenue.
- Bean Validation, DTO-based responses, consistent JSON errors, pagination for users, and backend ownership checks.
- MySQL schema managed with Flyway. The frontend is responsive and includes sign-in, registration, booking, profile, customer dashboard, and admin screens.

The fare is calculated as `base fare + (distance in km × cab rate per km)`. The default base fare is ₹100; change `BASE_FARE` to configure it. Cab rates are stored per vehicle in MySQL and are managed in the admin screen. The server calculates the quote and booking total; it does not accept a total from the browser. Distance is a rider-supplied estimate, not a map-routed measurement.

## Stack and structure

- **API:** Java 17, Spring Boot 3, Spring MVC, Spring Security, JWT, Spring Data JPA, Hibernate, Bean Validation, Flyway.
- **Database:** MySQL 8.
- **Web:** React 18, JavaScript, Vite, React Router, Axios, responsive CSS.

```text
cab-booking/
├── server/                    # Spring Boot REST API
│   └── src/main/java/com/bharath/cabbooking/
│       ├── config/            # Startup fleet/admin provisioning
│       ├── controller/        # REST endpoints and JSON error handling
│       ├── domain/            # Roles and lifecycle enums
│       ├── dto/               # Validated requests and API responses
│       ├── entity/            # JPA entities
│       ├── repository/        # Spring Data repositories
│       ├── security/          # JWT filter and access rules
│       └── service/           # Booking rules, fare logic, and mapping
├── src/                       # React application
├── docker-compose.yml         # Local MySQL + API + web UI
└── render.yaml                # Cloud blueprint (requires external MySQL)
```

## Run locally with Docker

1. Install Docker Desktop and start its Linux container engine.
2. Copy `.env.example` to `.env`. Replace `JWT_SECRET` with a random secret of at least 32 bytes and set a strong `ADMIN_PASSWORD` of at least 12 characters. Keep `.env` private.
3. From this folder, run:

   ```powershell
   docker compose up --build
   ```

4. Open [http://localhost:8081](http://localhost:8081). MySQL is initialized by Flyway; four sample cabs and drivers are created on first start. The admin account is created only when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.
5. To stop the services, run `docker compose down`. To preserve booking data, do **not** remove the `mysql_data` volume.

The Compose defaults are for local development only. Use separate, strong credentials and secret values for any internet-accessible deployment.

## Run locally without Docker

Prerequisites: Java 17, Maven 3.9+, Node.js 20+, and a running MySQL 8 server.

1. Create a `cab_booking` database and configure the `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` environment variables.
2. In `server/`, run `mvn spring-boot:run`. Set `JWT_SECRET`; optionally set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. In the project root, run `npm install`, then `npm run dev`.
4. Open [http://localhost:5173](http://localhost:5173). Set `VITE_API_URL` if the API is not at `http://localhost:8080/api`.

## API guide

The API base URL is `/api`. JSON request examples:

The Postman collection in `postman/Cabby.postman_collection.json` includes customer auth, cab search, fare estimate, booking/cancellation, admin dashboard, and role-access smoke tests.

### Register and log in

```http
POST /api/auth/register
Content-Type: application/json

{"fullName":"Jamie Rider","email":"jamie@example.com","password":"a-long-demo-password","phone":"+91 90000 11111"}
```

```http
POST /api/auth/login
Content-Type: application/json

{"email":"jamie@example.com","password":"a-long-demo-password"}
```

Both return an `AuthResponse` with a JWT and a user object that never includes the stored password hash. Use `Authorization: Bearer <token>` for protected routes. `GET /api/auth/me` returns the signed-in profile and `PUT /api/auth/me` updates the caller's name and phone.

### Get a server fare quote and create a booking

```http
GET /api/fares/estimate?cabId=1&distanceKm=12.5
```

```http
POST /api/bookings
Authorization: Bearer <customer-token>
Content-Type: application/json

{"cabId":1,"pickupLocation":"Central Station","dropLocation":"City Museum","distanceKm":12.5,"bookingDateTime":"2030-06-15T10:30:00"}
```

The booking body has no fare field. The response includes a generated booking reference, fare, cab, and assigned driver. Rebooking an unavailable cab returns `409 Conflict`. Customers can use `GET /api/bookings/my`, `GET /api/bookings/{id}`, and `PATCH /api/bookings/{id}/cancel`. They cannot read or cancel someone else's booking.

### API inventory

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Public |
| GET / PUT | `/api/auth/me` | Signed-in user |
| GET | `/api/cabs`, `/api/cabs/available`, `/api/cabs/{id}` | Public |
| GET | `/api/fares/estimate` | Public |
| POST / PUT / DELETE | `/api/cabs[/{id}]` | Admin |
| GET / POST / PUT / DELETE | `/api/drivers[/{id}]`, `/api/drivers/available` | Admin |
| POST | `/api/bookings` | Signed-in customer |
| GET | `/api/bookings/my`, `/api/bookings/{id}` | Owner, or admin |
| PATCH | `/api/bookings/{id}/cancel` | Booking owner |
| GET | `/api/bookings` | Admin |
| PATCH | `/api/bookings/{id}/status` | Admin |
| GET | `/api/users`, `/api/users/{id}` | Admin |
| PUT / DELETE | `/api/users/{id}` | Admin |
| GET | `/api/admin/dashboard/stats` | Admin |
| GET | `/api/health` | Public |

`400` indicates invalid input, `401` missing/invalid authentication, `403` insufficient role/ownership, `404` missing resource, and `409` a duplicate or business-rule conflict. Errors use `{ "message": "...", "timestamp": "...", "details": [] }`.

### Booking lifecycle

```text
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
    └───────────────→ CANCELLED
             CONFIRMED → CANCELLED
```

Only pending or confirmed bookings can be cancelled by their customer. Administrators move a ride forward through valid transitions. Completion and cancellation both release the cab and driver.

## Admin bootstrap

Set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting the API. Passwords must be at least 12 characters and are BCrypt-hashed before storage. Public registration cannot request or assign an administrator role. If the configured email already belongs to a non-admin account, startup fails instead of silently elevating it. To rotate credentials, use a managed admin account/password-management workflow rather than modifying the sample seed.

## UI design system

Figma-ready visual direction: warm ivory `#F7F7F2`, charcoal `#242824`, deep forest `#193D2D`, and lime `#C9EF5B`; Manrope headings with DM Sans body text; a 4/8 px spacing rhythm; 6–12 px rounded buttons and cards; sticky, compact navigation; spacious booking forms; clear ride/status tables; and a mobile layout that stacks trip details and fleet choices. Includes loading, validation, error, and empty states, visible focus states, and reduced-motion support.

## Test and build

- Web production build: `npm run build`.
- Web dependency review: `npm audit`.
- API tests: `cd server; mvn test`.
- Full local integration: `docker compose up --build`, then exercise the endpoints above with Postman or `curl`.
- Import `postman/Cabby.postman_collection.json` into Postman. Set `adminPassword` to the locally provisioned admin password before running the Admin requests.

The API unit tests cover server-side fare calculation and rejecting unavailable vehicles. The Docker and integration checks require Docker Desktop running.

## Deployment

`docker-compose.yml` runs the full stack locally; the production containers are split into the Spring API and static React/Nginx web client. `render.yaml` provides a deploy blueprint for the API and frontend and expects an externally hosted MySQL 8 database. Before deploying:

1. Provision a production MySQL 8 database and prepare its JDBC URL, username, and password.
2. Create the API and web services from this repository's standalone `cab-booking` folder. Configure production `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as provider-managed secrets.
3. Set `CORS_ALLOWED_ORIGIN` to the exact deployed web origin if the frontend and API are on separate origins. Set the frontend's `VITE_API_URL` to the public API origin plus `/api`.
4. Confirm `/api/health` is healthy, register a test customer, verify a quote and booking, and confirm the admin role can manage fleet and statuses while a customer cannot.

No hosting account, cloud database, or deployment credentials are configured in this workspace, so the project includes deployment setup but has not been published to a public URL.
