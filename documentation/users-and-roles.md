# Users and roles

## Signing in

People sign in with a username and password at `/accounts/login/`. Email is not
the login identifier and is not required. Sessions live in the database and last
until sign-out or expiry.

After signing in, Spicy routes by role:

| Role | Lands on |
|---|---|
| Administrator, Manager | Back office dashboard |
| Cashier | Point of sale |
| Signed in, no role | A "pending approval" page |
| Not signed in | Sign-in page |

Someone who signs up but is never given a role sees the pending page and cannot
do anything else. That is the expected state for a new account awaiting
assignment.

## The three roles

| | Cashier | Manager | Administrator |
|---|---|---|---|
| Point of sale | Yes | Yes | Yes |
| Order history | Own sales, unless full history is enabled | All | All |
| Close a shift | Own shift | Any shift | Any shift |
| Cancel or return an order | No | Yes | Yes |
| Record a cash-out | Yes | Yes | Yes |
| Cancel a cash-out | No | Yes | Yes |
| Inventory, menu, shifts, orders | No | Yes | Yes |
| Payment modes | Read only | Edit | Edit |
| Restaurant settings, production units | No | Edit | Edit |
| Accounting, reports | No | Yes | Yes |
| Assign roles, create accounts | No | No | Yes |
| Django admin | No | No | Yes |

Being denied a page returns a 403. Nothing about the interface is hidden-only:
the checks are enforced on the server, not by hiding buttons.

### What a cashier can reach

A cashier has the point of sale and nothing else. Every inventory, menu,
accounting, reporting, and settings page returns 403. Within the POS:

- They see only their own open drafts. Another cashier's draft is not visible and
  returns 404 if requested directly — not 403, so it does not confirm the draft
  exists.
- They can take orders, send them, settle them, record cash-outs, and print
  tickets for their own orders.
- They cannot cancel or return an order. That is a manager action.
- They can close the shift they opened. Not somebody else's.
- Order history is limited to today's paid sales unless the restaurant enables
  full history for cashiers. The filters for returns, cancellations, and
  discarded orders are ignored for them, and reprinting tickets is manager-only.
- They cannot reprint a receipt for anything other than a paid sale.

### What a manager can reach

Everything in the back office, including accounting, reports, order cancellation
and returns, and editing restaurant settings, production units, and payment
modes.

Note that inventory and menu administration has no separate manager tier: any
manager can create, edit, and delete items, warehouses, recipes, and prices. If
you want that restricted to administrators, the checks would need tightening —
today the back office gate treats every manager as trusted with master data.

A manager cannot assign roles or create accounts.

### What an administrator can reach

Everything a manager can, plus creating accounts, assigning and removing roles,
deactivating logins, and the Django admin site.

Assigning the administrator role also grants Django superuser and staff flags,
which is what opens `/admin/`. Removing the administrator role from someone
clears those flags. An administrator cannot have their role removed while others
still need one — demote them to manager first.

## Managing accounts

**Settings → User roles.** Administrator only.

- **Add user** creates the login with a username and password. The password is
  checked against the standard complexity rules: not too similar to the
  username, not a common password, not only numbers, and of reasonable length.
- **Assign role** adds the user to one of the three groups. A user holds exactly
  one role at a time; assigning a new one replaces the old.
- **Remove role** takes the group away, returning the user to the pending page.
- **Deactivate** disables the login without deleting the account or its history.
  Past orders and shifts keep the user's name. Use this instead of removing
  someone who has left — it preserves the audit trail.

You cannot deactivate your own account, which stops you from locking yourself out.

### Roles are groups, not a field

A user's role is Django group membership, and the checks read the group name on
each request. There is no role column on the user and no per-user permission
grants. Two consequences worth knowing:

- Changing a role takes effect on the next request. There is no cache to clear.
- The check queries the database on each access rather than caching it. On a
  busy screen this is a handful of small indexed queries per page. It is not a
  bottleneck at restaurant traffic, but it is why the sign-in screen and the POS
  are noticeably lighter than the back office.

## Profile

Any signed-in user can edit their own name and email and upload a profile picture
from `/users/profile/`. Images are limited to common formats and 5 MB.

Without an uploaded picture, Spicy shows a Gravatar derived from the email
address. That is a request to an external service. On an installation with no
internet access it simply fails to load and falls back to the default avatar;
nothing else is affected. If you would rather not make the request at all, upload
a picture for each account.

## Accounts and access for a new team member

1. The person signs up at `/accounts/signup/`, or an administrator creates the
   login from Settings → User roles.
2. They see the pending-approval page.
3. An administrator assigns the role.
4. They sign in again and land on the POS or the dashboard.

Signups email the site administrators. Until you configure a real email backend,
that notification goes to the terminal rather than to you, and you will find out
about signups only by noticing unassigned accounts.