# Buggy Store: product requirements

Buggy Store is the internal catalogue tool the merchandising team uses to manage products and
watch stock levels. This document is the specification to test against: if the application behaves
differently from what is written here, that is worth reporting.

Requirement IDs (for example `PRD-4`) are there so bug reports can cite them.

## Users and roles

| Role          | Demo account             | Password     | Can do                                      |
| ------------- | ------------------------ | ------------ | ------------------------------------------- |
| Administrator | `admin@buggystore.test`  | `Admin@123`  | Everything                                  |
| Viewer        | `viewer@buggystore.test` | `Viewer@123` | Read-only: dashboard, product list, details |

- **ROLE-1** Viewers never see controls that change data (add, edit, delete) anywhere in the app.
- **ROLE-2** Viewers who open an add/edit address directly are sent back to the product list with a
  "no permission" message.
- **ROLE-3** The server rejects any change made by a viewer, whatever the screen shows.

## Sign in and session

- **AUTH-1** Email address and password are both required. Missing fields are flagged before
  anything is sent.
- **AUTH-2** Email addresses are not case-sensitive, and spaces before or after the address are
  ignored (people often paste them).
- **AUTH-3** Wrong credentials show "Invalid email or password." without saying which one was wrong.
- **AUTH-4** The password can be shown and hidden with the eye button.
- **AUTH-5** While signing in, the button shows a loading state and can't be pressed again.
- **AUTH-6** Every page except Sign in and Forgot password needs a signed-in user. Visiting one while
  signed out goes to Sign in; **after signing in, the user continues to the page they originally
  asked for** (including its search and filters). Without a requested page they land on the
  Dashboard.
- **AUTH-7** A signed-in user who opens Sign in is taken to the Dashboard.
- **AUTH-8** The session survives a page refresh. Sessions expire after 60 minutes; the next action
  then returns the user to Sign in with "Your session has expired. Please sign in again."
- **AUTH-9** Logout ends the session on the server. Any other tab using the same session is signed
  out on its next action, and Back after logging out must not show protected data.

## Forgot password

- **PWD-1** The email field is required and must be a valid email address. Any valid address is
  accepted, including ones with `+`, `.` or `-` in the part before `@` (for example
  `jo.smith+test@company.com`).
- **PWD-2** For security, the confirmation is the same whether or not an account exists for the
  address: the page must not reveal which addresses are registered.
- **PWD-3** "Back to sign in" returns to the Sign in page.
- **PWD-4** This is a demo: no email is actually sent.

## Navigation and layout

- **NAV-1** A sidebar (a menu button on tablet and mobile) links to Dashboard and Products and offers
  Logout. The current page is highlighted.
- **NAV-2** Breadcrumbs on product pages link to the page they name.
- **NAV-3** Unknown addresses show a "Page not found" page with a way back.
- **NAV-4** The product list keeps its search, filters, sort and page in the address bar, so refresh,
  Back/Forward and shared links all restore the same view.

## Dashboard

All figures are calculated from the current product data and always agree with the product list.

| Card            | Definition                                                                   |
| --------------- | ---------------------------------------------------------------------------- |
| Total products  | Number of products, any status                                               |
| Active products | Number of products with status Active, and their share of the total          |
| Low stock       | Products with **10 or fewer** units in stock, including those with 0         |
| Inventory value | Sum of price × quantity over **all** products, any status, exact to the cent |

- **DASH-1** "Recently added" lists the five newest products, newest first, each linking to its
  details.
- **DASH-2** If the figures can't be loaded, the page shows an error with a "Try again" action. It
  never shows placeholder or zero values as if they were real data.

## Product list

- **LIST-1** Columns: Product (name, SKU, ID), Category, Price, Stock, Status, Created, and Actions
  for administrators.
- **LIST-2** Default order is newest first. Default page size is 10; the user can choose 5, 10, 25
  or 50 rows. The footer shows "Showing X–Y of N products" and "Page P of T".
- **LIST-3** Search matches **any part of the product name or the SKU**, ignores upper/lower case and
  leading/trailing spaces, and treats characters such as `%` and `_` literally.
- **LIST-4** Results update shortly after the user stops typing; typing a word must not send a request
  for every key press.
- **LIST-5** Category and Status filters can be used alone or together; together they narrow the
  results (Category **and** Status **and** search).
- **LIST-6** Every column with a sort control can be sorted both ways: text alphabetically, numbers
  numerically, dates chronologically. A second click reverses the order.
- **LIST-7** Status badges: Active is green, Inactive is grey, Discontinued is red. A stock badge
  shows "Low stock" (amber) for 1–10 units and "Out of stock" (red) for 0.
- **LIST-8** Any filter or sort change returns to page 1. If the current page no longer exists (for
  example after deleting the only product on the last page), the list shows the last page that does.
- **LIST-9** Helpful empty states: "No products match your filters" with Clear filters, or "No
  products yet" when the catalogue is empty.
- **LIST-10** If products can't be loaded, the table shows an error with "Try again".
- **LIST-11** On tablet and mobile the table scrolls sideways, so every column, including Actions, can
  be reached.

## Product details

- **DET-1** Shows every field plus inventory value (price × quantity), created and last-updated times.
- **DET-2** Administrators get Edit and Delete buttons.
- **DET-3** An address for a product that doesn't exist (for example `/products/9999` or
  `/products/abc`) shows "Product not found" with a link back to the list.

## Add and edit product

| Field    | Rules                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| Name     | Required. 3–100 characters. Leading/trailing spaces are ignored and not saved. Any characters are allowed.  |
| SKU      | Required. 4–20 letters, digits or hyphens. Saved in upper case. Unique, **ignoring case**, on add and edit. |
| Category | Required. One of the six categories.                                                                        |
| Price    | Required. A number from **0.01** to 99,999.99, with at most 2 decimal places.                               |
| Quantity | Required. A **whole number** from 0 to 10,000.                                                              |
| Status   | Required. Active, Inactive or Discontinued. Defaults to Active.                                             |

- **FORM-1** Invalid fields show a message under the field when the user tries to save. Messages never
  overlap other content.
- **FORM-2** Anything the form accepts can be saved. If the server still rejects a value, the user is
  told which field is wrong and why.
- **FORM-3** While saving, the save button shows a loading state and can't be pressed again; one click
  creates or updates exactly one record.
- **FORM-4** Text is saved and displayed exactly as typed (apart from trimmed spaces), including
  characters such as `& < > " '`.
- **FORM-5** Every changed field is saved. After saving, the user sees a confirmation, and every screen
  (list, details, dashboard) shows the new values without a manual refresh.
- **FORM-6** Add → success returns to the product list with the new product first. Edit → success
  returns to the product's details. Cancel discards changes.

## Delete product

- **DEL-1** Delete asks for confirmation in a dialog that names the product. Cancel (or Escape) closes
  it without changes. Confirm deletes **exactly the product named in the dialog**.
- **DEL-2** After deleting, the product disappears from the list and the dashboard, and counts update.

## Non-functional

- **NFR-1** Responsive from 375 px wide phones to large desktops. Nothing is cut off or overflows its
  container, including dialogs with long product names.
- **NFR-2** Fully usable with the keyboard alone, with a visible focus indicator and a logical focus
  order. Icon-only buttons have an accessible name and a tooltip.
- **NFR-3** No unexpected errors in the browser console during normal use.
- **NFR-4** API responses use correct HTTP status codes (200/201/204 success, 400 invalid input,
  401 not signed in, 403 not allowed, 404 not found, 409 conflict) and error messages users can act
  on.
- **NFR-5** Data is stored in a local database and survives refreshes and server restarts.
