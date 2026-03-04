# Discord Integration Plan – Issue #27

## Token Lookup Order

The system will look for DISCORD_BOT_TOKEN in this order:

1. Browser cache (user override via FeedPlayer interface)
2. /feed/.env
3. /docker/.env

## Browser Override

An override already exists in the browser cache.
The user inputs the Discord token through the FeedPlayer interface.
If present, this token takes highest priority.

## Docker Location

The primary Discord key will reside outside the feed repo in:

/docker/.env

This ensures deployment-level configuration remains separate from repository code.

## Cleanup

Remove the following files:

feed/membersense/backend/.env
feed/membersense/backend/.env.example

These files will no longer be used for Discord token storage.

## Test Channel

A public test Discord channel should be activated.
The test channel ID should be placed in:

/feed/.env
