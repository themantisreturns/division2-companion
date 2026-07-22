# Vendor History — v1.8.0

The scheduled GitHub Actions vendor sync now stores a snapshot whenever the
Ruben Alamina vendor JSON changes. Up to 20 snapshots are listed in
`public/data/vendor-history/index.json`.

The Weekly Vendors page shows the latest change counts and lets users browse
saved resets. The existing personalized shopping list continues to rank the
current reset using inventory, wishlist, build, and Expertise context.

## Automation

The workflow runs Tuesday and Wednesday at 10:00 UTC and can also be launched
manually from the GitHub Actions tab. It validates the downloaded JSON before
committing current data, metadata, and history.
